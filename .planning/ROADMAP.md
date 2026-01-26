# Roadmap: Stream ABR Advisor

## Overview

This roadmap delivers a local-only tool that ingests HLS playlists, validates them against RFC 8216, extracts ladder and metrics from a sampled window, and produces explainable scores and recommendations directly in the UI. Each phase builds a complete, user-verifiable capability that unlocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Ingest + RFC Validation** - Users can ingest playlists and see validated structure with a visible ladder baseline.
- [ ] **Phase 2: Sampling + Metrics** - Users can sample a time window and see bitrate/codec metrics over time.
- [ ] **Phase 3: Scoring + Report** - Users receive explainable scores and concrete recommendations in a report.

## Phase Details

### Phase 1: Ingest + RFC Validation
**Goal**: Users can provide a playlist and get a validated, classified ladder baseline.
**Depends on**: Nothing (first phase)
**Requirements**: INPT-01, INPT-02, INPT-03, PLAY-01, PLAY-02, PLAY-03, ANLY-01
**Success Criteria** (what must be TRUE):
  1. User can submit a direct M3U8 URL, a channel/VOD ID (resolved), or a local M3U8 file and see it accepted for analysis.
  2. User sees clear validation feedback when playlist tags or required tag placement are invalid.
  3. User can see whether the playlist is master or media and whether it is live or VOD.
  4. User can view the extracted ABR ladder (bitrate, resolution, codecs) from the playlist.
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold app shell for Phase 1 ingest/results
- [ ] 01-02-PLAN.md — Implement parsing, validation, classification, ladder extraction
- [ ] 01-03-PLAN.md — Build ingest UI and results rendering

### Phase 2: Sampling + Metrics
**Goal**: Users can sample a time window and inspect codecs and bitrate over time.
**Depends on**: Phase 1
**Requirements**: ANLY-02, ANLY-03
**Success Criteria** (what must be TRUE):
  1. User can set a sample duration in seconds and see metrics computed for that window.
  2. User can see detected audio and video codecs from the sampled media.
  3. User can view bitrate-over-time results for the sampled window.
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Scoring + Report
**Goal**: Users can receive explainable scores and recommendations in an on-screen report.
**Depends on**: Phase 2
**Requirements**: SCOR-01, SCOR-02, SCOR-03, REPT-01
**Success Criteria** (what must be TRUE):
  1. User can select a policy profile and see scoring rules applied to the analysis.
  2. User can see an overall score with best-practice warnings and clear reasons.
  3. User can see concrete ABR ladder improvement recommendations.
  4. User can view an on-screen report that includes the score, charts, and recommendations.
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 2 → 2.1 → 2.2 → 3 → 3.1 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Ingest + RFC Validation | 1/3 | In progress | - |
| 2. Sampling + Metrics | 0/TBD | Not started | - |
| 3. Scoring + Report | 0/TBD | Not started | - |
