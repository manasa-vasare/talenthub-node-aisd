// ============================================================================
// TALENT HUB - UNIT TESTS FOR checkEligibility ALGORITHM
// Verification of all Lab 4 Part B scenarios and edge cases
// ============================================================================

import { checkEligibility } from '../src/algorithms/checkEligibility.js';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, actual?: any, expected?: any) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (actual !== undefined) console.error(`    Actual:  `, actual);
    if (expected !== undefined) console.error(`    Expected:`, expected);
    failedCount++;
  }
}

console.log('--- RUNNING ELIGIBILITY ALGORITHM TESTS (Lab 4 Part B) ---');

// Test 1: Lab 4 Rahul example (CGPA 8.2, 1 active backlog against min 7.0, max 2 backlogs, allowed branch CSE)
{
  const result = checkEligibility(
    { cgpa: 8.2, active_backlogs: 1, branch: 'CSE', has_accepted_offer: false },
    { min_cgpa: 7.0, max_backlogs: 2, allowed_branches: ['CSE', 'ECE'] }
  );
  assert(result.eligible === true, 'Rahul passes all criteria', result);
}

// Test 2: R1 failure - CGPA below minimum (6.49 vs 6.50)
{
  const result = checkEligibility(
    { cgpa: 6.49, active_backlogs: 0, branch: 'CSE', has_accepted_offer: false },
    { min_cgpa: 6.50, max_backlogs: 0, allowed_branches: ['CSE'] }
  );
  assert(result.eligible === false && result.reason.includes('CGPA 6.49 below minimum 6.50'), 'R1 fails for 6.49 against 6.50', result);
}

// Test 3: R1 boundary edge case - CGPA exactly equal to minimum (6.50 vs 6.50)
{
  const result = checkEligibility(
    { cgpa: 6.50, active_backlogs: 0, branch: 'CSE', has_accepted_offer: false },
    { min_cgpa: 6.50, max_backlogs: 0, allowed_branches: ['CSE'] }
  );
  assert(result.eligible === true, 'R1 boundary: exact CGPA passes', result);
}

// Test 4: R1 boundary edge case - CGPA just above minimum (6.51 vs 6.50)
{
  const result = checkEligibility(
    { cgpa: 6.51, active_backlogs: 0, branch: 'CSE', has_accepted_offer: false },
    { min_cgpa: 6.50, max_backlogs: 0, allowed_branches: ['CSE'] }
  );
  assert(result.eligible === true, 'R1 boundary: 6.51 against 6.50 passes', result);
}

// Test 5: R2 failure - active backlogs exceed maximum allowed (1 backlog on 0-backlog drive)
{
  const result = checkEligibility(
    { cgpa: 9.0, active_backlogs: 1, branch: 'CSE', has_accepted_offer: false },
    { min_cgpa: 7.0, max_backlogs: 0, allowed_branches: ['CSE'] }
  );
  assert(result.eligible === false && result.reason.includes('1 active backlogs, maximum 0'), 'R2 fails for 1 backlog against max 0', result);
}

// Test 6: R2 boundary - active backlogs equal to max_backlogs (2 backlogs against max 2)
{
  const result = checkEligibility(
    { cgpa: 7.5, active_backlogs: 2, branch: 'ECE', has_accepted_offer: false },
    { min_cgpa: 7.0, max_backlogs: 2, allowed_branches: ['ECE'] }
  );
  assert(result.eligible === true, 'R2 boundary: active backlogs equal max passes', result);
}

// Test 7: R3 failure - student has already accepted an offer this season
{
  const result = checkEligibility(
    { cgpa: 9.5, active_backlogs: 0, branch: 'ISE', has_accepted_offer: true },
    { min_cgpa: 6.0, max_backlogs: 0, allowed_branches: ['ISE'] }
  );
  assert(result.eligible === false && result.reason === 'Already accepted an offer this season', 'R3 fails when has_accepted_offer is true', result);
}

// Test 8: R4 failure - branch not allowed
{
  const result = checkEligibility(
    { cgpa: 8.5, active_backlogs: 0, branch: 'MECH', has_accepted_offer: false },
    { min_cgpa: 6.0, max_backlogs: 0, allowed_branches: ['CSE', 'ISE'] }
  );
  assert(result.eligible === false && result.reason === 'Branch MECH not in drive scope', 'R4 fails when branch is not in scope', result);
}

// Test 9: R4 edge case - empty allowed branches list means open to ALL branches
{
  const result = checkEligibility(
    { cgpa: 8.5, active_backlogs: 0, branch: 'CIVIL', has_accepted_offer: false },
    { min_cgpa: 6.0, max_backlogs: 0, allowed_branches: [] }
  );
  assert(result.eligible === true, 'R4: empty allowed branches list permits all branches', result);
}

// Test 10: Rule ordering precedence - CGPA failure precedes backlog failure (FR-4.2)
{
  const result = checkEligibility(
    { cgpa: 5.0, active_backlogs: 3, branch: 'CIVIL', has_accepted_offer: true },
    { min_cgpa: 7.0, max_backlogs: 0, allowed_branches: ['CSE'] }
  );
  assert(result.eligible === false && result.reason.includes('CGPA 5.00 below minimum 7.00'), 'Rule precedence: R1 triggers before R2, R3, R4', result);
}

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed.`);
if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('All algorithm tests passed successfully!');
}

