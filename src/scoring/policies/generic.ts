import type { ScoringPolicy } from './basePolicy'

/**
 * Generic/Balanced Policy
 *
 * Balanced scoring for general-purpose streaming.
 * Uses equal weights across all rules for a fair, unbiased evaluation
 * suitable for most streaming scenarios.
 */
export const genericPolicy: ScoringPolicy = {
  id: 'generic',
  name: 'Generic/Balanced',
  description: 'Balanced scoring for general-purpose streaming',
  rules: [
    { ruleId: 'bitrate-spacing', enabled: true, weight: 0.14 },
    { ruleId: 'resolution-ladder', enabled: true, weight: 0.14 },
    { ruleId: 'codec-compatibility', enabled: true, weight: 0.14 },
    { ruleId: 'audio-codec', enabled: true, weight: 0.15 },
    { ruleId: 'segment-duration', enabled: true, weight: 0.15 },
    { ruleId: 'keyframe-alignment', enabled: true, weight: 0.14 },
    { ruleId: 'bandwidth-attributes', enabled: true, weight: 0.14 },
  ],
}
