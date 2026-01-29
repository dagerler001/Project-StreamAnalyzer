import type { AnalysisContext, RuleResult, ScoringRule } from '../../types/scoring'

/**
 * Rule registry type for mapping rule IDs to scoring rules
 */
export type RuleRegistry = {
  [ruleId: string]: ScoringRule
}

/**
 * Helper type for creating a rule check function
 */
export type RuleCheckFunction = (context: AnalysisContext) => RuleResult

/**
 * Factory function type for creating rules with parameters
 */
export type RuleFactory = (params?: Record<string, unknown>) => ScoringRule
