# Phase 1: Ingest + RFC Validation - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Accept a playlist input (URL, channel/VOD ID, or local M3U8 file) and present RFC validation feedback, playlist classification (master/media and live/VOD), and the extracted ABR ladder baseline.

</domain>

<decisions>
## Implementation Decisions

### Ingest flow
- Use an input-type selector with dedicated fields (tabs/segmented control style).
- Make the URL input the primary/default focus.
- Require an explicit Analyze button to submit.
- Offer file upload via browse-only (no drag-and-drop).

### Playlist classification display
- Use icon + label styling.
- Use terminology: Master/Variant and Live/VOD.

### Ladder baseline presentation
- Default ladder columns include full details (bitrate, resolution, codecs, plus bandwidth/avg bitrate/FPS if present).
- Order by descending bitrate.
- Show grouped sections within one table for video vs audio variants.
- Display codec info as friendly labels with raw codec strings available.

### Validation feedback
- Show severity levels: Error, Warning, and Info.
- Provide a short fix hint for each issue.
- Show results even with validation errors, but flag them as unreliable.

### Claude's Discretion
- Placement of the playlist classification labels in the UI.
- Whether to include supporting context alongside classification labels.
- Placement of validation issues (panel vs inline vs banner).

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-ingest-+-rfc-validation*
*Context gathered: 2026-01-27*
