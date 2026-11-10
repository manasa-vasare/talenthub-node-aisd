import { Request, Response } from 'express';
import { interviewService } from '../services/interviewService.js';

export async function scheduleRound(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { application_id, round_no, scheduled_at, venue, notes } = req.body;
    if (!application_id || !round_no || !scheduled_at || !venue) {
      res.status(400).json({ error: 'application_id, round_no, scheduled_at, and venue are required.' });
      return;
    }

    const slot = await interviewService.scheduleRound(
      {
        application_id: Number(application_id),
        round_no: Number(round_no),
        scheduled_at,
        venue,
        notes,
      },
      req.user
    );

    res.status(201).json(slot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateResult(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const slotId = parseInt(req.params.id as string, 10);
    const { passed, notes } = req.body;

    const slot = await interviewService.updateResult(
      slotId,
      {
        passed: passed !== undefined ? Boolean(passed) : null,
        notes,
      },
      req.user
    );

    res.json(slot);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getByApplication(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const appId = parseInt(req.params.applicationId as string, 10);
    const slots = await interviewService.getSlotsByApplication(appId, req.user);
    res.json(slots);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

