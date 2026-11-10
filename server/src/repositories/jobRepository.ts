import { query, withTransaction } from '../db/connection.js';
import { JobListing, Branch } from '../types/index.js';

export class JobRepository {
  async findById(id: number): Promise<JobListing | null> {
    const jobRes = await query<JobListing>(
      `SELECT j.*, c.company_name
       FROM job_listings j
       JOIN companies c ON j.company_id = c.id
       WHERE j.id = $1`,
      [id]
    );

    if (!jobRes.rows[0]) return null;

    const branchesRes = await query<{ branch: Branch }>(
      `SELECT branch FROM job_allowed_branches WHERE job_id = $1`,
      [id]
    );

    const job = jobRes.rows[0];
    job.allowed_branches = branchesRes.rows.map((r) => r.branch);
    return job;
  }

  async findAll(season?: string): Promise<JobListing[]> {
    let sql = `
      SELECT j.*, c.company_name
      FROM job_listings j
      JOIN companies c ON j.company_id = c.id
    `;
    const params: any[] = [];
    if (season) {
      sql += ` WHERE j.season = $1`;
      params.push(season);
    }
    sql += ` ORDER BY j.drive_date ASC, j.id DESC`;

    const jobRes = await query<JobListing>(sql, params);
    const jobs = jobRes.rows;

    if (jobs.length === 0) return [];

    // Fetch allowed branches for all jobs
    const branchesRes = await query<{ job_id: number; branch: Branch }>(
      `SELECT job_id, branch FROM job_allowed_branches`
    );

    const branchMap: Record<number, Branch[]> = {};
    for (const b of branchesRes.rows) {
      if (!branchMap[b.job_id]) branchMap[b.job_id] = [];
      branchMap[b.job_id].push(b.branch);
    }

    for (const job of jobs) {
      job.allowed_branches = branchMap[job.id] || [];
    }

    return jobs;
  }

  async findByCompanyId(companyId: number): Promise<JobListing[]> {
    const jobRes = await query<JobListing>(
      `SELECT j.*, c.company_name
       FROM job_listings j
       JOIN companies c ON j.company_id = c.id
       WHERE j.company_id = $1
       ORDER BY j.drive_date DESC, j.id DESC`,
      [companyId]
    );

    const jobs = jobRes.rows;
    if (jobs.length === 0) return [];

    const branchesRes = await query<{ job_id: number; branch: Branch }>(
      `SELECT job_id, branch FROM job_allowed_branches WHERE job_id = ANY($1::int[])`,
      [jobs.map((j) => j.id)]
    );

    const branchMap: Record<number, Branch[]> = {};
    for (const b of branchesRes.rows) {
      if (!branchMap[b.job_id]) branchMap[b.job_id] = [];
      branchMap[b.job_id].push(b.branch);
    }

    for (const job of jobs) {
      job.allowed_branches = branchMap[job.id] || [];
    }

    return jobs;
  }

  async create(data: {
    company_id: number;
    role: string;
    season: string;
    min_cgpa: number;
    max_backlogs: number;
    drive_date: string;
    is_open?: boolean;
    package_lpa?: number | null;
    description?: string | null;
    allowed_branches: Branch[];
  }): Promise<JobListing> {
    return await withTransaction(async (tx) => {
      const res = await tx.query<JobListing>(
        `INSERT INTO job_listings (company_id, role, season, min_cgpa, max_backlogs, drive_date, is_open, package_lpa, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          data.company_id,
          data.role,
          data.season,
          data.min_cgpa,
          data.max_backlogs,
          data.drive_date,
          data.is_open ?? true,
          data.package_lpa ?? null,
          data.description ?? null,
        ]
      );

      const job = res.rows[0];

      if (data.allowed_branches && data.allowed_branches.length > 0) {
        for (const branch of data.allowed_branches) {
          await tx.query(
            `INSERT INTO job_allowed_branches (job_id, branch) VALUES ($1, $2)`,
            [job.id, branch]
          );
        }
      }

      job.allowed_branches = data.allowed_branches || [];
      return job;
    });
  }

  async setOpenStatus(jobId: number, isOpen: boolean): Promise<JobListing | null> {
    const res = await query<JobListing>(
      `UPDATE job_listings
       SET is_open = $1
       WHERE id = $2
       RETURNING *`,
      [isOpen, jobId]
    );
    return res.rows[0] || null;
  }
}

export const jobRepository = new JobRepository();

