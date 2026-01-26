# Stack Research

**Domain:** M3U8 stream analysis + ABR ladder recommendations (local-only web UI)
**Researched:** 2026-01-27
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | 24.13.0 LTS | Local analyzer runtime, segment fetch, job runner | Current LTS with stable tooling and built-in `fetch`; well-supported for local-only tooling (Confidence: HIGH) |
| TypeScript | 5.9 | Type-safe parsing/scoring logic | Reduces parsing/validation bugs for HLS tags and codec metadata (Confidence: HIGH) |
| React | 19.2.4 | UI for inspection, scoring, and recommendations | Standard UI stack in 2025 with strong ecosystem and tooling (Confidence: HIGH) |
| Vite | 7.3.1 | Dev server + build system for local web UI | Fast, modern bundler; CRA is deprecated; good for local-only SPA (Confidence: HIGH) |
| Fastify | 5.7.2 | Local API server for analysis jobs | Lightweight, fast, good TypeScript support for structured JSON outputs (Confidence: HIGH) |
| FFmpeg/ffprobe | 8.0.1 | Media probing for codecs/bitrate/segment stats | Industry-standard CLI for codec and container inspection; `ffprobe` is the most practical source of truth (Confidence: HIGH) |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| m3u8-parser | 7.2.0 | Parse master/media playlists and tags | Always; canonical HLS playlist parsing in JS (Confidence: HIGH) |
| hls.js | 1.6.15 | In-browser playback/preview and manifest events | Use when you want preview playback or live manifest event timing (Confidence: HIGH) |
| mux.js | 7.1.0 | TS/fMP4 parsing and timestamp inspection | Use for segment-level metadata without full FFmpeg runs (Confidence: MEDIUM) |
| @tanstack/react-query | 5.90.20 | Client caching of analysis requests/results | Use for retries, cache invalidation, and background refresh (Confidence: HIGH) |
| zod | 4.3.6 | Input/output schema validation | Use for M3U8 URL/ID inputs and structured scoring outputs (Confidence: HIGH) |
| better-sqlite3 | 12.6.2 | Local cache of analysis results | Use if you need persistence across sessions or large result sets (Confidence: HIGH) |
| echarts | 6.0.0 | Bitrate/time-series charts | Use for interactive ABR ladder and bitrate graphs (Confidence: HIGH) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint + typescript-eslint | Code quality | Keep strict rules on parsing/validation code paths |
| Vitest | Unit tests | Focus on playlist parsing and scoring rules |

## Installation

```bash
# Core
npm install react react-dom fastify

# Supporting
npm install m3u8-parser hls.js mux.js @tanstack/react-query zod better-sqlite3 echarts

# Dev dependencies
npm install -D typescript vite @vitejs/plugin-react eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin vitest
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Fastify | Express | Use Express if you need legacy middleware or have existing Express plugins to reuse |
| Vite | Next.js | Use Next.js if you need SSR, routing, or deployable web app (not local-only) |
| echarts | Plotly | Use Plotly for higher-level chart primitives and built-in exporting |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App | Deprecated for new apps; slower dev experience | Vite + React |

## Stack Patterns by Variant

**If you need browser-only deployment (no local server):**
- Remove Fastify; run analysis in Web Workers
- Because local CORS constraints and FFmpeg usage limit browser-only depth

**If you need richer local persistence:**
- Keep `better-sqlite3` and add a simple migrations layer
- Because playlist history and scoring trends need durable storage

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| vite@7.3.1 | node@20.19+ / 22.12+ | Vite docs specify Node version requirements |

## Sources

- https://nodejs.org/en/download — Node.js LTS version
- https://www.typescriptlang.org/ — TypeScript 5.9 release
- https://github.com/facebook/react/releases — React 19.2.4 release
- https://vite.dev/guide/ — Vite 7.3.1 docs/version
- https://github.com/fastify/fastify/releases — Fastify 5.7.2 release
- https://ffmpeg.org/download.html — FFmpeg 8.0.1 release
- https://github.com/videojs/m3u8-parser/releases — m3u8-parser 7.2.0 release
- https://github.com/video-dev/hls.js/releases — hls.js 1.6.15 release
- https://github.com/videojs/mux.js/releases — mux.js 7.1.0 release
- https://github.com/TanStack/query/releases — @tanstack/react-query 5.90.20 release
- https://github.com/colinhacks/zod/releases — zod 4.3.6 release
- https://github.com/WiseLibs/better-sqlite3/releases — better-sqlite3 12.6.2 release
- https://github.com/apache/echarts/releases — ECharts 6.0.0 release
- https://react.dev/blog/2025/02/14/sunsetting-create-react-app — CRA deprecation notice

---
*Stack research for: M3U8 stream analysis + ABR ladder recommendations*
*Researched: 2026-01-27*
