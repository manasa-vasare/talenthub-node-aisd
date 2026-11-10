import { query, DbClient } from '../db/connection.js';
import { Student, Branch } from '../types/index.js';

export class StudentRepository {
  async findById(id: number, client?: DbClient): Promise<Student | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Student>(`SELECT * FROM students WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findByUsn(usn: string): Promise<Student | null> {
    const res = await query<Student>(`SELECT * FROM students WHERE usn = $1`, [usn]);
    return res.rows[0] || null;
  }

  async findByEmail(email: string): Promise<Student | null> {
    const res = await query<Student>(`SELECT * FROM students WHERE email = $1`, [email]);
    return res.rows[0] || null;
  }

  async findAll(): Promise<Student[]> {
    const res = await query<Student>(`SELECT * FROM students ORDER BY id ASC`);
    return res.rows;
  }

  async create(data: {
    usn: string;
    full_name: string;
    email: string;
    branch: Branch;
    cgpa: number;
    active_backlogs?: number;
    cleared_backlogs?: number;
    consent_given?: boolean;
  }): Promise<Student> {
    const res = await query<Student>(
      `INSERT INTO students (usn, full_name, email, branch, cgpa, active_backlogs, cleared_backlogs, consent_given, consent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.usn,
        data.full_name,
        data.email,
        data.branch,
        data.cgpa,
        data.active_backlogs ?? 0,
        data.cleared_backlogs ?? 0,
        data.consent_given ?? false,
        data.consent_given ? new Date() : null,
      ]
    );
    return res.rows[0];
  }

  async updateConsent(studentId: number, consentGiven: boolean): Promise<Student | null> {
    const res = await query<Student>(
      `UPDATE students
       SET consent_given = $1, consent_at = $2
       WHERE id = $3
       RETURNING *`,
      [consentGiven, consentGiven ? new Date() : null, studentId]
    );
    return res.rows[0] || null;
  }

  async updateHasAcceptedOffer(studentId: number, hasAccepted: boolean, client?: DbClient): Promise<void> {
    const q = client ? client.query.bind(client) : query;
    await q(
      `UPDATE students
       SET has_accepted_offer = $1
       WHERE id = $2`,
      [hasAccepted, studentId]
    );
  }

  /**
   * GDPR / DPDP Erasure on request (FR-10.2, NFR-4.4).
   * Anonymises the student row in place with unique placeholders
   * so all foreign keys in applications and offers stay valid.
   */
  async anonymize(studentId: number): Promise<Student | null> {
    const anonUsn = `ANON_USN_${studentId}_${Date.now()}`;
    const anonEmail = `erased_${studentId}@anonymized.invalid`;
    const anonName = `Erased Candidate #${studentId}`;

    const res = await query<Student>(
      `UPDATE students
       SET usn = $1, full_name = $2, email = $3, consent_given = false, consent_at = NULL
       WHERE id = $4
       RETURNING *`,
      [anonUsn, anonName, anonEmail, studentId]
    );
    return res.rows[0] || null;
  }
}

export const studentRepository = new StudentRepository();

