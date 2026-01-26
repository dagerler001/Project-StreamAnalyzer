# Stream ABR Advisor

## What This Is

A local-only web UI for streaming engineers to analyze an M3U8 (live or VOD) by sampling a user-defined number of seconds, inspecting the ABR ladder, A/V codecs, and bitrate over time. It scores the stream against general OTT best practices and recommends concrete ladder/codec improvements, shown directly in the UI.

## Core Value

Provide actionable, OTT-grade encoding and ladder recommendations from a short sample of a stream.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Accept M3U8 URL or channel/VOD ID (resolved to M3U8 via CDN API)
- [ ] Let users configure sample duration and download that window for analysis
- [ ] Analyze ABR ladder, A/V codecs, and bitrate over time for the sample
- [ ] Score quality + playback health and recommend improvements
- [ ] Present results on-screen (score + recommendations)

### Out of Scope

- Exported reports (JSON/CSV) — on-screen only for v1
- Hosted multi-user app — local-only execution
- Real CDN API integration — v1 uses a mock resolver

## Context

- Target users are streaming engineers tuning encoders and ladders
- Works for both live streams and VOD playlists
- Recommendations align to general OTT best practices (not brand-specific IP)

## Constraints

- **Environment**: Runs locally only — no hosted deployment
- **Integration**: CDN API resolution mocked in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Support both M3U8 URL and channel/VOD ID input | Matches real workflows and reduces manual URL handling | — Pending |
| Analyze live and VOD streams | Tool should cover both operational cases | — Pending |
| Score combines ladder + codecs + segment health | Gives a full quality + playback view | — Pending |
| On-screen results only in v1 | Keep scope tight for first release | — Pending |

---
*Last updated: 2026-01-27 after initialization*
