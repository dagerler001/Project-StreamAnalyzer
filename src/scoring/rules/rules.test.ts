import { describe, it, expect } from 'vitest'
import type { AnalysisContext } from '../../types/scoring'
import { bitrateSpacingRule, resolutionLadderRule } from './ladderRules'
import { codecCompatibilityRule, audioCodecRule } from './codecRules'
import { segmentDurationRule, keyframeAlignmentRule, bandwidthAttributesRule } from './segmentRules'
import { getRuleById, allRules } from './index'

// ============================================================================
// Test Fixtures
// ============================================================================

const createPerfectContext = (): AnalysisContext => ({
  ladder: {
    video: [
      { bitrate: 4000000, resolution: { width: 1920, height: 1080 }, codecs: ['avc1.640028'], frameRate: 30 },
      { bitrate: 2000000, resolution: { width: 1280, height: 720 }, codecs: ['avc1.64001f'], frameRate: 30 },
      { bitrate: 1000000, resolution: { width: 854, height: 480 }, codecs: ['avc1.4d001f'], frameRate: 30 },
      { bitrate: 500000, resolution: { width: 640, height: 360 }, codecs: ['avc1.42001e'], frameRate: 30 },
      { bitrate: 250000, resolution: { width: 426, height: 240 }, codecs: ['avc1.42000d'], frameRate: 30 },
    ],
    audio: [
      { bitrate: 128000, codecs: ['mp4a.40.2'] },
    ],
  },
  classification: { playlistType: 'master', streamType: 'vod' },
  sampleResult: {
    window: { startSeconds: 0, endSeconds: 10, actualDurationSeconds: 10, requestedDurationSeconds: 10 },
    bitrateSeries: [],
    codecs: { video: { friendly: ['H.264'], raw: ['avc1.640028'] }, audio: { friendly: ['AAC'], raw: ['mp4a.40.2'] } },
    diagnostics: { warnings: [], errors: [], missingHeaders: 0, segmentCount: 5 },
    reliable: true,
  },
})

const createMinorIssuesContext = (): AnalysisContext => ({
  ladder: {
    video: [
      { bitrate: 5000000, resolution: { width: 1920, height: 1080 }, codecs: ['avc1.640028'], frameRate: 30 },
      { bitrate: 3500000, resolution: { width: 1280, height: 720 }, codecs: ['avc1.64001f'], frameRate: 30 }, // 1.4x step (minor issue)
      { bitrate: 800000, resolution: { width: 854, height: 480 }, codecs: ['avc1.4d001f'], frameRate: 30 },
      { bitrate: 400000, resolution: { width: 640, height: 360 }, codecs: ['avc1.42001e'], frameRate: 30 },
    ],
    audio: [
      { bitrate: 128000, codecs: ['mp4a.40.2'] },
    ],
  },
  classification: { playlistType: 'master', streamType: 'vod' },
  sampleResult: {
    window: { startSeconds: 0, endSeconds: 15, actualDurationSeconds: 15, requestedDurationSeconds: 10 },
    bitrateSeries: [],
    codecs: { video: { friendly: ['H.264'], raw: ['avc1.640028'] }, audio: { friendly: ['AAC'], raw: ['mp4a.40.2'] } },
    diagnostics: { warnings: [], errors: [], missingHeaders: 0, segmentCount: 5 },
    reliable: true,
  },
})

const createMajorIssuesContext = (): AnalysisContext => ({
  ladder: {
    video: [
      { bitrate: 8000000, resolution: { width: 1920, height: 1080 }, codecs: ['vp9'], frameRate: 30 },
      { bitrate: 500000, resolution: { width: 640, height: 360 }, codecs: ['vp9'], frameRate: 30 }, // 16x gap (major issue)
    ],
    audio: [], // No audio variants (major issue)
  },
  classification: { playlistType: 'master', streamType: 'live' },
  sampleResult: {
    window: { startSeconds: 0, endSeconds: 20, actualDurationSeconds: 20, requestedDurationSeconds: 10 },
    bitrateSeries: [],
    codecs: { video: { friendly: ['VP9'], raw: ['vp9'] }, audio: { friendly: [], raw: [] } },
    diagnostics: { warnings: ['High variance'], errors: [], missingHeaders: 2, segmentCount: 5 },
    reliable: false,
  },
})

const createEdgeCaseContext = (): AnalysisContext => ({
  ladder: {
    video: [],
    audio: [],
  },
  classification: { playlistType: 'master', streamType: 'vod' },
  sampleResult: {
    window: { startSeconds: 0, endSeconds: 0, actualDurationSeconds: 0, requestedDurationSeconds: 10 },
    bitrateSeries: [],
    codecs: { video: { friendly: [], raw: [] }, audio: { friendly: [], raw: [] } },
    diagnostics: { warnings: [], errors: ['No variants found'], missingHeaders: 0, segmentCount: 0 },
    reliable: false,
  },
})

const createSingleVariantContext = (): AnalysisContext => ({
  ladder: {
    video: [
      { bitrate: 2000000, resolution: { width: 1280, height: 720 }, codecs: ['avc1.64001f'], frameRate: 30 },
    ],
    audio: [
      { bitrate: 128000, codecs: ['mp4a.40.2'] },
    ],
  },
  classification: { playlistType: 'master', streamType: 'vod' },
  sampleResult: {
    window: { startSeconds: 0, endSeconds: 10, actualDurationSeconds: 10, requestedDurationSeconds: 10 },
    bitrateSeries: [],
    codecs: { video: { friendly: ['H.264'], raw: ['avc1.64001f'] }, audio: { friendly: ['AAC'], raw: ['mp4a.40.2'] } },
    diagnostics: { warnings: [], errors: [], missingHeaders: 0, segmentCount: 5 },
    reliable: true,
  },
})

// ============================================================================
// Rule Registry Tests
// ============================================================================

describe('Rule Registry', () => {
  it('should export all 7 rules in allRules array', () => {
    expect(allRules).toHaveLength(7)
    const ruleIds = allRules.map(r => r.id)
    expect(ruleIds).toContain('bitrate-spacing')
    expect(ruleIds).toContain('resolution-ladder')
    expect(ruleIds).toContain('codec-compatibility')
    expect(ruleIds).toContain('audio-codec')
    expect(ruleIds).toContain('segment-duration')
    expect(ruleIds).toContain('keyframe-alignment')
    expect(ruleIds).toContain('bandwidth-attributes')
  })

  it('should retrieve rules by ID via getRuleById', () => {
    expect(getRuleById('bitrate-spacing')?.id).toBe('bitrate-spacing')
    expect(getRuleById('resolution-ladder')?.id).toBe('resolution-ladder')
    expect(getRuleById('codec-compatibility')?.id).toBe('codec-compatibility')
    expect(getRuleById('audio-codec')?.id).toBe('audio-codec')
    expect(getRuleById('segment-duration')?.id).toBe('segment-duration')
    expect(getRuleById('keyframe-alignment')?.id).toBe('keyframe-alignment')
    expect(getRuleById('bandwidth-attributes')?.id).toBe('bandwidth-attributes')
  })

  it('should return undefined for unknown rule IDs', () => {
    expect(getRuleById('unknown-rule')).toBeUndefined()
  })
})

// ============================================================================
// Bitrate Spacing Rule Tests
// ============================================================================

describe('bitrate-spacing rule', () => {
  it('should return score 100 for perfect ladder', () => {
    const result = bitrateSpacingRule.check(createPerfectContext())
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return partial score for minor spacing issues', () => {
    const result = bitrateSpacingRule.check(createMinorIssuesContext())
    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(result.score).toBeLessThan(100)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.recommendations.some(r => r.type === 'modify_variant')).toBe(true)
  })

  it('should return low score for major spacing issues', () => {
    const result = bitrateSpacingRule.check(createMajorIssuesContext())
    expect(result.score).toBeLessThanOrEqual(40)
    expect(result.passed).toBe(false)
    expect(result.recommendations.some(r => r.type === 'add_variant')).toBe(true)
  })

  it('should handle edge cases gracefully', () => {
    const emptyResult = bitrateSpacingRule.check(createEdgeCaseContext())
    expect(emptyResult.score).toBe(0)
    expect(emptyResult.passed).toBe(false)

    const singleResult = bitrateSpacingRule.check(createSingleVariantContext())
    expect(singleResult.score).toBeGreaterThanOrEqual(0)
    expect(singleResult.warnings.length).toBeGreaterThanOrEqual(0)
  })
})

// ============================================================================
// Resolution Ladder Rule Tests
// ============================================================================

describe('resolution-ladder rule', () => {
  it('should return score 100 for perfect ladder', () => {
    const result = resolutionLadderRule.check(createPerfectContext())
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return partial score for incomplete resolution ladder', () => {
    const result = resolutionLadderRule.check(createMinorIssuesContext())
    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(result.score).toBeLessThan(100)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('should return low score for major resolution issues', () => {
    const result = resolutionLadderRule.check(createMajorIssuesContext())
    expect(result.score).toBeLessThanOrEqual(50)
    expect(result.passed).toBe(false)
  })

  it('should handle edge cases gracefully', () => {
    const emptyResult = resolutionLadderRule.check(createEdgeCaseContext())
    expect(emptyResult.score).toBe(0)
    expect(emptyResult.passed).toBe(false)

    const singleResult = resolutionLadderRule.check(createSingleVariantContext())
    expect(singleResult.score).toBeGreaterThanOrEqual(0)
  })
})

// ============================================================================
// Codec Compatibility Rule Tests
// ============================================================================

describe('codec-compatibility rule', () => {
  it('should return score 100 for H.264 baseline', () => {
    const result = codecCompatibilityRule.check(createPerfectContext())
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return partial score for non-standard codecs', () => {
    const result = codecCompatibilityRule.check(createMajorIssuesContext())
    expect(result.score).toBeLessThan(100)
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('should handle edge cases gracefully', () => {
    const emptyResult = codecCompatibilityRule.check(createEdgeCaseContext())
    expect(emptyResult.score).toBe(0)
    expect(emptyResult.passed).toBe(false)
  })
})

// ============================================================================
// Audio Codec Rule Tests
// ============================================================================

describe('audio-codec rule', () => {
  it('should return score 100 for AAC audio', () => {
    const result = audioCodecRule.check(createPerfectContext())
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return low score when no audio variants', () => {
    const result = audioCodecRule.check(createMajorIssuesContext())
    expect(result.score).toBeLessThanOrEqual(50)
    expect(result.passed).toBe(false)
    expect(result.recommendations.some(r => r.message.includes('audio'))).toBe(true)
  })

  it('should handle edge cases gracefully', () => {
    const emptyResult = audioCodecRule.check(createEdgeCaseContext())
    expect(emptyResult.score).toBe(0)
    expect(emptyResult.passed).toBe(false)
  })
})

// ============================================================================
// Segment Duration Rule Tests
// ============================================================================

describe('segment-duration rule', () => {
  it('should return score 100 for optimal VOD segment duration', () => {
    const result = segmentDurationRule.check(createPerfectContext())
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
  })

  it('should return partial score for suboptimal duration', () => {
    const result = segmentDurationRule.check(createMinorIssuesContext())
    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(result.score).toBeLessThan(100)
  })

  it('should return lower score for live streams with long segments', () => {
    const result = segmentDurationRule.check(createMajorIssuesContext())
    expect(result.score).toBeLessThanOrEqual(70)
  })

  it('should handle edge cases gracefully', () => {
    const emptyResult = segmentDurationRule.check(createEdgeCaseContext())
    expect(emptyResult.score).toBe(0)
    expect(emptyResult.passed).toBe(false)
  })
})

// ============================================================================
// Keyframe Alignment Rule Tests
// ============================================================================

describe('keyframe-alignment rule', () => {
  it('should return score 100 when keyframes are aligned', () => {
    const result = keyframeAlignmentRule.check(createPerfectContext())
    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.passed).toBe(true)
  })

  it('should return partial score for misaligned keyframes', () => {
    const result = keyframeAlignmentRule.check(createMinorIssuesContext())
    expect(result.score).toBeGreaterThanOrEqual(60)
  })

  it('should handle edge cases gracefully', () => {
    const emptyResult = keyframeAlignmentRule.check(createEdgeCaseContext())
    expect(emptyResult.score).toBe(0)
    expect(emptyResult.passed).toBe(false)
  })
})

// ============================================================================
// Bandwidth Attributes Rule Tests
// ============================================================================

describe('bandwidth-attributes rule', () => {
  it('should return score 100 for proper bandwidth attributes', () => {
    const result = bandwidthAttributesRule.check(createPerfectContext())
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
  })

  it('should return partial score for missing average-bandwidth', () => {
    const context = createPerfectContext()
    context.ladder.video = context.ladder.video.map(v => ({ ...v, averageBandwidth: undefined }))
    const result = bandwidthAttributesRule.check(context)
    expect(result.score).toBeGreaterThanOrEqual(60)
    expect(result.score).toBeLessThan(100)
  })

  it('should handle edge cases gracefully', () => {
    const emptyResult = bandwidthAttributesRule.check(createEdgeCaseContext())
    expect(emptyResult.score).toBe(0)
    expect(emptyResult.passed).toBe(false)
  })
})
