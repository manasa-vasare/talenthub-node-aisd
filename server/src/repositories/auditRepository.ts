import { query, DbClient } from '../db/connection.js';
import { ApplicationStatusLog, ApplicationStatus } from '../types/index.js';

export class AuditRepository {
  async logStatusChange(
    data: {
      application_id: number;
      from_status: ApplicationStatus | null;
      to_status: ApplicationStatus;
      changed_by: number;
    },
    client?: DbClient
  ): Promise<ApplicationStatusLog> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<ApplicationStatusLog>(
      `INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, changed_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [data.application_id, data.from_status, data.to_status, data.changed_by]
    );
    return res.rows[0];
  }

  async getLogsByApplicationId(applicationId: number): Promise<ApplicationStatusLog[]> {
    const res = await query<ApplicationStatusLog>(
      `SELECT l.*, u.username as changed_by_username, u.role as changed_by_role
       FROM application_status_log l
       JOIN users u ON l.changed_by = u.id
       WHERE l.application_id = $1
       ORDER BY l.changed_at ASC`,
      [applicationId]
    );
    return res.rows;
  }

  async getAllLogs(limit: number = 100): Promise<ApplicationStatusLog[]> {
    const res = await query<ApplicationStatusLog>(
      `SELECT l.*,
              u.username as changed_by_username, u.role as changed_by_role,
              a.student_id, a.job_id,
              s.full_name as student_name, s.usn,
              j.role,
              c.company_name
       FROM application_status_log l
       JOIN users u ON l.changed_by = u.id
       JOIN applications a ON l.application_id = a.id
       JOIN students s ON a.student_id = s.id
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       ORDER BY l.changed_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}

export const auditRepository = new AuditRepository();

