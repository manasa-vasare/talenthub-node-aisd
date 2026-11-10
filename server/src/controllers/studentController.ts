import { Request, Response } from 'express';
import { studentService } from '../services/studentService.js';
import { applicationRepository } from '../repositories/applicationRepository.js';
import { interviewRepository } from '../repositories/interviewRepository.js';
import { offerRepository } from '../repositories/offerRepository.js';

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      res.status(403).json({ error: 'No associated student profile.' });
      return;
    }
    const student = await studentService.getProfile(studentId);
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateConsent(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      res.status(403).json({ error: 'No associated student profile.' });
      return;
    }
    const { consent_given } = req.body;
    if (typeof consent_given !== 'boolean') {
      res.status(400).json({ error: 'consent_given must be a boolean.' });
      return;
    }
    const updated = await studentService.updateConsent(studentId, consent_given);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function eraseProfile(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      res.status(403).json({ error: 'No associated student profile.' });
      return;
    }
    const anonymized = await studentService.anonymizeProfile(studentId);
    res.json({
      message: 'Student profile successfully anonymized per GDPR / DPDP right to erasure (FR-10.2).',
      student: anonymized,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMyApplications(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      res.status(403).json({ error: 'No associated student profile.' });
      return;
    }
    const apps = await applicationRepository.findByStudentId(studentId);
    res.json(apps);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMyInterviews(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      res.status(403).json({ error: 'No associated student profile.' });
      return;
    }
    const apps = await applicationRepository.findByStudentId(studentId);
    const slots: any[] = [];
    for (const app of apps) {
      const appSlots = await interviewRepository.findByApplicationId(app.id);
      for (const slot of appSlots) {
        slots.push({
          ...slot,
          job_role: app.role,
          company_name: app.company_name,
          application_status: app.status,
        });
      }
    }
    res.json(slots);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMyOffers(req: Request, res: Response): Promise<void> {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      res.status(403).json({ error: 'No associated student profile.' });
      return;
    }
    const apps = await applicationRepository.findByStudentId(studentId);
    const offers: any[] = [];
    for (const app of apps) {
      const offer = await offerRepository.findByApplicationId(app.id);
      if (offer) {
        offers.push({
          ...offer,
          application_status: app.status,
          role: app.role,
          company_name: app.company_name,
        });
      }
    }
    res.json(offers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

