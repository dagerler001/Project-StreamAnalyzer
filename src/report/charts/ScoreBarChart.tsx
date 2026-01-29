import type { CategoryScore, RuleCategory } from '../../types/scoring'

export type ScoreBarChartProps = {
  categories: { category: RuleCategory; score: CategoryScore }[]
  maxWidth?: number
  barHeight?: number
}

export const ScoreBarChart = ({
  categories,
  maxWidth = 300,
  barHeight = 24,
}: ScoreBarChartProps) => {
  if (categories.length === 0) {
    return (
      <div className="score-bar-chart">
        <p className="chart-empty-message">No category scores available.</p>
      </div>
    )
  }

  const width = maxWidth
  const height = categories.length * (barHeight + 16) + 40
  const padding = { top: 10, right: 50, bottom: 30, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Category labels
  const categoryLabels: Record<string, string> = {
    ladder: 'Ladder',
    codec: 'Codec',
    segment: 'Segment',
    metadata: 'Metadata',
  }

  // Get color based on score
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'var(--success, #4ade80)'
    if (score >= 60) return 'var(--warning, #e5a844)'
    return 'var(--error, #d64545)'
  }

  // Grid lines at 25, 50, 75, 100
  const gridLines = [25, 50, 75, 100]

  return (
    <div className="score-bar-chart">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
      >
        {/* Grid lines */}
        {gridLines.map((value) => {
          const x = padding.left + (value / 100) * chartWidth
          return (
            <g key={`grid-${value}`}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + chartHeight}
                stroke="var(--border-soft)"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <text
                x={x}
                y={height - 5}
                textAnchor="middle"
                fontSize="10"
                fill="var(--ink-muted)"
              >
                {value}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {categories.map((item, index) => {
          const y = padding.top + index * (barHeight + 16)
          const scoreValue = item.score.score
          const barWidth = (scoreValue / 100) * chartWidth
          const color = getScoreColor(scoreValue)

          return (
            <g key={item.category}>
              {/* Category label */}
              <text
                x={padding.left - 10}
                y={y + barHeight / 2 + 4}
                textAnchor="end"
                fontSize="12"
                fontWeight="500"
                fill="var(--ink-strong)"
              >
                {categoryLabels[item.category] || item.category}
              </text>

              {/* Background track */}
              <rect
                x={padding.left}
                y={y}
                width={chartWidth}
                height={barHeight}
                fill="var(--surface-muted)"
                rx={4}
              />

              {/* Filled portion */}
              <rect
                x={padding.left}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={4}
              />

              {/* Score value */}
              <text
                x={padding.left + barWidth + 8}
                y={y + barHeight / 2 + 4}
                fontSize="12"
                fontWeight="600"
                fill={color}
              >
                {Math.round(scoreValue)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
