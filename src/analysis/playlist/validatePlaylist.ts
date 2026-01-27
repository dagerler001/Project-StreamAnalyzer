import type { Manifest } from "m3u8-parser"

import type { ValidationIssue } from "../../types/analysis"

type IssueInput = Omit<ValidationIssue, "hint"> & { hint?: string }

const createIssue = ({ hint, ...issue }: IssueInput): ValidationIssue => ({
  ...issue,
  hint:
    hint ?? "Check playlist structure against RFC 8216 requirements.",
})

const isTagLine = (line: string, tag: string) => line.startsWith(tag)

const isUriLine = (line: string) =>
  line.length > 0 && !line.startsWith("#")

const extractExtinfDurations = (lines: string[]) => {
  const durations: number[] = []

  lines.forEach((line) => {
    if (!line.startsWith("#EXTINF")) {
      return
    }

    const match = line.match(/^#EXTINF:([0-9.]+)/)
    if (!match) {
      durations.push(0)
      return
    }

    const duration = Number(match[1])
    durations.push(Number.isFinite(duration) ? duration : 0)
  })

  return durations
}

export const validatePlaylist = (
  _manifest: Manifest,
  lines: string[],
): ValidationIssue[] => {
  const issues: ValidationIssue[] = []
  const trimmedLines = lines.map((line) => line.trim())

  const firstLine = trimmedLines[0] ?? ""
  if (firstLine !== "#EXTM3U") {
    issues.push(
      createIssue({
        severity: "error",
        message: "EXTM3U must be the first line of the playlist.",
        hint: "Move #EXTM3U to line 1 with no leading whitespace.",
        tag: "EXTM3U",
        line: 1,
      }),
    )
  }

  const hasMasterTags = trimmedLines.some((line) =>
    ["#EXT-X-STREAM-INF", "#EXT-X-I-FRAME-STREAM-INF", "#EXT-X-MEDIA"].some(
      (tag) => isTagLine(line, tag),
    ),
  )
  const hasMediaTags = trimmedLines.some((line) =>
    [
      "#EXTINF",
      "#EXT-X-TARGETDURATION",
      "#EXT-X-MEDIA-SEQUENCE",
      "#EXT-X-KEY",
      "#EXT-X-MAP",
      "#EXT-X-PROGRAM-DATE-TIME",
    ].some((tag) => isTagLine(line, tag)),
  )

  if (hasMasterTags && hasMediaTags) {
    issues.push(
      createIssue({
        severity: "error",
        message:
          "Playlist mixes master and media tags; RFC 8216 requires a single playlist type.",
        hint: "Separate master tags (#EXT-X-STREAM-INF) from media segment tags (#EXTINF).",
        tag: "EXT-X-STREAM-INF",
      }),
    )
  }

  trimmedLines.forEach((line, index) => {
    if (!line.startsWith("#EXT-X-STREAM-INF")) {
      return
    }

    const nextLine = trimmedLines[index + 1] ?? ""
    if (!isUriLine(nextLine)) {
      issues.push(
        createIssue({
          severity: "error",
          message:
            "EXT-X-STREAM-INF must be followed by a URI line in master playlists.",
          hint: "Add the variant playlist URI directly after EXT-X-STREAM-INF.",
          tag: "EXT-X-STREAM-INF",
          line: index + 1,
        }),
      )
    }
  })

  const extinfDurations = extractExtinfDurations(trimmedLines)
  if (extinfDurations.length === 0) {
    issues.push(
      createIssue({
        severity: "warning",
        message: "Media playlist has no EXTINF segment durations.",
        hint: "Ensure each media segment is preceded by #EXTINF with duration.",
        tag: "EXTINF",
      }),
    )
  } else if (extinfDurations.every((duration) => duration <= 0)) {
    issues.push(
      createIssue({
        severity: "warning",
        message: "EXTINF durations are zero or missing.",
        hint: "Provide a positive duration for each media segment.",
        tag: "EXTINF",
      }),
    )
  }

  const hasVersion = trimmedLines.some((line) => line.startsWith("#EXT-X-VERSION"))
  if (!hasVersion) {
    issues.push(
      createIssue({
        severity: "info",
        message: "EXT-X-VERSION tag is missing.",
        hint: "Add #EXT-X-VERSION to declare the playlist version.",
        tag: "EXT-X-VERSION",
      }),
    )
  }

  return issues
}
