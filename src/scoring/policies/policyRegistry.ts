import type { ScoringPolicy } from './basePolicy'
import { appleHlsPolicy } from './appleHLS'
import { googleVP9Policy } from './googleVP9'
import { genericPolicy } from './generic'

/**
 * All available scoring policies
 */
const policies: ScoringPolicy[] = [
  appleHlsPolicy,
  googleVP9Policy,
  genericPolicy,
]

/**
 * Get all available scoring policies
 * @returns Array of all policy profiles
 */
export function getAllPolicies(): ScoringPolicy[] {
  return [...policies]
}

/**
 * Get a specific policy by its ID
 * @param id - The policy ID to look up
 * @returns The matching policy or undefined if not found
 */
export function getPolicyById(id: string): ScoringPolicy | undefined {
  return policies.find((policy) => policy.id === id)
}

// Re-export individual policies for direct access
export { appleHlsPolicy, googleVP9Policy, genericPolicy }
