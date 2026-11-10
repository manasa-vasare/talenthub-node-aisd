import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  eligible?: boolean;
  reason?: string;
  compact?: boolean;
}

export const EligibilityBadge: React.FC<Props> = ({ eligible, reason, compact = false }) => {
  if (eligible === undefined) return null;

  if (eligible) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
        <span>Eligible to Apply</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
      <span className="truncate max-w-[280px]" title={reason}>
        {compact ? 'Ineligible' : reason || 'Criteria not met'}
      </span>
    </div>
  );
};
