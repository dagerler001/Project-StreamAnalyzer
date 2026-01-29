import type { Recommendation, RecommendationType } from "../../types/scoring"

export type RecommendationListProps = {
  recommendations: Recommendation[]
  showDetails?: boolean // default true
}

const getTypeLabel = (type: RecommendationType): string => {
  switch (type) {
    case "add_variant":
      return "Add"
    case "remove_variant":
      return "Remove"
    case "modify_variant":
      return "Modify"
    case "general":
      return "General"
  }
}

const getTypeClass = (type: RecommendationType): string => {
  switch (type) {
    case "add_variant":
      return "recommendation-type-add"
    case "remove_variant":
      return "recommendation-type-remove"
    case "modify_variant":
      return "recommendation-type-modify"
    case "general":
      return "recommendation-type-general"
  }
}

const getSeverityClass = (severity: Recommendation["severity"]): string => {
  switch (severity) {
    case "critical":
      return "recommendation-severity-critical"
    case "warning":
      return "recommendation-severity-warning"
    case "suggestion":
      return "recommendation-severity-suggestion"
  }
}

const getSeverityIndicator = (severity: Recommendation["severity"]): string => {
  switch (severity) {
    case "critical":
      return "●"
    case "warning":
      return "●"
    case "suggestion":
      return "○"
  }
}

interface VariantChangeInfo {
  bitrate?: number
  resolution?: { width: number; height: number }
}

const formatVariantChange = (
  current?: Partial<VariantChangeInfo>,
  suggested?: Partial<VariantChangeInfo>
): string | null => {
  if (!current && !suggested) return null

  const formatBitrate = (bps?: number): string => {
    if (!bps) return "—"
    if (bps >= 1_000_000) {
      return `${(bps / 1_000_000).toFixed(2)} Mbps`
    }
    return `${(bps / 1_000).toFixed(0)} Kbps`
  }

  const formatResolution = (res?: { width: number; height: number }): string => {
    if (!res) return "—"
    return `${res.height}p`
  }

  const currentStr = current
    ? `${formatResolution(current.resolution)} @ ${formatBitrate(current.bitrate)}`
    : "—"
  const suggestedStr = suggested
    ? `${formatResolution(suggested.resolution)} @ ${formatBitrate(suggested.bitrate)}`
    : "—"

  return `${currentStr} → ${suggestedStr}`
}

// Group recommendations by severity (critical > warning > suggestion)
const groupRecommendationsBySeverity = (
  recommendations: Recommendation[]
): Recommendation[][] => {
  const critical = recommendations.filter((r) => r.severity === "critical")
  const warning = recommendations.filter((r) => r.severity === "warning")
  const suggestion = recommendations.filter((r) => r.severity === "suggestion")
  return [critical, warning, suggestion].filter((group) => group.length > 0)
}

export const RecommendationList = ({
  recommendations,
  showDetails = true,
}: RecommendationListProps) => {
  if (recommendations.length === 0) {
    return (
      <div className="recommendation-list recommendation-list-empty">
        <div className="recommendation-list-success">
          <div className="recommendation-list-icon">✓</div>
          <p className="recommendation-list-message">
            No recommendations - ladder looks good!
          </p>
        </div>
      </div>
    )
  }

  const groupedRecommendations = groupRecommendationsBySeverity(recommendations)

  return (
    <div className="recommendation-list">
      {groupedRecommendations.map((group, groupIndex) => (
        <div key={groupIndex} className="recommendation-group">
          {group.map((recommendation, index) => {
            const variantChange = recommendation.variant
              ? formatVariantChange(
                  recommendation.variant.current,
                  recommendation.variant.suggested
                )
              : null

            return (
              <div
                key={index}
                className={`recommendation-item ${getTypeClass(
                  recommendation.type
                )} ${getSeverityClass(recommendation.severity)}`}
              >
                <div className="recommendation-header">
                  <span
                    className={`recommendation-severity ${getSeverityClass(
                      recommendation.severity
                    )}`}
                    title={`${recommendation.severity}`}
                  >
                    {getSeverityIndicator(recommendation.severity)}
                  </span>
                  <span
                    className={`recommendation-type-badge ${getTypeClass(
                      recommendation.type
                    )}`}
                  >
                    {getTypeLabel(recommendation.type)}
                  </span>
                </div>

                <div className="recommendation-content">
                  <p className="recommendation-message">
                    {recommendation.message}
                  </p>

                  {showDetails && recommendation.details && (
                    <p className="recommendation-details">
                      {recommendation.details}
                    </p>
                  )}

                  {variantChange && (
                    <div className="recommendation-variant-change">
                      <span className="variant-change-label">Change:</span>
                      <span className="variant-change-value">
                        {variantChange}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
