import type { SampleConfig, LadderResult, StreamType } from "../types/analysis"

type SampleControlsProps = {
  sampleConfig: SampleConfig
  onConfigChange: (updates: Partial<SampleConfig>) => void
  onRunSample: () => void
  streamType: StreamType
  ladder: LadderResult
  disabled: boolean
  isLoading: boolean
}

const DURATION_PRESETS = [15, 30, 60, 120]

export const SampleControls = ({
  sampleConfig,
  onConfigChange,
  onRunSample,
  streamType,
  ladder,
  disabled,
  isLoading,
}: SampleControlsProps) => {
  const videoVariants = ladder.video

  return (
    <div className="sample-controls">
      <div className="control-group">
        <label className="control-label">Sample Duration</label>
        <div className="duration-presets">
          {DURATION_PRESETS.map((duration) => (
            <button
              key={duration}
              type="button"
              className={`preset-button ${
                sampleConfig.durationSeconds === duration ? "active" : ""
              }`}
              onClick={() => onConfigChange({ durationSeconds: duration })}
              disabled={disabled}
            >
              {duration}s
            </button>
          ))}
        </div>
      </div>

      {streamType === "vod" && (
        <div className="control-group">
          <label className="control-label" htmlFor="start-offset">
            Start Offset (seconds)
          </label>
          <input
            id="start-offset"
            type="number"
            min="0"
            step="1"
            value={sampleConfig.startOffsetSeconds ?? 0}
            onChange={(e) =>
              onConfigChange({ startOffsetSeconds: Number(e.target.value) })
            }
            disabled={disabled}
            className="control-input"
          />
        </div>
      )}

      {streamType === "live" && (
        <div className="control-group">
          <label className="control-label" htmlFor="live-anchor">
            Live Anchor (seconds behind live edge)
          </label>
          <input
            id="live-anchor"
            type="number"
            min="0"
            step="1"
            value={sampleConfig.liveAnchorSeconds ?? 30}
            onChange={(e) =>
              onConfigChange({ liveAnchorSeconds: Number(e.target.value) })
            }
            disabled={disabled}
            className="control-input"
          />
        </div>
      )}

      {videoVariants.length > 1 && (
        <div className="control-group">
          <label className="control-label" htmlFor="rendition-select">
            Rendition
          </label>
          <select
            id="rendition-select"
            value={sampleConfig.selectedRenditionIndex}
            onChange={(e) =>
              onConfigChange({ selectedRenditionIndex: Number(e.target.value) })
            }
            disabled={disabled}
            className="control-select"
          >
            {videoVariants.map((variant, index) => {
              const bitrateMbps = (variant.bitrate / 1_000_000).toFixed(2)
              const resolution = variant.resolution
                ? `${variant.resolution.width}x${variant.resolution.height}`
                : "Unknown"
              return (
                <option key={index} value={index}>
                  {bitrateMbps} Mbps - {resolution}
                </option>
              )
            })}
          </select>
        </div>
      )}

      <button
        type="button"
        className="run-sample-button"
        onClick={onRunSample}
        disabled={disabled || isLoading}
      >
        {isLoading ? "Sampling..." : "Run Sample"}
      </button>
    </div>
  )
}
