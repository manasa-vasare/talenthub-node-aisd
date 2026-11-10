import { Request, Response } from 'express';
import { coordinatorService } from '../services/coordinatorService.js';
import { studentRepository } from '../repositories/studentRepository.js';

export async function bulkShortlist(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const jobId = parseInt(req.params.jobId as string, 10);
    const result = await coordinatorService.bulkShortlist(jobId, req.user);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const season = req.query.season as string | undefined;
    const stats = await coordinatorService.getPlacementStats(season);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string || '100', 10);
    const logs = await coordinatorService.getAuditLogs(limit);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAllStudents(req: Request, res: Response): Promise<void> {
  try {
    const students = await studentRepository.findAll();
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

