import { describe, it, expect } from 'vitest'
import { runScoring } from '../engine/scoreEngine'
import type { AnalysisContext } from '../../types/scoring'

describe('Score Engine Integration', () => {
  const mockContext: AnalysisContext = {
    ladder: {
      video: [
        { bitrate: 5000000, resolution: { width: 1920, height: 1080 }, codecs: ['avc1.640028'] },
        { bitrate: 2500000, resolution: { width: 1280, height: 720 }, codecs: ['avc1.64001f'] },
        { bitrate: 1000000, resolution: { width: 854, height: 480 }, codecs: ['avc1.64001e'] },
      ],
      audio: []
    },
    classification: { playlistType: 'master', streamType: 'vod' },
    sampleResult: {
      window: { startSeconds: 0, endSeconds: 10, actualDurationSeconds: 10, requestedDurationSeconds: 10 },
      bitrateSeries: [],
      codecs: { video: { friendly: ['H.264'], raw: ['avc1.640028'] }, audio: { friendly: ['AAC'], raw: ['mp4a.40.2'] } },
      diagnostics: { warnings: [], errors: [], missingHeaders: 0, segmentCount: 10 },
      reliable: true
    }
  }

  it('should return valid ScoreResult for generic policy', () => {
    const result = runScoring(mockContext, 'generic')
    
    // Check overall score exists and is in valid range
    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(100)
    
    // Check breakdown structure
    expect(result.breakdown).toBeDefined()
    expect(result.breakdown.overall).toBe(result.overall)
    expect(result.breakdown.categories).toBeDefined()
    expect(result.breakdown.categories.ladder).toBeDefined()
    expect(result.breakdown.categories.codec).toBeDefined()
    expect(result.breakdown.categories.segment).toBeDefined()
    expect(result.breakdown.categories.metadata).toBeDefined()
    
    // Check warnings and recommendations arrays exist
    expect(Array.isArray(result.warnings)).toBe(true)
    expect(Array.isArray(result.recommendations)).toBe(true)
    
    // Check ladders exist
    expect(result.originalLadder).toBeDefined()
    expect(result.recommendedLadder).toBeDefined()
    expect(result.originalLadder.video).toHaveLength(3)
  })

  it('should throw error for unknown policy', () => {
    expect(() => runScoring(mockContext, 'unknown-policy')).toThrow('Policy not found: unknown-policy')
  })

  it('should work with apple-hls policy', () => {
    const result = runScoring(mockContext, 'apple-hls')
    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(100)
    expect(result.breakdown).toBeDefined()
  })

  it('should work with google-vp9 policy', () => {
    const result = runScoring(mockContext, 'google-vp9')
    expect(result.overall).toBeGreaterThanOrEqual(0)
    expect(result.overall).toBeLessThanOrEqual(100)
    expect(result.breakdown).toBeDefined()
  })
})
