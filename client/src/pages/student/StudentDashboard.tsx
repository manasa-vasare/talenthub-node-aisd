import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, subscribeRealtime, downloadOfferLetterFile, getOfferLetterBlobUrl } from '../../api/client';
import { Student, JobListing, Application, InterviewSlot, Offer } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { EligibilityBadge } from '../../components/EligibilityBadge';
import {
  Briefcase,
  Calendar,
  Award,
  CheckCircle,
  AlertTriangle,
  Download,
  ShieldCheck,
  UserX,
  Clock,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  ExternalLink,
  Printer,
  X,
  FileText,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<Student | null>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<InterviewSlot[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'interviews' | 'offers'>('jobs');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [viewingOffer, setViewingOffer] = useState<Offer | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [profData, jobsData, appsData, intData, offData] = await Promise.all([
        apiRequest<Student>('/student/profile'),
        apiRequest<JobListing[]>('/jobs'),
        apiRequest<Application[]>('/student/applications'),
        apiRequest<InterviewSlot[]>('/student/interviews'),
        apiRequest<Offer[]>('/student/offers'),
      ]);

      setProfile(profData);
      setJobs(jobsData);
      setApplications(appsData);
      setInterviews(intData);
      setOffers(offData);
    } catch (err: any) {
      console.error('Error loading student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const unsubscribe = subscribeRealtime((event) => {
      if (
        event.type === 'APPLICATION_STATUS_UPDATED' ||
        event.type === 'INTERVIEW_SCHEDULED' ||
        event.type === 'INTERVIEW_RESULT_UPDATED' ||
        event.type === 'OFFER_ISSUED' ||
        event.type === 'OFFER_ACCEPTED' ||
        event.type === 'JOB_CREATED'
      ) {
        loadData();
      }
    });

    return unsubscribe;
  }, []);

  const handleApply = async (jobId: number) => {
    setActionMsg(null);
    try {
      const res = await apiRequest<{ eligible: boolean; message: string; reason?: string }>('/applications/apply', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId }),
      });

      setActionMsg({ text: res.message || 'Application submitted successfully.' });
      await loadData();
    } catch (err: any) {
      setActionMsg({ text: err.message, error: true });
    }
  };

  const handleAcceptOffer = async (applicationId: number) => {
    if (!window.confirm('Confirm placement offer acceptance? In accordance with university placement rules, this finalizes your recruitment for this season.')) {
      return;
    }
    setActionMsg(null);
    try {
      const res = await apiRequest<{ message: string }>(`/offers/${applicationId}/accept`, {
        method: 'POST',
      });
      setActionMsg({ text: res.message });
      await loadData();
      await refreshUser();
    } catch (err: any) {
      setActionMsg({ text: err.message, error: true });
    }
  };

  const handleViewOffer = async (offer: Offer) => {
    setViewingOffer(offer);
    setIsLoadingPdf(true);
    try {
      const url = await getOfferLetterBlobUrl(offer.offer_letter_key);
      setPdfBlobUrl(url);
    } catch (err: any) {
      console.error('Failed to preview offer document:', err);
      setActionMsg({ text: `Could not load PDF document preview: ${err.message}`, error: true });
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleCloseOfferModal = () => {
    if (pdfBlobUrl) {
      window.URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setViewingOffer(null);
  };

  const handleToggleConsent = async () => {
    if (!profile) return;
    try {
      const updated = await apiRequest<Student>('/student/consent', {
        method: 'PUT',
        body: JSON.stringify({ consent_given: !profile.consent_given }),
      });
      setProfile(updated);
      setActionMsg({ text: `Consent ${updated.consent_given ? 'Granted' : 'Revoked'} successfully.` });
    } catch (err: any) {
      setActionMsg({ text: err.message, error: true });
    }
  };

  const handleErasure = async () => {
    if (!window.confirm('GDPR / DPDP Right to Erasure: Are you sure you want to permanently anonymize your student profile? Your USN, name, and email will be purged in-place.')) {
      return;
    }
    try {
      const res = await apiRequest<{ message: string; student: Student }>('/student/erase', {
        method: 'POST',
      });
      setProfile(res.student);
      setActionMsg({ text: res.message });
      await refreshUser();
    } catch (err: any) {
      setActionMsg({ text: err.message, error: true });
    }
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
      {/* Action Notification Alert */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between shadow-2xs animate-fade-in ${
            actionMsg.error
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMsg.error ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span className="text-xs font-medium">{actionMsg.text}</span>
          </div>
          <button
            onClick={() => setActionMsg(null)}
            className="text-xs font-semibold hover:underline ml-4 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Banner & Academic Profile */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{profile?.full_name}</h1>
              {profile?.has_accepted_offer && (
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Placed This Season</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              USN: <span className="font-mono text-slate-800 font-semibold">{profile?.usn}</span> • {profile?.email}
            </p>
          </div>

          {/* Academic KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Branch</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">{profile?.branch}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">CGPA</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">{profile?.cgpa}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Backlogs</span>
              <div className={`text-base font-bold mt-0.5 ${profile?.active_backlogs ? 'text-amber-700' : 'text-slate-900'}`}>
                {profile?.active_backlogs} <span className="text-xs font-normal text-slate-500">active</span>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Placement</span>
              <div className="text-xs font-bold mt-1">
                {profile?.has_accepted_offer ? (
                  <span className="text-emerald-700">Placed</span>
                ) : (
                  <span className="text-slate-600">Seeking</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Consent & Privacy Section */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-4 h-4 ${profile?.consent_given ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span>
              DPDP Placement Consent:{' '}
              <strong className={profile?.consent_given ? 'text-emerald-700' : 'text-amber-700'}>
                {profile?.consent_given ? 'Granted' : 'Not Granted'}
              </strong>{' '}
              <span className="text-slate-400 hidden sm:inline">(Required to apply for campus recruitment drives)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleConsent}
              className="px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 font-semibold transition border border-slate-300 shadow-2xs cursor-pointer text-xs"
            >
              {profile?.consent_given ? 'Revoke Consent' : 'Grant Consent'}
            </button>
            <button
              onClick={handleErasure}
              className="px-3 py-1.5 rounded-md bg-white hover:bg-rose-50 text-rose-700 border border-slate-300 hover:border-rose-300 transition font-medium flex items-center gap-1.5 cursor-pointer text-xs"
              title="GDPR / DPDP Right to Erasure (FR-10.2: in-place anonymization)"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Right to Erasure</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'jobs'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Active Drives & Jobs ({jobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'applications'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Applications ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('interviews')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'interviews'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Interview Rounds ({interviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('offers')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'offers'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Placement Offers ({offers.length})</span>
        </button>
      </div>

      {/* Tab 1: Jobs with Live Eligibility */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Placement Season 2026-2027 Drives • Live Eligibility Engine
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => {
              const eligible = job.eligibility?.eligible;
              const reason = job.eligibility?.reason;

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between space-y-4 dashboard-card"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="text-xs font-semibold text-slate-600">{job.company_name}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-0.5">{job.role}</h3>
                      </div>
                      {job.package_lpa && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                            ₹{job.package_lpa} LPA
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {job.description || 'Campus recruitment drive for eligible batch candidates.'}
                    </p>

                    {/* Criteria details */}
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-1.5 text-slate-600 font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Min CGPA Required:</span>
                        <strong className="text-slate-900">{job.min_cgpa}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Max Active Backlogs:</span>
                        <strong className="text-slate-900">{job.max_backlogs}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Allowed Branches:</span>
                        <strong className="text-slate-900">
                          {job.allowed_branches && job.allowed_branches.length > 0
                            ? job.allowed_branches.join(', ')
                            : 'All Branches (Universal Scope)'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Drive Date:</span>
                        <strong className="text-slate-900">
                          {new Date(job.drive_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Badge & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <EligibilityBadge eligible={eligible} reason={reason} />

                    {job.has_applied ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <StatusBadge status={job.application_status || 'APPLIED'} />
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={!eligible || !job.is_open || !profile?.consent_given}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                          eligible && job.is_open && profile?.consent_given
                            ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                      >
                        <span>
                          {!profile?.consent_given
                            ? 'Grant Consent First'
                            : !job.is_open
                            ? 'Drive Closed'
                            : eligible
                            ? 'Apply Now'
                            : 'Ineligible'}
                        </span>
                        {eligible && job.is_open && profile?.consent_given && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Applications Table */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              No applications submitted yet. Browse active recruitment drives to apply.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Job Role</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Offered CTC</th>
                    <th className="px-5 py-3">Application Date</th>
                    <th className="px-5 py-3">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{app.role}</td>
                      <td className="px-5 py-3.5 text-slate-700 font-semibold">{app.company_name}</td>
                      <td className="px-5 py-3.5 font-mono text-slate-800">
                        {app.package_lpa ? `₹${app.package_lpa} LPA` : 'As per policy'}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">
                        {new Date(app.applied_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Interviews */}
      {activeTab === 'interviews' && (
        <div className="space-y-4">
          {interviews.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              No interview rounds currently scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interviews.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Round {slot.round_no}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{slot.job_role}</h4>
                      <div className="text-xs font-semibold text-slate-600">{slot.company_name}</div>
                    </div>
                    <div>
                      {slot.passed === true && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Passed Round
                        </span>
                      )}
                      {slot.passed === false && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          Did Not Clear
                        </span>
                      )}
                      {slot.passed === null && (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(slot.scheduled_at).toLocaleString('en-GB')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>Venue / Link: {slot.venue}</span>
                    </div>
                    {slot.notes && (
                      <div className="text-slate-500 italic pt-1 border-t border-slate-200">
                        Instructions: {slot.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Offers with Download & Accept */}
      {activeTab === 'offers' && (
        <div className="space-y-4">
          {offers.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
              No placement offers issued yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl p-5 border-2 border-emerald-200 shadow-2xs space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                        Formal Placement Offer
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-1.5">{offer.role}</h3>
                      <div className="text-xs font-semibold text-slate-600">{offer.company_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900">₹{offer.package_lpa}</div>
                      <span className="text-xs font-semibold text-slate-500">LPA CTC</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1 font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Issued On:</span>
                      <span className="text-slate-800">{new Date(offer.issued_at).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Offer Storage Key:</span>
                      <span className="font-mono text-[11px] text-slate-700 truncate max-w-[200px]" title={offer.offer_letter_key}>
                        {offer.offer_letter_key}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleViewOffer(offer)}
                      className="flex-1 min-w-[120px] py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-200" />
                      <span>View Letter</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadOfferLetterFile(offer.offer_letter_key, `Offer_Letter_${offer.company_name}.pdf`)}
                      className="py-2 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-300 shadow-2xs transition cursor-pointer"
                      title="Download PDF Document"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      <span>Download PDF</span>
                    </button>

                    {offer.accepted ? (
                      <div className="py-2 px-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Accepted</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAcceptOffer(offer.application_id)}
                        disabled={profile?.has_accepted_offer}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          profile?.has_accepted_offer
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-xs'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Accept Offer</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Offer Letter Viewer Modal */}
      {viewingOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Official Placement Offer Letter
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewingOffer.company_name} — {viewingOffer.role} ({viewingOffer.package_lpa} LPA)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pdfBlobUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => window.open(pdfBlobUrl, '_blank')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">New Tab</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                      title="Print document"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Print</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => downloadOfferLetterFile(viewingOffer.offer_letter_key, `Offer_Letter_${viewingOffer.company_name}.pdf`)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Download valid PDF file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleCloseOfferModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer ml-1"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {isLoadingPdf ? (
                <div className="py-20 text-center space-y-2">
                  <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Rendering authentic offer document...</p>
                </div>
              ) : pdfBlobUrl ? (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 shadow-inner">
                    <iframe
                      src={pdfBlobUrl}
                      className="w-full h-[460px] border-0"
                      title="Offer Letter PDF Preview"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-3">
                  <p className="text-xs text-slate-600 font-medium">
                    The offer document is ready for download or offline viewing.
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadOfferLetterFile(viewingOffer.offer_letter_key, `Offer_Letter_${viewingOffer.company_name}.pdf`)}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Offer Letter PDF</span>
                  </button>
                </div>
              )}

              {/* Institutional Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 font-medium">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Institutional Placement Record
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    Official Appointment
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                  <div>
                    <span className="block text-[11px] text-slate-400">Candidate</span>
                    <span className="font-semibold text-slate-900">{viewingOffer.student_name}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Company</span>
                    <span className="font-semibold text-slate-900">{viewingOffer.company_name}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Designation</span>
                    <span className="font-semibold text-slate-900">{viewingOffer.role}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400">Annual Package</span>
                    <span className="font-semibold text-slate-900">₹{viewingOffer.package_lpa} LPA</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                  <strong className="text-slate-700">Placement Policy Note:</strong> In compliance with university guidelines (Lab 4 / 3NF Policy Engine), accepting this offer allocates you a final placement for this recruitment season (1 student = 1 offer).
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate-500">
                Key: {viewingOffer.offer_letter_key}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseOfferModal}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
                {!viewingOffer.accepted && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleAcceptOffer(viewingOffer.application_id);
                      handleCloseOfferModal();
                    }}
                    disabled={profile?.has_accepted_offer}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer ${
                      profile?.has_accepted_offer
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-xs'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Accept Offer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
