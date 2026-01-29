import type { LadderResult, LadderVariant } from '../../types/analysis'
import type { Recommendation } from '../../types/scoring'

/**
 * Generate an optimized ladder by applying recommendations to the original
 *
 * @param originalLadder - The original ladder from analysis
 * @param recommendations - Consolidated recommendations to apply
 * @returns Optimized ladder with changes applied
 */
export function generateOptimizedLadder(
  originalLadder: LadderResult,
  recommendations: Recommendation[]
): LadderResult {
  // Start with deep copy of original ladder
  const optimized: LadderResult = {
    video: originalLadder.video.map((v) => ({ ...v })),
    audio: originalLadder.audio.map((a) => ({ ...a })),
  }

  // Separate recommendations by type
  const addRecommendations = recommendations.filter(
    (r) => r.type === 'add_variant'
  )
  const removeRecommendations = recommendations.filter(
    (r) => r.type === 'remove_variant'
  )
  const modifyRecommendations = recommendations.filter(
    (r) => r.type === 'modify_variant'
  )

  // Apply modifications first
  for (const rec of modifyRecommendations) {
    if (rec.variant?.index !== undefined) {
      const index = rec.variant.index
      if (index >= 0 && index < optimized.video.length) {
        optimized.video[index] = applyVariantChange(
          optimized.video[index],
          rec.variant.suggested || {}
        )
      }
    }
  }

  // Apply removals (in reverse order to maintain indices)
  const indicesToRemove = removeRecommendations
    .map((r) => r.variant?.index)
    .filter((i): i is number => i !== undefined)
    .sort((a, b) => b - a) // Sort descending

  for (const index of indicesToRemove) {
    if (index >= 0 && index < optimized.video.length) {
      optimized.video.splice(index, 1)
    }
  }

  // Apply additions
  for (const rec of addRecommendations) {
    if (rec.variant?.suggested) {
      const newVariant: LadderVariant = {
        bitrate: rec.variant.suggested.bitrate || 0,
        averageBandwidth: rec.variant.suggested.averageBandwidth,
        resolution: rec.variant.suggested.resolution,
        codecs: rec.variant.suggested.codecs || [],
        frameRate: rec.variant.suggested.frameRate,
      }
      optimized.video.push(newVariant)
    }
  }

  // Ensure ladder remains valid:
  // 1. Sort by bitrate descending
  optimized.video.sort((a, b) => b.bitrate - a.bitrate)

  // 2. Remove duplicates (same bitrate and resolution)
  optimized.video = optimized.video.filter((variant, index, self) =>
    index ===
    self.findIndex(
      (v) =>
        v.bitrate === variant.bitrate &&
        v.resolution?.width === variant.resolution?.width &&
        v.resolution?.height === variant.resolution?.height
    )
  )

  // 3. Ensure at least one variant remains
  if (optimized.video.length === 0 && originalLadder.video.length > 0) {
    // Restore the highest bitrate variant from original
    optimized.video = [originalLadder.video[0]]
  }

  return optimized
}

/**
 * Apply a change to a variant, returning a new variant object
 *
 * @param variant - Original variant
 * @param change - Partial changes to apply
 * @returns New variant with changes applied
 */
export function applyVariantChange(
  variant: LadderVariant,
  change: Partial<LadderVariant>
): LadderVariant {
  return {
    ...variant,
    ...change,
    // Deep merge resolution if provided
    resolution:
      change.resolution !== undefined
        ? change.resolution
        : variant.resolution,
    // Merge codecs arrays if provided
    codecs:
      change.codecs !== undefined ? change.codecs : [...variant.codecs],
  }
}
