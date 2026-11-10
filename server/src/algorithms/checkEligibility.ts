// ============================================================================
// TALENT HUB - CRITICAL ALGORITHM: checkEligibility
// Part B & Part E of Lab 4 AI-Assisted Detailed Design
// Evaluates all applicable rules per Alternative B (Student Decision: ACCEPT B)
// Supports full list of failure reasons and inclusive boundary constraints.
// ============================================================================

import {
  EligibilityStudentInput,
  EligibilityJobInput,
  EligibilityResult,
} from '../types/index.js';

/**
 * Checks a student's eligibility for a specific job listing.
 * Evaluates all applicable rules and returns all failure reasons (Lab 4 Part E Alternative B).
 * Ineligibility is returned as a result object, never thrown as an exception (FR-4.1).
 *
 * @param student - candidate attributes (cgpa, active_backlogs, branch, has_accepted_offer)
 * @param job - drive criteria (min_cgpa, max_backlogs, allowed_branches list, is_open)
 * @returns EligibilityResult { eligible: boolean, reason: string, reasons: string[] }
 */
export function checkEligibility(
  student: EligibilityStudentInput,
  job: EligibilityJobInput
): EligibilityResult {
  const reasons: string[] = [];

  // Preconditions validation
  if (student.cgpa < 0 || student.cgpa > 10) {
    reasons.push(`Invalid student CGPA: ${student.cgpa} (must be between 0 and 10)`);
  }

  if (student.active_backlogs < 0) {
    reasons.push(`Invalid active backlogs: ${student.active_backlogs} (cannot be negative)`);
  }

  // Precondition: Job open status (per Lab 4 Part E pseudocode)
  if (job.is_open === false) {
    reasons.push('Job is closed');
  }

  // R1: CGPA boundary (inclusive: student.cgpa >= job.min_cgpa passes)
  // Number precision comparison with 2 decimal tolerance to avoid IEEE-754 precision issues
  const cgpaDiff = Number((student.cgpa - job.min_cgpa).toFixed(2));
  if (cgpaDiff < 0) {
    reasons.push(`CGPA ${student.cgpa.toFixed(2)} below minimum ${job.min_cgpa.toFixed(2)}`);
  }

  // R2: Active backlogs boundary (inclusive: student.active_backlogs <= job.max_backlogs passes)
  // Cleared backlogs are never evaluated per FR-4.2
  if (student.active_backlogs > job.max_backlogs) {
    reasons.push(`${student.active_backlogs} active backlogs, maximum ${job.max_backlogs}`);
  }

  // R3: Season-wide placement policy check (student has not accepted an offer elsewhere)
  if (student.has_accepted_offer === true) {
    reasons.push('Already accepted an offer this season');
  }

  // R4: Branch scope check
  // An empty allowed_branches list indicates the job is open to ALL branches (FR-3.3)
  if (job.allowed_branches && job.allowed_branches.length > 0) {
    if (!job.allowed_branches.includes(student.branch)) {
      reasons.push(`Branch ${student.branch} not in drive scope`);
    }
  }

  const eligible = reasons.length === 0;

  return {
    eligible,
    reasons,
    reason: eligible ? 'All eligibility conditions are met' : reasons[0],
  };
}
