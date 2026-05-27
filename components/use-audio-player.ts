"use client";

import { useEffect, useRef, useState } from "react";

export type PlaybackItem = {
  id: string;
  url?: string;
  rate?: number;
  speechText?: string;
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

  async function playSource(item: PlaybackItem) {
    shouldStopRef.current = false;
    setError(null);

    if (!item.url) {
      const message = "No archived audio is available for this item yet.";
      setError(message);
      item.onError?.(message);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }

    const audio = audioRef.current;
    audio.pause();
    audio.src = item.url;
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
