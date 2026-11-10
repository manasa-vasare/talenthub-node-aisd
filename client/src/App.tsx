import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { CompanyDashboard } from './pages/company/CompanyDashboard';
import { CoordinatorDashboard } from './pages/coordinator/CoordinatorDashboard';

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading TalentHub...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-slate-200 selection:text-slate-900">
      <Navbar />
      <main className="flex-1 pb-16">
        {user.role === 'student' && <StudentDashboard />}
        {user.role === 'company' && <CompanyDashboard />}
        {user.role === 'coordinator' && <CoordinatorDashboard />}
      </main>
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TalentHub • University Placement Management System</span>
          <span className="text-slate-400">Laboratory 4 Detailed Design Architecture • Node.js, TypeScript & PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
