# Research: Phase 02 - Sampling + Metrics

## Summary

- m3u8-parser exposes `manifest.segments` with `uri` and `duration`, enabling a cumulative timeline for sampling.
- Segment bitrate can be computed from byte size and duration using `Content-Length` or `Content-Range` headers via `fetch`.
- Header-based probing avoids full downloads but can fail under CORS or chunked transfer; partial results must be surfaced.
- Codec detection should prioritize playlist `CODECS` attributes; probing for codecs remains an open decision when attributes are missing.

## Notes

- Prefer playlist attributes first; probing is secondary and may be limited by server/CORS behavior.
- If probing fails, surface an “unreliable” or “partial” indicator consistent with Phase 1’s warning banner pattern.
