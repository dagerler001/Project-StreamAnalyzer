import type { Manifest } from "m3u8-parser"
import type {
  SampleConfig,
  SampleResult,
  SampleCodecs,
  StreamType,
} from "../../types/analysis"
import { parseM3U8 } from "../playlist/parseM3U8"
import { getCodecLabels } from "../ladder/codecLabels"
import {
  buildSegmentTimeline,
  selectWindowSegments,
} from "./sampleWindow"
import {
  probeSegmentSizes,
  computeRollingAverage,
  probeCodecs,
} from "./segmentProbe"

/**
 * Analyze a sample window from either a master or media playlist
 * Returns bitrate series, codec info, and diagnostics
 */
export const analyzeSample = async (
  manifest: Manifest,
  basePlaylistUrl: string | undefined,
  config: SampleConfig,
  streamType: StreamType
): Promise<SampleResult> => {
  const warnings: string[] = []
  const errors: string[] = []

  // If manifest is master, resolve the selected variant
  let mediaManifest: Manifest = manifest
  let mediaBaseUrl: string | undefined = basePlaylistUrl

  if (manifest.playlists && manifest.playlists.length > 0) {
    // This is a master playlist
    const selectedVariant = manifest.playlists[config.selectedRenditionIndex]

    if (!selectedVariant) {
      errors.push(
        `Selected rendition index ${config.selectedRenditionIndex} not found in master playlist`
      )
      return createEmptyResult(config, warnings, errors)
    }

    const variantUri = selectedVariant.uri
    if (!variantUri) {
      errors.push("Selected variant has no URI")
      return createEmptyResult(config, warnings, errors)
    }

    // Resolve variant URI against base URL
    try {
      const variantUrl = basePlaylistUrl
        ? new URL(variantUri, basePlaylistUrl).href
        : variantUri

      mediaBaseUrl = variantUrl

      // Fetch and parse the media playlist
      const response = await fetch(variantUrl)
      if (!response.ok) {
        errors.push(
          `Failed to fetch variant playlist: HTTP ${response.status} ${response.statusText}`
        )
        return createEmptyResult(config, warnings, errors)
      }

      const text = await response.text()
      const parsed = parseM3U8(text)
      mediaManifest = parsed.manifest
    } catch (error) {
      errors.push(
        `Failed to fetch variant playlist: ${error instanceof Error ? error.message : String(error)}`
      )
      return createEmptyResult(config, warnings, errors)
    }
  }

  // Build segment timeline
  const timeline = buildSegmentTimeline(mediaManifest)

  if (timeline.length === 0) {
    errors.push("No segments found in media playlist")
    return createEmptyResult(config, warnings, errors)
  }

  // Select window segments
  const { window, segments } = selectWindowSegments(
    timeline,
    config,
    streamType
  )

  if (segments.length === 0) {
    warnings.push("No segments found in requested window")
  }

  // Probe segment sizes
  const probeResult = await probeSegmentSizes(segments, mediaBaseUrl)
  errors.push(...probeResult.errors)

  // Compute rolling average
  const bitrateSeries = computeRollingAverage(probeResult.points)

  // Extract codecs from playlist or probe
  const codecs = await extractCodecs(
    mediaManifest,
    manifest,
    config.selectedRenditionIndex,
    mediaBaseUrl,
    warnings
  )

  const diagnostics = {
    warnings,
    errors,
    missingHeaders: probeResult.missingHeaders,
    segmentCount: segments.length,
  }

  const reliable =
    warnings.length === 0 &&
    errors.length === 0 &&
    probeResult.missingHeaders === 0

  return {
    window,
    bitrateSeries,
    codecs,
    diagnostics,
    reliable,
  }
}

/**
 * Extract codecs from playlist CODECS attribute or probe segments
 */
const extractCodecs = async (
  mediaManifest: Manifest,
  masterManifest: Manifest,
  selectedRenditionIndex: number,
  baseUrl: string | undefined,
  warnings: string[]
): Promise<SampleCodecs> => {
  const codecs: SampleCodecs = {
    video: { friendly: [], raw: [] },
    audio: { friendly: [], raw: [] },
  }

  // Try to get CODECS from master playlist variant first
  if (masterManifest.playlists && masterManifest.playlists.length > 0) {
    const variant = masterManifest.playlists[selectedRenditionIndex]
    if (variant?.attributes?.CODECS) {
      const codecValue = variant.attributes.CODECS
      // CODECS can be string or object in m3u8-parser types
      const codecString = typeof codecValue === "string" ? codecValue : String(codecValue)
      const parsed = parseCodecString(codecString)
      codecs.video = parsed.video
      codecs.audio = parsed.audio
      return codecs
    }
  }

  // Try to get from media playlist (rare but possible)
  // m3u8-parser doesn't expose CODECS at media playlist level typically

  // Codecs not in playlist - probe segments
  warnings.push("CODECS attribute missing from playlist, probing segments")

  const firstSegment = mediaManifest.segments?.[0]
  const initUri = (firstSegment as any)?.map?.uri as string | undefined
  const firstSegmentUri = firstSegment?.uri

  const probeResult = await probeCodecs(initUri, firstSegmentUri, baseUrl)
  warnings.push(...probeResult.warnings)

  if (probeResult.codecs.video) {
    codecs.video = probeResult.codecs.video
  }
  if (probeResult.codecs.audio) {
    codecs.audio = probeResult.codecs.audio
  }

  return codecs
}

/**
 * Parse codec string into video and audio codecs with friendly labels
 */
const parseCodecString = (
  codecString: string
): { video: SampleCodecs["video"]; audio: SampleCodecs["audio"] } => {
  const rawCodecs = codecString
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)

  const video: string[] = []
  const audio: string[] = []

  for (const codec of rawCodecs) {
    const lower = codec.toLowerCase()
    // Video codecs: avc1, hvc1, hev1, av01, vp09, vp08
    if (
      lower.startsWith("avc1") ||
      lower.startsWith("hvc1") ||
      lower.startsWith("hev1") ||
      lower.startsWith("av01") ||
      lower.startsWith("vp0")
    ) {
      video.push(codec)
    }
    // Audio codecs: mp4a, ac-3, ec-3, opus
    else if (
      lower.startsWith("mp4a") ||
      lower.startsWith("ac-3") ||
      lower.startsWith("ec-3") ||
      lower.startsWith("opus")
    ) {
      audio.push(codec)
    }
  }

  return {
    video: {
      friendly: getCodecLabels(video),
      raw: video,
    },
    audio: {
      friendly: getCodecLabels(audio),
      raw: audio,
    },
  }
}

/**
 * Create an empty result when analysis fails early
 */
const createEmptyResult = (
  config: SampleConfig,
  warnings: string[],
  errors: string[]
): SampleResult => {
  return {
    window: {
      startSeconds: 0,
      endSeconds: 0,
      actualDurationSeconds: 0,
      requestedDurationSeconds: config.durationSeconds,
    },
    bitrateSeries: [],
    codecs: {
      video: { friendly: [], raw: [] },
      audio: { friendly: [], raw: [] },
    },
    diagnostics: {
      warnings,
      errors,
      missingHeaders: 0,
      segmentCount: 0,
    },
    reliable: false,
  }
}
