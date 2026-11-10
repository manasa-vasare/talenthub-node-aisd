import { Request, Response } from 'express';
import { jobService } from '../services/jobService.js';
import { enforceCompanyScope } from '../middleware/authMiddleware.js';

export async function listJobs(req: Request, res: Response): Promise<void> {
  try {
    const season = req.query.season as string | undefined;
    const studentId = req.user?.role === 'student' ? req.user.studentId : null;
    const jobs = await jobService.listJobs(season, studentId);
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getJob(req: Request, res: Response): Promise<void> {
  try {
    const jobId = parseInt(req.params.id as string, 10);
    const studentId = req.user?.role === 'student' ? req.user.studentId : null;
    const job = await jobService.getJobById(jobId, studentId);
    res.json(job);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

export async function createJob(req: Request, res: Response): Promise<void> {
  try {
    const { role, season, min_cgpa, max_backlogs, drive_date, package_lpa, description, allowed_branches } = req.body;
    let companyId = req.body.company_id;

    if (req.user?.role === 'company') {
      companyId = req.user.companyId;
    }

    if (!companyId) {
      res.status(400).json({ error: 'company_id is required' });
      return;
    }

    if (!enforceCompanyScope(req, res, companyId)) {
      res.status(403).json({ error: 'Unauthorized to post jobs for another company.' });
      return;
    }

    const job = await jobService.createJob({
      company_id: companyId,
      role,
      season,
      min_cgpa: Number(min_cgpa),
      max_backlogs: Number(max_backlogs || 0),
      drive_date,
      package_lpa: package_lpa ? Number(package_lpa) : null,
      description,
      allowed_branches: allowed_branches || [],
    });

    res.status(201).json(job);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function toggleJobStatus(req: Request, res: Response): Promise<void> {
  try {
    const jobId = parseInt(req.params.id as string, 10);
    const { is_open } = req.body;
    if (typeof is_open !== 'boolean') {
      res.status(400).json({ error: 'is_open must be a boolean' });
      return;
    }

    const job = await jobService.getJobById(jobId);
    if (!enforceCompanyScope(req, res, job.company_id)) {
      res.status(403).json({ error: 'Unauthorized to alter this job listing.' });
      return;
    }

    const updated = await jobService.setJobStatus(jobId, is_open);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

