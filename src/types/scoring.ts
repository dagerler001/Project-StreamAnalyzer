import type { LadderResult, PlaylistClassification, SampleResult } from './analysis'

// ============================================================================
// Core Types
// ============================================================================

/**
 * Policy profile that defines which rules apply and their weights
 */
export type ScoringPolicy = {
  id: string
  name: string
  description: string
  rules: RuleConfig[]
}

/**
 * Configuration for a single scoring rule within a policy
 */
export type RuleConfig = {
  ruleId: string
  enabled: boolean
  weight: number // 0-1, contribution to overall score
  params?: Record<string, unknown>
}

/**
 * Rule categories for organizing and displaying scores
 */
export type RuleCategory = 'ladder' | 'codec' | 'segment' | 'metadata'

/**
 * Context passed to rules containing all analysis data
 */
export type AnalysisContext = {
  ladder: LadderResult
  classification: PlaylistClassification
  sampleResult?: SampleResult
}

// ============================================================================
// Rule Types
// ============================================================================

/**
 * Interface for implementing a scoring rule
 */
export type ScoringRule = {
  id: string
  name: string
  category: RuleCategory
  check: (context: AnalysisContext) => RuleResult
}

/**
 * Result returned by a rule's check function
 */
export type RuleResult = {
  passed: boolean
  score: number // 0-100
  warnings: Warning[]
  recommendations: Recommendation[]
}

/**
 * Warning with severity level and optional hint
 */
export type Warning = {
  severity: 'error' | 'warning' | 'info'
  message: string
  hint?: string
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Complete score breakdown with overall and per-category scores
 */
export type ScoreBreakdown = {
  overall: number // 0-100
  categories: {
    ladder: CategoryScore
    codec: CategoryScore
    segment: CategoryScore
    metadata: CategoryScore
  }
}

/**
 * Score for a single category with rule-level details
 */
export type CategoryScore = {
  score: number
  maxScore: number
  rules: RuleScore[]
}

/**
 * Score for a single rule execution
 */
export type RuleScore = {
  ruleId: string
  score: number
  maxScore: number
  passed: boolean
  reason: string // Human-readable explanation
  recommendation?: string
}

/**
 * Complete scoring result including breakdown and recommendations
 */
export type ScoreResult = {
  overall: number
  breakdown: ScoreBreakdown
  warnings: Warning[]
  recommendations: Recommendation[]
  originalLadder: LadderResult
  recommendedLadder: LadderResult
}

/**
 * Score state for UI state management
 */
export type ScoreState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: ScoreResult }
  | { status: 'error'; error: string }

// ============================================================================
// Recommendation Types
// ============================================================================

/**
 * Recommendation type for specific actions
 */
export type RecommendationType =
  | 'add_variant'
  | 'remove_variant'
  | 'modify_variant'
  | 'general'

/**
 * Recommendation with specific action and details
 */
export type Recommendation = {
  id: string
  type: RecommendationType
  severity: 'critical' | 'warning' | 'suggestion'
  message: string
  details?: string
  variant?: VariantChange
}

/**
 * Variant change details for add/remove/modify recommendations
 */
export type VariantChange = {
  index?: number
  current?: Partial<LadderVariant>
  suggested?: Partial<LadderVariant>
}

/**
 * Partial variant type for recommendations
 * (redefined here to avoid circular imports)
 */
export type LadderVariant = {
  bitrate: number
  averageBandwidth?: number
  resolution?: {
    width: number
    height: number
  }
  codecs: string[]
  frameRate?: number
}
