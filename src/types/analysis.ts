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
