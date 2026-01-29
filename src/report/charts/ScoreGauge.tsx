export type ScoreGaugeProps = {
  score: number // 0-100
  size?: number // default 120
  strokeWidth?: number // default 10
}

export const ScoreGauge = ({
  score,
  size = 120,
  strokeWidth = 10,
}: ScoreGaugeProps) => {
  // Clamp score to 0-100
  const clampedScore = Math.max(0, Math.min(100, score))

  // Calculate dimensions
  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  // Calculate stroke dash offset based on score
  // Full circle would be circumference, so we use percentage
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference

  // Get color based on score
  const getScoreColor = (value: number): string => {
    if (value >= 80) return 'var(--success, #4ade80)'
    if (value >= 60) return 'var(--warning, #e5a844)'
    return 'var(--error, #d64545)'
  }

  const color = getScoreColor(clampedScore)

  return (
    <div className="score-gauge">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="gauge-svg"
      >
        {/* Background circle (gray track) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--surface-muted)"
          strokeWidth={strokeWidth}
        />

        {/* Foreground arc showing score */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90, ${center}, ${center})`}
          style={{
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />

        {/* Centered text showing score */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.35}
          fontWeight="600"
          fill="var(--ink-strong)"
        >
          {Math.round(clampedScore)}
        </text>
      </svg>
    </div>
  )
}
