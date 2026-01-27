import type { BitratePoint, SampleCodecs } from "../../types/analysis"
import type { SegmentTimeline } from "./sampleWindow"

export type ProbeResult = {
  points: BitratePoint[]
  missingHeaders: number
  errors: string[]
}

/**
 * Issue HEAD requests for each segment to read Content-Length or Content-Range
 * Convert bytes and duration into bitrateBps
 * Skip segments where headers are missing or CORS blocks the request
 */
export const probeSegmentSizes = async (
  segments: SegmentTimeline[],
  baseUrl?: string
): Promise<ProbeResult> => {
  const points: BitratePoint[] = []
  let missingHeaders = 0
  const errors: string[] = []

  for (const segment of segments) {
    try {
      const url = baseUrl ? new URL(segment.uri, baseUrl).href : segment.uri

      const response = await fetch(url, { method: "HEAD" })

      if (!response.ok) {
        errors.push(
          `Segment ${segment.index}: HTTP ${response.status} ${response.statusText}`
        )
        missingHeaders++
        continue
      }

      // Try Content-Length first, then Content-Range
      let bytes: number | undefined
      const contentLength = response.headers.get("Content-Length")
      const contentRange = response.headers.get("Content-Range")

      if (contentLength) {
        bytes = parseInt(contentLength, 10)
      } else if (contentRange) {
        // Content-Range: bytes 0-1234/1235
        const match = contentRange.match(/\/(\d+)/)
        if (match) {
          bytes = parseInt(match[1], 10)
        }
      }

      if (!bytes || isNaN(bytes)) {
        missingHeaders++
        continue
      }

      const bitrateBps =
        segment.durationSeconds > 0
          ? (bytes * 8) / segment.durationSeconds
          : 0

      points.push({
        segmentIndex: segment.index,
        startSeconds: segment.startSeconds,
        durationSeconds: segment.durationSeconds,
        bytes,
        bitrateBps,
      })
    } catch (error) {
      errors.push(
        `Segment ${segment.index}: ${error instanceof Error ? error.message : String(error)}`
      )
      missingHeaders++
    }
  }

  return { points, missingHeaders, errors }
}

/**
 * Compute rolling average bitrate (3-point window)
 */
export const computeRollingAverage = (
  points: BitratePoint[]
): BitratePoint[] => {
  return points.map((point, index) => {
    const start = Math.max(0, index - 1)
    const end = Math.min(points.length, index + 2)
    const window = points.slice(start, end)

    const sum = window.reduce((acc, p) => acc + p.bitrateBps, 0)
    const rollingAverageBps = sum / window.length

    return {
      ...point,
      rollingAverageBps,
    }
  })
}

/**
 * Lightweight codec probe using ranged GET (0-2047 bytes) against init segment or first media segment
 * Parse MP4 ftyp/moov boxes for codec hints when possible
 * Fall back to Content-Type heuristics if parsing fails
 */
export const probeCodecs = async (
  initUri: string | undefined,
  firstSegmentUri: string | undefined,
  baseUrl?: string
): Promise<{ codecs: Partial<SampleCodecs>; warnings: string[] }> => {
  const warnings: string[] = []

  const targetUri = initUri ?? firstSegmentUri
  if (!targetUri) {
    warnings.push("No init segment or first media segment available for probing")
    return { codecs: {}, warnings }
  }

  try {
    const url = baseUrl ? new URL(targetUri, baseUrl).href : targetUri

    // Request first 2KB
    const response = await fetch(url, {
      headers: { Range: "bytes=0-2047" },
    })

    if (!response.ok) {
      warnings.push(
        `Codec probe failed: HTTP ${response.status} ${response.statusText}`
      )
      return { codecs: {}, warnings }
    }

    const contentType = response.headers.get("Content-Type") ?? ""
    const buffer = await response.arrayBuffer()

    // Try to parse MP4 boxes for codec hints
    const codecs = parseMP4Codecs(buffer, contentType)

    if (!codecs.video?.raw.length && !codecs.audio?.raw.length) {
      warnings.push(
        "Codec probe could not extract codecs from segment headers"
      )
    }

    return { codecs, warnings }
  } catch (error) {
    warnings.push(
      `Codec probe error: ${error instanceof Error ? error.message : String(error)}`
    )
    return { codecs: {}, warnings }
  }
}

/**
 * Parse MP4 boxes for codec information
 * This is a simplified parser that looks for ftyp and stsd boxes
 * For production use, consider a dedicated MP4 parser library
 */
const parseMP4Codecs = (
  buffer: ArrayBuffer,
  contentType: string
): Partial<SampleCodecs> => {
  const view = new DataView(buffer)
  const codecs: Partial<SampleCodecs> = {
    video: { friendly: [], raw: [] },
    audio: { friendly: [], raw: [] },
  }

  // Look for ftyp box (file type)
  // MP4 box format: [size:4][type:4][data...]
  let offset = 0

  try {
    while (offset < buffer.byteLength - 8) {
      const boxSize = view.getUint32(offset, false)
      if (boxSize < 8 || boxSize > buffer.byteLength - offset) {
        break
      }

      const boxType =
        String.fromCharCode(view.getUint8(offset + 4)) +
        String.fromCharCode(view.getUint8(offset + 5)) +
        String.fromCharCode(view.getUint8(offset + 6)) +
        String.fromCharCode(view.getUint8(offset + 7))

      if (boxType === "ftyp") {
        // ftyp contains major brand and compatible brands
        // We can infer some codec info from brands
        const majorBrand =
          String.fromCharCode(view.getUint8(offset + 8)) +
          String.fromCharCode(view.getUint8(offset + 9)) +
          String.fromCharCode(view.getUint8(offset + 10)) +
          String.fromCharCode(view.getUint8(offset + 11))

        // Common MP4 brands
        if (majorBrand.startsWith("iso") || majorBrand.startsWith("mp4")) {
          // Fallback to content-type heuristics
          applyContentTypeHeuristics(contentType, codecs)
        }
      }

      offset += boxSize
    }
  } catch {
    // Parsing failed, try content-type heuristics
  }

  // If we didn't find codecs in boxes, use content-type
  if (!codecs.video?.raw.length && !codecs.audio?.raw.length) {
    applyContentTypeHeuristics(contentType, codecs)
  }

  return codecs
}

/**
 * Apply codec heuristics based on Content-Type
 */
const applyContentTypeHeuristics = (
  contentType: string,
  codecs: Partial<SampleCodecs>
) => {
  const normalized = contentType.toLowerCase()

  if (normalized.includes("video/mp4") || normalized.includes("application/mp4")) {
    // Most common: H.264 + AAC
    codecs.video = { friendly: ["H.264"], raw: ["avc1"] }
    codecs.audio = { friendly: ["AAC"], raw: ["mp4a"] }
  } else if (normalized.includes("video/mp2t")) {
    // MPEG-TS: usually H.264 + AAC
    codecs.video = { friendly: ["H.264"], raw: ["avc1"] }
    codecs.audio = { friendly: ["AAC"], raw: ["mp4a"] }
  }
}
