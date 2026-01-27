import type { Manifest } from "m3u8-parser"
import type { SampleConfig, SampleWindow } from "../../types/analysis"

export type SegmentTimeline = {
  index: number
  uri: string
  startSeconds: number
  durationSeconds: number
}

/**
 * Build cumulative timeline from manifest segments
 */
export const buildSegmentTimeline = (
  manifest: Manifest
): SegmentTimeline[] => {
  const segments = manifest.segments ?? []
  const timeline: SegmentTimeline[] = []
  let cumulativeTime = 0

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const duration = segment.duration ?? 0

    if (!segment.uri) {
      continue
    }

    timeline.push({
      index: i,
      uri: segment.uri,
      startSeconds: cumulativeTime,
      durationSeconds: duration,
    })

    cumulativeTime += duration
  }

  return timeline
}

/**
 * Select segments within a time window
 * For VOD: use startOffsetSeconds
 * For live: compute window end as (totalDuration - liveAnchorSeconds), then start = end - durationSeconds
 */
export const selectWindowSegments = (
  timeline: SegmentTimeline[],
  config: SampleConfig,
  streamType: "vod" | "live"
): { window: SampleWindow; segments: SegmentTimeline[] } => {
  if (timeline.length === 0) {
    return {
      window: {
        startSeconds: 0,
        endSeconds: 0,
        actualDurationSeconds: 0,
        requestedDurationSeconds: config.durationSeconds,
      },
      segments: [],
    }
  }

  const totalDuration =
    timeline[timeline.length - 1].startSeconds +
    timeline[timeline.length - 1].durationSeconds

  let windowStart: number
  let windowEnd: number

  if (streamType === "live") {
    // For live: anchor from end
    const anchorSeconds = config.liveAnchorSeconds ?? 0
    windowEnd = totalDuration - anchorSeconds
    windowStart = Math.max(0, windowEnd - config.durationSeconds)
  } else {
    // For VOD: use offset
    windowStart = config.startOffsetSeconds ?? 0
    windowEnd = windowStart + config.durationSeconds
  }

  // Clamp to available range
  windowStart = Math.max(0, windowStart)
  windowEnd = Math.min(totalDuration, windowEnd)

  // Select segments that overlap the window
  const selectedSegments = timeline.filter((seg) => {
    const segEnd = seg.startSeconds + seg.durationSeconds
    return seg.startSeconds < windowEnd && segEnd > windowStart
  })

  const actualDuration = windowEnd - windowStart

  return {
    window: {
      startSeconds: windowStart,
      endSeconds: windowEnd,
      actualDurationSeconds: actualDuration,
      requestedDurationSeconds: config.durationSeconds,
    },
    segments: selectedSegments,
  }
}
