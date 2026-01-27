---
phase: 02-sampling-+-metrics
plan: 01
subsystem: analysis
tags: [sampling, bitrate, codecs, metrics, m3u8, fetch, HEAD-requests]

# Dependency graph
requires:
  - phase: 01-ingest-+-rfc-validation
    provides: parseM3U8, codecLabels, and manifest types for playlist processing
provides:
  - Sampling domain types (SampleConfig, SampleResult, BitratePoint, SampleCodecs)
  - Window selection for VOD and live streams
  - Header-based bitrate probing with diagnostics
  - Codec detection from playlist attributes or segment probing
affects: [02-02-sampling-ui, 02-03-metrics-computation, phase-03-recommendation-engine]

# Tech tracking
tech-stack:
  added: []
  patterns: [header-based-probing, partial-results-with-diagnostics, vod-vs-live-window-selection]

key-files:
  created:
    - src/analysis/sampling/analyzeSample.ts
    - src/analysis/sampling/sampleWindow.ts
    - src/analysis/sampling/segmentProbe.ts
  modified:
    - src/types/analysis.ts

key-decisions:
  - "Use HEAD requests for bitrate probing to avoid full segment downloads"
  - "Prioritize CODECS attribute from playlist; fall back to segment probing only when missing"
  - "Return partial results with diagnostics when probing fails (CORS, missing headers)"
  - "3-point rolling average for bitrate smoothing"
  - "Support both VOD (startOffsetSeconds) and live (liveAnchorSeconds) window modes"

patterns-established:
  - "Partial results pattern: reliable=false flag with detailed diagnostics arrays"
  - "Window selection: VOD uses offset, live anchors from end minus liveAnchorSeconds"
  - "Codec detection hierarchy: playlist CODECS → ranged GET probe → Content-Type heuristics"

# Metrics
duration: 3min
completed: 2026-01-27
---

# Phase 2 Plan 1: Sampling Analysis Primitives Summary

**Header-based bitrate probing and codec detection primitives supporting VOD/live window selection with partial-result diagnostics**

## Performance

- **Duration:** 3 minutes
- **Started:** 2026-01-27T13:00:03Z
- **Completed:** 2026-01-27T13:03:33Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Sampling domain types enable structured analysis configuration and results
- Window selection automatically adapts to VOD (offset-based) vs live (end-anchored) semantics
- Bitrate probing via HEAD requests provides efficient size measurement without full downloads
- Codec detection gracefully falls back from playlist attributes to lightweight segment probing
- Diagnostic tracking enables UI to surface partial results with warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Define sampling domain types** - `4f603ea` (feat)
2. **Task 2: Implement sampling + probing helpers** - `cb03829` (feat)

## Files Created/Modified
- `src/types/analysis.ts` - Added SampleConfig, SampleWindow, BitratePoint, SampleCodecs, SampleDiagnostics, SampleResult types
- `src/analysis/sampling/sampleWindow.ts` - Builds cumulative segment timeline and selects window segments for VOD/live
- `src/analysis/sampling/segmentProbe.ts` - HEAD-based size probing, rolling average, and optional codec probe with ranged GET
- `src/analysis/sampling/analyzeSample.ts` - End-to-end orchestrator handling master/media playlists, variant resolution, and codec extraction

## Decisions Made

1. **HEAD requests for bitrate probing** - Avoids downloading full segments (potentially hundreds of MB), uses Content-Length or Content-Range headers
2. **CODECS attribute priority** - Playlist attributes are authoritative; probing only when missing
3. **Partial results with diagnostics** - Sampling continues even when some segments fail, tracking errors/warnings/missingHeaders for UI transparency
4. **3-point rolling average** - Smooths bitrate spikes while preserving trend visibility
5. **VOD vs live window modes** - VOD uses absolute startOffsetSeconds; live computes end as (totalDuration - liveAnchorSeconds) for consistent "X seconds before live edge" behavior

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript m3u8-parser type strictness**
- Issue: Segment properties (uri, map.uri) and CODECS attribute typed as optional/ambiguous
- Resolution: Added runtime checks for segment.uri existence before pushing to timeline; cast CODECS to string with typeof guard
- Impact: Ensures type safety without modifying m3u8-parser types

## Next Phase Readiness

**Ready for Phase 2 Plan 2 (Sampling UI):**
- SampleConfig/SampleResult types ready for UI consumption
- analyzeSample function handles both master and media playlists
- Diagnostics enable warning banner pattern from Phase 1

**Blockers:** None

**Considerations for future plans:**
- Codec probing via ranged GET is lightweight but may fail on CORS-restricted origins - diagnostics surface this gracefully
- Rolling average window size (3 points) may need tuning based on real-world segment durations
- HEAD request failures are tracked but not retried - future enhancement could add exponential backoff

---
*Phase: 02-sampling-+-metrics*
*Completed: 2026-01-27*
