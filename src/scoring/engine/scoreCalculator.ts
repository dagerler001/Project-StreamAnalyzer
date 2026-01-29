import type {
  CategoryScore,
  RuleCategory,
  RuleResult,
  ScoringPolicy,
} from '../../types/scoring'

/**
 * Maps rule IDs to their categories
 */
const RULE_CATEGORY_MAP: Record<string, RuleCategory> = {
  'bitrate-spacing': 'ladder',
  'resolution-ladder': 'ladder',
  'codec-compatibility': 'codec',
  'audio-codec': 'codec',
  'segment-duration': 'segment',
  'keyframe-alignment': 'segment',
  'bandwidth-attributes': 'metadata',
}

/**
 * Result with associated rule ID for internal tracking
 */
type RuleResultWithId = {
  ruleId: string
  result: RuleResult
}

/**
 * Calculate category scores from rule results
 * Groups results by category and calculates weighted average scores
 *
 * @param ruleResultsWithIds - Array of rule results with their rule IDs
 * @param policy - The scoring policy containing rule configurations
 * @returns Array of category scores with rule details
 */
export function calculateCategoryScores(
  ruleResultsWithIds: RuleResultWithId[],
  policy: ScoringPolicy
): CategoryScore[] {
  // Get enabled rule configs from policy
  const enabledConfigs = policy.rules.filter((config) => config.enabled)

  // Group rule results by category
  const resultsByCategory = new Map<RuleCategory, RuleResultWithId[]>()

  for (const { ruleId, result } of ruleResultsWithIds) {
    const config = enabledConfigs.find((c) => c.ruleId === ruleId)
    if (config) {
      const category = RULE_CATEGORY_MAP[ruleId]
      if (category) {
        const existing = resultsByCategory.get(category) || []
        existing.push({ ruleId, result })
        resultsByCategory.set(category, existing)
      }
    }
  }

  // Calculate score for each category
  const categoryScores: CategoryScore[] = []

  for (const [, resultsWithIds] of resultsByCategory) {
    if (resultsWithIds.length === 0) continue

    // Calculate weighted average for this category
    let totalWeight = 0
    let weightedScore = 0

    for (const { ruleId, result } of resultsWithIds) {
      const config = enabledConfigs.find((c) => c.ruleId === ruleId)
      if (config) {
        const weight = config.weight
        totalWeight += weight
        weightedScore += result.score * weight
      }
    }

    const categoryScore = totalWeight > 0 ? weightedScore / totalWeight : 0

    categoryScores.push({
      score: Math.round(categoryScore),
      maxScore: 100,
      rules: resultsWithIds.map(({ ruleId, result }) => {
        return {
          ruleId,
          score: result.score,
          maxScore: 100,
          passed: result.passed,
          reason: getReasonFromResult(result),
          recommendation: result.recommendations[0]?.message,
        }
      }),
    })
  }

  return categoryScores
}

/**
 * Calculate overall score from category scores
 * Uses equal weighting across categories
 *
 * @param categories - Array of category scores
 * @returns Rounded integer score 0-100
 */
export function calculateOverallScore(categories: CategoryScore[]): number {
  if (categories.length === 0) return 0

  // Calculate average score across all categories
  let totalScore = 0

  for (const category of categories) {
    totalScore += category.score
  }

  const averageScore = totalScore / categories.length

  return Math.round(Math.max(0, Math.min(100, averageScore)))
}

/**
 * Helper to extract reason from rule result
 */
function getReasonFromResult(result: RuleResult): string {
  if (result.warnings.length > 0) {
    return result.warnings[0].message
  }
  if (result.recommendations.length > 0) {
    return result.recommendations[0].message
  }
  return result.passed ? 'Rule passed' : 'Rule failed'
}

// Export the helper type for use by scoreEngine
export type { RuleResultWithId }
