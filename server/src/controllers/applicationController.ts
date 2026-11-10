import { Request, Response } from 'express';
import { applicationService } from '../services/applicationService.js';
import { applicationRepository } from '../repositories/applicationRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';

export async function applyForJob(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId || !req.user) {
      res.status(403).json({ error: 'Only authenticated students can apply for jobs.' });
      return;
    }

    const { job_id } = req.body;
    if (!job_id) {
      res.status(400).json({ error: 'job_id is required.' });
      return;
    }

    const result = await applicationService.applyForJob(studentId, parseInt(job_id, 10), req.user);
    if (!result.success) {
      res.status(422).json({
        eligible: false,
        message: 'Application rejected by placement rules.',
        reason: result.reason,
      });
      return;
    }

    res.status(201).json({
      eligible: true,
      message: 'Application submitted successfully!',
      application: result.application,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getApplication(req: Request, res: Response): Promise<void> {
  try {
    const appId = parseInt(req.params.id as string, 10);
    const app = await applicationRepository.findById(appId);
    if (!app) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }

    // Role-based visibility check
    if (req.user?.role === 'student' && app.student_id !== req.user.studentId) {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }
    if (req.user?.role === 'company' && app.company_id !== req.user.companyId) {
      res.status(403).json({ error: 'Unauthorized.' });
      return;
    }

    res.json(app);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getApplicationLogs(req: Request, res: Response): Promise<void> {
  try {
    const appId = parseInt(req.params.id as string, 10);
    const logs = await auditRepository.getLogsByApplicationId(appId);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const appId = parseInt(req.params.id as string, 10);
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'status is required.' });
      return;
    }

    const updated = await applicationService.updateStatus(appId, status, req.user);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
