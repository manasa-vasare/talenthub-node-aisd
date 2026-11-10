import React, { useState, useEffect } from 'react';
import { apiRequest, subscribeRealtime } from '../../api/client';
import { JobListing, Student, StatusLog } from '../../types';
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  Zap,
  BarChart3,
  Shield,
  Activity,
} from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [auditLogs, setAuditLogs] = useState<StatusLog[]>([]);
  const [selectedJobForShortlist, setSelectedJobForShortlist] = useState<number | null>(null);
  const [shortlistResults, setShortlistResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [shortlistingLoading, setShortlistingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'shortlist' | 'students' | 'audit'>('analytics');

  const loadAllData = async () => {
    try {
      const [statsData, jobsData, studentsData, logsData] = await Promise.all([
        apiRequest<any>('/coordinator/stats'),
        apiRequest<JobListing[]>('/jobs'),
        apiRequest<Student[]>('/coordinator/students'),
        apiRequest<StatusLog[]>('/coordinator/audit-logs'),
      ]);

      setStats(statsData);
      setJobs(jobsData);
      setStudents(studentsData);
      setAuditLogs(logsData);
      if (jobsData.length > 0 && !selectedJobForShortlist) {
        setSelectedJobForShortlist(jobsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();

    const unsubscribe = subscribeRealtime((event) => {
      if (
        event.type === 'APPLICATION_CREATED' ||
        event.type === 'APPLICATION_STATUS_UPDATED' ||
        event.type === 'OFFER_ACCEPTED' ||
        event.type === 'OFFER_ISSUED' ||
        event.type === 'STUDENT_ANONYMIZED'
      ) {
        loadAllData();
      }
    });

    return unsubscribe;
  }, []);

  const handleRunBulkShortlist = async () => {
    if (!selectedJobForShortlist) return;
    setShortlistingLoading(true);
    setShortlistResults(null);

    try {
      const res = await apiRequest(`/coordinator/bulk-shortlist/${selectedJobForShortlist}`, {
        method: 'POST',
      });
      setShortlistResults(res);
      await loadAllData();
    } catch (err: any) {
      alert(`Error running bulk shortlisting: ${err.message}`);
    } finally {
      setShortlistingLoading(false);
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
      {/* Top Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
            Placement Operations • Coordinator Console
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1.5">Campus Placement Intelligence</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Recruitment drive oversight, rule-based bulk shortlisting, audit trail logs, and cohort statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-2xs">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Placement Rate: {stats?.placementRate || 0}%</span>
          </div>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs dashboard-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Registered</span>
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats?.totalStudents || 0}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Eligible Candidates</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs dashboard-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Placed Candidates</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{stats?.placedStudents || 0}</div>
          <div className="text-xs text-emerald-700 font-medium mt-0.5">{stats?.placementRate}% placement rate</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs dashboard-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Average Package</span>
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">₹{stats?.averagePackage || 0}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Lakhs Per Annum</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs dashboard-card">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Highest Package</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">₹{stats?.highestPackage || 0}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">LPA Maximum Offer</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Branch Statistics</span>
        </button>

        <button
          onClick={() => setActiveTab('shortlist')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'shortlist'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-600" />
          <span>Automated Bulk Shortlisting</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'students'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Directory ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === 'audit'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4 text-slate-600" />
          <span>Audit Log Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Branch Statistics */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Branch-wise Placement Progress</h3>
            <div className="space-y-3.5 pt-1">
              {stats?.branchStats?.map((b: any) => (
                <div key={b.branch} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{b.branch}</span>
                    <span className="text-slate-500">
                      {b.placed} / {b.total} Placed ({b.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(b.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Top Recruiting Partners</h3>
            <div className="space-y-2.5 pt-1">
              {stats?.companyOffers?.map((c: any) => (
                <div
                  key={c.company}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-semibold"
                >
                  <span className="text-slate-900">{c.company}</span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    {c.count} {c.count === 1 ? 'Offer' : 'Offers'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Automated Bulk Shortlisting */}
      {activeTab === 'shortlist' && (
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Rule-Based Batch Shortlisting Engine (Lab 4 Part B)
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                Executes the sequential fail-fast eligibility algorithm (R1 CGPA → R2 Backlogs → R3 Placement Policy → R4 Branch Scope) across all applicants. Automatically promotes eligible students to SHORTLISTED and appends rows to the immutable audit log.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Select Drive to Evaluate:
                </label>
                <select
                  value={selectedJobForShortlist || ''}
                  onChange={(e) => setSelectedJobForShortlist(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-800"
                >
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.role} • {j.company_name} (Min CGPA: {j.min_cgpa}, Max Backlogs: {j.max_backlogs})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto pt-4 sm:pt-5">
                <button
                  onClick={handleRunBulkShortlist}
                  disabled={shortlistingLoading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>{shortlistingLoading ? 'Evaluating...' : 'Run Automated Shortlisting'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Shortlisting Results View */}
          {shortlistResults && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Execution Summary</h4>
                <div className="flex gap-2 text-xs font-bold">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    Evaluated: {shortlistResults.processed}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Shortlisted: {shortlistResults.shortlisted}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                    Ineligible: {shortlistResults.ineligible}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                {shortlistResults.details.map((d: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border flex items-center justify-between text-xs font-medium ${
                      d.eligible
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50/70 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900">{d.studentName}</span>{' '}
                      <span className="text-slate-500 font-mono">({d.usn})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={d.eligible ? 'text-emerald-800 font-bold' : 'text-rose-800 font-bold'}>
                        {d.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Student Directory */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">USN & Email</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">CGPA</th>
                  <th className="px-4 py-3">Backlogs</th>
                  <th className="px-4 py-3">Consent</th>
                  <th className="px-4 py-3">Placement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">{s.full_name}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-slate-800 font-semibold">{s.usn}</div>
                      <div className="text-[11px] text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.branch}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{s.cgpa}</td>
                    <td className="px-4 py-3">
                      <span className={s.active_backlogs ? 'text-amber-700 font-semibold' : 'text-slate-600'}>
                        {s.active_backlogs} active
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          s.consent_given
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {s.consent_given ? 'Granted' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.has_accepted_offer ? (
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Placed
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">In Process</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Audit Trail (NFR-9.1) */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-2">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Placement Audit Logs (NFR-9.1)</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Immutable chronological log of every status transition, actor ID, and timestamp.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase text-slate-500 font-semibold tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Candidate</th>
                  <th className="px-4 py-2.5">Company & Role</th>
                  <th className="px-4 py-2.5">From Status</th>
                  <th className="px-4 py-2.5">To Status</th>
                  <th className="px-4 py-2.5">Action By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-2.5 text-slate-500 font-mono">
                      {new Date(log.changed_at).toLocaleString('en-GB')}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {log.student_name} ({log.usn})
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {log.company_name} - {log.role}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {log.from_status || 'INITIAL'}
                    </td>
                    <td className="px-4 py-2.5 text-emerald-800 font-bold">
                      {log.to_status}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {log.changed_by_username} <span className="text-slate-400">({log.changed_by_role})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
