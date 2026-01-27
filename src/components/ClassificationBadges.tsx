import type { PlaylistClassification } from "../types/analysis"

export type ClassificationBadgesProps = {
  classification: PlaylistClassification
}

export const ClassificationBadges = ({
  classification,
}: ClassificationBadgesProps) => {
  const { playlistType, streamType } = classification

  const getPlaylistTypeLabel = () => {
    switch (playlistType) {
      case "master":
        return "Master"
      case "media":
        return "Variant"
      case "unknown":
        return "Unknown"
    }
  }

  const getStreamTypeLabel = () => {
    switch (streamType) {
      case "live":
        return "Live"
      case "vod":
        return "VOD"
    }
  }

  const getPlaylistTypeIcon = () => {
    switch (playlistType) {
      case "master":
        return "▦"
      case "media":
        return "▬"
      case "unknown":
        return "?"
    }
  }

  const getStreamTypeIcon = () => {
    switch (streamType) {
      case "live":
        return "●"
      case "vod":
        return "▶"
    }
  }

  return (
    <div className="classification-badges">
      <div className="classification-badge classification-badge-primary">
        <span className="classification-badge-icon">
          {getPlaylistTypeIcon()}
        </span>
        <span className="classification-badge-label">
          {getPlaylistTypeLabel()}
        </span>
      </div>
      <div className="classification-badge classification-badge-secondary">
        <span className="classification-badge-icon">{getStreamTypeIcon()}</span>
        <span className="classification-badge-label">
          {getStreamTypeLabel()}
        </span>
      </div>
    </div>
  )
}
