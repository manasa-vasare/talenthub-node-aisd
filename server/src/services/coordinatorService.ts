import { jobRepository } from '../repositories/jobRepository.js';
import { applicationRepository } from '../repositories/applicationRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { eligibilityRepository } from '../repositories/eligibilityRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { offerRepository } from '../repositories/offerRepository.js';
import { checkEligibility } from '../algorithms/checkEligibility.js';
import { withTransaction, query } from '../db/connection.js';
import { JWTPayload, ApplicationStatusLog, Branch, VALID_BRANCHES } from '../types/index.js';
import { realtime } from '../realtime/index.js';

export class CoordinatorService {
  async bulkShortlist(
    jobId: number,
    actor: JWTPayload
  ): Promise<{
    jobId: number;
    processed: number;
    shortlisted: number;
    ineligible: number;
    details: { studentName: string; usn: string; eligible: boolean; reason: string }[];
  }> {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new Error('Job listing not found');
    }

    const applications = await applicationRepository.findByJobId(jobId);
    const appliedApps = applications.filter((a) => a.status === 'APPLIED');

    let shortlistedCount = 0;
    let ineligibleCount = 0;
    const details: { studentName: string; usn: string; eligible: boolean; reason: string }[] = [];

    for (const app of appliedApps) {
      const student = await studentRepository.findById(app.student_id);
      if (!student) continue;

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

      // Persist eligibility decision (FR-6.3, NFR-9.3)
      await eligibilityRepository.upsertDecision({
        student_id: student.id,
        job_id: job.id,
        eligible: eligibility.eligible,
        reason: eligibility.reason,
      });

      details.push({
        studentName: student.full_name,
        usn: student.usn,
        eligible: eligibility.eligible,
        reason: eligibility.reason,
      });

      if (eligibility.eligible) {
        await withTransaction(async (tx) => {
          await applicationRepository.updateStatus(app.id, 'SHORTLISTED', tx);
          await auditRepository.logStatusChange(
            {
              application_id: app.id,
              from_status: 'APPLIED',
              to_status: 'SHORTLISTED',
              changed_by: actor.userId,
            },
            tx
          );
        });
        shortlistedCount++;
      } else {
        ineligibleCount++;
      }
    }

    realtime.broadcast('APPLICATION_STATUS_UPDATED', {
      bulk: true,
      jobId,
      shortlistedCount,
      ineligibleCount,
    });

    return {
      jobId,
      processed: appliedApps.length,
      shortlisted: shortlistedCount,
      ineligible: ineligibleCount,
      details,
    };
  }

  async getPlacementStats(season?: string) {
    const studentsRes = await query<{
      id: number;
      branch: Branch;
      has_accepted_offer: boolean;
    }>(`SELECT id, branch, has_accepted_offer FROM students`);
    const students = studentsRes.rows;

    const offersRes = await query<{
      id: number;
      package_lpa: number;
      accepted: boolean;
      company_name: string;
      branch: Branch;
    }>(`
      SELECT o.id, o.package_lpa, o.accepted, c.company_name, s.branch
      FROM offers o
      JOIN applications a ON o.application_id = a.id
      JOIN students s ON a.student_id = s.id
      JOIN job_listings j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
    `);
    const offers = offersRes.rows;

    const totalStudents = students.length;
    const placedStudents = students.filter((s) => s.has_accepted_offer).length;
    const placementRate = totalStudents > 0 ? Number(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

    const acceptedOffers = offers.filter((o) => o.accepted);
    const packages = offers.map((o) => Number(o.package_lpa));
    const highestPackage = packages.length > 0 ? Math.max(...packages) : 0;
    const averagePackage =
      packages.length > 0
        ? Number((packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(2))
        : 0;

    // Branch breakdown
    const branchStats = VALID_BRANCHES.map((b) => {
      const branchStudents = students.filter((s) => s.branch === b);
      const branchPlaced = branchStudents.filter((s) => s.has_accepted_offer).length;
      return {
        branch: b,
        total: branchStudents.length,
        placed: branchPlaced,
        percentage:
          branchStudents.length > 0
            ? Number(((branchPlaced / branchStudents.length) * 100).toFixed(1))
            : 0,
      };
    });

    // Company offer counts
    const companyCounts: Record<string, number> = {};
    for (const o of offers) {
      companyCounts[o.company_name] = (companyCounts[o.company_name] || 0) + 1;
    }

    return {
      season: season || 'All Active Seasons',
      totalStudents,
      placedStudents,
      placementRate,
      totalOffers: offers.length,
      acceptedOffersCount: acceptedOffers.length,
      averagePackage,
      highestPackage,
      branchStats,
      companyOffers: Object.entries(companyCounts).map(([company, count]) => ({ company, count })),
    };
  }

  async getAuditLogs(limit: number = 100): Promise<ApplicationStatusLog[]> {
    return await auditRepository.getAllLogs(limit);
  }
}

export const coordinatorService = new CoordinatorService();

