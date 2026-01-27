import type { BitratePoint } from '../types/analysis'

export type BitrateChartProps = {
  bitrateSeries: BitratePoint[]
}

export const BitrateChart = ({ bitrateSeries }: BitrateChartProps) => {
  if (bitrateSeries.length === 0) {
    return (
      <div className="bitrate-chart">
        <p className="chart-empty-message">No bitrate data available for this sample.</p>
      </div>
    )
  }

  // Calculate chart dimensions
  const width = 800
  const height = 400
  const padding = { top: 20, right: 20, bottom: 60, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Find min/max bitrate for scaling
  const allBitrates = bitrateSeries.flatMap((point) => [
    point.bitrateBps,
    point.rollingAverageBps ?? point.bitrateBps,
  ])
  const minBitrate = Math.min(...allBitrates)
  const maxBitrate = Math.max(...allBitrates)
  const bitrateRange = maxBitrate - minBitrate || 1 // Avoid division by zero

  // Time range
  const startTime = bitrateSeries[0].startSeconds
  const endTime = bitrateSeries[bitrateSeries.length - 1].startSeconds +
    bitrateSeries[bitrateSeries.length - 1].durationSeconds

  const timeRange = endTime - startTime || 1

  // Scale functions
  const scaleX = (seconds: number) => ((seconds - startTime) / timeRange) * chartWidth
  const scaleY = (bitrate: number) => chartHeight - ((bitrate - minBitrate) / bitrateRange) * chartHeight

  // Generate path for raw bitrate line
  const rawPath = bitrateSeries
    .map((point, idx) => {
      const x = scaleX(point.startSeconds)
      const y = scaleY(point.bitrateBps)
      return `${idx === 0 ? 'M' : 'L'} ${x},${y}`
    })
    .join(' ')

  // Generate path for rolling average line
  const smoothedPath = bitrateSeries
    .filter((point) => point.rollingAverageBps !== undefined)
    .map((point, idx) => {
      const x = scaleX(point.startSeconds)
      const y = scaleY(point.rollingAverageBps!)
      return `${idx === 0 ? 'M' : 'L'} ${x},${y}`
    })
    .join(' ')

  // Format bitrate for display (convert to Mbps)
  const formatBitrate = (bps: number) => {
    const mbps = bps / 1_000_000
    return `${mbps.toFixed(2)} Mbps`
  }

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bitrate-chart">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
      >
        {/* Background */}
        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          fill="var(--surface-muted)"
          stroke="var(--border-soft)"
          strokeWidth="1"
        />

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = padding.top + chartHeight * fraction
          const bitrate = maxBitrate - fraction * bitrateRange
          return (
            <g key={`grid-${fraction}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="var(--border-soft)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill="var(--ink-muted)"
              >
                {formatBitrate(bitrate)}
              </text>
            </g>
          )
        })}

        {/* Raw bitrate line */}
        <path
          d={rawPath}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2"
          opacity="0.5"
        />

        {/* Smoothed bitrate line */}
        {smoothedPath && (
          <path
            d={smoothedPath}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="3"
          />
        )}

        {/* X-axis labels */}
        <text
          x={padding.left}
          y={height - padding.bottom + 25}
          textAnchor="start"
          fontSize="12"
          fill="var(--ink-muted)"
        >
          {formatTime(startTime)}
        </text>
        <text
          x={padding.left + chartWidth}
          y={height - padding.bottom + 25}
          textAnchor="end"
          fontSize="12"
          fill="var(--ink-muted)"
        >
          {formatTime(endTime)}
        </text>

        {/* Axis labels */}
        <text
          x={padding.left + chartWidth / 2}
          y={height - padding.bottom + 45}
          textAnchor="middle"
          fontSize="13"
          fontWeight="500"
          fill="var(--ink-strong)"
        >
          Time (mm:ss)
        </text>
        <text
          x={padding.left - 60}
          y={padding.top + chartHeight / 2}
          textAnchor="middle"
          fontSize="13"
          fontWeight="500"
          fill="var(--ink-strong)"
          transform={`rotate(-90, ${padding.left - 60}, ${padding.top + chartHeight / 2})`}
        >
          Bitrate
        </text>
      </svg>

      {/* Legend */}
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-marker legend-marker-raw"></div>
          <span className="legend-label">Raw bitrate</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker legend-marker-smoothed"></div>
          <span className="legend-label">Smoothed (3-point avg)</span>
        </div>
      </div>
    </div>
  )
}
