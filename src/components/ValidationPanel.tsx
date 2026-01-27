import type { ValidationIssue, ValidationSeverity } from "../types/analysis"

export type ValidationPanelProps = {
  issues: ValidationIssue[]
  reliable: boolean
}

const getSeverityColor = (severity: ValidationSeverity): string => {
  switch (severity) {
    case "error":
      return "var(--error)"
    case "warning":
      return "var(--warning)"
    case "info":
      return "var(--info)"
  }
}

const getSeverityLabel = (severity: ValidationSeverity): string => {
  switch (severity) {
    case "error":
      return "Error"
    case "warning":
      return "Warning"
    case "info":
      return "Info"
  }
}

export const ValidationPanel = ({ issues, reliable }: ValidationPanelProps) => {
  if (issues.length === 0) {
    return (
      <div className="validation-panel validation-success">
        <div className="validation-icon">✓</div>
        <p className="validation-empty-message">
          No validation issues found. Playlist conforms to RFC 8216.
        </p>
      </div>
    )
  }

  return (
    <div className="validation-panel">
      {!reliable && (
        <div className="validation-warning-banner">
          <strong>Warning:</strong> Critical errors detected. Classification and ladder results may be unreliable.
        </div>
      )}

      <div className="validation-issues">
        {issues.map((issue, index) => (
          <div key={index} className="validation-issue">
            <div
              className="validation-issue-badge"
              style={{ backgroundColor: getSeverityColor(issue.severity) }}
            >
              {getSeverityLabel(issue.severity)}
            </div>
            <div className="validation-issue-content">
              <p className="validation-issue-message">{issue.message}</p>
              <p className="validation-issue-hint">{issue.hint}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
