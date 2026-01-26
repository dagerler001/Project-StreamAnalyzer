# Feature Research

**Domain:** M3U8 stream analysis and ABR ladder recommendation
**Researched:** 2026-01-27
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| M3U8 ingest (URL + local file) | Core input for any HLS analysis tool | LOW | Support master + media playlists per RFC 8216. |
| Playlist parsing + tag validation | Engineers expect spec-compliant checks | MEDIUM | Validate required tags, tag placement, EXT-X-VERSION, master vs media tag separation. |
| ABR ladder extraction | Minimum for ladder review | MEDIUM | Parse EXT-X-STREAM-INF, EXT-X-MEDIA; compute bitrate/resolution/fps/codecs. |
| Segment sampling + size/bitrate stats | Needed to assess bitrate over time | MEDIUM | Fetch N seconds/segments, compute avg/peak segment bitrate per RFC 8216 definitions. |
| Codec and container inspection | Required for compatibility review | MEDIUM | Use CODECS attributes + segment headers for confirmation. |
| Live vs VOD detection | Fundamental for correct expectations | LOW | Use EXT-X-ENDLIST, PLAYLIST-TYPE, target duration patterns. |
| Basic best-practice warnings | Standard expectation for QA tooling | MEDIUM | Flag obvious issues: long segments, missing EXT-X-INDEPENDENT-SEGMENTS, mismatched ladder ordering. |
| Human-readable report (UI) | Engineers need quick triage | LOW | On-screen summary + downloadable JSON/CSV. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| ABR ladder recommendations | Turns analysis into actionable changes | HIGH | Recommend target bitrates/resolutions per content class and device targets. |
| OTT best-practice scoring model | Provides a single score for gating | MEDIUM | Weighted rules with explainable breakdown and confidence. |
| Live playlist evolution checks | Finds time-based issues others miss | HIGH | Detect drift, reload cadence, discontinuity gaps over windowed samples. |
| Segment-level QoE risk estimates | Predicts rebuffering/switch risk | HIGH | Uses segment bitrate variability vs target duration to score stability. |
| Custom policy profiles | Adapts to org standards | MEDIUM | Rule sets per platform (e.g., mobile vs OTT box). |
| One-click “fix list” export | Streamlines handoff to encoding team | LOW | Output as JIRA/CSV with prioritized actions. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full in-browser playback/QC | “Just play it here” | Adds player complexity, DRM constraints, and QC is not goal | Link out to reference players or local tools. |
| Real-time CDN monitoring | “Watch production in real time” | Scope and infra heavy, conflicts with local-only design | Keep as offline analysis with manual refresh. |
| Automatic re-encoding/ladder generation | “Fix it automatically” | Requires pipeline access and content-aware encoding | Provide recommendations and exportable guidance. |
| Deep frame-level QC (PSNR/VMAF) | “Assess quality, not just bitrate” | Needs source reference + heavy compute | Defer to dedicated QA pipeline; include pointers only. |

## Feature Dependencies

```
M3U8 ingest
    └──requires──> Playlist parsing + tag validation
                       └──requires──> ABR ladder extraction
                                         └──enhances──> ABR ladder recommendations

Segment sampling + size/bitrate stats
    └──enhances──> Bitrate over time charts
    └──enhances──> QoE risk estimates

Best-practice ruleset
    └──requires──> Playlist parsing + tag validation
    └──enhances──> OTT best-practice scoring model
```

### Dependency Notes

- **ABR ladder extraction requires playlist parsing:** Master playlist tags and attributes are prerequisites for ladder modeling.
- **ABR ladder recommendations enhance ladder extraction:** Recommendations need observed ladder dimensions to compare against targets.
- **QoE risk estimates require segment sampling:** Risk metrics are derived from segment size variability and target duration.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] M3U8 ingest (URL + local file) — core input path
- [ ] Playlist parsing + tag validation — required for any analysis
- [ ] ABR ladder extraction + visualization — primary user value
- [ ] Segment sampling + bitrate over time charts — reveals stability issues
- [ ] Basic best-practice warnings + score — aligns with “recommendations” goal

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] ABR ladder recommendations — after baseline analysis is trusted
- [ ] Custom policy profiles — when multiple teams need tailored rules
- [ ] Exportable “fix list” — when users request workflow integration

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Live playlist evolution checks — requires longer sampling + scheduling
- [ ] QoE risk estimates — needs calibration and validation data

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| M3U8 ingest | HIGH | LOW | P1 |
| Playlist parsing + tag validation | HIGH | MEDIUM | P1 |
| ABR ladder extraction | HIGH | MEDIUM | P1 |
| Segment sampling + bitrate charts | HIGH | MEDIUM | P1 |
| Basic best-practice warnings + score | MEDIUM | MEDIUM | P1 |
| ABR ladder recommendations | HIGH | HIGH | P2 |
| Custom policy profiles | MEDIUM | MEDIUM | P2 |
| Live playlist evolution checks | MEDIUM | HIGH | P3 |
| QoE risk estimates | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A | Competitor B | Our Approach |
|---------|--------------|--------------|--------------|
| Manifest validation | Apple Media Stream Validator focuses on spec compliance | Generic HLS validators (varied) | Combine validation with visual ladder + scoring in one UI. |
| Ladder visualization | Typically basic listing or CLI output | Often absent or minimal | First-class visual ladder with bitrate/time charts. |
| Recommendations | Usually absent | Rarely available | Provide actionable ladder + rules-based recommendations. |

## Sources

- https://datatracker.ietf.org/doc/html/rfc8216 (HLS spec; tags, playlists, bitrate definitions)
- https://developer.apple.com/streaming/ (HLS documentation hub; tools reference)
- https://developer.apple.com/documentation/http_live_streaming/hls_authoring_specification_for_apple_devices (authoring best practices)

---
*Feature research for: M3U8 stream analysis and ABR ladder recommendation*
*Researched: 2026-01-27*
