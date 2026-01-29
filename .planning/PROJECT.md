# Stream ABR Advisor

## What This Is

A local-only web UI for streaming engineers to analyze an M3U8 (live or VOD) by sampling a user-defined number of seconds, inspecting the ABR ladder, A/V codecs, and bitrate over time. It scores the stream against general OTT best practices and recommends concrete ladder/codec improvements, shown directly in the UI.

## Core Value

Provide actionable, OTT-grade encoding and ladder recommendations from a short sample of a stream.

## Current State

**Shipped:** v1.0 MVP (2026-01-29)

The tool is fully functional with:
- Three input methods: direct M3U8 URL, channel/VOD ID (mock CDN resolver), local file upload
- RFC 8216 playlist validation with severity levels
- Master/media and live/VOD classification
- ABR ladder extraction and visualization
- Time-window sampling (15/30/60/120s) with bitrate-over-time analysis
- Audio/video codec detection
- Policy-based scoring (Apple HLS, Google VP9, Generic profiles)
- Explainable scores with warnings and concrete recommendations
- Side-by-side ladder comparison with change highlighting

**Codebase:** ~6,887 LOC TypeScript/React, 123 files, 31 tests (100% passing)

## Requirements

### Validated (v1.0)

- ✓ Accept M3U8 URL or channel/VOD ID (resolved to M3U8 via CDN API) — v1.0
- ✓ Let users configure sample duration and download that window for analysis — v1.0
- ✓ Analyze ABR ladder, A/V codecs, and bitrate over time for the sample — v1.0
- ✓ Score quality + playback health and recommend improvements — v1.0
- ✓ Present results on-screen (score + recommendations) — v1.0

### Active (Next Milestone)

(None yet — awaiting user feedback from v1.0)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Exported reports (JSON/CSV) | Keep v1 on-screen only; revisit after validation |
| Hosted multi-user app | Local-only execution constraint |
| Real CDN API integration | v1 uses mock resolver; real API in future |
| Live playlist evolution checks | High complexity; defer until core validated |
| Segment-level QoE risk estimates | Needs calibration data |
| Automatic re-encoding/ladder generation | Requires pipeline access beyond analysis tool |
| Full in-browser playback/QC | Adds player/DRM complexity; not core to analysis |

## Context

- Target users are streaming engineers tuning encoders and ladders
- Works for both live streams and VOD playlists
- Recommendations align to general OTT best practices (not brand-specific IP)
- v1.0 shipped with 3 phases, 12 plans, 27 commits over 3 days

## Constraints

- **Environment**: Runs locally only — no hosted deployment
- **Integration**: CDN API resolution mocked in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Support both M3U8 URL and channel/VOD ID input | Matches real workflows and reduces manual URL handling | ✓ Good — all 3 input modes working |
| Analyze live and VOD streams | Tool should cover both operational cases | ✓ Good — classification handles both, including EVENT playlists |
| Score combines ladder + codecs + segment health | Gives a full quality + playback view | ✓ Good — 7 rules across 4 categories |
| On-screen results only in v1 | Keep scope tight for first release | ✓ Good — ReportPanel delivers complete UI |
| Use m3u8-parser library | Standard library with good TypeScript support | ✓ Good — parsing reliable |
| Native SVG for charting | Avoid external dependencies | ✓ Good — consistent visualization |
| Policy-based rule engine | Different platforms need different scoring | ✓ Good — 3 profiles implemented |

## Next Milestone Goals

Awaiting user validation and feedback from v1.0 to determine priorities. Potential directions:

- Exportable reports (JSON/CSV) for integration with other tools
- Real CDN API integration (beyond mock resolver)
- Additional scoring policies (DASH, specific encoding vendors)
- Historical comparison (track ladder changes over time)
- Batch analysis (multiple playlists at once)

---
*Last updated: 2026-01-29 after v1.0 milestone completion*
