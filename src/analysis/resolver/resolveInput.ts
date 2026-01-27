import { MOCK_CDN_MAP } from "./mockCdnMap"

export type ResolverSuccess = {
  success: true
  url: string
  label?: string
}

export type ResolverError = {
  success: false
  error: "unknown-id" | "invalid-input"
  message: string
}

export type ResolverResult = ResolverSuccess | ResolverError

export const resolveInput = (input: string): ResolverResult => {
  const trimmed = input.trim()

  if (!trimmed) {
    return {
      success: false,
      error: "invalid-input",
      message: "Input is empty",
    }
  }

  // Check if it's already a URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      success: true,
      url: trimmed,
    }
  }

  // Try to resolve as channel/VOD ID
  const entry = MOCK_CDN_MAP[trimmed]
  if (!entry) {
    return {
      success: false,
      error: "unknown-id",
      message: `Unknown channel or VOD ID: "${trimmed}"`,
    }
  }

  return {
    success: true,
    url: entry.url,
    label: entry.label,
  }
}
