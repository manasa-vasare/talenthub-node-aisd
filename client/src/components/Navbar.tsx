import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeRealtime } from '../api/client';
import { GraduationCap, LogOut, Radio, ChevronDown, Check, UserCircle } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, login } = useAuth();
  const [isLive, setIsLive] = useState(true);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeRealtime((event) => {
      setIsLive(true);
      if (event.type !== 'CONNECTED') {
        setLastEvent(event.type.replace(/_/g, ' '));
        setTimeout(() => setLastEvent(null), 4000);
      }
    });
    return unsubscribe;
  }, []);

  const demoAccounts = [
    { label: 'Rahul Sharma', sub: 'Student • CSE', username: 'rahul', role: 'student', details: 'CGPA 8.2 • 1 Backlog' },
    { label: 'Priya Patel', sub: 'Student • ISE', username: 'priya', role: 'student', details: 'CGPA 9.15 • Offer Pending' },
    { label: 'Sneha K', sub: 'Student • CSE', username: 'sneha', role: 'student', details: 'Placed at Google (32.5 LPA)' },
    { label: 'Google India', sub: 'Company Rep', username: 'google_hr', role: 'company', details: 'Hiring Team' },
    { label: 'Microsoft Corp', sub: 'Company Rep', username: 'microsoft_hr', role: 'company', details: 'Hiring Team' },
    { label: 'Placement Officer', sub: 'Coordinator', username: 'coordinator', role: 'coordinator', details: 'Placement Cell Admin' },
  ];

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'student':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
            Student
          </span>
        );
      case 'company':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
            Recruiter
          </span>
        );
      case 'coordinator':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
            Coordinator
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  TalentHub
                </span>
                <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Placement Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Campus Placement Management System</p>
            </div>
          </div>

          {/* Realtime Event Toast Badge */}
          {lastEvent && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fade-in">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Event: {lastEvent}</span>
            </div>
          )}

          {/* User Controls & Demo Switcher */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Socket Status */}
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
              <span className="hidden sm:inline font-medium">Live Sync</span>
            </div>

            {/* Quick Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-2xs cursor-pointer"
                title="Switch test account to preview any role"
              >
                <span>Switch Role</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {showSwitchMenu && (
                <div className="absolute right-0 mt-2 w-76 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>Select Persona</span>
                    <span className="font-normal text-slate-400">Demo Accounts</span>
                  </div>
                  <div className="py-1">
                    {demoAccounts.map((acc) => {
                      const isCurrent = user?.username === acc.username;
                      return (
                        <button
                          key={acc.username}
                          onClick={async () => {
                            setShowSwitchMenu(false);
                            if (acc.role === 'student') await login(acc.username, 'student123');
                            else if (acc.role === 'company') await login(acc.username, 'company123');
                            else await login(acc.username, 'admin123');
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center justify-between transition cursor-pointer ${
                            isCurrent ? 'bg-slate-50 text-slate-900 font-semibold' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-semibold flex items-center gap-1.5">
                              <span>{acc.label}</span>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-slate-900" />}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{acc.sub} • {acc.details}</div>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                            {acc.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Current User Pill & Logout */}
            <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                  <UserCircle className="w-4 h-4 text-slate-600" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900">{user?.username}</div>
                  <div className="mt-0.5">{getRoleBadge(user?.role)}</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
