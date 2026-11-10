import { query, DbClient } from '../db/connection.js';
import { EligibilityDecision } from '../types/index.js';

export class EligibilityRepository {
  async upsertDecision(
    data: {
      student_id: number;
      job_id: number;
      eligible: boolean;
      reason: string;
    },
    client?: DbClient
  ): Promise<EligibilityDecision> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<EligibilityDecision>(
      `INSERT INTO eligibility_decisions (student_id, job_id, eligible, reason, decided_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (student_id, job_id)
       DO UPDATE SET eligible = EXCLUDED.eligible, reason = EXCLUDED.reason, decided_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [data.student_id, data.job_id, data.eligible, data.reason]
    );
    return res.rows[0];
  }

  async getDecision(studentId: number, jobId: number): Promise<EligibilityDecision | null> {
    const res = await query<EligibilityDecision>(
      `SELECT * FROM eligibility_decisions WHERE student_id = $1 AND job_id = $2`,
      [studentId, jobId]
    );
    return res.rows[0] || null;
  }

  async getDecisionsForJob(jobId: number): Promise<EligibilityDecision[]> {
    const res = await query<EligibilityDecision>(
      `SELECT ed.*, s.full_name, s.usn, s.branch, s.cgpa, s.active_backlogs
       FROM eligibility_decisions ed
       JOIN students s ON ed.student_id = s.id
       WHERE ed.job_id = $1
       ORDER BY ed.decided_at DESC`,
      [jobId]
    );
    return res.rows;
  }
}

export const eligibilityRepository = new EligibilityRepository();

