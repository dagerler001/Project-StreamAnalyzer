import type { ScoringRule } from '../../types/scoring'
import { bitrateSpacingRule, resolutionLadderRule } from './ladderRules'
import { codecCompatibilityRule, audioCodecRule } from './codecRules'
import { segmentDurationRule, keyframeAlignmentRule, bandwidthAttributesRule } from './segmentRules'

/**
 * Array of all scoring rules
 */
export const allRules: ScoringRule[] = [
  bitrateSpacingRule,
  resolutionLadderRule,
  codecCompatibilityRule,
  audioCodecRule,
  segmentDurationRule,
  keyframeAlignmentRule,
  bandwidthAttributesRule,
]

/**
 * Rule registry mapping ruleId to ScoringRule
 */
const ruleRegistry: Record<string, ScoringRule> = {
  'bitrate-spacing': bitrateSpacingRule,
  'resolution-ladder': resolutionLadderRule,
  'codec-compatibility': codecCompatibilityRule,
  'audio-codec': audioCodecRule,
  'segment-duration': segmentDurationRule,
  'keyframe-alignment': keyframeAlignmentRule,
  'bandwidth-attributes': bandwidthAttributesRule,
}

/**
 * Get a rule by its ID
 * @param id - The rule ID
 * @returns The ScoringRule or undefined if not found
 */
export function getRuleById(id: string): ScoringRule | undefined {
  return ruleRegistry[id]
}

// Re-export all rules for direct access
export {
  bitrateSpacingRule,
  resolutionLadderRule,
  codecCompatibilityRule,
  audioCodecRule,
  segmentDurationRule,
  keyframeAlignmentRule,
  bandwidthAttributesRule,
}
