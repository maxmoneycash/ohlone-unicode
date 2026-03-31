"use client";

import { useEffect, useRef, useState } from "react";

export type PlaybackItem = {
  id: string;
  url?: string;
  rate?: number;
  speechText?: string;
  preferSpeech?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
};

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldStopRef = useRef(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      shouldStopRef.current = true;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  async function playSpeech(item: PlaybackItem) {
    if (!item.speechText || !("speechSynthesis" in window)) {
      throw new Error("Browser speech synthesis is unavailable.");
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(item.speechText);
    utterance.lang = "en-US";
    utterance.rate = Math.min(Math.max(item.rate ?? 1, 0.6), 1.4);

    setActiveId(item.id);
    setIsPlaying(true);
    item.onStart?.();

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error("Browser speech synthesis failed."));
      window.speechSynthesis.speak(utterance);
    });

    item.onEnd?.();
    setActiveId(null);
    setIsPlaying(false);
  }

  async function playSource(item: PlaybackItem) {
    shouldStopRef.current = false;
    setError(null);

    const useBrowserSpeech = item.preferSpeech || !item.url;

    if (useBrowserSpeech) {
      try {
        await playSpeech(item);
        return;
      } catch (speechError) {
        const message =
          speechError instanceof Error
            ? speechError.message
            : "Browser speech synthesis failed.";
        setError(message);
        item.onError?.(message);
        setActiveId(null);
        setIsPlaying(false);
        return;
      }
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }

    const audio = audioRef.current;
    const sourceUrl = item.url;
    if (!sourceUrl) {
      throw new Error("Audio source is missing.");
    }
    audio.pause();
    audio.src = sourceUrl;
    audio.currentTime = 0;
    audio.playbackRate = item.rate ?? 1;

    setActiveId(item.id);
    setIsPlaying(true);
    item.onStart?.();

    try {
      await audio.play();

      await new Promise<void>((resolve, reject) => {
        const handleEnded = () => {
          cleanup();
          resolve();
        };

        const handleError = () => {
          cleanup();
          if (audio.error?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
            reject(new Error("This audio format is not supported on your device."));
            return;
          }

          reject(new Error("Audio playback failed."));
        };

        const cleanup = () => {
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("error", handleError);
        };

        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);
      });

      item.onEnd?.();
    } catch (playbackError) {
      const message =
        playbackError instanceof Error
          ? playbackError.message
          : "Audio playback failed.";
      setError(message);
      item.onError?.(message);
    } finally {
      setActiveId(null);
      setIsPlaying(false);
    }
  }

  async function playQueue(items: PlaybackItem[]) {
    setError(null);
    shouldStopRef.current = false;

    for (const item of items) {
      if (shouldStopRef.current) {
        break;
      }

      await playSource(item);
    }
  }

  function stop() {
    shouldStopRef.current = true;
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setActiveId(null);
    setIsPlaying(false);
  }

  return {
    activeId,
    error,
    isPlaying,
    playQueue,
    playSource,
    stop,
  };
}
