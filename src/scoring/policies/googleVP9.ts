import type { ScoringPolicy } from './basePolicy'

/**
 * Google VP9 Recommendations Policy
 *
 * Optimized for VP9 codec following Google encoding guidelines.
 * Similar structure to Apple HLS but with higher weight on codec compatibility
 * and preference for VP9 codec where supported.
 */
export const googleVP9Policy: ScoringPolicy = {
  id: 'google-vp9',
  name: 'Google VP9 Recommendations',
  description: 'Optimized for VP9 codec following Google encoding guidelines',
  rules: [
    { ruleId: 'bitrate-spacing', enabled: true, weight: 0.15 },
    { ruleId: 'resolution-ladder', enabled: true, weight: 0.2 },
    {
      ruleId: 'codec-compatibility',
      enabled: true,
      weight: 0.2,
      params: { preferVP9: true },
    },
    { ruleId: 'audio-codec', enabled: true, weight: 0.1 },
    { ruleId: 'segment-duration', enabled: true, weight: 0.15 },
    { ruleId: 'keyframe-alignment', enabled: true, weight: 0.1 },
    { ruleId: 'bandwidth-attributes', enabled: true, weight: 0.1 },
  ],
}
