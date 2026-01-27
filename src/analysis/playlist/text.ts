const normalizeNewlines = (value: string) => value.replace(/\r\n?/g, "\n")

export const normalizePlaylistText = (input: string) => {
  const withoutBom = input.replace(/^\uFEFF/, "")
  const normalized = normalizeNewlines(withoutBom)
  const lines = normalized.split("\n")

  return { text: normalized, lines }
}
