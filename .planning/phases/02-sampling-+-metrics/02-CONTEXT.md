# Phase 2: Sampling + Metrics - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Sample a time window from media and show detected codecs plus bitrate-over-time metrics for that sample. This phase is about configuring the sampling window and presenting the resulting metrics.

</domain>

<decisions>
## Implementation Decisions

### Sampling window behavior
- Duration is chosen via preset buttons (no free-entry field).
- For VOD, users choose the sample start offset.
- For live media, the sample window anchor is user-configurable.
- No explicit min/max duration policy beyond the available presets.

### Bitrate-over-time display
- Use an area chart.
- Plot per-segment points (one point per segment in the sample).
- Show both raw bitrate and a smoothed (rolling average) overlay.
- Chart represents the selected rendition only (single line).

### Codec detection presentation
- Show codec details including profile/level when known.
- Display audio and video codecs separately.
- If multiple codecs are detected, list all detected codecs.

### Incomplete/failed samples
- Show partial metrics when data is incomplete.
- Provide a manual retry action.
- Use detailed diagnostic messaging.

### Claude's Discretion
- Where codec info appears in the UI.
- Whether a too-short/missing sample shows a warning with partial results or a blocking error state.

</decisions>

<specifics>
## Specific Ideas

No specific requirements - open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 02-sampling-+-metrics*
*Context gathered: 2026-01-27*
