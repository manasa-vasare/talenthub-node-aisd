import React from 'react';
import { ApplicationStatus } from '../types';
import { Clock, CheckCircle2, Calendar, FileText, Award, UserCheck } from 'lucide-react';

export const StatusBadge: React.FC<{ status: ApplicationStatus | string }> = ({ status }) => {
  switch (status) {
    case 'APPLIED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Applied</span>
        </span>
      );
    case 'SHORTLISTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Shortlisted</span>
        </span>
      );
    case 'INTERVIEW_SCHEDULED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>Interview Scheduled</span>
        </span>
      );
    case 'INTERVIEWED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          <FileText className="w-3.5 h-3.5 text-purple-600" />
          <span>Interviewed</span>
        </span>
      );
    case 'OFFERED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
          <Award className="w-3.5 h-3.5 text-emerald-600" />
          <span>Offer Issued</span>
        </span>
      );
    case 'ACCEPTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>Offer Accepted</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
};
