import type { ScoringPolicy, ScoreState, RuleCategory } from "../../types/scoring"
import { SegmentedControl } from "../../components/SegmentedControl"
import { ScoreDisplay } from "./ScoreDisplay"
import { ScoreBreakdown } from "./ScoreBreakdown"
import { WarningList } from "./WarningList"
import { RecommendationList } from "./RecommendationList"
import { LadderComparison } from "./LadderComparison"

interface ReportPanelProps {
  scoreState: ScoreState
  selectedPolicy: string
  availablePolicies: ScoringPolicy[]
  onPolicyChange: (policyId: string) => void
  onRunScoring: () => void
}

export const ReportPanel = ({
  scoreState,
  selectedPolicy,
  availablePolicies,
  onPolicyChange,
  onRunScoring,
}: ReportPanelProps) => {
  // Transform categories object to array format expected by ScoreBreakdown
  const getCategoryArray = () => {
    if (scoreState.status !== "success") return []
    const cats = scoreState.result.breakdown.categories
    return [
      { category: "ladder" as RuleCategory, score: cats.ladder },
      { category: "codec" as RuleCategory, score: cats.codec },
      { category: "segment" as RuleCategory, score: cats.segment },
      { category: "metadata" as RuleCategory, score: cats.metadata },
    ]
  }

  return (
    <div className="report-panel">
      {/* Policy Selector */}
      <section className="report-section">
        <h3>Scoring Policy</h3>
        <SegmentedControl
          options={availablePolicies.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
          value={selectedPolicy}
          onChange={onPolicyChange}
        />
        <p className="policy-description">
          {availablePolicies.find((p) => p.id === selectedPolicy)?.description}
        </p>
      </section>

      {/* Score Display */}
      {scoreState.status === "success" && (
        <>
          <section className="report-section">
            <h3>Overall Score</h3>
            <ScoreDisplay score={scoreState.result.overall} />
          </section>

          <section className="report-section">
            <h3>Score Breakdown</h3>
            <ScoreBreakdown categories={getCategoryArray()} />
          </section>

          <section className="report-section">
            <h3>Best Practice Warnings</h3>
            <WarningList warnings={scoreState.result.warnings} />
          </section>

          <section className="report-section">
            <h3>Recommendations</h3>
            <RecommendationList
              recommendations={scoreState.result.recommendations}
            />
          </section>

          <section className="report-section">
            <h3>Recommended Ladder</h3>
            <LadderComparison
              current={scoreState.result.originalLadder}
              recommended={scoreState.result.recommendedLadder}
            />
          </section>
        </>
      )}

      {scoreState.status === "loading" && (
        <p className="placeholder">Calculating scores...</p>
      )}

      {scoreState.status === "error" && (
        <div className="error-state">
          <p className="error-message">{scoreState.error}</p>
          <button onClick={onRunScoring} type="button">
            Retry
          </button>
        </div>
      )}
    </div>
  )
}
