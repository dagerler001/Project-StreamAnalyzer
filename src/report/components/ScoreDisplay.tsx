import { ScoreGauge } from '../charts/ScoreGauge'

export type ScoreDisplayProps = {
  score: number
  showLabel?: boolean // default true
  size?: 'small' | 'medium' | 'large' // default 'medium'
}

export const ScoreDisplay = ({
  score,
  showLabel = true,
  size = 'medium',
}: ScoreDisplayProps) => {
  // Get label based on score ranges
  const getScoreLabel = (value: number): string => {
    if (value >= 90) return 'Excellent'
    if (value >= 80) return 'Good'
    if (value >= 60) return 'Fair'
    return 'Poor'
  }

  // Get CSS class based on score for color coding
  const getScoreClass = (value: number): string => {
    if (value >= 80) return 'score-excellent'
    if (value >= 60) return 'score-good'
    return 'score-poor'
  }

  // Map size prop to gauge size
  const sizeMap: Record<string, number> = {
    small: 80,
    medium: 120,
    large: 160,
  }

  const gaugeSize = sizeMap[size] || 120
  const label = getScoreLabel(score)
  const scoreClass = getScoreClass(score)

  return (
    <div className={`score-display ${scoreClass} score-display-${size}`}>
      <ScoreGauge score={score} size={gaugeSize} />
      {showLabel && (
        <div className="score-label">{label}</div>
      )}
    </div>
  )
}
