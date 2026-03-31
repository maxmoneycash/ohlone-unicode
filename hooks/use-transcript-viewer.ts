"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { CharacterAlignmentResponseModel } from "@elevenlabs/elevenlabs-js/api/types/CharacterAlignmentResponseModel"

export type TranscriptWord = {
  kind: "word"
  text: string
  start: number
  end: number
  segmentIndex: number
}

export type TranscriptGap = {
  kind: "gap"
  text: string
  start: number
  end: number
  segmentIndex: number
}

export type TranscriptSegment = TranscriptWord | TranscriptGap

export type SegmentComposer = (segments: TranscriptSegment[]) => TranscriptSegment[]

export type UseTranscriptViewerOptions = {
  alignment: CharacterAlignmentResponseModel
  hideAudioTags?: boolean
  segmentComposer?: SegmentComposer
  onPlay?: () => void
  onPause?: () => void
  onTimeUpdate?: (time: number) => void
  onEnded?: () => void
  onDurationChange?: (duration: number) => void
}

export type UseTranscriptViewerResult = {
  audioRef: React.RefObject<HTMLAudioElement | null>
  currentTime: number
  currentWord: TranscriptWord | null
  duration: number
  endScrubbing: () => void
  isPlaying: boolean
  pause: () => void
  play: () => Promise<void>
  seekToTime: (time: number) => void
  segments: TranscriptSegment[]
  spokenSegments: TranscriptSegment[]
  startScrubbing: () => void
  unspokenSegments: TranscriptSegment[]
}

function buildSegments(
  alignment: CharacterAlignmentResponseModel,
  hideAudioTags: boolean,
) {
  const { characters, characterStartTimesSeconds, characterEndTimesSeconds } = alignment
  const segments: TranscriptSegment[] = []

  let buffer = ""
  let start = 0
  let end = 0
  let kind: TranscriptSegment["kind"] | null = null

  const flush = () => {
    if (!buffer || kind === null) {
      return
    }

    segments.push({
      kind,
      text: buffer,
      start,
      end,
      segmentIndex: segments.length,
    } as TranscriptSegment)

    buffer = ""
    kind = null
  }

  characters.forEach((character, index) => {
    const nextKind = /\s/u.test(character) ? "gap" : "word"
    const nextStart = characterStartTimesSeconds[index] ?? end
    const nextEnd = characterEndTimesSeconds[index] ?? nextStart

    if (hideAudioTags && (character === "<" || character === ">")) {
      flush()
      return
    }

    if (kind === null) {
      kind = nextKind
      start = nextStart
      end = nextEnd
      buffer = character
      return
    }

    if (kind !== nextKind) {
      flush()
      kind = nextKind
      start = nextStart
      end = nextEnd
      buffer = character
      return
    }

    buffer += character
    end = nextEnd
  })

  flush()
  return segments
}

export function useTranscriptViewer({
  alignment,
  hideAudioTags = true,
  segmentComposer,
  onPlay,
  onPause,
  onTimeUpdate,
  onEnded,
  onDurationChange,
}: UseTranscriptViewerOptions): UseTranscriptViewerResult {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const shouldResumeRef = useRef(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const segments = useMemo(() => {
    const nextSegments = buildSegments(alignment, hideAudioTags)
    return segmentComposer ? segmentComposer(nextSegments) : nextSegments
  }, [alignment, hideAudioTags, segmentComposer])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      onTimeUpdate?.(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(audio.duration || currentTime)
      onEnded?.()
    }

    const handleDurationChange = () => {
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : 0
      setDuration(nextDuration)
      onDurationChange?.(nextDuration)
    }

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("durationchange", handleDurationChange)

    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("durationchange", handleDurationChange)
    }
  }, [currentTime, onDurationChange, onEnded, onPause, onPlay, onTimeUpdate])

  const currentWord = useMemo(() => {
    return (
      segments.find(
        (segment): segment is TranscriptWord =>
          segment.kind === "word" &&
          currentTime >= segment.start &&
          currentTime < segment.end,
      ) ?? null
    )
  }, [currentTime, segments])

  const spokenSegments = useMemo(() => {
    return segments.filter((segment) => segment.end <= currentTime)
  }, [currentTime, segments])

  const unspokenSegments = useMemo(() => {
    return segments.filter((segment) => {
      if (currentWord && segment.segmentIndex === currentWord.segmentIndex) {
        return false
      }

      return segment.start > currentTime
    })
  }, [currentTime, currentWord, segments])

  const play = async () => {
    if (!audioRef.current) {
      return
    }

    await audioRef.current.play()
  }

  const pause = () => {
    audioRef.current?.pause()
  }

  const seekToTime = (time: number) => {
    if (!audioRef.current) {
      return
    }

    audioRef.current.currentTime = Math.min(Math.max(time, 0), duration || time)
    setCurrentTime(audioRef.current.currentTime)
  }

  const startScrubbing = () => {
    shouldResumeRef.current = isPlaying
    pause()
  }

  const endScrubbing = () => {
    if (shouldResumeRef.current) {
      shouldResumeRef.current = false
      void play()
    }
  }

  return {
    audioRef,
    currentTime,
    currentWord,
    duration,
    endScrubbing,
    isPlaying,
    pause,
    play,
    seekToTime,
    segments,
    spokenSegments,
    startScrubbing,
    unspokenSegments,
  }
}
