# Project Research Summary

**Project:** Stream ABR Advisor
**Domain:** Local M3U8 stream analysis and ABR ladder recommendations
**Researched:** 2026-01-27
**Confidence:** MEDIUM

## Executive Summary

This project is a local-only web UI for streaming engineers to analyze HLS playlists (live or VOD), sample segments, and generate ABR ladder insights with best-practice scoring. Expert tooling in this space relies on strict RFC 8216-compliant parsing, targeted segment sampling, and trusted codec/bitrate inspection via ffprobe, with clear UI surfacing of ladder structure, timeline metrics, and warnings.

The recommended approach is a Vite + React UI paired with a local Fastify analysis API, backed by a modular analysis pipeline (resolver, playlist parser/validator, sampler, probe, metrics, scoring). Use typed artifacts and caching to keep analysis repeatable and fast, and keep heavy parsing/probing off the main thread. For scoring and recommendations, implement a rule engine with explainable outputs before adding advanced QoE estimates.

Key risks are inaccurate parsing and misleading metrics: misclassifying master vs media playlists, ignoring discontinuities, relying on declared BANDWIDTH instead of segment size, and skipping EXT-X-MAP for fMP4. Mitigate with strict validation, explicit discontinuity handling, RFC-aligned bitrate math, and explicit encryption handling (flag and skip deep probing when necessary).

## Key Findings

### Recommended Stack

Stack research supports a modern local toolchain: Node 24 LTS + TypeScript for the analysis pipeline, Vite + React for UI, and Fastify for a local API. ffprobe is the most reliable source of codec/container truth; m3u8-parser should be the canonical parser. Optional libraries (mux.js, hls.js, react-query, zod, better-sqlite3, echarts) fill in sampling, playback preview, caching, and charts as needed.

**Core technologies:**
- Node.js 24.13.0 LTS: local analysis runtime and fetch support — stable LTS with built-in fetch.
- TypeScript 5.9: parsing and scoring correctness — reduces RFC and validation errors.
- React 19.2.4: UI for inspection and reporting — standard ecosystem in 2025.
- Vite 7.3.1: dev/build system — fast local SPA tooling.
- Fastify 5.7.2: local API server — lightweight, typed JSON pipelines.
- FFmpeg/ffprobe 8.0.1: media probing — most reliable codec/bitrate source.

### Expected Features

Feature research emphasizes a solid analysis core before advanced recommendations. MVP should deliver ingestion, strict playlist parsing, ladder extraction, sampling-based metrics, and baseline warnings with an on-screen report.

**Must have (table stakes):**
- M3U8 ingest (URL + local file) — core input path.
- Playlist parsing + tag validation — RFC-compliant analysis foundation.
- ABR ladder extraction + visualization — primary user value.
- Segment sampling + bitrate-over-time stats — stability assessment.
- Basic best-practice warnings + score — actionable QA.

**Should have (competitive):**
- ABR ladder recommendations — actionable tuning guidance.
- Custom policy profiles — adapt scoring to teams.
- One-click fix list export — workflow integration.

**Defer (v2+):**
- Live playlist evolution checks — higher complexity scheduling.
- Segment-level QoE risk estimates — needs calibration data.

### Architecture Approach

Architecture research recommends a pipeline-based analysis layer separated from UI, with swappable probe adapters and worker offload for heavy parsing/probing. Typed artifacts at each stage enable caching and deterministic recompute.

**Major components:**
1. Resolver/URL normalizer — resolve IDs and normalize playlist URLs.
2. Playlist parser + validator — parse master/media playlists and enforce RFC rules.
3. Segment sampler + media probe — choose windows and extract codec/bitrate data.
4. Metrics + ladder analyzer — compute time-series stats and ladder health.
5. Scoring + recommendation engine — rule-based scores with explanations.

### Critical Pitfalls

1. **Mixed master/media parsing** — enforce RFC 8216 playlist type validation before analysis.
2. **Ignoring discontinuities/media sequence** — reset timelines and continuity on discontinuities.
3. **Wrong bitrate math** — compute segment bitrate from size and EXTINF, not BANDWIDTH.
4. **Missing EXT-X-MAP for fMP4** — always fetch init segments for codec parsing.
5. **Mishandling encryption/keys** — detect EXT-X-KEY; flag and skip deep probes when needed.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Ingest + RFC-Safe Parsing Foundation
**Rationale:** All downstream analysis depends on accurate playlist classification and URI resolution.
**Delivers:** URL/file ingest, resolver/normalizer, strict parser/validator, ladder extraction baseline.
**Addresses:** M3U8 ingest, playlist parsing + validation, ABR ladder extraction.
**Avoids:** Mixed master/media parsing, mis-resolved relative URIs, missing EXT-X-MAP, invalid variant group references.

### Phase 2: Sampling + Metrics + Baseline Scoring
**Rationale:** Sampling and RFC-aligned metrics are prerequisite for any trustworthy scoring or charts.
**Delivers:** Segment sampling, ffprobe integration, bitrate/time-series charts, best-practice warnings + score.
**Addresses:** Segment sampling + stats, basic best-practice warnings, live vs VOD detection.
**Avoids:** Wrong bitrate math, ignored discontinuities/media sequence, too-short sampling windows, stale live reload logic.

### Phase 3: Recommendations + Policy Profiles
**Rationale:** Recommendations are only credible after validated metrics and baseline scoring.
**Delivers:** Ladder recommendations, policy profiles, exportable fix lists.
**Addresses:** ABR ladder recommendations, custom policy profiles, fix list export.
**Avoids:** Overconfident recommendations without explainability or coverage indicators.

### Phase Ordering Rationale

- Parsing and ladder extraction must be correct before metrics or scoring can be trusted.
- Sampling/probing is the first major performance bottleneck; isolate it before recommendation complexity.
- Recommendation logic should build on proven, explainable scoring outputs.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Live reload cadence and sampling strategy for live streams; probe performance limits.
- **Phase 3:** Recommendation calibration and policy rule definition per device targets.

Phases with standard patterns (skip research-phase):
- **Phase 1:** RFC-compliant parsing and URL resolution are well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official release/docs and widely used tooling. |
| Features | MEDIUM | Based on domain expectations and RFC/Apple guidance. |
| Architecture | MEDIUM | Standard pipeline patterns; some choices depend on probe method. |
| Pitfalls | MEDIUM | Derived from RFC rules and common HLS failure modes. |

**Overall confidence:** MEDIUM

### Gaps to Address

- Recommendation calibration data: define bitrate/resolution targets per content class and device mix.
- Probe approach trade-offs: confirm ffprobe vs WASM performance and local installation UX.
- Encryption handling: decide MVP stance and UI messaging for encrypted segments.
- Live sampling defaults: validate minimum window size and reload cadence for meaningful metrics.

## Sources

### Primary (HIGH confidence)
- https://www.rfc-editor.org/rfc/rfc8216 — HLS playlist rules and bitrate definitions.
- https://developer.apple.com/streaming/ — Apple HLS documentation and best practices.
- https://ffmpeg.org/download.html — ffprobe availability and versioning.
- https://nodejs.org/en/download — Node.js LTS guidance.
- https://www.typescriptlang.org/ — TypeScript 5.9 release.
- https://react.dev/blog/2025/02/14/sunsetting-create-react-app — CRA deprecation context.

### Secondary (MEDIUM confidence)
- https://vite.dev/guide/ — Vite 7.3.1 requirements.
- https://github.com/fastify/fastify/releases — Fastify 5.7.2 release.
- https://github.com/videojs/m3u8-parser/releases — m3u8-parser release.
- https://github.com/video-dev/hls.js/releases — hls.js release.
- https://github.com/videojs/mux.js/releases — mux.js release.
- https://github.com/TanStack/query/releases — @tanstack/react-query release.
- https://github.com/colinhacks/zod/releases — zod release.
- https://github.com/WiseLibs/better-sqlite3/releases — better-sqlite3 release.
- https://github.com/apache/echarts/releases — ECharts release.

---
*Research completed: 2026-01-27*
*Ready for roadmap: yes*
