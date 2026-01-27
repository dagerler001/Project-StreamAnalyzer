import { Parser } from "m3u8-parser"
import type { Manifest } from "m3u8-parser"

import { normalizePlaylistText } from "./text"

export type ParsedPlaylist = {
  manifest: Manifest
  lines: string[]
  text: string
}

export const parseM3U8 = (input: string): ParsedPlaylist => {
  const { text, lines } = normalizePlaylistText(input)
  const parser = new Parser()

  parser.push(text)
  parser.end()

  return { manifest: parser.manifest, lines, text }
}
