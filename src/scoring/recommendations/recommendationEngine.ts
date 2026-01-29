import type { Recommendation } from '../../types/scoring'

/**
 * Consolidate recommendations by deduplicating and sorting
 *
 * @param recommendations - Array of recommendations from all rules
 * @returns Consolidated array with duplicates removed and sorted by severity
 */
export function consolidateRecommendations(
  recommendations: Recommendation[]
): Recommendation[] {
  // 1. Deduplicate by id, keeping highest severity if duplicates
  const seen = new Map<string, Recommendation>()

  for (const rec of recommendations) {
    const existing = seen.get(rec.id)
    if (!existing || severityRank(rec.severity) > severityRank(existing.severity)) {
      seen.set(rec.id, rec)
    }
  }

  // 2. Convert back to array
  let consolidated = Array.from(seen.values())

  // 3. Sort by severity: critical first, then warning, then suggestion
  consolidated.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))

  // 4. Group by type (add_variant, remove_variant, modify_variant, general)
  // This maintains severity order within each type group
  const typeOrder: Record<string, number> = {
    add_variant: 0,
    remove_variant: 1,
    modify_variant: 2,
    general: 3,
  }

  consolidated.sort((a, b) => {
    // First sort by severity
    const severityDiff = severityRank(b.severity) - severityRank(a.severity)
    if (severityDiff !== 0) return severityDiff

    // Then by type
    return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99)
  })

  return consolidated
}

/**
 * Merge similar recommendations targeting the same variant
 *
 * @param recs - Array of recommendations
 * @returns Array with similar recommendations merged
 */
export function mergeSimilarRecommendations(
  recs: Recommendation[]
): Recommendation[] {
  const merged: Recommendation[] = []
  const modifyGroups = new Map<number, Recommendation[]>()

  // Group modify_variant recommendations by variant index
  for (const rec of recs) {
    if (rec.type === 'modify_variant' && rec.variant?.index !== undefined) {
      const index = rec.variant.index
      const group = modifyGroups.get(index) || []
      group.push(rec)
      modifyGroups.set(index, group)
    } else {
      merged.push(rec)
    }
  }

  // Merge recommendations within each group
  for (const [, group] of modifyGroups) {
    if (group.length <= 1) {
      merged.push(...group)
      continue
    }

    // Merge all modify recommendations for this variant
    const baseRec = group[0]
    const mergedRec: Recommendation = {
      ...baseRec,
      message: `Multiple improvements for variant ${baseRec.variant!.index}`,
      details: group.map((r) => r.message).join('; '),
      variant: {
        index: baseRec.variant!.index,
        current: mergeVariantChanges(
          group.map((r) => r.variant?.current)
        ),
        suggested: mergeVariantChanges(
          group.map((r) => r.variant?.suggested)
        ),
      },
    }

    merged.push(mergedRec)
  }

  return merged
}

/**
 * Helper to rank severity for sorting
 */
function severityRank(severity: string): number {
  switch (severity) {
    case 'critical':
      return 3
    case 'warning':
      return 2
    case 'suggestion':
      return 1
    default:
      return 0
  }
}

/**
 * Helper to merge variant changes
 */
function mergeVariantChanges(
  changes: (Partial<{
    bitrate?: number
    resolution?: { width: number; height: number }
    codecs?: string[]
    frameRate?: number
  }> | undefined)[]
): Partial<{
  bitrate?: number
  resolution?: { width: number; height: number }
  codecs?: string[]
  frameRate?: number
}> {
  const merged: Partial<{
    bitrate?: number
    resolution?: { width: number; height: number }
    codecs?: string[]
    frameRate?: number
  }> = {}

  for (const change of changes) {
    if (!change) continue

    if (change.bitrate !== undefined) {
      merged.bitrate = change.bitrate
    }
    if (change.resolution !== undefined) {
      merged.resolution = change.resolution
    }
    if (change.codecs !== undefined) {
      merged.codecs = change.codecs
    }
    if (change.frameRate !== undefined) {
      merged.frameRate = change.frameRate
    }
  }

  return merged
}
