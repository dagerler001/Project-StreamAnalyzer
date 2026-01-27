# Phase 1: Ingest + RFC Validation - Research

**Researched:** 2026-01-27
**Domain:** HLS (M3U8) ingest, RFC 8216 validation, playlist classification, ABR ladder extraction
**Confidence:** MEDIUM

## Summary

This research focused on how to ingest HLS playlists, validate them against RFC 8216, and extract classification plus ABR ladder data for the UI. The authoritative source for validation rules is RFC 8216, which defines playlist structure, required tags, and master vs media playlist rules. For parsing, a standard, well-used JavaScript parser is `m3u8-parser` (Video.js), which provides a structured manifest object and supported tag coverage.

The standard approach is to treat ingest as a pipeline: accept input (URL, ID-resolved URL, or local file), parse with a dedicated M3U8 parser, validate against RFC rules, then classify playlist type and live/VOD status, and finally extract ladder variants from master playlist attributes (BANDWIDTH, RESOLUTION, CODECS, etc.). Validation should show error/warning/info levels and surface issues even if parsing succeeds.

**Primary recommendation:** Use `m3u8-parser` for parsing and implement RFC 8216 rule checks for validation, classification, and ladder extraction.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| m3u8-parser | 7.2.0 | Parse M3U8 playlists into structured manifest | Widely used, maintained, supports core HLS tags and outputs normalized manifest data |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| RFC 8216 | 2017 | Validation rules for playlist structure and tags | Always, as the authoritative spec for HLS playlist validity |
| Fetch API | n/a (built-in) | Download playlist text from URL | For URL input or ID-resolved URLs |
| File API (FileReader) | n/a (built-in) | Read local `.m3u8` files | For local file upload input |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `m3u8-parser` | Hand-rolled parser | High risk of RFC noncompliance; more maintenance and edge cases |

**Installation:**
```bash
npm install m3u8-parser
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── ingest/           # input handling (URL, ID resolve, file upload)
├── parsing/          # M3U8 parsing wrapper
├── validation/       # RFC 8216 rule checks and severity mapping
├── classification/   # master/media + live/VOD detection
├── analysis/         # ABR ladder extraction
└── ui/               # results rendering and feedback
```

### Pattern 1: Ingest → Parse → Validate → Classify → Analyze
**What:** A single linear pipeline that always parses first, then validates against RFC rules, then classifies and extracts ladder data. Validation errors do not block classification/analysis, but flag results as unreliable.
**When to use:** Always for playlist inputs, across URL/ID/file paths.
**Example:**
```typescript
// Source: https://github.com/videojs/m3u8-parser
import { Parser } from 'm3u8-parser';

const parser = new Parser();
parser.push(playlistText);
parser.end();

const manifest = parser.manifest;
```

### Pattern 2: Master/Media Validation Gate
**What:** Enforce RFC rules that master playlists cannot contain media segment tags and vice-versa. Determine playlist type using RFC definitions: all URI lines must refer to media segments (media playlist) or to media playlists (master playlist).
**When to use:** Before ladder extraction and before live/VOD detection.
**Example:**
```typescript
// Source: https://www.rfc-editor.org/rfc/rfc8216
// RFC 8216: Media segment tags MUST NOT appear in a Master Playlist.
// A Playlist MUST be either a Media Playlist or a Master Playlist.
```

### Anti-Patterns to Avoid
- **Mixing master and media tags:** RFC 8216 requires clients to fail playlists that contain both media segment tags and master playlist tags.
- **Skipping EXTM3U first-line check:** EXTM3U MUST be the first line in any playlist.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| M3U8 parsing | Manual line-by-line parser | `m3u8-parser` | Handles tag parsing and manifests; avoids RFC edge cases |
| Attribute list parsing | Custom string splitting | `m3u8-parser` outputs parsed attributes | RFC attribute rules are strict (no whitespace, uppercase names, etc.) |

**Key insight:** Parsing and attribute handling are nuanced in RFC 8216; relying on a parser reduces invalid assumptions and avoids brittle validators.

## Common Pitfalls

### Pitfall 1: EXTM3U not first line
**What goes wrong:** Validation misses a noncompliant playlist that starts with comments or whitespace.
**Why it happens:** Developers parse loosely or trim leading lines.
**How to avoid:** Enforce RFC rule: EXTM3U MUST be the first line.
**Warning signs:** Parsed manifest exists but header position is incorrect.

### Pitfall 2: Mixed master/media tags
**What goes wrong:** A playlist with both media segment tags and master tags is incorrectly classified or partially parsed.
**Why it happens:** Classification uses tag presence only, without RFC rule enforcement.
**How to avoid:** Fail validation when both types appear; classify only when rule passes.
**Warning signs:** EXTINF appears alongside EXT-X-STREAM-INF.

### Pitfall 3: Live/VOD misclassification
**What goes wrong:** Treating playlists without EXT-X-ENDLIST as VOD.
**Why it happens:** Ignoring RFC meaning of EXT-X-ENDLIST and EXT-X-PLAYLIST-TYPE.
**How to avoid:** Use EXT-X-ENDLIST to identify “no more segments”; use EXT-X-PLAYLIST-TYPE when present.
**Warning signs:** Live playlists marked VOD despite missing ENDLIST.

### Pitfall 4: UTF-8/BOM issues
**What goes wrong:** Parse succeeds but validation should fail due to invalid encoding or BOM.
**Why it happens:** Browser file readers hide encoding problems.
**How to avoid:** Explicitly check for BOM and invalid UTF-8 control characters per RFC.
**Warning signs:** “Strange characters” in raw text or inconsistent parsing across inputs.

## Code Examples

Verified patterns from official sources:

### Parse a playlist with m3u8-parser
```typescript
// Source: https://github.com/videojs/m3u8-parser
import { Parser } from 'm3u8-parser';

const parser = new Parser();
parser.push(playlistText);
parser.end();

const manifest = parser.manifest;
```

### RFC-required EXTM3U placement
```text
// Source: https://www.rfc-editor.org/rfc/rfc8216
// "The EXTM3U tag ... MUST be the first line of every Media Playlist and every Master Playlist."
#EXTM3U
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Ad-hoc M3U8 parsing | Use a dedicated parser + RFC validation | Ongoing standard practice | Fewer invalid assumptions; consistent manifest data |

**Deprecated/outdated:**
- Relying on tag heuristics alone for playlist type: RFC 8216 requires strict master/media separation.

## Open Questions

1. **Validation depth for v1**
   - What we know: RFC 8216 defines strict syntax and tag placement rules.
   - What's unclear: How exhaustive v1 validation should be beyond core rules (e.g., attribute-list constraints).
   - Recommendation: Implement core RFC checks first (EXTM3U placement, tag mixing, required tags, URI following EXT-X-STREAM-INF) and track deeper RFC checks for later phases.

## Sources

### Primary (HIGH confidence)
- https://www.rfc-editor.org/rfc/rfc8216 - Playlist structure, required tags, classification rules, live/VOD signals
- https://github.com/videojs/m3u8-parser - Parser usage, supported tags, manifest shape, install instructions

### Secondary (MEDIUM confidence)
- https://github.com/videojs/m3u8-parser/releases/tag/v7.2.0 - Version reference for latest release

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - parser choice and RFC rules are verified; broader stack not specified by repo
- Architecture: MEDIUM - based on RFC requirements and parser capabilities
- Pitfalls: HIGH - directly derived from RFC 8216 rules

**Research date:** 2026-01-27
**Valid until:** 2026-02-26
