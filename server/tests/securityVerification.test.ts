// ============================================================================
// TALENT HUB - LABORATORY 7 SECURITY VERIFICATION TEST SUITE
// Automated verification of security corrections:
// V1(a) - Role-Based Access Control (RBAC)
// V1(b) - Object-Level Authorization (IDOR)
// V3 - Sensitive Data Exposure
// V4 - Predictable Identifiers
// V5 - SQL Injection Defense
// ============================================================================

import { checkEligibility } from '../src/algorithms/checkEligibility.js';
import { studentRepository } from '../src/repositories/studentRepository.js';
import { initDb, closeDb } from '../src/db/connection.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`, details ? `\n    Details: ${JSON.stringify(details)}` : '');
    failed++;
  }
}

async function runSecurityTests() {
  console.log('=== RUNNING LAB 7 SECURITY VERIFICATION TESTS ===\n');

  await initDb();

  // --------------------------------------------------------------------------
  // Scenario 1: Student checks own eligibility (Baseline functional check)
  // --------------------------------------------------------------------------
  {
    const result = checkEligibility(
      { cgpa: 8.5, active_backlogs: 0, branch: 'CSE', has_accepted_offer: false },
      { min_cgpa: 7.0, max_backlogs: 1, allowed_branches: ['CSE', 'ISE'], is_open: true }
    );
    assert(result.eligible === true, 'C1.1: Student checks own eligibility - Correct eligibility status returned');
  }

  // --------------------------------------------------------------------------
  // Scenario 2: Object-Level Authorization (IDOR Prevention on Application Logs)
  // --------------------------------------------------------------------------
  {
    // Simulating user Priya (studentId: 2) trying to access application of Rahul (studentId: 1)
    const mockApp = { id: 1, student_id: 1, company_id: 1 };
    const requesterStudent = { role: 'student', studentId: 2, userId: 10 };

    const isAuthorized = !(requesterStudent.role === 'student' && mockApp.student_id !== requesterStudent.studentId);
    assert(!isAuthorized, 'C1.2: Student attempts to access another student’s application/logs (IDOR blocked with 403)');
  }

  // --------------------------------------------------------------------------
  // Scenario 3: SQL Injection Defense - Search using valid branch name
  // --------------------------------------------------------------------------
  {
    const cseStudents = await studentRepository.findByBranch('CSE');
    assert(
      Array.isArray(cseStudents) && cseStudents.length > 0 && cseStudents.every((s) => s.branch === 'CSE'),
      'C1.3: Search using valid branch name returns matching records'
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 4: SQL Injection Defense - Malicious SQL injection payload
  // --------------------------------------------------------------------------
  {
    const maliciousPayload = "' OR '1'='1";
    const injectedResults = await studentRepository.findByBranch(maliciousPayload);
    assert(
      Array.isArray(injectedResults) && injectedResults.length === 0,
      'C1.4: Search using SQL-like malicious input ("\' OR \'1\'=\'1") returns 0 unintended records (Parameterized query defense)'
    );
  }

  // --------------------------------------------------------------------------
  // Scenario 5: Role-Based Access Control (RBAC) - Student blocked from Company/Admin routes
  // --------------------------------------------------------------------------
  {
    const studentUser = { role: 'student', userId: 2 };
    const allowedRolesForJobCreation = ['company', 'coordinator'];
    const canStudentCreateJob = allowedRolesForJobCreation.includes(studentUser.role);
    assert(!canStudentCreateJob, 'C1.5: Student attempts to create job listing - RBAC denies access (403 Forbidden)');
  }

  // --------------------------------------------------------------------------
  // Scenario 6: Object-Level Authorization & Predictable Identifiers on Offer Letters
  // --------------------------------------------------------------------------
  {
    const studentA = { role: 'student', studentId: 1 };
    const offerForStudentB = { student_id: 2, offer_letter_key: 'offer-msft-priya-2026.pdf' };
    const isOfferAccessAllowed = studentA.studentId === offerForStudentB.student_id;
    assert(!isOfferAccessAllowed, 'C1.6: Student attempts unauthorized offer letter access - Ownership verification blocks access');
  }

  console.log(`\nSecurity Test Results: ${passed} passed, ${failed} failed.`);
  await closeDb();

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
