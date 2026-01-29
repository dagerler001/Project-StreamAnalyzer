import type {
  AnalysisContext,
  RuleResult,
  ScoreBreakdown,
  ScoreResult,
  Warning,
  Recommendation,
} from '../../types/scoring'
import { getPolicyById } from '../policies/policyRegistry'
import { getRuleById } from '../rules'
import {
  calculateCategoryScores,
  calculateOverallScore,
  type RuleResultWithId,
} from './scoreCalculator'
import { consolidateRecommendations } from '../recommendations/recommendationEngine'
import { generateOptimizedLadder } from '../recommendations/ladderOptimizer'

/**
 * Run the complete scoring pipeline
 * Executes all enabled rules for a policy and generates a ScoreResult
 *
 * @param context - Analysis context containing ladder, classification, and sample results
 * @param policyId - ID of the scoring policy to use
 * @returns Complete ScoreResult with scores, warnings, and recommendations
 * @throws Error if policy not found
 */
export function runScoring(
  context: AnalysisContext,
  policyId: string
): ScoreResult {
  // 1. Look up policy
  const policy = getPolicyById(policyId)
  if (!policy) {
    throw new Error(`Policy not found: ${policyId}`)
  }

  // 2. Get all enabled rules from policy
  const enabledRuleConfigs = policy.rules.filter((config) => config.enabled)

  // 3. Execute each enabled rule
  const ruleResultsWithIds: RuleResultWithId[] = []

  for (const ruleConfig of enabledRuleConfigs) {
    const rule = getRuleById(ruleConfig.ruleId)
    if (!rule) {
      console.warn(`Rule not found: ${ruleConfig.ruleId}`)
      continue
    }

    // Execute rule with policy params if provided
    let result: RuleResult
    try {
      result = rule.check(context)
    } catch (error) {
      console.error(`Error executing rule ${ruleConfig.ruleId}:`, error)
      // Create a failed result for errors
      result = {
        passed: false,
        score: 0,
        warnings: [
          {
            severity: 'error',
            message: `Rule execution failed: ${ruleConfig.ruleId}`,
            hint:
              error instanceof Error ? error.message : 'Unknown error occurred',
          },
        ],
        recommendations: [],
      }
    }

    ruleResultsWithIds.push({
      ruleId: ruleConfig.ruleId,
      result,
    })
  }

  // 4. Calculate category scores
  const categoryScores = calculateCategoryScores(ruleResultsWithIds, policy)

  // 5. Calculate overall score
  const overallScore = calculateOverallScore(categoryScores)

  // 6. Consolidate all warnings
  const allWarnings: Warning[] = []
  for (const { result } of ruleResultsWithIds) {
    allWarnings.push(...result.warnings)
  }

  // 7. Consolidate all recommendations
  const allRecommendations: Recommendation[] = []
  for (const { result } of ruleResultsWithIds) {
    allRecommendations.push(...result.recommendations)
  }
  const consolidatedRecommendations = consolidateRecommendations(allRecommendations)

  // 8. Generate optimized ladder
  const optimizedLadder = generateOptimizedLadder(
    context.ladder,
    consolidatedRecommendations
  )

  // 9. Build score breakdown
  const breakdown: ScoreBreakdown = {
    overall: overallScore,
    categories: {
      ladder: categoryScores.find((c) =>
        c.rules.some((r) =>
          ['bitrate-spacing', 'resolution-ladder'].includes(r.ruleId)
        )
      ) || { score: 0, maxScore: 100, rules: [] },
      codec: categoryScores.find((c) =>
        c.rules.some((r) =>
          ['codec-compatibility', 'audio-codec'].includes(r.ruleId)
        )
      ) || { score: 0, maxScore: 100, rules: [] },
      segment: categoryScores.find((c) =>
        c.rules.some((r) =>
          ['segment-duration', 'keyframe-alignment'].includes(r.ruleId)
        )
      ) || { score: 0, maxScore: 100, rules: [] },
      metadata: categoryScores.find((c) =>
        c.rules.some((r) => r.ruleId === 'bandwidth-attributes')
      ) || { score: 0, maxScore: 100, rules: [] },
    },
  }

  // 10. Return complete ScoreResult
  return {
    overall: overallScore,
    breakdown,
    warnings: allWarnings,
    recommendations: consolidatedRecommendations,
    originalLadder: context.ladder,
    recommendedLadder: optimizedLadder,
  }
}
