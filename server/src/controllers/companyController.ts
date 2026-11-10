import { Request, Response } from 'express';
import { jobRepository } from '../repositories/jobRepository.js';
import { applicationRepository } from '../repositories/applicationRepository.js';

export async function getMyJobs(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(403).json({ error: 'No associated company profile.' });
      return;
    }
    const jobs = await jobRepository.findByCompanyId(companyId);
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getCompanyApplicants(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(403).json({ error: 'No associated company profile.' });
      return;
    }
    const apps = await applicationRepository.findByCompanyId(companyId);
    res.json(apps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getJobApplicants(req: Request, res: Response): Promise<void> {
  try {
    const jobId = parseInt(req.params.jobId as string, 10);
    const job = await jobRepository.findById(jobId);
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (req.user?.role === 'company' && job.company_id !== req.user.companyId) {
      res.status(403).json({ error: 'Unauthorized to view applicants for another company.' });
      return;
    }

    const apps = await applicationRepository.findByJobId(jobId);
    res.json(apps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

