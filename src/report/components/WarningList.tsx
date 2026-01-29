import type { Warning } from "../../types/scoring"

export type WarningListProps = {
  warnings: Warning[]
  maxHeight?: number // for scrollable container
}

const getSeverityColor = (severity: Warning["severity"]): string => {
  switch (severity) {
    case "error":
      return "var(--error)"
    case "warning":
      return "var(--warning)"
    case "info":
      return "var(--info)"
  }
}

const getSeverityLabel = (severity: Warning["severity"]): string => {
  switch (severity) {
    case "error":
      return "Error"
    case "warning":
      return "Warning"
    case "info":
      return "Info"
  }
}

// Group warnings by severity (error > warning > info)
const groupWarningsBySeverity = (warnings: Warning[]): Warning[][] => {
  const error = warnings.filter((w) => w.severity === "error")
  const warning = warnings.filter((w) => w.severity === "warning")
  const info = warnings.filter((w) => w.severity === "info")
  return [error, warning, info].filter((group) => group.length > 0)
}

export const WarningList = ({ warnings, maxHeight }: WarningListProps) => {
  if (warnings.length === 0) {
    return (
      <div className="warning-list warning-list-empty">
        <div className="warning-list-success">
          <div className="warning-list-icon">✓</div>
          <p className="warning-list-message">
            No warnings - great job!
          </p>
        </div>
      </div>
    )
  }

  const groupedWarnings = groupWarningsBySeverity(warnings)

  return (
    <div
      className="warning-list"
      style={maxHeight ? { maxHeight, overflow: "auto" } : undefined}
    >
      {groupedWarnings.map((group, groupIndex) => (
        <div key={groupIndex} className="warning-group">
          {group.map((warning, index) => (
            <div
              key={index}
              className={`warning-item warning-severity-${warning.severity}`}
            >
              <div
                className="warning-badge"
                style={{ backgroundColor: getSeverityColor(warning.severity) }}
              >
                {getSeverityLabel(warning.severity)}
              </div>
              <div className="warning-content">
                <p className="warning-message">{warning.message}</p>
                {warning.hint && (
                  <p className="warning-hint">{warning.hint}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
