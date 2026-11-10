import { applicationRepository } from '../repositories/applicationRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { jobRepository } from '../repositories/jobRepository.js';
import { eligibilityRepository } from '../repositories/eligibilityRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { checkEligibility } from '../algorithms/checkEligibility.js';
import { withTransaction } from '../db/connection.js';
import { Application, ApplicationStatus, JWTPayload } from '../types/index.js';
import { realtime } from '../realtime/index.js';

export class ApplicationService {
  async applyForJob(
    studentId: number,
    jobId: number,
    actor: JWTPayload
  ): Promise<{ success: boolean; reason?: string; application?: Application }> {
    // 1. Verify student exists and check consent (FR-10.1, NFR-4.1)
    const student = await studentRepository.findById(studentId);
    if (!student) {
      return { success: false, reason: 'Student profile not found.' };
    }

    if (!student.consent_given) {
      return {
        success: false,
        reason: 'Student consent is required before submitting applications (FR-10.1).',
      };
    }

    // 2. Verify job exists and is open (FR-5.1)
    const job = await jobRepository.findById(jobId);
    if (!job) {
      return { success: false, reason: 'Job listing not found.' };
    }

    if (!job.is_open) {
      return { success: false, reason: 'Job drive is currently closed for applications.' };
    }

    // 3. Check existing application for this job (FR-5.2)
    const existingJobApp = await applicationRepository.findByStudentAndJob(studentId, jobId);
    if (existingJobApp) {
      return { success: false, reason: 'You have already applied to this job.' };
    }

    // 4. Check "same company once per season" rule (FR-5.3)
    const companySeasonApp = await applicationRepository.findStudentApplicationForCompanyInSeason(
      studentId,
      job.company_id,
      job.season
    );
    if (companySeasonApp) {
      return {
        success: false,
        reason: `Placement Policy: Only one application per company (${job.company_name}) is permitted per season (${job.season}).`,
      };
    }

    // 5. Run critical checkEligibility algorithm (FR-4.1 to FR-4.5)
    const eligibility = checkEligibility(
      {
        cgpa: Number(student.cgpa),
        active_backlogs: student.active_backlogs,
        branch: student.branch,
        has_accepted_offer: student.has_accepted_offer,
      },
      {
        min_cgpa: Number(job.min_cgpa),
        max_backlogs: job.max_backlogs,
        allowed_branches: job.allowed_branches || [],
      }
    );

    // 6. Record eligibility decision in eligibility_decisions (FR-6.3, NFR-9.3)
    await eligibilityRepository.upsertDecision({
      student_id: studentId,
      job_id: jobId,
      eligible: eligibility.eligible,
      reason: eligibility.reason,
    });

    if (!eligibility.eligible) {
      return { success: false, reason: eligibility.reason };
    }

    // 7. Atomic application creation and status audit log
    const application = await withTransaction(async (tx) => {
      const app = await applicationRepository.create(studentId, jobId, tx);
      await auditRepository.logStatusChange(
        {
          application_id: app.id,
          from_status: null,
          to_status: 'APPLIED',
          changed_by: actor.userId,
        },
        tx
      );
      return app;
    });

    const fullApp = await applicationRepository.findById(application.id);

    // Broadcast real-time event
    realtime.broadcast('APPLICATION_CREATED', fullApp);

    return { success: true, application: fullApp || application };
  }

  async updateStatus(
    applicationId: number,
    newStatus: ApplicationStatus,
    actor: JWTPayload
  ): Promise<Application> {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new Error(`Application #${applicationId} not found`);
    }

    // Authorization & isolation checks
    if (actor.role === 'company') {
      if (app.company_id !== actor.companyId) {
        throw new Error('Unauthorized: You can only update applications for your own company.');
      }
      if (newStatus === 'ACCEPTED') {
        throw new Error('Only the candidate can accept an offer.');
      }
    } else if (actor.role === 'student') {
      if (app.student_id !== actor.studentId) {
        throw new Error('Unauthorized: You can only view and update your own applications.');
      }
      if (newStatus !== 'ACCEPTED') {
        throw new Error('Students can only accept offers.');
      }
    }

    const previousStatus = app.status;

    const updated = await withTransaction(async (tx) => {
      const result = await applicationRepository.updateStatus(applicationId, newStatus, tx);
      if (!result) {
        throw new Error('Failed to update application status');
      }

      await auditRepository.logStatusChange(
        {
          application_id: applicationId,
          from_status: previousStatus,
          to_status: newStatus,
          changed_by: actor.userId,
        },
        tx
      );

      return result;
    });

    const fullApp = await applicationRepository.findById(applicationId);
    realtime.broadcast('APPLICATION_STATUS_UPDATED', fullApp);
    return fullApp || updated;
  }
}

export const applicationService = new ApplicationService();

