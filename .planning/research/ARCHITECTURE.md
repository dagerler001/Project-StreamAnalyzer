# Architecture Research

**Domain:** Local M3U8 stream analysis and ABR ladder recommendation tools
**Researched:** 2026-01-27
**Confidence:** MEDIUM

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             UI / Presentation                           │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │ Input Panel  │  │ Timeline + ABR  │  │ Score + Recommendations     │ │
│  │ (URL / ID)   │  │ Visualizations  │  │ + Export                     │ │
│  └──────┬───────┘  └────────┬────────┘  └───────────────┬─────────────┘ │
│         │                   │                           │               │
├─────────┴───────────────────┴───────────────────────────┴───────────────┤
│                        Analysis Orchestrator Layer                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Resolver /   │  │ Playlist      │  │ Segment      │  │ Media Probe  │ │
│  │ URL Normal   │  │ Parser +      │  │ Sampler      │  │ (ffprobe/WASM│ │
│  │ (mock CDN)   │  │ Validator     │  │              │  │ or native)   │ │
│  └──────┬───────┘  └──────┬────────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                   │                 │                │         │
│  ┌──────┴───────┐  ┌────────┴─────────┐  ┌────┴───────┐  ┌─────┴──────┐ │
│  │ Metrics       │  │ ABR Ladder       │  │ Codec /    │  │ Scoring +  │ │
│  │ Aggregator    │  │ Analyzer          │  │ Container │  │ Reco Engine│ │
│  └──────┬───────┘  └────────┬─────────┘  │ Analyzer   │  └─────┬──────┘ │
│         │                   │            └────┬───────┘        │        │
├─────────┴───────────────────┴─────────────────┴────────────────┴────────┤
│                          Local Storage / Cache                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────────────┐ │
│  │ Playlist     │  │ Segment      │  │ Analysis Results (JSON / IDB)   │ │
│  │ Cache         │  │ Sample Cache │  │ + Historical Runs               │ │
│  └──────────────┘  └──────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Input Panel | Capture M3U8 URL or channel/VOD ID and analysis parameters | Web form + validation |
| Resolver / URL Normalizer | Convert channel/VOD ID to actual M3U8 URL (mock CDN resolver), normalize query params | Pure function + mapping config |
| Playlist Parser + Validator | Parse master/media playlists, validate tags, build playlist graph | HLS parser library or custom parser | 
| Segment Sampler | Select time window and segment subset for probing (live window or VOD range) | Deterministic sampler with rate limits |
| Media Probe | Inspect sampled segments for bitrate, codec, container, GOP, audio layout | ffprobe CLI (local) or WebAssembly probe |
| Metrics Aggregator | Compute bitrate over time, segment duration stats, discontinuities | In-memory compute + cached results |
| ABR Ladder Analyzer | Evaluate ladder spacing, codec/resolution alignment, bandwidth metadata | Rule-based analyzer using playlist + probe data |
| Scoring + Recommendation Engine | Score against best-practice rules and emit suggestions | Configurable ruleset + templates |
| UI Visualizations | Timeline, ladder chart, codec badges, variance graphs | Charting library + virtualized tables |
| Local Storage / Cache | Persist playlists, sampled segments, and results for compare | IndexedDB or filesystem (local app) |

## Recommended Project Structure

```
src/
├── app/                     # UI shell, routing, layout
│   ├── pages/               # Input, results, compare views
│   └── components/          # Charts, tables, badges
├── analysis/                # Core analysis pipeline
│   ├── resolver/            # URL normalization, mock CDN
│   ├── playlist/            # Parsing, validation, graph model
│   ├── sampling/            # Segment selection strategies
│   ├── probe/               # Media probing adapters
│   ├── metrics/             # Derived metrics computation
│   ├── ladder/              # ABR ladder analysis rules
│   └── scoring/             # Scoring + recommendation rules
├── workers/                 # Web Workers for heavy analysis
├── data/                    # Caches and analysis artifacts
├── types/                   # Shared domain types
└── utils/                   # Shared helpers (time, parsing)
```

### Structure Rationale

- **analysis/** is isolated from UI so tests can exercise the pipeline without UI state.
- **probe/** is a swappable adapter to keep local ffprobe or WASM probes behind a stable interface.
- **workers/** keeps heavy parsing/probing off the main thread for local-only UI responsiveness.

## Architectural Patterns

### Pattern 1: Pipeline with Immutable Analysis Artifacts

**What:** Each stage emits a typed artifact (playlist graph, sample set, metrics, score). Artifacts are cached and never mutated.
**When to use:** Multi-step analysis where some stages are expensive and should be reused across UI views.
**Trade-offs:** Extra memory usage, but predictable recompute and easy caching.

**Example:**
```typescript
type AnalysisStage<I, O> = (input: I) => Promise<O>;

const run = async (input: ResolveInput) => {
  const resolved = await resolveUrl(input);
  const playlists = await parsePlaylists(resolved);
  const samples = await sampleSegments(playlists, input.window);
  const probe = await probeSegments(samples);
  const metrics = computeMetrics(playlists, probe);
  return scoreAndRecommend(metrics);
};
```

### Pattern 2: Worker Offload for Probe + Parse

**What:** Execute parsing/probing in a Web Worker or local backend to avoid UI blocking.
**When to use:** Large playlists or multi-variant ladders with many segments.
**Trade-offs:** Message passing overhead and serialized data transfer.

**Example:**
```typescript
worker.postMessage({ type: "PROBE", segments });
worker.onmessage = (e) => setProbeResult(e.data);
```

### Pattern 3: Rule Engine for Scoring

**What:** Encode best-practice checks as composable rules with thresholds.
**When to use:** Scoring evolves frequently or needs to be configurable.
**Trade-offs:** More abstraction than inline checks.

## Data Flow

### Request Flow

```
User input
  ↓
Resolver → Playlist Fetch → Playlist Parse/Validate → Sample Plan
  ↓                                             ↓
Segment Fetch → Media Probe → Metrics Compute → Score + Reco
  ↓                                             ↓
Cache Update                                  UI Render
```

### State Management

```
Analysis Store
  ↓ (subscribe)
UI Components ←→ Actions → Reducers/Mutations → Analysis Store
```

### Key Data Flows

1. **Master playlist intake:** URL/ID resolves to master playlist, then variants are expanded into media playlists.
2. **Sampling + probing:** Segment sampler chooses ranges, probe extracts bitrate/codec/container data, metrics aggregated.
3. **Scoring + recommendations:** Rules read metrics and playlist metadata to output score + actions.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Local-only, in-browser pipeline with optional worker and caching is sufficient. |
| 1k-100k users | Add local backend proxy for CORS/signed URLs, keep caching to avoid repeated downloads. |
| 100k+ users | If multi-user hosted service ever added, centralize probing and caching, split probe workers. |

### Scaling Priorities

1. **First bottleneck:** Segment probing time. Fix with sampling limits and worker or native ffprobe.
2. **Second bottleneck:** Playlist reload loop for live streams. Fix with adaptive polling and cached diffs.

## Anti-Patterns

### Anti-Pattern 1: Regex-Only Playlist Parsing

**What people do:** Parse M3U8 with ad hoc regex and skip tag validation.
**Why it's wrong:** Misses tag scope rules, attributes, and playlist type constraints from RFC 8216.
**Do this instead:** Use a real parser that enforces playlist tag rules and builds a typed model.

### Anti-Pattern 2: Probing Every Segment

**What people do:** Download and probe full VOD or long live windows.
**Why it's wrong:** Slow, expensive, and unnecessary for ladder analysis.
**Do this instead:** Sample windows and limit per-variant segments; make sampling strategy explicit.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| CDN Resolver (mock) | Local mapping file or API stub | Replaces real channel/VOD lookup for greenfield. |
| HTTP Fetch (playlist/segments) | Browser fetch or local proxy | CORS/signed URLs may require proxy. |
| Media Probe (ffprobe) | WASM in browser or local CLI | Choose based on fidelity and performance needs. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ Analysis Orchestrator | Typed actions / events | Keeps UI stateless and testable. |
| Orchestrator ↔ Workers | Message passing | Transfer large results as structured JSON only. |

## Sources

- https://www.rfc-editor.org/rfc/rfc8216 (HLS protocol and playlist structure, RFC 8216)
- https://developer.apple.com/streaming/ (Apple HLS documentation index, references to authoring guidance)

---
*Architecture research for: M3U8 stream analysis and ABR ladder recommendation tools*
*Researched: 2026-01-27*
