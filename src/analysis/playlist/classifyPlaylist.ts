import type { Manifest } from "m3u8-parser"

import type { PlaylistClassification, PlaylistType, StreamType } from "../../types/analysis"

const resolvePlaylistType = (manifest: Manifest): PlaylistType => {
  if ((manifest.playlists?.length ?? 0) > 0) {
    return "master"
  }

  if ((manifest.segments?.length ?? 0) > 0) {
    return "media"
  }

  return "unknown"
}

const resolveStreamType = (manifest: Manifest): StreamType => {
  const playlistType = (manifest.playlistType ?? "").toUpperCase()
  if (playlistType === "VOD") {
    return "vod"
  }

  if (manifest.endList) {
    return "vod"
  }

  return "live"
}

export const classifyPlaylist = (manifest: Manifest): PlaylistClassification => ({
  playlistType: resolvePlaylistType(manifest),
  streamType: resolveStreamType(manifest),
})
