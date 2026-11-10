import { interviewRepository } from '../repositories/interviewRepository.js';
import { applicationRepository } from '../repositories/applicationRepository.js';
import { applicationService } from './applicationService.js';
import { InterviewSlot, JWTPayload } from '../types/index.js';
import { realtime } from '../realtime/index.js';

export class InterviewService {
  async getSlotsByApplication(applicationId: number, actor: JWTPayload): Promise<InterviewSlot[]> {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new Error('Application not found');
    }

    if (actor.role === 'student' && app.student_id !== actor.studentId) {
      throw new Error('Unauthorized');
    }
    if (actor.role === 'company' && app.company_id !== actor.companyId) {
      throw new Error('Unauthorized');
    }

    return await interviewRepository.findByApplicationId(applicationId);
  }

  async scheduleRound(
    data: {
      application_id: number;
      round_no: number;
      scheduled_at: string;
      venue: string;
      notes?: string;
    },
    actor: JWTPayload
  ): Promise<InterviewSlot> {
    const app = await applicationRepository.findById(data.application_id);
    if (!app) {
      throw new Error('Application not found');
    }

    if (actor.role === 'company' && app.company_id !== actor.companyId) {
      throw new Error('Unauthorized: You can only schedule interviews for your own company.');
    }

    // Check existing rounds for application
    const existing = await interviewRepository.findByApplicationId(data.application_id);
    if (existing.some((r) => r.round_no === data.round_no)) {
      throw new Error(`Round #${data.round_no} is already scheduled for this application.`);
    }

    const slot = await interviewRepository.create(data);

    // If application was SHORTLISTED or APPLIED, move to INTERVIEW_SCHEDULED
    if (app.status === 'SHORTLISTED' || app.status === 'APPLIED') {
      await applicationService.updateStatus(data.application_id, 'INTERVIEW_SCHEDULED', actor);
    }

    realtime.broadcast('INTERVIEW_SCHEDULED', { slot, application: app });
    return slot;
  }

  async updateResult(
    slotId: number,
    data: { passed: boolean | null; notes?: string },
    actor: JWTPayload
  ): Promise<InterviewSlot> {
    const slot = await interviewRepository.findById(slotId);
    if (!slot) {
      throw new Error('Interview slot not found');
    }

    const app = await applicationRepository.findById(slot.application_id);
    if (!app) {
      throw new Error('Application not found');
    }

    if (actor.role === 'company' && app.company_id !== actor.companyId) {
      throw new Error('Unauthorized');
    }

    const updated = await interviewRepository.updateResult(slotId, data.passed, data.notes);
    if (!updated) {
      throw new Error('Failed to update slot');
    }

    // If result recorded and app is in INTERVIEW_SCHEDULED, update status to INTERVIEWED
    if (data.passed !== null && app.status === 'INTERVIEW_SCHEDULED') {
      await applicationService.updateStatus(app.id, 'INTERVIEWED', actor);
    }

    realtime.broadcast('INTERVIEW_RESULT_UPDATED', { slot: updated, application: app });
    return updated;
  }
}

export const interviewService = new InterviewService();

