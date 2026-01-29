# Phase 3: Scoring + Report - Research

**Researched:** 2026-01-29
**Domain:** OTT Streaming Best Practices, ABR Ladder Analysis, Scoring Algorithms
**Confidence:** HIGH

## Summary

This phase implements a scoring system for OTT streaming best practices, policy profiles for different rulesets, and an on-screen report UI. The research draws from industry standards including Apple's HLS Authoring Specification, Google's VP9 encoding guidelines, and the HLS RFC (RFC 8216).

The core challenge is creating an explainable scoring system that evaluates ABR ladders against best practices and provides concrete, actionable recommendations. This requires:
1. Defining scoring rules based on industry standards
2. Creating a policy/profile system for different use cases
3. Building explainable scoring with clear reasoning
4. Generating specific ABR ladder improvement recommendations
5. Designing a report UI that presents scores, visualizations, and recommendations

**Primary recommendation:** Build a rule-based scoring engine with pluggable policy profiles, using native SVG for report visualizations (consistent with Phase 2), and structure recommendations as specific ladder modifications (add/remove/modify variants).

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | UI framework | Already used in project |
| TypeScript | 5.x | Type safety | Already used in project |
| Native SVG | N/A | Charting/visualization | Locked decision - no external chart libs |
| CSS | N/A | Styling | Locked decision - no Tailwind |

### Phase 3 Specific
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| None required | - | Scoring is custom logic | Domain-specific rules, no standard library |

**Key insight:** Scoring for OTT best practices is domain-specific. Industry standards (Apple, Google, DASH-IF) define the rules, but implementation is custom. No standard npm package exists for "ABR ladder scoring" - this is custom business logic.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── scoring/
│   ├── engine/
│   │   ├── scoreEngine.ts        # Main scoring orchestrator
│   │   └── scoreCalculator.ts    # Score aggregation logic
│   ├── policies/
│   │   ├── policyRegistry.ts     # Policy profile registry
│   │   ├── basePolicy.ts         # Base policy interface
│   │   ├── appleHLS.ts           # Apple HLS best practices
│   │   ├── googleVP9.ts          # Google VP9 recommendations
│   │   └── generic.ts            # Generic/balanced policy
│   ├── rules/
│   │   ├── ruleTypes.ts          # Rule type definitions
│   │   ├── ladderRules.ts        # ABR ladder specific rules
│   │   ├── codecRules.ts         # Codec-related rules
│   │   └── segmentRules.ts       # Segment-related rules
│   └── recommendations/
│       ├── recommendationEngine.ts
│       └── ladderOptimizer.ts
├── report/
│   ├── components/
│   │   ├── ReportPanel.tsx       # Main report container
│   │   ├── ScoreDisplay.tsx      # Overall score visualization
│   │   ├── ScoreBreakdown.tsx    # Per-category scores
│   │   ├── WarningList.tsx       # Best-practice warnings
│   │   ├── RecommendationList.tsx
│   │   └── LadderComparison.tsx  # Before/after ladder view
│   └── charts/
│       ├── ScoreGauge.tsx        # SVG score gauge
│       └── ScoreBarChart.tsx     # Category score bars
└── types/
    └── scoring.ts                # Scoring type definitions
```

### Pattern 1: Policy-Based Rule Engine
**What:** A configurable rule system where policies define which rules to apply and their weights/parameters.

**When to use:** When different use cases (mobile vs desktop, live vs VOD) need different scoring criteria.

**Example:**
```typescript
// Source: Based on strategy pattern + industry best practices
interface ScoringPolicy {
  id: string
  name: string
  description: string
  rules: RuleConfig[]
}

interface RuleConfig {
  ruleId: string
  enabled: boolean
  weight: number // 0-1, contribution to overall score
  params?: Record<string, unknown>
}

interface ScoringRule {
  id: string
  name: string
  category: 'ladder' | 'codec' | 'segment' | 'metadata'
  check: (context: AnalysisContext) => RuleResult
}

interface RuleResult {
  passed: boolean
  score: number // 0-100
  warnings: Warning[]
  recommendations: Recommendation[]
}
```

### Pattern 2: Explainable Score Aggregation
**What:** Each rule produces not just a score but explanations (warnings + recommendations) that feed into the final report.

**When to use:** When users need to understand WHY a score was given and HOW to improve it.

**Example:**
```typescript
// Source: Based on explainable AI patterns
interface ScoreBreakdown {
  overall: number // 0-100
  categories: {
    ladder: CategoryScore
    codec: CategoryScore
    segment: CategoryScore
    metadata: CategoryScore
  }
}

interface CategoryScore {
  score: number
  maxScore: number
  rules: RuleScore[]
}

interface RuleScore {
  ruleId: string
  score: number
  maxScore: number
  passed: boolean
  reason: string // Human-readable explanation
  recommendation?: string
}
```

### Pattern 3: Recommendation as Action
**What:** Recommendations are structured as specific actions (add variant, remove variant, modify variant) rather than vague advice.

**When to use:** When the goal is actionable output that could theoretically be applied automatically.

**Example:**
```typescript
// Source: Based on linter/fix patterns
interface Recommendation {
  id: string
  type: 'add_variant' | 'remove_variant' | 'modify_variant' | 'general'
  severity: 'critical' | 'warning' | 'suggestion'
  message: string
  details?: string
  // For variant-specific recommendations
  variant?: {
    index?: number
    current?: Partial<LadderVariant>
    suggested?: Partial<LadderVariant>
  }
}

// Example recommendation
{
  id: 'missing-audio-only',
  type: 'add_variant',
  severity: 'warning',
  message: 'Add audio-only variant for low-bandwidth users',
  details: 'Current ladder starts at 400 Kbps. Adding a 64 Kbps audio-only variant improves experience on very slow connections.',
  variant: {
    suggested: {
      bitrate: 64000,
      codecs: ['mp4a.40.2']
    }
  }
}
```

### Pattern 4: Native SVG Score Visualization
**What:** Use SVG (consistent with Phase 2) for score gauges, bar charts, and progress indicators.

**When to use:** When locked into native SVG (no Chart.js/Recharts).

**Example:**
```typescript
// Source: Pattern from Phase 2 BitrateChart
interface ScoreGaugeProps {
  score: number // 0-100
  size?: number
  strokeWidth?: number
}

export const ScoreGauge = ({ score, size = 120, strokeWidth = 10 }: ScoreGaugeProps) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  
  // Color based on score
  const color = score >= 80 ? 'var(--success)' 
    : score >= 60 ? 'var(--warning)' 
    : 'var(--error)'
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border-soft)"
        strokeWidth={strokeWidth}
      />
      {/* Score arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Score text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size / 4}
        fontWeight="bold"
        fill={color}
      >
        {score}
      </text>
    </svg>
  )
}
```

### Anti-Patterns to Avoid
- **Black-box scoring:** Don't just return a number. Always include reasoning.
- **One-size-fits-all policies:** Different content types (live sports vs VOD movies) need different rules.
- **Vague recommendations:** "Improve ladder" is useless. "Add 240p variant at 250 Kbps" is actionable.
- **Over-normalizing scores:** Don't force all scores to average to 50. Use absolute criteria from industry standards.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Score calculation | Custom math | Weighted average with bounds | Simple arithmetic, but document the formula clearly |
| Policy selection UI | Custom dropdown | Reuse SegmentedControl from Phase 1 | Consistent UX, already tested |
| Collapsible sections | Custom implementation | Native `<details>`/`<summary>` | Accessible, no JS needed |
| Color-coded scores | Manual color logic | CSS custom properties + classes | `--score-good`, `--score-warning`, `--score-error` |

**Key insight:** The complexity in this phase is in the domain logic (what makes a good ABR ladder), not the implementation patterns. Focus engineering effort on rule definitions, not UI components.

## Common Pitfalls

### Pitfall 1: Over-Engineering the Rule Engine
**What goes wrong:** Creating a complex DSL or plugin system for rules when simple functions suffice.

**Why it happens:** Anticipating future needs for "user-defined rules" that may never come.

**How to avoid:** Start with hardcoded rule functions. Extract to configurable policies only when multiple concrete use cases exist.

**Warning signs:** Spending more time on the rule engine framework than on defining actual rules.

### Pitfall 2: Inconsistent Scoring Criteria
**What goes wrong:** Rules that contradict each other or use different scales (one rule 0-10, another 0-100).

**Why it happens:** Multiple developers implementing rules without a shared schema.

**How to avoid:** Define the `RuleResult` interface first. All rules MUST return normalized 0-100 scores.

### Pitfall 3: Recommendations That Ignore Context
**What goes wrong:** Suggesting 4K variants for mobile-only content, or audio-only for music videos.

**Why it happens:** Rules that don't consider stream type, content type, or target devices.

**How to avoid:** Pass full `AnalysisContext` to every rule including classification (live/VOD) and any content hints.

### Pitfall 4: Score Inflation
**What goes wrong:** All ladders score 80+ because rules are too lenient.

**Why it happens:** Fear of discouraging users with low scores.

**How to avoid:** Calibrate against real-world examples. A poorly configured ladder SHOULD score poorly. Provide clear improvement paths.

### Pitfall 5: Report UI Clutter
**What goes wrong:** Trying to show all possible information at once, overwhelming users.

**Why it happens:** Fear of missing important details.

**How to avoid:** Progressive disclosure: Score first, breakdown on demand, detailed diagnostics in collapsible sections.

## Code Examples

### Scoring Rule Implementation
```typescript
// Source: Based on industry best practices + HLS RFC
import type { ScoringRule, RuleResult, AnalysisContext } from '../types/scoring'

export const bitrateSpacingRule: ScoringRule = {
  id: 'bitrate-spacing',
  name: 'Bitrate Step Spacing',
  category: 'ladder',
  
  check: (context: AnalysisContext): RuleResult => {
    const { ladder } = context
    const videoVariants = ladder.video
    
    if (videoVariants.length < 2) {
      return {
        passed: false,
        score: 50,
        warnings: [{
          severity: 'warning',
          message: 'Ladder has fewer than 2 variants',
          hint: 'Add more variants for adaptive bitrate switching'
        }],
        recommendations: []
      }
    }
    
    // Sort by bitrate ascending
    const sorted = [...videoVariants].sort((a, b) => a.bitrate - b.bitrate)
    const issues: string[] = []
    const recommendations: Recommendation[] = []
    let totalSpacingScore = 0
    
    for (let i = 1; i < sorted.length; i++) {
      const lower = sorted[i - 1].bitrate
      const upper = sorted[i].bitrate
      const ratio = upper / lower
      
      // Ideal step: 1.5x to 2x (industry standard)
      if (ratio < 1.3) {
        issues.push(`Step ${i}: ${(ratio * 100).toFixed(0)}% increase (too small)`)
        recommendations.push({
          id: `spacing-step-${i}`,
          type: 'modify_variant',
          severity: 'suggestion',
          message: `Increase spacing between variants ${i-1} and ${i}`,
          details: `Current ratio: ${ratio.toFixed(2)}x. Target: 1.5-2.0x`,
          variant: {
            index: i,
            current: { bitrate: upper },
            suggested: { bitrate: Math.round(lower * 1.7) }
          }
        })
        totalSpacingScore += 40
      } else if (ratio > 3.0) {
        issues.push(`Step ${i}: ${(ratio * 100).toFixed(0)}% increase (too large)`)
        recommendations.push({
          id: `spacing-gap-${i}`,
          type: 'add_variant',
          severity: 'warning',
          message: `Add intermediate variant between ${i-1} and ${i}`,
          details: `Gap is ${ratio.toFixed(2)}x. Consider adding variant at ~${Math.round(Math.sqrt(lower * upper) / 1000)} Kbps`
        })
        totalSpacingScore += 60
      } else {
        totalSpacingScore += 100
      }
    }
    
    const avgScore = totalSpacingScore / (sorted.length - 1)
    
    return {
      passed: avgScore >= 80,
      score: Math.round(avgScore),
      warnings: issues.map(msg => ({
        severity: 'warning',
        message: msg,
        hint: 'Maintain 1.5-2x bitrate spacing between variants'
      })),
      recommendations
    }
  }
}
```

### Policy Profile Definition
```typescript
// Source: Based on Apple HLS spec + Google VP9 guidelines
export const appleHlsPolicy: ScoringPolicy = {
  id: 'apple-hls',
  name: 'Apple HLS Best Practices',
  description: 'Optimized for Apple devices following HLS Authoring Specification',
  
  rules: [
    { ruleId: 'bitrate-spacing', enabled: true, weight: 0.15 },
    { ruleId: 'resolution-ladder', enabled: true, weight: 0.20 },
    { ruleId: 'codec-compatibility', enabled: true, weight: 0.15 },
    { ruleId: 'audio-codec', enabled: true, weight: 0.10 },
    { ruleId: 'segment-duration', enabled: true, weight: 0.15 },
    { ruleId: 'keyframe-alignment', enabled: true, weight: 0.15 },
    { ruleId: 'bandwidth-attributes', enabled: true, weight: 0.10 }
  ]
}

export const googleVP9Policy: ScoringPolicy = {
  id: 'google-vp9',
  name: 'Google VP9 Recommendations',
  description: 'Optimized for VP9 codec following Google encoding guidelines',
  
  rules: [
    { ruleId: 'bitrate-spacing', enabled: true, weight: 0.15 },
    { ruleId: 'resolution-ladder', enabled: true, weight: 0.20 },
    { 
      ruleId: 'codec-compatibility', 
      enabled: true, 
      weight: 0.20,
      params: { preferVP9: true }
    },
    { ruleId: 'audio-codec', enabled: true, weight: 0.10 },
    { ruleId: 'segment-duration', enabled: true, weight: 0.15 },
    { ruleId: 'keyframe-alignment', enabled: true, weight: 0.10 },
    { ruleId: 'bandwidth-attributes', enabled: true, weight: 0.10 }
  ]
}
```

### Report Panel Structure
```typescript
// Source: Component architecture pattern
interface ReportPanelProps {
  scoreResult: ScoreResult
  selectedPolicy: string
  availablePolicies: ScoringPolicy[]
  onPolicyChange: (policyId: string) => void
}

export const ReportPanel = ({
  scoreResult,
  selectedPolicy,
  availablePolicies,
  onPolicyChange
}: ReportPanelProps) => {
  return (
    <div className="report-panel">
      {/* Policy Selector */}
      <section className="report-section">
        <h3>Scoring Policy</h3>
        <SegmentedControl
          options={availablePolicies.map(p => ({
            value: p.id,
            label: p.name
          }))}
          value={selectedPolicy}
          onChange={onPolicyChange}
        />
        <p className="policy-description">
          {availablePolicies.find(p => p.id === selectedPolicy)?.description}
        </p>
      </section>
      
      {/* Overall Score */}
      <section className="report-section">
        <h3>Overall Score</h3>
        <div className="score-display">
          <ScoreGauge score={scoreResult.overall} />
          <ScoreLabel score={scoreResult.overall} />
        </div>
      </section>
      
      {/* Category Breakdown */}
      <section className="report-section">
        <h3>Score Breakdown</h3>
        <ScoreBreakdown categories={scoreResult.categories} />
      </section>
      
      {/* Warnings */}
      <section className="report-section">
        <h3>Best Practice Warnings</h3>
        <WarningList warnings={scoreResult.warnings} />
      </section>
      
      {/* Recommendations */}
      <section className="report-section">
        <h3>Recommendations</h3>
        <RecommendationList recommendations={scoreResult.recommendations} />
      </section>
      
      {/* Ladder Comparison */}
      <section className="report-section">
        <h3>Recommended Ladder</h3>
        <LadderComparison
          current={scoreResult.originalLadder}
          recommended={scoreResult.recommendedLadder}
        />
      </section>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed bitrate ladders | Content-aware encoding | 2020+ | Ladders should match content complexity |
| Single codec delivery | Multi-codec (H.264 + H.265 + AV1) | 2022+ | Device capability-based codec selection |
| Uniform segment duration | Variable duration for scene changes | 2021+ | Better quality at same bitrate |
| Bandwidth-only ABR | Buffer-based + throughput | 2020+ | More stable switching |

**Deprecated/outdated:**
- **Flash-based streaming:** All modern OTT uses HLS or DASH
- **Single-segment TS files:** fMP4/CMAF is now standard
- **RTMP ingestion:** SRT and HLS ingestion are replacing RTMP

## Open Questions

1. **Policy Profile Granularity**
   - What we know: Need different rules for live vs VOD, mobile vs desktop
   - What's unclear: Should policies be mutually exclusive or composable?
   - Recommendation: Start with mutually exclusive presets (Apple, Google, Generic). Composable policies add UI complexity without clear benefit.

2. **Recommendation Specificity**
   - What we know: Recommendations should be actionable
   - What's unclear: How specific should variant suggestions be? Exact bitrate or ranges?
   - Recommendation: Provide specific bitrates (rounded to nice numbers) but indicate these are suggestions, not requirements.

3. **Score Weighting**
   - What we know: Different rules have different importance
   - What's unclear: Should weights be user-configurable or policy-defined?
   - Recommendation: Policy-defined weights. User-configurable weights add complexity without clear use case.

## Sources

### Primary (HIGH confidence)
- Google VP9 VOD Encoding Guidelines - https://developers.google.com/media/vp9/settings/vod (verified 2025-01-15)
- HLS RFC 8216bis-11 - https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis-11 (verified IETF draft)
- Video.js HTTP Streaming docs - https://github.com/videojs/http-streaming (verified GitHub)

### Secondary (MEDIUM confidence)
- Industry best practices for ABR ladder spacing (1.5-2x between variants)
- Common OTT scoring criteria from streaming optimization tools

### Tertiary (LOW confidence)
- Apple HLS Authoring Specification (requires Apple Developer login, not verified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new libraries needed, using existing project stack
- Architecture: HIGH - Well-established patterns (strategy, rule engine)
- Pitfalls: MEDIUM - Based on general software engineering patterns, limited OTT-specific sources

**Research date:** 2026-01-29
**Valid until:** 90 days (stable domain, industry standards change slowly)
