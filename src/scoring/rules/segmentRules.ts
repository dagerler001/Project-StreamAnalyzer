import type { AnalysisContext, RuleResult, ScoringRule, Warning, Recommendation } from '../../types/scoring'

// ============================================================================
// Helper Functions
// ============================================================================

function createWarning(severity: Warning['severity'], message: string, hint?: string): Warning {
  return { severity, message, hint }
}

function createRecommendation(
  id: string,
  type: Recommendation['type'],
  severity: Recommendation['severity'],
  message: string,
  details?: string
): Recommendation {
  return { id, type, severity, message, details }
}

function createResult(
  passed: boolean,
  score: number,
  warnings: Warning[] = [],
  recommendations: Recommendation[] = []
): RuleResult {
  return { passed, score, warnings, recommendations }
}

// ============================================================================
// Rule 5: Segment Duration
// ============================================================================

/**
 * Validates segment duration is within recommended range
 * Live streams: shorter segments (2-6s) preferred
 * VOD: longer segments (6-10s) acceptable
 */
export const segmentDurationRule: ScoringRule = {
  id: 'segment-duration',
  name: 'Segment Duration',
  category: 'segment',
  check: (context: AnalysisContext): RuleResult => {
    const { streamType } = context.classification
    
    // Check if sample result is available
    if (!context.sampleResult) {
      return createResult(true, 50, [
        createWarning('info', 'No sample data available for segment duration analysis')
      ])
    }
    
    const { window, bitrateSeries } = context.sampleResult
    
    if (bitrateSeries.length === 0 && window.actualDurationSeconds === 0) {
      return createResult(false, 0, [
        createWarning('error', 'No segment data available')
      ])
    }

    const warnings: Warning[] = []
    const recommendations: Recommendation[] = []
    
    // Calculate average segment duration from bitrate series
    let avgSegmentDuration = 0
    if (bitrateSeries.length > 0) {
      const totalDuration = bitrateSeries.reduce((sum, p) => sum + p.durationSeconds, 0)
      avgSegmentDuration = totalDuration / bitrateSeries.length
    } else {
      // Fallback: estimate from window
      avgSegmentDuration = window.actualDurationSeconds / 5 // Assume 5 segments
    }

    const isLive = streamType === 'live'
    
    // Define ideal ranges
    const liveIdealMin = 2
    const liveIdealMax = 6
    const vodIdealMin = 6
    const vodIdealMax = 10
    
    const idealMin = isLive ? liveIdealMin : vodIdealMin
    const idealMax = isLive ? liveIdealMax : vodIdealMax
    
    let totalScore = 100

    if (avgSegmentDuration < idealMin) {
      // Too short
      const deviation = idealMin - avgSegmentDuration
      totalScore -= Math.min(50, deviation * 20)
      warnings.push(createWarning(
        'warning',
        `Segment duration too short: ${avgSegmentDuration.toFixed(1)}s`,
        `Ideal for ${isLive ? 'live' : 'VOD'}: ${idealMin}-${idealMax}s`
      ))
      recommendations.push(createRecommendation(
        'increase-segment-duration',
        'general',
        'warning',
        `Consider increasing segment duration to ${idealMin}-${idealMax} seconds`
      ))
    } else if (avgSegmentDuration > idealMax) {
      // Too long
      const deviation = avgSegmentDuration - idealMax
      totalScore -= Math.min(40, deviation * 10)
      warnings.push(createWarning(
        'warning',
        `Segment duration too long: ${avgSegmentDuration.toFixed(1)}s`,
        `Ideal for ${isLive ? 'live' : 'VOD'}: ${idealMin}-${idealMax}s`
      ))
      recommendations.push(createRecommendation(
        'decrease-segment-duration',
        'general',
        'warning',
        `Consider decreasing segment duration to ${idealMin}-${idealMax} seconds`
      ))
    }

    // Live streams with very long segments get extra penalty
    if (isLive && avgSegmentDuration > 10) {
      totalScore -= 20
      warnings.push(createWarning(
        'error',
        'Long segments unsuitable for live streaming',
        'Live streams need short segments for low latency'
      ))
      recommendations.push(createRecommendation(
        'reduce-live-segments',
        'general',
        'critical',
        'Reduce segment duration to 2-6 seconds for live streaming'
      ))
    }

    return createResult(
      totalScore >= 70,
      Math.max(0, Math.min(100, Math.round(totalScore))),
      warnings,
      recommendations
    )
  }
}

// ============================================================================
// Rule 6: Keyframe Alignment
// ============================================================================

/**
 * Checks keyframe alignment across variants (important for switching)
 * Validates keyframe interval is reasonable (1-4 seconds)
 */
export const keyframeAlignmentRule: ScoringRule = {
  id: 'keyframe-alignment',
  name: 'Keyframe Alignment',
  category: 'segment',
  check: (context: AnalysisContext): RuleResult => {
    const { video } = context.ladder
    
    if (video.length === 0) {
      return createResult(false, 0, [
        createWarning('error', 'No video variants to check keyframe alignment')
      ])
    }

    const warnings: Warning[] = []
    const recommendations: Recommendation[] = []
    let totalScore = 100

    // Since we don't have actual keyframe data in the current types,
    // we infer from segment duration and frame rate
    // A reasonable keyframe interval is typically 2-4 seconds
    
    // Estimate segment duration from sample result if available
    const segmentDuration = context.sampleResult?.window.actualDurationSeconds && context.sampleResult.window.actualDurationSeconds > 0 
      ? context.sampleResult.window.actualDurationSeconds / 5 
      : video[0]?.frameRate ? 6 : 6 // Default assumption

    // Check frame rates are consistent across variants
    const frameRates = video.map(v => v.frameRate).filter(Boolean) as number[]
    if (frameRates.length > 1) {
      const uniqueFrameRates = new Set(frameRates)
      if (uniqueFrameRates.size > 1) {
        // Mixed frame rates - may cause keyframe alignment issues
        totalScore -= 15
        warnings.push(createWarning(
          'warning',
          'Mixed frame rates across variants',
          'Consistent frame rate helps keyframe alignment'
        ))
        recommendations.push(createRecommendation(
          'consistent-framerate',
          'modify_variant',
          'warning',
          'Consider using consistent frame rate across all variants'
        ))
      }
    }

    // Estimate keyframe interval (typically 2x segment duration or GOP size)
    // Industry standard is 2-4 seconds
    const estimatedKeyframeInterval = segmentDuration
    
    if (estimatedKeyframeInterval > 6) {
      totalScore -= 20
      warnings.push(createWarning(
        'warning',
        `Long estimated keyframe interval: ~${estimatedKeyframeInterval.toFixed(1)}s`,
        'Recommended: 2-4 seconds for smooth switching'
      ))
      recommendations.push(createRecommendation(
        'reduce-keyframe-interval',
        'general',
        'warning',
        'Reduce GOP/keyframe interval to 2-4 seconds'
      ))
    } else if (estimatedKeyframeInterval < 1) {
      totalScore -= 10
      warnings.push(createWarning(
        'info',
        `Short keyframe interval: ~${estimatedKeyframeInterval.toFixed(1)}s`,
        'May increase bitrate unnecessarily'
      ))
    }

    // Check we have multiple variants (keyframe alignment matters more)
    if (video.length === 1) {
      totalScore = Math.max(50, totalScore - 10)
      warnings.push(createWarning(
        'info',
        'Single variant - keyframe alignment less critical'
      ))
    }

    return createResult(
      totalScore >= 70,
      Math.max(0, Math.min(100, Math.round(totalScore))),
      warnings,
      recommendations
    )
  }
}

// ============================================================================
// Rule 7: Bandwidth Attributes
// ============================================================================

/**
 * Validates BANDWIDTH and AVERAGE-BANDWIDTH attributes present
 * Checks values are reasonable and consistent
 */
export const bandwidthAttributesRule: ScoringRule = {
  id: 'bandwidth-attributes',
  name: 'Bandwidth Attributes',
  category: 'metadata',
  check: (context: AnalysisContext): RuleResult => {
    const { video } = context.ladder
    
    if (video.length === 0) {
      return createResult(false, 0, [
        createWarning('error', 'No video variants to check bandwidth attributes')
      ])
    }

    const warnings: Warning[] = []
    const recommendations: Recommendation[] = []
    let totalScore = 100

    let missingBandwidth = 0
    let missingAvgBandwidth = 0
    let inconsistentCount = 0

    video.forEach((v, i) => {
      // Check BANDWIDTH (required)
      if (!v.bitrate || v.bitrate === 0) {
        missingBandwidth++
        warnings.push(createWarning(
          'error',
          `Variant ${i + 1}: Missing BANDWIDTH attribute`
        ))
        recommendations.push(createRecommendation(
          `add-bandwidth-${i}`,
          'modify_variant',
          'critical',
          `Add BANDWIDTH attribute to variant ${i + 1}`
        ))
      }

      // Check AVERAGE-BANDWIDTH (recommended)
      if (!v.averageBandwidth) {
        missingAvgBandwidth++
      } else {
        // Check consistency: average should be <= peak
        if (v.averageBandwidth > v.bitrate * 1.1) {
          inconsistentCount++
          warnings.push(createWarning(
            'warning',
            `Variant ${i + 1}: AVERAGE-BANDWIDTH exceeds BANDWIDTH`,
            'Average bandwidth should typically be less than or equal to peak bandwidth'
          ))
          recommendations.push(createRecommendation(
            `fix-bandwidth-${i}`,
            'modify_variant',
            'warning',
            `Correct AVERAGE-BANDWIDTH for variant ${i + 1}`
          ))
        }
      }
    })

    // Penalties
    if (missingBandwidth > 0) {
      totalScore -= missingBandwidth * 25
    }

    if (missingAvgBandwidth > 0) {
      // AVERAGE-BANDWIDTH is recommended but not required
      totalScore -= (missingAvgBandwidth / video.length) * 20
      if (missingAvgBandwidth === video.length) {
        warnings.push(createWarning(
          'warning',
          'AVERAGE-BANDWIDTH not specified for any variant',
          'Recommended for better bitrate prediction'
        ))
        recommendations.push(createRecommendation(
          'add-avg-bandwidth',
          'modify_variant',
          'suggestion',
          'Add AVERAGE-BANDWIDTH attributes for better adaptation'
        ))
      }
    }

    if (inconsistentCount > 0) {
      totalScore -= inconsistentCount * 15
    }

    return createResult(
      totalScore >= 70,
      Math.max(0, Math.min(100, Math.round(totalScore))),
      warnings,
      recommendations
    )
  }
}
