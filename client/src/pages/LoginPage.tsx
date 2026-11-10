import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Branch, VALID_BRANCHES } from '../types';
import { GraduationCap, Briefcase, Shield, ArrowRight, Lock, User, CheckCircle2, Mail, Building, FileText } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, registerStudent, registerCompany } = useAuth();
  const [mode, setMode] = useState<'signin' | 'register_student' | 'register_company'>('signin');
  
  // Login Form
  const [username, setUsername] = useState('rahul');
  const [password, setPassword] = useState('student123');

  // Student Register Form
  const [studentForm, setStudentForm] = useState({
    username: '',
    password: '',
    full_name: '',
    usn: '',
    email: '',
    branch: 'CSE' as Branch,
    cgpa: '8.5',
    active_backlogs: '0',
    consent_given: true,
  });

  // Company Register Form
  const [companyForm, setCompanyForm] = useState({
    username: '',
    password: '',
    company_name: '',
    website: '',
    description: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerStudent({
        username: studentForm.username,
        password: studentForm.password,
        full_name: studentForm.full_name,
        usn: studentForm.usn,
        email: studentForm.email,
        branch: studentForm.branch,
        cgpa: parseFloat(studentForm.cgpa),
        active_backlogs: parseInt(studentForm.active_backlogs, 10),
        consent_given: studentForm.consent_given,
      });
    } catch (err: any) {
      setError(err.message || 'Student registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await registerCompany({
        username: companyForm.username,
        password: companyForm.password,
        company_name: companyForm.company_name,
        website: companyForm.website,
        description: companyForm.description,
      });
    } catch (err: any) {
      setError(err.message || 'Recruiter registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const demoPresets = [
    {
      title: 'Rahul Sharma',
      role: 'Student (CSE)',
      hint: 'CGPA 8.2 • 1 Backlog (Eligible for MSFT / Amazon)',
      username: 'rahul',
      password: 'student123',
      icon: GraduationCap,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      title: 'Priya Patel',
      role: 'Student (ISE)',
      hint: 'CGPA 9.15 • 24 LPA Offer Pending (Microsoft)',
      username: 'priya',
      password: 'student123',
      icon: GraduationCap,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Sneha K',
      role: 'Student (CSE)',
      hint: 'CGPA 9.6 • Placed at Google (32.5 LPA)',
      username: 'sneha',
      password: 'student123',
      icon: GraduationCap,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      title: 'Google India',
      role: 'Company Representative',
      hint: 'Post Drives • Shortlist • Schedule • Issue Offers',
      username: 'google_hr',
      password: 'company123',
      icon: Briefcase,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      title: 'Microsoft Corp',
      role: 'Company Representative',
      hint: 'Review Applications & Release Offer Letters',
      username: 'microsoft_hr',
      password: 'company123',
      icon: Briefcase,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'Placement Officer',
      role: 'Placement Coordinator',
      hint: 'Bulk Shortlisting • Analytics • Audit Logs • Consent',
      username: 'coordinator',
      password: 'admin123',
      icon: Shield,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] font-sans">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start py-10">
        {/* Left Side: Brand & Quick Demo Switcher */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  TalentHub
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Campus Placement Management System
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed font-normal">
            Production-grade placement platform designed in strict accordance with the <strong>Laboratory 4 Detailed Design Specification</strong>:
            10-table 3NF/BCNF relational database, deterministic fail-fast <code className="text-slate-800 font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">checkEligibility</code> algorithm,
            atomic offer acceptance, role-isolated RBAC, DPDP consent tracking, and real-time state synchronization.
          </p>

          {/* Quick Demo Credentials */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Demo Persona Accounts (Click to Pre-fill)</span>
              {mode !== 'signin' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-xs text-slate-900 font-semibold hover:underline cursor-pointer"
                >
                  Switch to Sign In
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoPresets.map((preset) => {
                const Icon = preset.icon;
                const isSelected = mode === 'signin' && username === preset.username;
                return (
                  <button
                    key={preset.username}
                    onClick={() => {
                      setMode('signin');
                      setUsername(preset.username);
                      setPassword(preset.password);
                    }}
                    type="button"
                    className={`p-3.5 rounded-xl text-left transition border cursor-pointer ${
                      isSelected
                        ? 'bg-slate-50 border-slate-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-slate-900 truncate">{preset.title}</div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-900 flex-shrink-0" />}
                        </div>
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border mt-1 ${preset.badgeColor}`}>
                          {preset.role}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{preset.hint}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card (Sign In / Register) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 p-7 rounded-2xl shadow-sm space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 py-1.5 rounded-md transition cursor-pointer text-center ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register_student'); setError(null); }}
              className={`flex-1 py-1.5 rounded-md transition cursor-pointer text-center ${
                mode === 'register_student'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Student
            </button>
            <button
              type="button"
              onClick={() => { setMode('register_company'); setError(null); }}
              className={`flex-1 py-1.5 rounded-md transition cursor-pointer text-center ${
                mode === 'register_company'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register Recruiter
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold animate-fade-in flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode 1: Sign In */}
          {mode === 'signin' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition font-medium"
                    placeholder="e.g. rahul, google_hr, coordinator"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 transition font-medium"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Mode 2: Register Student */}
          {mode === 'register_student' && (
            <form onSubmit={handleStudentRegister} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Full Candidate Name</label>
                <input
                  type="text"
                  required
                  value={studentForm.full_name}
                  onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                  placeholder="e.g. Ananya Rao"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">USN (Unique)</label>
                  <input
                    type="text"
                    required
                    value={studentForm.usn}
                    onChange={(e) => setStudentForm({ ...studentForm, usn: e.target.value })}
                    placeholder="e.g. 1RV22CS088"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs font-mono uppercase focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Branch</label>
                  <select
                    value={studentForm.branch}
                    onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value as Branch })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                  >
                    {VALID_BRANCHES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">CGPA (0 - 10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={studentForm.cgpa}
                    onChange={(e) => setStudentForm({ ...studentForm, cgpa: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Active Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={studentForm.active_backlogs}
                    onChange={(e) => setStudentForm({ ...studentForm, active_backlogs: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">College Email (Unique)</label>
                <input
                  type="email"
                  required
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  placeholder="ananya@college.edu"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Portal Username</label>
                  <input
                    type="text"
                    required
                    value={studentForm.username}
                    onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                    placeholder="e.g. ananya"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-slate-600 text-[11px] leading-tight">
                  <input
                    type="checkbox"
                    checked={studentForm.consent_given}
                    onChange={(e) => setStudentForm({ ...studentForm, consent_given: e.target.checked })}
                    className="mt-0.5 rounded border-slate-300 text-slate-900"
                  />
                  <span>
                    I grant DPDP consent for processing my academic profile for campus recruitment drives (FR-10.1).
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Student Profile...' : 'Complete Student Registration'}
              </button>
            </form>
          )}

          {/* Mode 3: Register Recruiter */}
          {mode === 'register_company' && (
            <form onSubmit={handleCompanyRegister} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Company / Organisation Name</label>
                <input
                  type="text"
                  required
                  value={companyForm.company_name}
                  onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                  placeholder="e.g. Oracle India"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Company Website</label>
                <input
                  type="url"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  placeholder="https://oracle.com"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">About Company</label>
                <textarea
                  rows={2}
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  placeholder="Enterprise cloud infrastructure and software..."
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Recruiter Username</label>
                  <input
                    type="text"
                    required
                    value={companyForm.username}
                    onChange={(e) => setCompanyForm({ ...companyForm, username: e.target.value })}
                    placeholder="e.g. oracle_hr"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={companyForm.password}
                    onChange={(e) => setCompanyForm({ ...companyForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg font-semibold text-xs text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Recruiter Account...' : 'Complete Recruiter Registration'}
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              Protected by Token-based JWT Authentication (ADR-003) & Salted Bcrypt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
