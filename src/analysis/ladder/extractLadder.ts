import type { Manifest } from "m3u8-parser"

import type { LadderResult, LadderVariant } from "../../types/analysis"
import { getCodecLabels } from "./codecLabels"

type PlaylistAttributes = {
  BANDWIDTH?: number
  "AVERAGE-BANDWIDTH"?: number
  RESOLUTION?: { width: number; height: number }
  CODECS?: string
  "FRAME-RATE"?: number
}

const extractVideoVariants = (manifest: Manifest): LadderVariant[] => {
  const playlists = manifest.playlists ?? []
  const variants: LadderVariant[] = []

  playlists.forEach((playlist) => {
    const attrs = (playlist.attributes ?? {}) as PlaylistAttributes
    const bandwidth = attrs.BANDWIDTH
    const averageBandwidth = attrs["AVERAGE-BANDWIDTH"]
    const resolution = attrs.RESOLUTION
    const codecsStr = attrs.CODECS
    const frameRate = attrs["FRAME-RATE"]

    if (!bandwidth) {
      return
    }

    const codecs = getCodecLabels(codecsStr)

    variants.push({
      bitrate: bandwidth,
      averageBandwidth,
      resolution,
      codecs,
      frameRate,
    })
  })

  return variants.sort((a, b) => {
    const aRate = a.averageBandwidth ?? a.bitrate
    const bRate = b.averageBandwidth ?? b.bitrate
    return bRate - aRate
  })
}

const extractAudioVariants = (manifest: Manifest): LadderVariant[] => {
  const audioGroups = manifest.mediaGroups?.AUDIO ?? {}
  const variants: LadderVariant[] = []

  Object.entries(audioGroups).forEach(([_groupId, group]) => {
    Object.values(group).forEach((item) => {
      const attrs = (item.attributes ?? {}) as PlaylistAttributes
      const bandwidth = attrs.BANDWIDTH
      const averageBandwidth = attrs["AVERAGE-BANDWIDTH"]
      const codecsStr = attrs.CODECS

      if (!bandwidth) {
        return
      }

      const codecs = getCodecLabels(codecsStr)

      variants.push({
        bitrate: bandwidth,
        averageBandwidth,
        codecs,
      })
    })
  })

  return variants.sort((a, b) => {
    const aRate = a.averageBandwidth ?? a.bitrate
    const bRate = b.averageBandwidth ?? b.bitrate
    return bRate - aRate
  })
}

export const extractLadder = (manifest: Manifest): LadderResult => ({
  video: extractVideoVariants(manifest),
  audio: extractAudioVariants(manifest),
})
