import type { LadderResult, LadderVariant } from "../types/analysis"

export type LadderTableProps = {
  ladder: LadderResult
}

const formatBitrate = (bps: number): string => {
  if (bps >= 1_000_000) {
    return `${(bps / 1_000_000).toFixed(2)} Mbps`
  }
  return `${(bps / 1_000).toFixed(0)} kbps`
}

const formatResolution = (resolution?: { width: number; height: number }): string => {
  if (!resolution) return "—"
  return `${resolution.width}×${resolution.height}`
}

const formatCodecs = (codecs: string[]): string => {
  if (codecs.length === 0) return "—"
  return codecs.join(", ")
}

const formatFrameRate = (frameRate?: number): string => {
  if (!frameRate) return "—"
  return `${frameRate.toFixed(2)} fps`
}

const VariantRow = ({ variant }: { variant: LadderVariant }) => (
  <tr className="ladder-row">
    <td className="ladder-cell">{formatBitrate(variant.bitrate)}</td>
    <td className="ladder-cell">
      {variant.averageBandwidth
        ? formatBitrate(variant.averageBandwidth)
        : "—"}
    </td>
    <td className="ladder-cell">{formatResolution(variant.resolution)}</td>
    <td className="ladder-cell">{formatCodecs(variant.codecs)}</td>
    <td className="ladder-cell">{formatFrameRate(variant.frameRate)}</td>
  </tr>
)

export const LadderTable = ({ ladder }: LadderTableProps) => {
  const hasVideo = ladder.video.length > 0
  const hasAudio = ladder.audio.length > 0

  if (!hasVideo && !hasAudio) {
    return (
      <div className="ladder-empty">
        <p className="ladder-empty-message">
          No ladder variants detected in this playlist.
        </p>
      </div>
    )
  }

  return (
    <div className="ladder-table-container">
      {hasVideo && (
        <section className="ladder-section">
          <h3 className="ladder-section-title">Video Variants</h3>
          <div className="ladder-table-wrapper">
            <table className="ladder-table">
              <thead>
                <tr className="ladder-header-row">
                  <th className="ladder-header-cell">Bitrate</th>
                  <th className="ladder-header-cell">Avg Bitrate</th>
                  <th className="ladder-header-cell">Resolution</th>
                  <th className="ladder-header-cell">Codecs</th>
                  <th className="ladder-header-cell">Frame Rate</th>
                </tr>
              </thead>
              <tbody>
                {ladder.video.map((variant, index) => (
                  <VariantRow key={index} variant={variant} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {hasAudio && (
        <section className="ladder-section">
          <h3 className="ladder-section-title">Audio Variants</h3>
          <div className="ladder-table-wrapper">
            <table className="ladder-table">
              <thead>
                <tr className="ladder-header-row">
                  <th className="ladder-header-cell">Bitrate</th>
                  <th className="ladder-header-cell">Avg Bitrate</th>
                  <th className="ladder-header-cell">Resolution</th>
                  <th className="ladder-header-cell">Codecs</th>
                  <th className="ladder-header-cell">Frame Rate</th>
                </tr>
              </thead>
              <tbody>
                {ladder.audio.map((variant, index) => (
                  <VariantRow key={index} variant={variant} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
