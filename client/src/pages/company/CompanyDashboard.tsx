import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, subscribeRealtime } from '../../api/client';
import { JobListing, Application, Branch, VALID_BRANCHES } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Briefcase,
  PlusCircle,
  Users,
  X,
} from 'lucide-react';

export const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState<Application | null>(null);
  const [showOfferModal, setShowOfferModal] = useState<Application | null>(null);

  // Form states
  const [newJob, setNewJob] = useState({
    role: '',
    season: '2026-2027',
    min_cgpa: '7.0',
    max_backlogs: '0',
    drive_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    package_lpa: '15.0',
    description: '',
    allowed_branches: ['CSE', 'ISE', 'ECE'] as Branch[],
  });

  const [scheduleData, setScheduleData] = useState({
    round_no: 1,
    scheduled_at: '',
    venue: 'Campus Placement Cell / Google Meet',
    notes: '',
  });

  const [offerData, setOfferData] = useState({
    package_lpa: '18.0',
  });

  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const loadJobs = async () => {
    try {
      const data = await apiRequest<JobListing[]>('/company/my-jobs');
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (jobId: number) => {
    try {
      const data = await apiRequest<Application[]>(`/company/job/${jobId}/applicants`);
      setApplicants(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadJobs();

    const unsubscribe = subscribeRealtime((event) => {
      if (
        event.type === 'APPLICATION_CREATED' ||
        event.type === 'APPLICATION_STATUS_UPDATED' ||
        event.type === 'OFFER_ACCEPTED'
      ) {
        loadJobs();
        if (selectedJob) {
          loadApplicants(selectedJob.id);
        }
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (selectedJob) {
      loadApplicants(selectedJob.id);
    }
  }, [selectedJob]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          ...newJob,
          min_cgpa: parseFloat(newJob.min_cgpa),
          max_backlogs: parseInt(newJob.max_backlogs, 10),
          package_lpa: parseFloat(newJob.package_lpa),
        }),
      });
      setShowCreateJob(false);
      setStatusMsg({ text: 'Recruitment drive listing posted successfully.' });
      await loadJobs();
    } catch (err: any) {
      setStatusMsg({ text: err.message, error: true });
    }
  };

  const handleStatusUpdate = async (appId: number, status: string) => {
    try {
      await apiRequest(`/applications/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setStatusMsg({ text: `Application status updated to ${status}.` });
      if (selectedJob) await loadApplicants(selectedJob.id);
    } catch (err: any) {
      setStatusMsg({ text: err.message, error: true });
    }
  };

  const handleScheduleRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showScheduleModal) return;

    try {
      await apiRequest('/interviews/schedule', {
        method: 'POST',
        body: JSON.stringify({
          application_id: showScheduleModal.id,
          round_no: Number(scheduleData.round_no),
          scheduled_at: scheduleData.scheduled_at,
          venue: scheduleData.venue,
          notes: scheduleData.notes,
        }),
      });
      setShowScheduleModal(null);
      setStatusMsg({ text: `Interview Round ${scheduleData.round_no} scheduled.` });
      if (selectedJob) await loadApplicants(selectedJob.id);
    } catch (err: any) {
      setStatusMsg({ text: err.message, error: true });
    }
  };

  const handleIssueOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showOfferModal) return;

    try {
      await apiRequest('/offers/issue', {
        method: 'POST',
        body: JSON.stringify({
          application_id: showOfferModal.id,
          package_lpa: parseFloat(offerData.package_lpa),
        }),
      });
      setShowOfferModal(null);
      setStatusMsg({ text: `Formal offer of ₹${offerData.package_lpa} LPA issued.` });
      if (selectedJob) await loadApplicants(selectedJob.id);
    } catch (err: any) {
      setStatusMsg({ text: err.message, error: true });
    }
  };

  const toggleBranch = (b: Branch) => {
    setNewJob((prev) => {
      const exists = prev.allowed_branches.includes(b);
      return {
        ...prev,
        allowed_branches: exists
          ? prev.allowed_branches.filter((x) => x !== b)
          : [...prev.allowed_branches, b],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
            Recruiter Workspace • Corporate Portal
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5">
            {user?.profile?.company_name || 'Hiring Portal'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Manage your recruitment drives, evaluate candidate pipelines, schedule interview rounds, and issue formal offers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateJob(true)}
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer flex-shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Drive</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between text-xs font-semibold animate-fade-in ${
            statusMsg.error
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            onClick={() => setStatusMsg(null)}
            className="hover:underline ml-4 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content: Left drives list + Right applicants table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Posted Drives */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-slate-600" />
            <span>Active Drives ({jobs.length})</span>
          </h2>

          <div className="space-y-2.5">
            {jobs.map((job) => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 rounded-xl border cursor-pointer transition dashboard-card ${
                    isSelected
                      ? 'bg-slate-50 border-slate-900 shadow-2xs ring-1 ring-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{job.role}</h3>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        Drive Date: {new Date(job.drive_date).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    {job.package_lpa && (
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        ₹{job.package_lpa} LPA
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>
                      Min CGPA: <strong className="text-slate-800">{job.min_cgpa}</strong> • Max Backlogs: <strong className="text-slate-800">{job.max_backlogs}</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      job.is_open
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {job.is_open ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Applicants Table */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-600" />
              <span>Applicants for {selectedJob?.role || 'Drive'} ({applicants.length})</span>
            </h2>
          </div>

          {applicants.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-slate-500 border border-slate-200">
              No students have applied to this drive yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Candidate</th>
                      <th className="px-4 py-3">Branch & CGPA</th>
                      <th className="px-4 py-3">Backlogs</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {applicants.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{app.student_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{app.usn}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800">{app.student_branch}</span>
                          <span className="text-xs text-slate-500 ml-1.5">(CGPA: {app.student_cgpa})</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={app.student_backlogs ? 'text-amber-700 font-semibold' : 'text-slate-600'}>
                            {app.student_backlogs || 0} active
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {app.status === 'APPLIED' && (
                              <button
                                onClick={() => handleStatusUpdate(app.id, 'SHORTLISTED')}
                                className="px-2.5 py-1 rounded bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold transition cursor-pointer shadow-2xs"
                              >
                                Shortlist
                              </button>
                            )}

                            {(app.status === 'SHORTLISTED' || app.status === 'INTERVIEW_SCHEDULED') && (
                              <button
                                onClick={() => {
                                  setShowScheduleModal(app);
                                  setScheduleData({
                                    round_no: 1,
                                    scheduled_at: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                                    venue: 'Campus Placement Cell / Google Meet',
                                    notes: 'Technical Interview',
                                  });
                                }}
                                className="px-2.5 py-1 rounded bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-300 text-xs font-semibold transition cursor-pointer shadow-2xs"
                              >
                                Schedule Round
                              </button>
                            )}

                            {(app.status === 'INTERVIEWED' || app.status === 'INTERVIEW_SCHEDULED') && (
                              <button
                                onClick={() => {
                                  setShowOfferModal(app);
                                  setOfferData({ package_lpa: String(selectedJob?.package_lpa || '12.0') });
                                }}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
                              >
                                Issue Offer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Post New Job */}
      {showCreateJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Post New Recruitment Drive</h3>
              <button onClick={() => setShowCreateJob(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Job Role / Title</label>
                <input
                  type="text"
                  required
                  value={newJob.role}
                  onChange={(e) => setNewJob({ ...newJob, role: e.target.value })}
                  placeholder="e.g. Software Engineer - Distributed Systems"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Min CGPA (0 - 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={newJob.min_cgpa}
                    onChange={(e) => setNewJob({ ...newJob, min_cgpa: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Max Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newJob.max_backlogs}
                    onChange={(e) => setNewJob({ ...newJob, max_backlogs: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Package CTC (LPA)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newJob.package_lpa}
                    onChange={(e) => setNewJob({ ...newJob, package_lpa: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Drive Date</label>
                  <input
                    type="date"
                    required
                    value={newJob.drive_date}
                    onChange={(e) => setNewJob({ ...newJob, drive_date: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              {/* 1NF Allowed Branches Selection */}
              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
                  Allowed Branches (1NF Decomposed - Leave empty for ALL branches):
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {VALID_BRANCHES.map((b: Branch) => {
                    const isSelected = newJob.allowed_branches.includes(b);
                    return (
                      <button
                        type="button"
                        key={b}
                        onClick={() => toggleBranch(b)}
                        className={`px-3 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Description</label>
                <textarea
                  rows={3}
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  placeholder="Job specifications, skills expected..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateJob(false)}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Create Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Interview */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Schedule Interview for {showScheduleModal.student_name}
              </h3>
              <button onClick={() => setShowScheduleModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleRound} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">
                  Round Number (Unique per app - FR-7.2)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={scheduleData.round_no}
                  onChange={(e) => setScheduleData({ ...scheduleData, round_no: parseInt(e.target.value, 10) })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Schedule Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleData.scheduled_at}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduled_at: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Venue / Online Link</label>
                <input
                  type="text"
                  required
                  value={scheduleData.venue}
                  onChange={(e) => setScheduleData({ ...scheduleData, venue: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Round Notes / Instructions</label>
                <input
                  type="text"
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  placeholder="e.g. Technical Round 1"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(null)}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
                >
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Offer */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Issue Formal Offer to {showOfferModal.student_name}
              </h3>
              <button onClick={() => setShowOfferModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueOffer} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Offered Package (LPA)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={offerData.package_lpa}
                  onChange={(e) => setOfferData({ package_lpa: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 text-base font-bold"
                />
              </div>

              <p className="text-slate-500 text-xs leading-relaxed">
                An unpredictable UUID storage key will be generated for the offer document (FR-8.3, NFR-3.5).
                The candidate will receive an immediate real-time event on their portal.
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(null)}
                  className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Issue Formal Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
