// ============================================================================
// TALENT HUB - LAB 7: SQL INJECTION VULNERABILITY DEMONSTRATION & DEFENSE
// Demonstrates:
// 1. Insecure String Concatenation (Vulnerability)
// 2. Parameterized Query (Remediation / Defense)
// ============================================================================

import { query, initDb, closeDb } from '../src/db/connection.js';

async function runSqlInjectionDemo() {
  await initDb();

  console.log('================================================================');
  console.log('   LABORATORY 7: SQL INJECTION (V5) DEMONSTRATION & DEFENSE     ');
  console.log('================================================================\n');

  const maliciousInput = "' OR '1'='1";

  // --------------------------------------------------------------------------
  // PART 1: THE INSECURE IMPLEMENTATION (String Concatenation)
  // --------------------------------------------------------------------------
  console.log('--- 1. INSECURE CODE (String Concatenation) ---');
  console.log('Code: const sql = "SELECT * FROM students WHERE branch = \'" + branch + "\'";');
  
  const insecureSql = "SELECT full_name, usn, branch FROM students WHERE branch = '" + maliciousInput + "'";
  console.log(`Executed SQL query string:\n  >> ${insecureSql}\n`);

  try {
    const insecureResult = await query(insecureSql);
    console.log(`⚠️  VULNERABILITY CONFIRMED: Query returned ${insecureResult.rows.length} students!`);
    console.log('Sample leaked records:');
    insecureResult.rows.slice(0, 3).forEach((s: any) => {
      console.log(`  - [LEAKED] ${s.full_name} (${s.usn}) - Branch: ${s.branch}`);
    });
    console.log('>> EXPLANATION: Because \'1\'=\'1\' is always TRUE, the attacker extracted');
    console.log('   ALL students across ALL branches, bypassing access filters completely.\n');
  } catch (err: any) {
    console.error('Insecure query error:', err.message);
  }

  // --------------------------------------------------------------------------
  // PART 2: THE SECURE IMPLEMENTATION (Parameterized Query)
  // --------------------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('--- 2. CORRECTED CODE (Parameterized Query / Prepared Statement) ---');
  console.log('Code: await query("SELECT * FROM students WHERE branch = $1", [branch]);');

  const secureSql = 'SELECT full_name, usn, branch FROM students WHERE branch = $1';
  console.log(`Executed SQL query:\n  >> ${secureSql}\n  >> Parameters: [ "${maliciousInput}" ]\n`);

  try {
    const secureResult = await query(secureSql, [maliciousInput]);
    console.log(`🛡️  DEFENSE VERIFIED: Query returned ${secureResult.rows.length} students.`);
    console.log('>> EXPLANATION: The database treated "\' OR \'1\'=\'1" as a LITERAL string value');
    console.log('   (looking for a branch literally named "\' OR \'1\'=\'1").');
    console.log('   Zero unintended records returned. SQL Injection is 100% PREVENTED!\n');
  } catch (err: any) {
    console.error('Secure query error:', err.message);
  }

  console.log('================================================================');
  console.log('   DEMONSTRATION COMPLETE: VULNERABILITY VALIDATED & DEFENDED   ');
  console.log('================================================================');

  await closeDb();
}

runSqlInjectionDemo().catch(console.error);
