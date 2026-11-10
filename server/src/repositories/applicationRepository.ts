import { query, DbClient } from '../db/connection.js';
import { Application, ApplicationStatus } from '../types/index.js';

export class ApplicationRepository {
  async findById(id: number, client?: DbClient): Promise<Application | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Application>(
      `SELECT a.*,
              s.full_name as student_name, s.usn, s.email as student_email, s.branch as student_branch, s.cgpa as student_cgpa, s.active_backlogs as student_backlogs,
              j.role, j.package_lpa, j.company_id,
              c.company_name,
              o.offer_letter_key, o.accepted as offer_accepted
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       LEFT JOIN offers o ON a.id = o.application_id
       WHERE a.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByStudentAndJob(studentId: number, jobId: number, client?: DbClient): Promise<Application | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Application>(
      `SELECT * FROM applications WHERE student_id = $1 AND job_id = $2`,
      [studentId, jobId]
    );
    return res.rows[0] || null;
  }

  /**
   * Enforces FR-5.3: Student can apply to the same company only once per season.
   */
  async findStudentApplicationForCompanyInSeason(
    studentId: number,
    companyId: number,
    season: string,
    client?: DbClient
  ): Promise<Application | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Application>(
      `SELECT a.*
       FROM applications a
       JOIN job_listings j ON a.job_id = j.id
       WHERE a.student_id = $1 AND j.company_id = $2 AND j.season = $3
       LIMIT 1`,
      [studentId, companyId, season]
    );
    return res.rows[0] || null;
  }

  async findByStudentId(studentId: number): Promise<Application[]> {
    const res = await query<Application>(
      `SELECT a.*,
              j.role, j.package_lpa, j.season, j.drive_date,
              c.company_name, c.id as company_id,
              o.id as offer_id, o.offer_letter_key, o.accepted as offer_accepted, o.package_lpa as offered_package
       FROM applications a
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       LEFT JOIN offers o ON a.id = o.application_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [studentId]
    );
    return res.rows;
  }

  async findByJobId(jobId: number): Promise<Application[]> {
    const res = await query<Application>(
      `SELECT a.*,
              s.full_name as student_name, s.usn, s.email as student_email, s.branch as student_branch, s.cgpa as student_cgpa, s.active_backlogs as student_backlogs, s.has_accepted_offer,
              j.role,
              c.company_name,
              o.id as offer_id, o.offer_letter_key, o.accepted as offer_accepted
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       LEFT JOIN offers o ON a.id = o.application_id
       WHERE a.job_id = $1
       ORDER BY a.applied_at ASC`,
      [jobId]
    );
    return res.rows;
  }

  async findByCompanyId(companyId: number): Promise<Application[]> {
    const res = await query<Application>(
      `SELECT a.*,
              s.full_name as student_name, s.usn, s.email as student_email, s.branch as student_branch, s.cgpa as student_cgpa, s.active_backlogs as student_backlogs,
              j.role, j.season,
              c.company_name,
              o.id as offer_id, o.offer_letter_key, o.accepted as offer_accepted
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       LEFT JOIN offers o ON a.id = o.application_id
       WHERE j.company_id = $1
       ORDER BY a.applied_at DESC`,
      [companyId]
    );
    return res.rows;
  }

  async findAll(): Promise<Application[]> {
    const res = await query<Application>(
      `SELECT a.*,
              s.full_name as student_name, s.usn, s.email as student_email, s.branch as student_branch, s.cgpa as student_cgpa, s.active_backlogs as student_backlogs,
              j.role, j.season,
              c.company_name, c.id as company_id,
              o.id as offer_id, o.offer_letter_key, o.accepted as offer_accepted
       FROM applications a
       JOIN students s ON a.student_id = s.id
       JOIN job_listings j ON a.job_id = j.id
       JOIN companies c ON j.company_id = c.id
       LEFT JOIN offers o ON a.id = o.application_id
       ORDER BY a.applied_at DESC`
    );
    return res.rows;
  }

  async create(studentId: number, jobId: number, client?: DbClient): Promise<Application> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Application>(
      `INSERT INTO applications (student_id, job_id, status, applied_at, updated_at)
       VALUES ($1, $2, 'APPLIED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [studentId, jobId]
    );
    return res.rows[0];
  }

  async updateStatus(
    applicationId: number,
    newStatus: ApplicationStatus,
    client?: DbClient
  ): Promise<Application | null> {
    const q = client ? client.query.bind(client) : query;
    const res = await q<Application>(
      `UPDATE applications
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newStatus, applicationId]
    );
    return res.rows[0] || null;
  }
}

export const applicationRepository = new ApplicationRepository();

