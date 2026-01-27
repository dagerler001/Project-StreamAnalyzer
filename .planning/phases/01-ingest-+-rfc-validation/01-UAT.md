---
status: complete
phase: 01-ingest-+-rfc-validation
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-01-27T02:39:08.5484473+02:00
updated: 2026-01-27T02:44:32.5221048+02:00
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Analyze via Playlist URL
expected: In URL mode, entering a valid M3U8 URL and pressing Enter or clicking Analyze shows a loading state and then renders Validation, Classification, and ABR Ladder results.
result: pass

### 2. Analyze via Channel/VOD ID
expected: In Channel/VOD ID mode, entering a known ID (for example, ch-live-1 or vod-movie-123) and running Analyze resolves the ID and produces the same results sections without an unknown-ID error.
result: issue
reported: "Failed to fetch"
severity: major

### 3. Analyze via Local File
expected: In Local File mode, selecting a .m3u8 file enables Analyze and renders Validation, Classification, and ABR Ladder results after processing.
result: pass

### 4. Validation Feedback and Reliability Warning
expected: When analyzing an invalid playlist (for example, missing #EXTM3U or with tag placement issues), the Validation panel lists issues with severity badges and hints, and a warning banner appears if any error-level issues are present.
result: pass

### 5. Classification Badges
expected: The Classification section shows two badges indicating playlist type (Master or Variant) and stream type (Live or VOD) that match the analyzed playlist.
result: pass

### 6. ABR Ladder Table
expected: The ABR Ladder section shows Video and/or Audio variant tables with bitrate, avg bitrate, resolution, codecs, and frame rate; variants are listed highest bitrate first, and if none exist a clear empty message appears.
result: pass

## Summary

total: 6
passed: 5
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "In Channel/VOD ID mode, entering a known ID (for example, ch-live-1 or vod-movie-123) and running Analyze resolves the ID and produces the same results sections without an unknown-ID error."
  status: failed
  reason: "User reported: Failed to fetch"
  severity: major
  test: 2
  root_cause: "ID resolver maps to placeholder example.cdn.com URLs; fetch(resolveResult.url) fails and surfaces as 'Failed to fetch'."
  artifacts:
    - path: src/analysis/resolver/mockCdnMap.ts
      issue: "Known IDs map to https://example.cdn.com/... placeholder URLs."
    - path: src/hooks/usePlaylistAnalysis.ts
      issue: "ID flow fetches resolved URL directly; placeholder URL fails network fetch."
  missing:
    - "Replace mockCdnMap URLs with reachable sample playlists or local fixtures." 
    - "Optionally add a mock fetch layer for ID mode in dev/UAT to avoid external network dependency."
  debug_session: .planning/debug/test-2-analyze-id-failed.md
