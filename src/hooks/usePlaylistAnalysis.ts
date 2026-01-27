import { useState } from "react"
import type { AnalysisResult } from "../types/analysis"
import { resolveInput } from "../analysis/resolver/resolveInput"
import { parseM3U8 } from "../analysis/playlist/parseM3U8"
import { validatePlaylist } from "../analysis/playlist/validatePlaylist"
import { classifyPlaylist } from "../analysis/playlist/classifyPlaylist"
import { extractLadder } from "../analysis/ladder/extractLadder"
import type { InputType } from "../components/InputPanel"

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: AnalysisResult }
  | { status: "error"; error: string; partialResult?: Partial<AnalysisResult> }

export const usePlaylistAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({ status: "idle" })

  const analyze = async (inputType: InputType, value: string | File) => {
    setState({ status: "loading" })

    try {
      let playlistText: string

      // Step 1: Get playlist text based on input type
      if (inputType === "url") {
        const url = value as string
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch playlist: ${response.statusText}`)
        }
        playlistText = await response.text()
      } else if (inputType === "id") {
        const id = value as string
        const resolveResult = resolveInput(id)
        if (!resolveResult.success) {
          throw new Error(resolveResult.message)
        }
        const response = await fetch(resolveResult.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch playlist: ${response.statusText}`)
        }
        playlistText = await response.text()
      } else {
        // file
        const file = value as File
        playlistText = await file.text()
      }

      // Step 2: Parse the playlist
      const parsed = parseM3U8(playlistText)

      // Step 3: Validate the playlist
      const validation = validatePlaylist(parsed.manifest, parsed.lines)

      // Step 4: Classify the playlist
      const classification = classifyPlaylist(parsed.manifest)

      // Step 5: Extract ladder
      const ladder = extractLadder(parsed.manifest)

      // Step 6: Determine if results are reliable (no errors in validation)
      const reliable = !validation.some((issue) => issue.severity === "error")

      const result: AnalysisResult = {
        validation,
        classification,
        ladder,
        reliable,
      }

      setState({ status: "success", result })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred"

      // Try to still provide partial validation if we have text
      setState({
        status: "error",
        error: errorMessage,
      })
    }
  }

  return {
    state,
    analyze,
  }
}
