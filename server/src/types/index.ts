// ============================================================================
// TALENT HUB - DOMAIN TYPES & DATA TRANSFER OBJECTS (TypeScript)
// Aligned with 3NF/BCNF Schema & Lab 4 Specifications
// ============================================================================

export type UserRole = 'student' | 'company' | 'coordinator';

export type Branch = 'CSE' | 'ECE' | 'ISE' | 'MECH' | 'CIVIL';

export const VALID_BRANCHES: Branch[] = ['CSE', 'ECE', 'ISE', 'MECH', 'CIVIL'];

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFERED'
  | 'ACCEPTED';

export const APPLICATION_STATUS_FLOW: ApplicationStatus[] = [
  'APPLIED',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEWED',
  'OFFERED',
  'ACCEPTED',
];

// Database Entities
export interface Student {
  id: number;
  usn: string;
  full_name: string;
  email: string;
  branch: Branch;
  cgpa: number;
  active_backlogs: number;
  cleared_backlogs: number;
  has_accepted_offer: boolean;
  consent_given: boolean;
  consent_at: Date | string | null;
  created_at?: Date | string;
}

export interface Company {
  id: number;
  company_name: string;
  description: string | null;
  website: string | null;
  created_at?: Date | string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
  student_id: number | null;
  company_id: number | null;
  created_at?: Date | string;
}

export interface JobListing {
  id: number;
  company_id: number;
  role: string;
  season: string;
  min_cgpa: number;
  max_backlogs: number;
  drive_date: string;
  is_open: boolean;
  package_lpa: number | null;
  description: string | null;
  created_at?: Date | string;
  // Computed / Joined fields
  company_name?: string;
  allowed_branches?: Branch[];
}

export interface JobAllowedBranch {
  job_id: number;
  branch: Branch;
}

export interface Application {
  id: number;
  student_id: number;
  job_id: number;
  status: ApplicationStatus;
  applied_at: Date | string;
  updated_at: Date | string;
  // Computed / Joined fields
  student_name?: string;
  usn?: string;
  student_email?: string;
  student_branch?: Branch;
  student_cgpa?: number;
  student_backlogs?: number;
  role?: string;
  company_name?: string;
  company_id?: number;
  package_lpa?: number | null;
  offer_letter_key?: string | null;
  offer_accepted?: boolean;
}

export interface InterviewSlot {
  id: number;
  application_id: number;
  round_no: number;
  scheduled_at: Date | string;
  venue: string;
  passed: boolean | null;
  notes: string | null;
}

export interface Offer {
  id: number;
  application_id: number;
  package_lpa: number;
  offer_letter_key: string;
  accepted: boolean;
  issued_at: Date | string;
  // Joined fields
  student_name?: string;
  role?: string;
  company_name?: string;
  student_id?: number;
}

export interface ApplicationStatusLog {
  id: number;
  application_id: number;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by: number;
  changed_at: Date | string;
  // Joined
  changed_by_username?: string;
  changed_by_role?: UserRole;
}

export interface EligibilityDecision {
  id: number;
  student_id: number;
  job_id: number;
  eligible: boolean;
  reason: string;
  decided_at: Date | string;
}

// Algorithm Types: checkEligibility
export interface EligibilityStudentInput {
  cgpa: number;
  active_backlogs: number;
  branch: Branch;
  has_accepted_offer: boolean;
}

export interface EligibilityJobInput {
  min_cgpa: number;
  max_backlogs: number;
  allowed_branches: Branch[];
  is_open?: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  reason: string;
  reasons: string[];
}

// Auth Types
export interface JWTPayload {
  userId: number;
  username: string;
  role: UserRole;
  studentId?: number | null;
  companyId?: number | null;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: UserRole;
    studentId: number | null;
    companyId: number | null;
    profile?: Student | Company | null;
  };
}

