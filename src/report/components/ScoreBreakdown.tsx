import { ScoreBarChart } from '../charts/ScoreBarChart'
import type { CategoryScore, RuleCategory, RuleScore } from '../../types/scoring'

export type ScoreBreakdownProps = {
  categories: { category: RuleCategory; score: CategoryScore }[]
  showRules?: boolean // default false, expand to show individual rules
}

export const ScoreBreakdown = ({
  categories,
  showRules = false,
}: ScoreBreakdownProps) => {
  // Category labels
  const categoryLabels: Record<RuleCategory, string> = {
    ladder: 'Ladder',
    codec: 'Codec',
    segment: 'Segment',
    metadata: 'Metadata',
  }

  // Get color class based on score
  const getScoreClass = (value: number): string => {
    if (value >= 80) return 'category-excellent'
    if (value >= 60) return 'category-good'
    return 'category-poor'
  }

  // Get status icon based on pass/fail
  const getStatusIcon = (passed: boolean): string => {
    return passed ? '✓' : '✗'
  }

  return (
    <div className="score-breakdown">
      {/* Category bar chart */}
      <div className="score-breakdown-chart">
        <ScoreBarChart categories={categories} />
      </div>

      {/* Category details */}
      <div className="score-breakdown-details">
        {categories.map((item) => {
          const { category, score } = item
          const scoreClass = getScoreClass(score.score)

          return (
            <div
              key={category}
              className={`score-category ${scoreClass}`}
            >
              <details open={showRules}>
                <summary className="score-category-header">
                  <span className="score-category-name">
                    {categoryLabels[category]}
                  </span>
                  <span className="score-category-value">
                    {Math.round(score.score)}/{score.maxScore}
                  </span>
                </summary>

                <div className="score-category-rules">
                  {score.rules.map((rule: RuleScore) => (
                    <div
                      key={rule.ruleId}
                      className={`score-rule ${rule.passed ? 'passed' : 'failed'}`}
                    >
                      <div className="score-rule-header">
                        <span className="score-rule-status">
                          {getStatusIcon(rule.passed)}
                        </span>
                        <span className="score-rule-name">
                          {rule.ruleId}
                        </span>
                        <span className="score-rule-score">
                          {rule.score}/{rule.maxScore}
                        </span>
                      </div>
                      <p className="score-rule-reason">{rule.reason}</p>
                      {rule.recommendation && (
                        <p className="score-rule-recommendation">
                          💡 {rule.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )
        })}
      </div>
    </div>
  )
}
