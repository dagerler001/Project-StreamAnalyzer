const CODEC_LABELS: Record<string, string> = {
  avc1: "H.264",
  hvc1: "H.265",
  hev1: "H.265",
  av01: "AV1",
  mp4a: "AAC",
  "ec-3": "E-AC-3",
  "ac-3": "AC-3",
}

const normalizeCodec = (codec: string) => codec.trim().toLowerCase()

export const getCodecLabel = (codec: string) => {
  const normalized = normalizeCodec(codec)
  const prefix = normalized.split(".")[0]

  return CODEC_LABELS[prefix] ?? codec.trim()
}

export const getCodecLabels = (codecs?: string | string[]) => {
  if (!codecs) {
    return []
  }

  const codecList = Array.isArray(codecs)
    ? codecs
    : codecs.split(",").map((codec) => codec.trim())

  const labels = codecList.filter(Boolean).map(getCodecLabel)

  return Array.from(new Set(labels))
}
