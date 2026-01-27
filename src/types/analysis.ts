export type ValidationSeverity = "error" | "warning" | "info"

export type ValidationIssue = {
  severity: ValidationSeverity
  message: string
  hint: string
  tag?: string
  line?: number
}

export type PlaylistType = "master" | "media" | "unknown"
export type StreamType = "live" | "vod"

export type PlaylistClassification = {
  playlistType: PlaylistType
  streamType: StreamType
}

export type LadderVariant = {
  bitrate: number
  averageBandwidth?: number
  resolution?: {
    width: number
    height: number
  }
  codecs: string[]
  frameRate?: number
}

export type LadderResult = {
  video: LadderVariant[]
  audio: LadderVariant[]
}

export type AnalysisResult = {
  validation: ValidationIssue[]
  classification: PlaylistClassification
  ladder: LadderResult
  reliable: boolean
}

// Phase 2: Sampling + Metrics

export type SampleConfig = {
  durationSeconds: number
  startOffsetSeconds?: number // VOD: absolute start time
  liveAnchorSeconds?: number // Live: seconds from end (e.g., 30 = start 30s before live edge)
  selectedRenditionIndex: number // Index in master playlist variants array
}

export type SampleWindow = {
  startSeconds: number
  endSeconds: number
  actualDurationSeconds: number
  requestedDurationSeconds: number
}

export type BitratePoint = {
  segmentIndex: number
  startSeconds: number
  durationSeconds: number
  bytes: number
  bitrateBps: number
  rollingAverageBps?: number
}

export type SampleCodecs = {
  video: {
    friendly: string[] // e.g., ["H.264", "H.265"]
    raw: string[] // e.g., ["avc1.64001f", "hvc1.1.6.L120.90"]
  }
  audio: {
    friendly: string[]
    raw: string[]
  }
}

export type SampleDiagnostics = {
  warnings: string[]
  errors: string[]
  missingHeaders: number // Count of segments with missing Content-Length
  segmentCount: number // Total segments in sample
}

export type SampleResult = {
  window: SampleWindow
  bitrateSeries: BitratePoint[]
  codecs: SampleCodecs
  diagnostics: SampleDiagnostics
  reliable: boolean // false when diagnostics exist
}
