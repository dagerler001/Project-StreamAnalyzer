import { useState, useCallback } from "react"
import type { AnalysisResult, SampleConfig, SampleResult } from "../types/analysis"
import type { Manifest } from "m3u8-parser"
import type { ScoreResult } from "../types/scoring"
import { resolveInput } from "../analysis/resolver/resolveInput"
import { parseM3U8 } from "../analysis/playlist/parseM3U8"
import { validatePlaylist } from "../analysis/playlist/validatePlaylist"
import { classifyPlaylist } from "../analysis/playlist/classifyPlaylist"
import { extractLadder } from "../analysis/ladder/extractLadder"
import { analyzeSample } from "../analysis/sampling/analyzeSample"
import { runScoring } from "../scoring/engine/scoreEngine"
import type { InputType } from "../components/InputPanel"

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: AnalysisResult }
  | { status: "error"; error: string; partialResult?: Partial<AnalysisResult> }

type SampleState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: SampleResult }
  | { status: "error"; error: string; partialResult?: Partial<SampleResult> }

type ScoreState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: ScoreResult }
  | { status: "error"; error: string }

export const usePlaylistAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({ status: "idle" })
  const [sampleState, setSampleState] = useState<SampleState>({ status: "idle" })
  const [scoreState, setScoreState] = useState<ScoreState>({ status: "idle" })
  const [selectedPolicy, setSelectedPolicy] = useState<string>("generic")

  // Track analyzed playlist data for sampling reuse
  const [lastPlaylistUrl, setLastPlaylistUrl] = useState<string | undefined>()
  const [parsedManifest, setParsedManifest] = useState<Manifest | undefined>()

  // Sample configuration state
  const [sampleConfig, setSampleConfig] = useState<SampleConfig>({
    durationSeconds: 30,
    startOffsetSeconds: 0,
    liveAnchorSeconds: 30,
    selectedRenditionIndex: 0,
  })

  const analyze = async (inputType: InputType, value: string | File) => {
    setState({ status: "loading" })

    try {
      let playlistText: string
      let baseUrl: string | undefined

      // Step 1: Get playlist text based on input type
      if (inputType === "url") {
        const url = value as string
        baseUrl = url
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
        baseUrl = resolveResult.url
        const response = await fetch(resolveResult.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch playlist: ${response.statusText}`)
        }
        playlistText = await response.text()
      } else {
        // file - no base URL available
        const file = value as File
        playlistText = await file.text()
        baseUrl = undefined
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

      // Store data for sampling reuse
      setLastPlaylistUrl(baseUrl)
      setParsedManifest(parsed.manifest)

      // Default to first video variant for sampling
      const firstVideoIndex = 0
      setSampleConfig((prev) => ({
        ...prev,
        selectedRenditionIndex: firstVideoIndex,
      }))

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

  const runSample = async () => {
    if (!parsedManifest) {
      setSampleState({
        status: "error",
        error: "No playlist analyzed yet. Please analyze a playlist first.",
      })
      return
    }

    if (state.status !== "success") {
      setSampleState({
        status: "error",
        error: "Playlist analysis must be successful before sampling.",
      })
      return
    }

    setSampleState({ status: "loading" })

    try {
      const result = await analyzeSample(
        parsedManifest,
        lastPlaylistUrl,
        sampleConfig,
        state.result.classification.streamType
      )

      setSampleState({ status: "success", result })
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred during sampling"

      setSampleState({
        status: "error",
        error: errorMessage,
      })
    }
  }

  const retrySample = async () => {
    // Reuse existing config and run sample again
    await runSample()
  }

  const updateSampleConfig = (updates: Partial<SampleConfig>) => {
    setSampleConfig((prev) => ({ ...prev, ...updates }))
  }

  const runScoringAction = useCallback(() => {
    if (state.status !== "success") return

    setScoreState({ status: "loading" })

    try {
      const context = {
        ladder: state.result.ladder,
        classification: state.result.classification,
        sampleResult: sampleState.status === "success" ? sampleState.result : undefined,
      }

      const result = runScoring(context, selectedPolicy)
      setScoreState({ status: "success", result })
    } catch (err) {
      setScoreState({
        status: "error",
        error: err instanceof Error ? err.message : "Scoring failed",
      })
    }
  }, [state, sampleState, selectedPolicy])

  // Auto-run scoring when analysis completes successfully
  const runScoringIfIdle = useCallback(() => {
    if (state.status === "success" && scoreState.status === "idle") {
      runScoringAction()
    }
  }, [state, scoreState, runScoringAction])

  // Trigger auto-run scoring when analysis completes
  if (state.status === "success" && scoreState.status === "idle") {
    runScoringIfIdle()
  }

  return {
    state,
    analyze,
    sampleState,
    sampleConfig,
    updateSampleConfig,
    runSample,
    retrySample,
    scoreState,
    selectedPolicy,
    setSelectedPolicy,
    runScoring: runScoringAction,
  }
}
