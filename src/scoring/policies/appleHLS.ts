import type { ScoringPolicy } from './basePolicy'

/**
 * Apple HLS Best Practices Policy
 *
 * Optimized for Apple devices following HLS Authoring Specification.
 * Focuses on bitrate spacing, resolution ladder, and codec compatibility
 * for maximum compatibility across Apple ecosystem.
 */
export const appleHlsPolicy: ScoringPolicy = {
  id: 'apple-hls',
  name: 'Apple HLS Best Practices',
  description:
    'Optimized for Apple devices following HLS Authoring Specification',
  rules: [
    { ruleId: 'bitrate-spacing', enabled: true, weight: 0.15 },
    { ruleId: 'resolution-ladder', enabled: true, weight: 0.2 },
    { ruleId: 'codec-compatibility', enabled: true, weight: 0.15 },
    { ruleId: 'audio-codec', enabled: true, weight: 0.1 },
    { ruleId: 'segment-duration', enabled: true, weight: 0.15 },
    { ruleId: 'keyframe-alignment', enabled: true, weight: 0.15 },
    { ruleId: 'bandwidth-attributes', enabled: true, weight: 0.1 },
  ],
}
