import type { SampleCodecs } from '../types/analysis'

export type CodecSummaryProps = {
  codecs: SampleCodecs
}

export const CodecSummary = ({ codecs }: CodecSummaryProps) => {
  const hasVideoCodecs = codecs.video.friendly.length > 0 || codecs.video.raw.length > 0
  const hasAudioCodecs = codecs.audio.friendly.length > 0 || codecs.audio.raw.length > 0

  if (!hasVideoCodecs && !hasAudioCodecs) {
    return (
      <div className="codec-summary">
        <p className="codec-empty-message">No codec information available for this sample.</p>
      </div>
    )
  }

  return (
    <div className="codec-summary">
      {hasVideoCodecs && (
        <div className="codec-group">
          <h4 className="codec-group-title">Video Codecs</h4>
          <ul className="codec-list">
            {codecs.video.friendly.map((friendly, idx) => (
              <li key={`video-${idx}`} className="codec-item">
                <span className="codec-friendly">{friendly}</span>
                {codecs.video.raw[idx] && (
                  <span className="codec-raw">{codecs.video.raw[idx]}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasAudioCodecs && (
        <div className="codec-group">
          <h4 className="codec-group-title">Audio Codecs</h4>
          <ul className="codec-list">
            {codecs.audio.friendly.map((friendly, idx) => (
              <li key={`audio-${idx}`} className="codec-item">
                <span className="codec-friendly">{friendly}</span>
                {codecs.audio.raw[idx] && (
                  <span className="codec-raw">{codecs.audio.raw[idx]}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
