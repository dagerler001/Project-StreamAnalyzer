---
phase: 02-sampling-+-metrics
plan: 03
subsystem: ui-metrics
status: complete
completed: 2026-01-27
duration: 3 minutes
tags:
  - react
  - svg-charts
  - codec-display
  - diagnostics

dependencies:
  requires:
    - 02-02 (Sample controls and configuration)
    - 02-01 (Sampling engine)
  provides:
    - Codec summary component
    - Bitrate chart visualization
    - Sample metrics UI integration
  affects:
    - 03-* (Phase 3 will consume these metrics for recommendations)

tech-stack:
  added:
    - Native SVG for charting (no external libs)
  patterns:
    - Responsive SVG charts with inline scaling
    - Empty state handling for partial results
    - Diagnostic warning banners

decisions:
  - title: Use native SVG for charting
    rationale: Avoids external dependencies, full control over visualization, performant for simple line charts
    phase-plan: "02-03"
  - title: Display unreliable results with warnings
    rationale: Users see partial data even when some segments fail, maintaining transparency
    phase-plan: "02-03"
  - title: Separate friendly and raw codec labels
    rationale: Friendly names (H.264) for readability, raw strings (avc1.64001f) for technical reference
    phase-plan: "02-03"

key-files:
  created:
    - src/components/BitrateChart.tsx
    - src/components/CodecSummary.tsx
  modified:
    - src/App.tsx
    - src/App.css
---

# Phase [2] Plan [3]: Render Sampling Metrics Summary

Codec and bitrate visualization with SVG charts, diagnostics display, and retry functionality.

## Overview

**What was built:** Complete metrics display UI for sampled stream windows, including codec detection and bitrate-over-time visualization.

**Why it matters:** Delivers the Phase 2 visual experience, enabling users to see detected codecs and bitrate patterns from their sample runs.

**Integration points:**
- Consumes `sampleState.result` from usePlaylistAnalysis hook
- Displays BitrateChart and CodecSummary when sample succeeds
- Shows diagnostic warnings for unreliable samples

## Tasks Completed

### Task 1: Build codec and bitrate chart components
**Commit:** 319bd88

Created two new components for sample metrics visualization:

**CodecSummary component:**
- Displays video and audio codecs separately
- Shows friendly codec names (H.264, AAC) alongside raw strings (avc1.64001f, mp4a.40.2)
- Handles empty codec data gracefully with placeholder message
- Styled with codec list layout using surface-muted backgrounds

**BitrateChart component:**
- Renders SVG area chart with time on X-axis, bitrate on Y-axis
- Displays both raw bitrate points and 3-point rolling average
- Auto-scales based on min/max bitrate in dataset
- Includes grid lines, axis labels, and legend
- Formats bitrate as Mbps and time as mm:ss
- Handles empty datasets with placeholder message

Both components are dependency-free and resilient to partial data.

**Files:**
- `src/components/BitrateChart.tsx`
- `src/components/CodecSummary.tsx`

### Task 2: Integrate metrics display and styling
**Commit:** 3ac4e8e

Wired metrics components into the Results panel with full state handling:

**App.tsx integration:**
- Added Sample Results section that appears when sampleState is not idle
- Loading state shows "Sampling stream..." placeholder
- Error state displays error message with "Retry Sample" button
- Success state renders codec summary and bitrate chart
- Warning banner appears when `sampleState.result.reliable` is false
- Diagnostics display lists errors, warnings, and missing header counts
- Inline retry button in warning banner for failed/partial samples

**CSS styling (App.css):**
- `.sample-loading`, `.sample-error`: Loading and error states with surface backgrounds
- `.sample-warning-banner`: Yellow-tinted warning with border, lists diagnostics
- `.codec-summary`: Card layout for codec groups
- `.codec-list`, `.codec-item`: List styling with friendly/raw label separation
- `.bitrate-chart`: Chart container with responsive SVG
- `.chart-legend`: Legend for raw vs smoothed bitrate lines
- `.button-retry`, `.button-retry-inline`: Retry action buttons

All styling follows existing design system variables and responsive layout patterns.

**Files:**
- `src/App.tsx`
- `src/App.css`

## Verification

All tasks verified with `npm run build` - TypeScript compilation and Vite production build succeeded with no errors.

## Decisions Made

### 1. Use native SVG for charting
**Context:** Need to visualize bitrate-over-time data
**Options:** External charting library (Chart.js, Recharts) vs native SVG
**Decision:** Native SVG implementation
**Rationale:** Simple line chart doesn't justify external dependency; full control over styling and scaling; better performance for small datasets; maintains zero-dependency approach for Phase 2.

### 2. Display unreliable results with warnings
**Context:** Samples may fail partially (missing headers, CORS errors, segment failures)
**Decision:** Show partial metrics with warning banner listing diagnostics
**Rationale:** Consistent with Phase 1 approach (show unreliable validation results); users see what data is available; transparency about reliability; retry option always available.

### 3. Separate friendly and raw codec labels
**Context:** Codec strings can be technical (avc1.64001f) or readable (H.264)
**Decision:** Display both friendly name and raw string side-by-side
**Rationale:** Friendly names for quick recognition; raw strings for technical reference and debugging; codec-raw class with monospace font distinguishes technical detail.

## Next Phase Readiness

**Blockers:** None

**Considerations for Phase 3:**
- Bitrate data is ready for analysis (min, max, average, variance)
- Codec information available for compatibility checks
- Diagnostics can inform recommendation confidence levels
- Chart visualization can be reused/extended for ladder comparisons

## Deviations from Plan

None - plan executed exactly as written.

## Metrics

**Execution time:** 3 minutes
**Tasks completed:** 2/2
**Commits:** 2 atomic commits
**Files created:** 2
**Files modified:** 2
**Build status:** Success

---

*Generated by GSD execution agent*
