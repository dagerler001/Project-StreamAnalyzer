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
// Codec Detection Helpers
// ============================================================================

function isH264(codec: string): boolean {
  return codec.toLowerCase().startsWith('avc1')
}

function isH265(codec: string): boolean {
  return codec.toLowerCase().startsWith('hvc1') || codec.toLowerCase().startsWith('hev1')
}

function isVP9(codec: string): boolean {
  return codec.toLowerCase().includes('vp09') || codec.toLowerCase() === 'vp9'
}

function isAAC(codec: string): boolean {
  const lower = codec.toLowerCase()
  return lower.startsWith('mp4a') || lower.includes('aac')
}

// ============================================================================
// Rule 3: Codec Compatibility
// ============================================================================

/**
 * Evaluates codec choices for target platform
 * Apple policy: prefer H.264 baseline, H.265 for newer devices
 * Google policy: prefer VP9 where supported
 * Generic: H.264 as safe default
 */
export const codecCompatibilityRule: ScoringRule = {
  id: 'codec-compatibility',
  name: 'Codec Compatibility',
  category: 'codec',
  check: (context: AnalysisContext): RuleResult => {
    const { video } = context.ladder
    
    if (video.length === 0) {
      return createResult(false, 0, [
        createWarning('error', 'No video variants to evaluate codecs')
      ])
    }

    const warnings: Warning[] = []
    const recommendations: Recommendation[] = []
    let totalScore = 100

    // Collect all codecs
    const allCodecs = new Set<string>()
    video.forEach(v => {
      v.codecs.forEach(c => allCodecs.add(c))
    })

    if (allCodecs.size === 0) {
      totalScore = 0
      warnings.push(createWarning('error', 'No codec information found'))
      recommendations.push(createRecommendation(
        'add-codecs',
        'modify_variant',
        'critical',
        'Add CODECS attribute to all variants'
      ))
      return createResult(false, 0, warnings, recommendations)
    }

    // Check for H.264 (baseline compatibility)
    const hasH264 = Array.from(allCodecs).some(isH264)
    const hasH265 = Array.from(allCodecs).some(isH265)
    const hasVP9 = Array.from(allCodecs).some(isVP9)

    if (!hasH264 && !hasH265) {
      // No modern codecs - likely VP9 only or something else
      if (hasVP9) {
        totalScore -= 30
        warnings.push(createWarning(
          'warning',
          'VP9 only - limited compatibility with Apple devices',
          'Consider adding H.264 variants for broader support'
        ))
        recommendations.push(createRecommendation(
          'add-h264',
          'add_variant',
          'warning',
          'Add H.264 variants for Apple device compatibility'
        ))
      } else {
        totalScore -= 50
        warnings.push(createWarning(
          'error',
          'Unrecognized codec(s) - may have compatibility issues',
          `Found: ${Array.from(allCodecs).join(', ')}`
        ))
        recommendations.push(createRecommendation(
          'use-standard-codecs',
          'modify_variant',
          'critical',
          'Use standard codecs (H.264, H.265) for better compatibility'
        ))
      }
    } else if (hasH264) {
      // Has H.264 - good baseline
      if (hasH265) {
        // Bonus for offering both
        totalScore = Math.min(100, totalScore + 5)
      }
    }

    // Check codec consistency across ladder
    const codecTypes = new Set<string>()
    video.forEach(v => {
      v.codecs.forEach(c => {
        if (isH264(c)) codecTypes.add('h264')
        else if (isH265(c)) codecTypes.add('h265')
        else if (isVP9(c)) codecTypes.add('vp9')
        else codecTypes.add('other')
      })
    })

    if (codecTypes.size > 1 && !codecTypes.has('other')) {
      // Mixed H.264/H.265 is acceptable
      if (!codecTypes.has('vp9')) {
        totalScore = Math.min(100, totalScore + 5)
      }
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
// Rule 4: Audio Codec
// ============================================================================

/**
 * Validates audio codec choices (AAC standard)
 * Checks audio-only variant presence for low-bandwidth scenarios
 */
export const audioCodecRule: ScoringRule = {
  id: 'audio-codec',
  name: 'Audio Codec',
  category: 'codec',
  check: (context: AnalysisContext): RuleResult => {
    const { audio } = context.ladder
    
    if (audio.length === 0) {
      return createResult(false, 30, [
        createWarning('error', 'No audio variants found', 'Audio is required for proper playback')
      ], [
        createRecommendation(
          'add-audio',
          'add_variant',
          'critical',
          'Add audio variants to the ladder'
        )
      ])
    }

    const warnings: Warning[] = []
    const recommendations: Recommendation[] = []
    let totalScore = 100

    // Check for AAC codec
    let hasAAC = false
    audio.forEach(a => {
      a.codecs.forEach(c => {
        if (isAAC(c)) hasAAC = true
      })
    })

    if (!hasAAC) {
      totalScore -= 40
      warnings.push(createWarning(
        'warning',
        'Non-AAC audio codec detected',
        'AAC is the industry standard for HLS/DASH'
      ))
      recommendations.push(createRecommendation(
        'use-aac',
        'modify_variant',
        'warning',
        'Consider using AAC for better compatibility'
      ))
    }

    // Check audio bitrate reasonableness
    const audioBitrates = audio.map(a => a.bitrate)
    const avgBitrate = audioBitrates.reduce((a, b) => a + b, 0) / audioBitrates.length
    
    if (avgBitrate > 256000) {
      totalScore -= 15
      warnings.push(createWarning(
        'info',
        `High audio bitrate: ${(avgBitrate / 1000).toFixed(0)}Kbps`,
        'Typical range is 64-192Kbps'
      ))
      recommendations.push(createRecommendation(
        'reduce-audio-bitrate',
        'modify_variant',
        'suggestion',
        'Consider reducing audio bitrate to save bandwidth'
      ))
    } else if (avgBitrate < 64000) {
      totalScore -= 10
      warnings.push(createWarning(
        'info',
        `Low audio bitrate: ${(avgBitrate / 1000).toFixed(0)}Kbps`,
        'May impact audio quality'
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
