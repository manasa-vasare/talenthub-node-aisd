// ============================================================================
// TALENT HUB - CRITICAL ALGORITHM: checkEligibility
// Part B of Lab 4 AI-Assisted Detailed Design
// Fixed sequential fail-fast order (R1 -> R2 -> R3 -> R4) per FR-4.1 to FR-4.5
// ============================================================================

import {
  EligibilityStudentInput,
  EligibilityJobInput,
  EligibilityResult,
} from '../types/index.js';

/**
 * Checks a student's eligibility for a specific job listing.
 * Evaluates rules sequentially and returns at the first failing rule.
 * Ineligibility is returned as a result object, never thrown as an exception (FR-4.1).
 *
 * @param student - candidate attributes (cgpa, active_backlogs, branch, has_accepted_offer)
 * @param job - drive criteria (min_cgpa, max_backlogs, allowed_branches list)
 * @returns EligibilityResult { eligible: boolean, reason: string }
 */
export function checkEligibility(
  student: EligibilityStudentInput,
  job: EligibilityJobInput
): EligibilityResult {
  // Preconditions validation
  if (student.cgpa < 0 || student.cgpa > 10) {
    return {
      eligible: false,
      reason: `Invalid student CGPA: ${student.cgpa} (must be between 0 and 10)`,
    };
  }

  if (student.active_backlogs < 0) {
    return {
      eligible: false,
      reason: `Invalid active backlogs: ${student.active_backlogs} (cannot be negative)`,
    };
  }

  // R1: CGPA boundary (inclusive: student.cgpa >= job.min_cgpa passes)
  // Number precision comparison with 2 decimal tolerance to avoid IEEE-754 precision issues (e.g. 6.499999)
  const cgpaDiff = Number((student.cgpa - job.min_cgpa).toFixed(2));
  if (cgpaDiff < 0) {
    return {
      eligible: false,
      reason: `CGPA ${student.cgpa.toFixed(2)} below minimum ${job.min_cgpa.toFixed(2)}`,
    };
  }

  // R2: Active backlogs boundary (inclusive: student.active_backlogs <= job.max_backlogs passes)
  // Cleared backlogs are never evaluated per FR-4.2
  if (student.active_backlogs > job.max_backlogs) {
    return {
      eligible: false,
      reason: `${student.active_backlogs} active backlogs, maximum ${job.max_backlogs}`,
    };
  }

  // R3: Season-wide placement policy check (student has not accepted an offer elsewhere)
  if (student.has_accepted_offer === true) {
    return {
      eligible: false,
      reason: 'Already accepted an offer this season',
    };
  }

  // R4: Branch scope check
  // An empty allowed_branches list indicates the job is open to ALL branches (FR-3.3)
  if (job.allowed_branches && job.allowed_branches.length > 0) {
    if (!job.allowed_branches.includes(student.branch)) {
      return {
        eligible: false,
        reason: `Branch ${student.branch} not in drive scope`,
      };
    }
  }

  // All criteria satisfied
  return {
    eligible: true,
    reason: 'All eligibility conditions are met',
  };
}

