---
phase: "03"
plan: "01"
subsystem: "scoring"
tags: ["typescript", "scoring", "policies", "types"]
dependencies: []
requires:
  - Phase 1 (Ingest + RFC Validation) - Analysis types
  - Phase 2 (Sampling + Metrics) - SampleResult type
provides:
  - Scoring type system foundation
  - Three policy profiles (Apple HLS, Google VP9, Generic)
  - Policy registry for profile selection
affects:
  - Phase 3 Plan 02 (Scoring engine implementation)
  - Phase 3 Plan 03 (Report UI components)
tech-stack:
  added: []
  patterns:
    - Policy-based rule engine
    - Type-safe scoring system
    - Registry pattern for policies
key-files:
  created:
    - src/types/scoring.ts
    - src/scoring/policies/basePolicy.ts
    - src/scoring/policies/appleHLS.ts
    - src/scoring/policies/googleVP9.ts
    - src/scoring/policies/generic.ts
    - src/scoring/policies/policyRegistry.ts
  modified: []
decisions:
  - id: "D031"
    text: "Use policy-based rule engine with configurable weights"
    rationale: "Different use cases (Apple devices vs Google VP9 vs generic) need different scoring criteria"
  - id: "D032"
    text: "Scores normalized to 0-100 scale across all rules"
    rationale: "Consistent scoring scale enables meaningful aggregation and user understanding"
  - id: "D033"
    text: "Recommendations structured as specific actions (add/remove/modify variant)"
    rationale: "Actionable recommendations are more valuable than vague advice"
metrics:
  duration: "7 minutes"
  completed: "2026-01-29"
---

# Phase 3 Plan 1: Scoring Types + Policy Profiles Summary

## Overview

Established the foundation for explainable ABR ladder scoring by defining comprehensive TypeScript types and three initial policy profiles. This provides the type system and configuration infrastructure for the scoring engine.

## What Was Built

### Type System (`src/types/scoring.ts`)

Created a comprehensive type system with 15+ type definitions:

**Core Types:**
- `ScoringPolicy` - Policy profile with id, name, description, and rules array
- `RuleConfig` - Rule configuration with ruleId, enabled flag, weight (0-1), and optional params
- `RuleCategory` - Union type: 'ladder' | 'codec' | 'segment' | 'metadata'
- `AnalysisContext` - Context passed to rules containing ladder, classification, and sampleResult

**Rule Types:**
- `ScoringRule` - Interface with id, name, category, and check function
- `RuleResult` - Result with passed boolean, score (0-100), warnings, and recommendations
- `Warning` - Severity level ('error' | 'warning' | 'info'), message, and optional hint

**Result Types:**
- `ScoreBreakdown` - Overall score + per-category scores (ladder, codec, segment, metadata)
- `CategoryScore` - Score, maxScore, and array of RuleScore
- `RuleScore` - ruleId, score, maxScore, passed, reason, and recommendation
- `ScoreResult` - Complete result with overall score, breakdown, warnings, recommendations, and original ladder

**Recommendation Types:**
- `Recommendation` - Structured recommendation with id, type, severity, message, details, and variant info
- `RecommendationType` - Union: 'add_variant' | 'remove_variant' | 'modify_variant' | 'general'
- `VariantChange` - Index, current, and suggested variant properties

### Policy Profiles

**Apple HLS Best Practices** (`src/scoring/policies/appleHLS.ts`)
- ID: `apple-hls`
- Optimized for Apple devices following HLS Authoring Specification
- 7 rules with weights emphasizing resolution-ladder (0.20) and bitrate-spacing (0.15)

**Google VP9 Recommendations** (`src/scoring/policies/googleVP9.ts`)
- ID: `google-vp9`
- Optimized for VP9 codec following Google encoding guidelines
- Higher weight on codec-compatibility (0.20) with `preferVP9: true` param

**Generic/Balanced** (`src/scoring/policies/generic.ts`)
- ID: `generic`
- Balanced scoring for general-purpose streaming
- Equal weights (0.14-0.15) across all 7 rules

### Policy Registry (`src/scoring/policies/policyRegistry.ts`)

Exports:
- `getAllPolicies(): ScoringPolicy[]` - Returns all 3 policy profiles
- `getPolicyById(id: string): ScoringPolicy | undefined` - Lookup by policy ID
- Re-exports: `appleHlsPolicy`, `googleVP9Policy`, `genericPolicy`

## Technical Highlights

### Type Safety
- All scores normalized to 0-100 scale
- Proper imports from existing `analysis.ts` types
- No circular dependencies
- Full TypeScript compilation with zero errors

### Architecture Patterns
- **Policy-based Rule Engine**: Different profiles for different use cases
- **Explainable Scoring**: Every rule produces human-readable reasons
- **Actionable Recommendations**: Structured as specific variant changes
- **Registry Pattern**: Central access point for all policies

### Rule Configuration
All policies use the same 7 rule IDs with configurable weights:
1. `bitrate-spacing` - Bitrate step spacing between variants
2. `resolution-ladder` - Resolution ladder completeness
3. `codec-compatibility` - Codec support and compatibility
4. `audio-codec` - Audio codec configuration
5. `segment-duration` - Segment duration consistency
6. `keyframe-alignment` - Keyframe alignment across variants
7. `bandwidth-attributes` - Bandwidth attribute correctness

## Decisions Made

### D031: Policy-Based Rule Engine
**Decision:** Use policy profiles with configurable rule weights
**Rationale:** Different streaming scenarios (Apple ecosystem, VP9-focused, general-purpose) require different scoring priorities
**Impact:** Users can select appropriate policy for their target platform

### D032: Normalized 0-100 Scoring
**Decision:** All rule scores normalized to 0-100 scale
**Rationale:** Consistent scale enables meaningful aggregation and intuitive user understanding
**Impact:** Overall scores are weighted averages of rule scores

### D033: Actionable Recommendations
**Decision:** Recommendations structured as specific actions with variant details
**Rationale:** "Add 240p variant at 250 Kbps" is more useful than "Improve ladder"
**Impact:** Recommendations include current/suggested variant properties for UI rendering

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- ✅ Type definitions complete and exported from `src/types/scoring.ts`
- ✅ Three policy profiles defined with correct weights
- ✅ Policy registry provides `getAllPolicies()` and `getPolicyById()`
- ✅ Build succeeds with no TypeScript errors
- ✅ Types properly reference existing Analysis types from Phase 1 and 2

## Commits

| Commit | Message | Files |
|--------|---------|-------|
| 64b2e2f | feat(03-01): define scoring domain types | src/types/scoring.ts |
| 2750f01 | feat(03-01): create policy profiles and registry | src/scoring/policies/*.ts |

## Next Phase Readiness

This plan provides the foundation for:
- **Plan 02**: Scoring engine implementation (rule implementations, score calculation)
- **Plan 03**: Report UI components (score visualization, recommendation display)

The type system is complete and ready for the scoring engine to consume. Policy profiles can be extended with additional rules as the engine develops.

## Files Created

```
src/
├── types/
│   └── scoring.ts              # 171 lines - Complete type system
└── scoring/
    └── policies/
        ├── basePolicy.ts       # 18 lines - Type re-exports
        ├── appleHLS.ts         # 25 lines - Apple HLS policy
        ├── googleVP9.ts        # 32 lines - Google VP9 policy
        ├── generic.ts          # 28 lines - Generic/balanced policy
        └── policyRegistry.ts   # 35 lines - Policy registry
```

## Key Exports

**From `src/types/scoring.ts`:**
- `ScoringPolicy`, `RuleConfig`, `ScoringRule`, `RuleResult`
- `ScoreResult`, `ScoreBreakdown`, `CategoryScore`, `RuleScore`
- `Recommendation`, `RecommendationType`, `VariantChange`
- `RuleCategory`, `AnalysisContext`, `Warning`

**From `src/scoring/policies/policyRegistry.ts`:**
- `getAllPolicies()`, `getPolicyById(id)`
- `appleHlsPolicy`, `googleVP9Policy`, `genericPolicy`
