import type { LadderResult, LadderVariant } from "../../types/analysis"

export type LadderComparisonProps = {
  current: LadderResult
  recommended: LadderResult
  showAudio?: boolean // default true
}

type VariantDiff =
  | { type: "unchanged"; variant: LadderVariant }
  | { type: "added"; variant: LadderVariant }
  | { type: "removed"; variant: LadderVariant }
  | {
      type: "modified"
      current: LadderVariant
      suggested: LadderVariant
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

// Compare two variants to determine if they're the same
const variantsEqual = (a: LadderVariant, b: LadderVariant): boolean => {
  if (a.bitrate !== b.bitrate) return false
  if (a.averageBandwidth !== b.averageBandwidth) return false
  if (a.frameRate !== b.frameRate) return false
  if (a.resolution?.width !== b.resolution?.width) return false
  if (a.resolution?.height !== b.resolution?.height) return false
  if (a.codecs.length !== b.codecs.length) return false
  return a.codecs.every((c, i) => c === b.codecs[i])
}

// Compute differences between current and recommended ladders
const computeDiffs = (
  current: LadderVariant[],
  recommended: LadderVariant[]
): VariantDiff[] => {
  const diffs: VariantDiff[] = []
  const matchedCurrent = new Set<number>()
  const matchedRecommended = new Set<number>()

  // First pass: find exact matches and modifications
  current.forEach((currVariant, currIndex) => {
    const exactMatch = recommended.findIndex(
      (rec, recIndex) =>
        !matchedRecommended.has(recIndex) && variantsEqual(currVariant, rec)
    )

    if (exactMatch !== -1) {
      diffs.push({ type: "unchanged", variant: currVariant })
      matchedCurrent.add(currIndex)
      matchedRecommended.add(exactMatch)
    } else {
      // Check for modification (same resolution, different bitrate)
      const modifiedMatch = recommended.findIndex(
        (rec, recIndex) =>
          !matchedRecommended.has(recIndex) &&
          currVariant.resolution?.width === rec.resolution?.width &&
          currVariant.resolution?.height === rec.resolution?.height
      )

      if (modifiedMatch !== -1) {
        diffs.push({
          type: "modified",
          current: currVariant,
          suggested: recommended[modifiedMatch],
        })
        matchedCurrent.add(currIndex)
        matchedRecommended.add(modifiedMatch)
      }
    }
  })

  // Second pass: mark remaining as removed or added
  current.forEach((variant, index) => {
    if (!matchedCurrent.has(index)) {
      diffs.push({ type: "removed", variant })
    }
  })

  recommended.forEach((variant, index) => {
    if (!matchedRecommended.has(index)) {
      diffs.push({ type: "added", variant })
    }
  })

  // Sort by bitrate descending
  return diffs.sort((a, b) => {
    const bitrateA = a.type === "modified" ? a.current.bitrate : a.variant.bitrate
    const bitrateB = b.type === "modified" ? b.current.bitrate : b.variant.bitrate
    return bitrateB - bitrateA
  })
}

const VariantRow = ({
  variant,
  diffType,
}: {
  variant: LadderVariant
  diffType: VariantDiff["type"]
}) => {
  const rowClass = `ladder-row ladder-variant-${diffType}`

  return (
    <tr className={rowClass}>
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
}

const ModifiedVariantRow = ({
  current,
  suggested,
}: {
  current: LadderVariant
  suggested: LadderVariant
}) => {
  return (
    <tr className="ladder-row ladder-variant-modified">
      <td className="ladder-cell">
        <span className="ladder-old-value">{formatBitrate(current.bitrate)}</span>
        <span className="ladder-arrow"> → </span>
        <span className="ladder-new-value">{formatBitrate(suggested.bitrate)}</span>
      </td>
      <td className="ladder-cell">
        {current.averageBandwidth || suggested.averageBandwidth ? (
          <>
            <span className="ladder-old-value">
              {current.averageBandwidth
                ? formatBitrate(current.averageBandwidth)
                : "—"}
            </span>
            <span className="ladder-arrow"> → </span>
            <span className="ladder-new-value">
              {suggested.averageBandwidth
                ? formatBitrate(suggested.averageBandwidth)
                : "—"}
            </span>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="ladder-cell">{formatResolution(current.resolution)}</td>
      <td className="ladder-cell">{formatCodecs(current.codecs)}</td>
      <td className="ladder-cell">{formatFrameRate(current.frameRate)}</td>
    </tr>
  )
}

const LadderColumn = ({
  title,
  variants,
  diffs,
}: {
  title: string
  variants: LadderVariant[]
  diffs: VariantDiff[]
}) => {
  return (
    <div className="ladder-comparison-column">
      <div className="ladder-comparison-header">
        <h3 className="ladder-comparison-title">{title}</h3>
        <span className="ladder-comparison-count">
          {variants.length} variant{variants.length !== 1 ? "s" : ""}
        </span>
      </div>

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
            {diffs.map((diff, index) => {
              if (diff.type === "modified") {
                return (
                  <ModifiedVariantRow
                    key={index}
                    current={diff.current}
                    suggested={diff.suggested}
                  />
                )
              }
              return (
                <VariantRow
                  key={index}
                  variant={diff.variant}
                  diffType={diff.type}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const LadderComparison = ({
  current,
  recommended,
  showAudio = true,
}: LadderComparisonProps) => {
  const videoDiffs = computeDiffs(current.video, recommended.video)
  const audioDiffs = computeDiffs(current.audio, recommended.audio)

  // Check if ladders are identical
  const hasChanges =
    videoDiffs.some((d) => d.type !== "unchanged") ||
    audioDiffs.some((d) => d.type !== "unchanged")

  if (!hasChanges) {
    return (
      <div className="ladder-comparison ladder-comparison-empty">
        <div className="ladder-comparison-success">
          <div className="ladder-comparison-icon">✓</div>
          <p className="ladder-comparison-message">
            No changes recommended - current ladder is optimal
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ladder-comparison">
      <div className="ladder-comparison-section">
        <h4 className="ladder-comparison-section-title">Video Variants</h4>
        <div className="ladder-comparison-columns">
          <LadderColumn
            title="Current Ladder"
            variants={current.video}
            diffs={videoDiffs}
          />
          <LadderColumn
            title="Recommended Ladder"
            variants={recommended.video}
            diffs={videoDiffs}
          />
        </div>
      </div>

      {showAudio && (current.audio.length > 0 || recommended.audio.length > 0) && (
        <div className="ladder-comparison-section">
          <h4 className="ladder-comparison-section-title">Audio Variants</h4>
          <div className="ladder-comparison-columns">
            <LadderColumn
              title="Current Ladder"
              variants={current.audio}
              diffs={audioDiffs}
            />
            <LadderColumn
              title="Recommended Ladder"
              variants={recommended.audio}
              diffs={audioDiffs}
            />
          </div>
        </div>
      )}

      <div className="ladder-comparison-legend">
        <div className="ladder-legend-item">
          <span className="ladder-legend-marker ladder-legend-added">+</span>
          <span className="ladder-legend-label">Added</span>
        </div>
        <div className="ladder-legend-item">
          <span className="ladder-legend-marker ladder-legend-removed">−</span>
          <span className="ladder-legend-label">Removed</span>
        </div>
        <div className="ladder-legend-item">
          <span className="ladder-legend-marker ladder-legend-modified">~</span>
          <span className="ladder-legend-label">Modified</span>
        </div>
      </div>
    </div>
  )
}
