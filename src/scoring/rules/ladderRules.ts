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
// Rule 1: Bitrate Spacing
// ============================================================================

/**
 * Evaluates spacing between consecutive bitrate variants
 * Ideal step: 1.5x to 2x (industry standard)
 */
export const bitrateSpacingRule: ScoringRule = {
  id: 'bitrate-spacing',
  name: 'Bitrate Spacing',
  category: 'ladder',
  check: (context: AnalysisContext): RuleResult => {
    const { video } = context.ladder
    
    if (video.length === 0) {
      return createResult(false, 0, [
        createWarning('error', 'No video variants found in ladder')
      ], [
        createRecommendation('add-variants', 'add_variant', 'critical', 'Add video variants to create a proper ABR ladder')
      ])
    }

    if (video.length === 1) {
      return createResult(true, 50, [
        createWarning('warning', 'Only one video variant - limited ABR capability', 'Consider adding more variants for better adaptation')
      ], [
        createRecommendation('add-more-variants', 'add_variant', 'warning', 'Add more variants to improve ABR ladder')
      ])
    }

    // Sort by bitrate descending
    const sorted = [...video].sort((a, b) => b.bitrate - a.bitrate)
    const warnings: Warning[] = []
    const recommendations: Recommendation[] = []
    let totalScore = 100

    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]
      const ratio = current.bitrate / next.bitrate

      if (ratio < 1.3) {
        // Step too small
        const penalty = Math.min(30, (1.3 - ratio) * 100)
        totalScore -= penalty
        warnings.push(createWarning(
          'warning',
          `Bitrate step too small: ${(ratio).toFixed(2)}x between ${current.bitrate / 1000}Kbps and ${next.bitrate / 1000}Kbps`,
          'Ideal step is 1.5x to 2x'
        ))
        recommendations.push(createRecommendation(
          `modify-step-${i}`,
          'modify_variant',
          'warning',
          `Consider increasing gap between ${current.bitrate / 1000}Kbps and ${next.bitrate / 1000}Kbps variants`,
          `Current ratio: ${ratio.toFixed(2)}x, target: 1.5x-2x`
        ))
      } else if (ratio > 3.0) {
        // Step too large
        const penalty = Math.min(40, (ratio - 3.0) * 20)
        totalScore -= penalty
        warnings.push(createWarning(
          'error',
          `Bitrate step too large: ${ratio.toFixed(2)}x between ${current.bitrate / 1000}Kbps and ${next.bitrate / 1000}Kbps`,
          'Large gaps cause poor quality adaptation'
        ))
        recommendations.push(createRecommendation(
          `add-variant-${i}`,
          'add_variant',
          'critical',
          `Add intermediate variant between ${current.bitrate / 1000}Kbps and ${next.bitrate / 1000}Kbps`,
          `Gap of ${ratio.toFixed(2)}x is too large for smooth ABR`
        ))
      } else if (ratio < 1.5 || ratio > 2.5) {
        // Minor deviation from ideal
        const deviation = ratio < 1.5 ? 1.5 - ratio : ratio - 2.0
        const penalty = deviation * 15
        totalScore -= penalty
        warnings.push(createWarning(
          'info',
          `Bitrate step slightly off ideal: ${ratio.toFixed(2)}x`,
          'Target 1.5x-2x for optimal ABR'
        ))
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
// Rule 2: Resolution Ladder
// ============================================================================

/**
 * Standard resolutions for comparison
 */
const STANDARD_RESOLUTIONS = [
  { height: 2160, name: '4K' },
  { height: 1080, name: '1080p' },
  { height: 720, name: '720p' },
  { height: 480, name: '480p' },
  { height: 360, name: '360p' },
  { height: 240, name: '240p' },
]

/**
 * Checks resolution progression matches bitrate progression
 * Validates standard resolutions are present
 */
export const resolutionLadderRule: ScoringRule = {
  id: 'resolution-ladder',
  name: 'Resolution Ladder',
  category: 'ladder',
  check: (context: AnalysisContext): RuleResult => {
    const { video } = context.ladder
    
    if (video.length === 0) {
      return createResult(false, 0, [
        createWarning('error', 'No video variants found')
      ], [
        createRecommendation('add-variants', 'add_variant', 'critical', 'Add video variants with proper resolutions')
      ])
    }

    // Sort by bitrate descending
    const sorted = [...video].sort((a, b) => b.bitrate - a.bitrate)
    const warnings: Warning[] = []
    const recommendations: Recommendation[] = []
    let totalScore = 100

    // Check each variant has resolution
    const missingResolution = sorted.filter(v => !v.resolution)
    if (missingResolution.length > 0) {
      totalScore -= missingResolution.length * 15
      warnings.push(createWarning(
        'error',
        `${missingResolution.length} variant(s) missing resolution information`
      ))
      recommendations.push(createRecommendation(
        'add-resolutions',
        'modify_variant',
        'critical',
        'Add resolution information to all variants'
      ))
    }

    // Check resolution ordering matches bitrate ordering
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]
      
      if (current.resolution && next.resolution) {
        if (current.resolution.height < next.resolution.height) {
          totalScore -= 20
          warnings.push(createWarning(
            'error',
            `Resolution ordering mismatch: ${current.resolution.height}p at ${current.bitrate / 1000}Kbps vs ${next.resolution.height}p at ${next.bitrate / 1000}Kbps`
          ))
          recommendations.push(createRecommendation(
            `fix-order-${i}`,
            'modify_variant',
            'critical',
            'Resolution should decrease with bitrate'
          ))
        }
      }
    }

    // Check for standard resolutions
    const presentHeights = new Set(sorted.map(v => v.resolution?.height).filter(Boolean))
    const expectedResolutions = video.length >= 4 
      ? [1080, 720, 480, 360, 240] 
      : video.length >= 3 
        ? [720, 480, 360] 
        : video.length >= 2 
          ? [720, 480] 
          : [720]
    
    const missingStandards = expectedResolutions.filter(h => !presentHeights.has(h))
    if (missingStandards.length > 0) {
      totalScore -= missingStandards.length * 10
      warnings.push(createWarning(
        'warning',
        `Missing standard resolutions: ${missingStandards.map(h => `${h}p`).join(', ')}`
      ))
      missingStandards.forEach(height => {
        const name = STANDARD_RESOLUTIONS.find(r => r.height === height)?.name || `${height}p`
        recommendations.push(createRecommendation(
          `add-${height}p`,
          'add_variant',
          'warning',
          `Consider adding ${name} variant for better coverage`
        ))
      })
    }

    return createResult(
      totalScore >= 70,
      Math.max(0, Math.min(100, Math.round(totalScore))),
      warnings,
      recommendations
    )
  }
}
