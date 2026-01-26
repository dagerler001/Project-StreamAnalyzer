# Requirements: Stream ABR Advisor

**Defined:** 2026-01-27
**Core Value:** Provide actionable, OTT-grade encoding and ladder recommendations from a short sample of a stream.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Inputs

- [ ] **INPT-01**: User can paste a direct M3U8 URL to analyze
- [ ] **INPT-02**: User can enter a channel/VOD ID and the app resolves it to an M3U8 URL (mock CDN API in v1)
- [ ] **INPT-03**: User can upload or select a local M3U8 playlist file for analysis

### Playlist Handling

- [ ] **PLAY-01**: App validates playlist tags and required tag placement per RFC 8216
- [ ] **PLAY-02**: App enforces master vs media playlist type validation before analysis
- [ ] **PLAY-03**: App detects whether a playlist is live or VOD and shows the result

### Analysis Core

- [ ] **ANLY-01**: App extracts ABR ladder variants (bitrate, resolution, codecs) and visualizes the ladder
- [ ] **ANLY-02**: App inspects audio/video codecs using playlist attributes and probe data
- [ ] **ANLY-03**: User can set a sample duration in seconds, and the app computes bitrate over time for that window

### Scoring & Recommendations

- [ ] **SCOR-01**: App produces best-practice warnings and an overall score with explainable reasons
- [ ] **SCOR-02**: App recommends concrete ABR ladder improvements based on the analysis
- [ ] **SCOR-03**: User can select a policy profile to apply a specific ruleset to scoring

### Reporting

- [ ] **REPT-01**: App shows an on-screen report with score, charts, and recommendations

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

(None yet)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Exportable fix list/report | Keep v1 on-screen only; revisit after validation |
| Live playlist evolution checks | High complexity; defer until core analysis is validated |
| Segment-level QoE risk estimates | Needs calibration data; out of scope for v1 |
| Automatic re-encoding/ladder generation | Requires pipeline access beyond analysis tool |
| Full in-browser playback/QC | Adds player/DRM complexity; not core to analysis |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPT-01 | Phase 1 | Pending |
| INPT-02 | Phase 1 | Pending |
| INPT-03 | Phase 1 | Pending |
| PLAY-01 | Phase 1 | Pending |
| PLAY-02 | Phase 1 | Pending |
| PLAY-03 | Phase 1 | Pending |
| ANLY-01 | Phase 1 | Pending |
| ANLY-02 | Phase 2 | Pending |
| ANLY-03 | Phase 2 | Pending |
| SCOR-01 | Phase 3 | Pending |
| SCOR-02 | Phase 3 | Pending |
| SCOR-03 | Phase 3 | Pending |
| REPT-01 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---
*Requirements defined: 2026-01-27*
*Last updated: 2026-01-27 after roadmap creation*
