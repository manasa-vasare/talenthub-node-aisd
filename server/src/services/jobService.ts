import { jobRepository } from '../repositories/jobRepository.js';
import { studentRepository } from '../repositories/studentRepository.js';
import { applicationRepository } from '../repositories/applicationRepository.js';
import { checkEligibility } from '../algorithms/checkEligibility.js';
import { JobListing, Branch, EligibilityResult } from '../types/index.js';
import { realtime } from '../realtime/index.js';

export interface JobWithEligibility extends JobListing {
  eligibility?: EligibilityResult;
  has_applied?: boolean;
  application_status?: string;
}

export class JobService {
  async listJobs(season?: string, studentId?: number | null): Promise<JobWithEligibility[]> {
    const jobs = await jobRepository.findAll(season);

    if (!studentId) {
      return jobs;
    }

    const student = await studentRepository.findById(studentId);
    if (!student) {
      return jobs;
    }

    const applications = await applicationRepository.findByStudentId(studentId);
    const appliedJobMap = new Map<number, string>();
    for (const app of applications) {
      appliedJobMap.set(app.job_id, app.status);
    }

    return jobs.map((job) => {
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

      return {
        ...job,
        eligibility,
        has_applied: appliedJobMap.has(job.id),
        application_status: appliedJobMap.get(job.id),
      };
    });
  }

  async getJobById(jobId: number, studentId?: number | null): Promise<JobWithEligibility> {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new Error(`Job #${jobId} not found`);
    }

    if (!studentId) {
      return job;
    }

    const student = await studentRepository.findById(studentId);
    if (!student) {
      return job;
    }

    const application = await applicationRepository.findByStudentAndJob(studentId, jobId);
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

    return {
      ...job,
      eligibility,
      has_applied: !!application,
      application_status: application?.status,
    };
  }

  async createJob(data: {
    company_id: number;
    role: string;
    season: string;
    min_cgpa: number;
    max_backlogs: number;
    drive_date: string;
    package_lpa?: number | null;
    description?: string | null;
    allowed_branches: Branch[];
  }): Promise<JobListing> {
    const job = await jobRepository.create(data);
    realtime.broadcast('JOB_CREATED', job);
    return job;
  }

  async setJobStatus(jobId: number, isOpen: boolean): Promise<JobListing> {
    const job = await jobRepository.setOpenStatus(jobId, isOpen);
    if (!job) {
      throw new Error(`Job #${jobId} not found`);
    }
    return job;
  }
}

export const jobService = new JobService();

