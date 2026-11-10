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

export interface User {
  id: number;
  username: string;
  role: UserRole;
  studentId: number | null;
  companyId: number | null;
  profile?: any;
}

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
  consent_at: string | null;
}

export interface JobListing {
  id: number;
  company_id: number;
  company_name: string;
  role: string;
  season: string;
  min_cgpa: number;
  max_backlogs: number;
  drive_date: string;
  is_open: boolean;
  package_lpa: number | null;
  description: string | null;
  allowed_branches: Branch[];
  eligibility?: {
    eligible: boolean;
    reason: string;
  };
  has_applied?: boolean;
  application_status?: ApplicationStatus;
}

export interface Application {
  id: number;
  student_id: number;
  job_id: number;
  status: ApplicationStatus;
  applied_at: string;
  updated_at: string;
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
  has_accepted_offer?: boolean;
}

export interface InterviewSlot {
  id: number;
  application_id: number;
  round_no: number;
  scheduled_at: string;
  venue: string;
  passed: boolean | null;
  notes: string | null;
  job_role?: string;
  company_name?: string;
  student_name?: string;
  usn?: string;
}

export interface Offer {
  id: number;
  application_id: number;
  package_lpa: number;
  offer_letter_key: string;
  accepted: boolean;
  issued_at: string;
  student_name?: string;
  role?: string;
  company_name?: string;
  application_status?: ApplicationStatus;
}

export interface StatusLog {
  id: number;
  application_id: number;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by: number;
  changed_at: string;
  changed_by_username: string;
  changed_by_role: UserRole;
  student_name?: string;
  usn?: string;
  role?: string;
  company_name?: string;
}
