import { query } from '../db/connection.js';
import { InterviewSlot } from '../types/index.js';

export class InterviewRepository {
  async findById(id: number): Promise<InterviewSlot | null> {
    const res = await query<InterviewSlot>(`SELECT * FROM interview_slots WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findByApplicationId(applicationId: number): Promise<InterviewSlot[]> {
    const res = await query<InterviewSlot>(
      `SELECT * FROM interview_slots
       WHERE application_id = $1
       ORDER BY round_no ASC`,
      [applicationId]
    );
    return res.rows;
  }

  async findByJobId(jobId: number): Promise<InterviewSlot[]> {
    const res = await query<InterviewSlot>(
      `SELECT i.*, a.student_id, s.full_name as student_name, s.usn
       FROM interview_slots i
       JOIN applications a ON i.application_id = a.id
       JOIN students s ON a.student_id = s.id
       WHERE a.job_id = $1
       ORDER BY i.scheduled_at ASC`,
      [jobId]
    );
    return res.rows;
  }

  async create(data: {
    application_id: number;
    round_no: number;
    scheduled_at: string;
    venue: string;
    notes?: string;
  }): Promise<InterviewSlot> {
    const res = await query<InterviewSlot>(
      `INSERT INTO interview_slots (application_id, round_no, scheduled_at, venue, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.application_id, data.round_no, data.scheduled_at, data.venue, data.notes || null]
    );
    return res.rows[0];
  }

  async updateResult(id: number, passed: boolean | null, notes?: string): Promise<InterviewSlot | null> {
    const res = await query<InterviewSlot>(
      `UPDATE interview_slots
       SET passed = $1, notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING *`,
      [passed, notes || null, id]
    );
    return res.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const res = await query(`DELETE FROM interview_slots WHERE id = $1`, [id]);
    return res.rowCount > 0;
  }
}

export const interviewRepository = new InterviewRepository();

