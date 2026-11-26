import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Terminal, Play, X, Database, ArrowRight, Code, AlertTriangle, CheckCircle } from 'lucide-react';

interface Student {
  id: number;
  full_name: string;
  usn: string;
  branch: string;
  cgpa: string;
}

interface DemoResponse {
  demonstration: string;
  input: string;
  executedSql: string;
  count: number;
  attackSuccessful?: boolean;
  attackBlocked?: boolean;
  message: string;
  students: Student[];
}

interface SqlInjectionDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlInjectionDemoModal: React.FC<SqlInjectionDemoModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'insecure' | 'secure'>('insecure');
  const [branchInput, setBranchInput] = useState<string>("' OR '1'='1");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const runDemo = async (selectedMode: 'insecure' | 'secure' = mode, customInput: string = branchInput) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = selectedMode === 'insecure'
        ? `/api/demo/sql-injection/insecure?branch=${encodeURIComponent(customInput)}`
        : `/api/demo/sql-injection/secure?branch=${encodeURIComponent(customInput)}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to execute query`);
      }
      const data: DemoResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error executing demonstration');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    setBranchInput(preset);
    runDemo(mode, preset);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Laboratory 7: SQL Injection Vulnerability & Defense
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-600 text-white uppercase tracking-wider">
                  Case 2 Live Demo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive demonstration of OWASP A03:2021 SQL Injection on TalentHub's student search
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                setMode('insecure');
                runDemo('insecure', branchInput);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-bold transition ${
                mode === 'insecure'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-rose-700 hover:bg-white/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              1. Insecure Code (String Concatenation)
            </button>
            <button
              onClick={() => {
                setMode('secure');
                runDemo('secure', branchInput);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-xs font-bold transition ${
                mode === 'secure'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-emerald-700 hover:bg-white/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              2. Secured Code (Parameterized Query / Prepared Statement)
            </button>
          </div>

          {/* Interactive Input Form */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Search by Branch (Simulated User Input)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={branchInput}
                onChange={(e) => setBranchInput(e.target.value)}
                placeholder="e.g. CSE or ' OR '1'='1"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={() => runDemo(mode, branchInput)}
                disabled={loading}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition ${
                  mode === 'insecure'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Run Query</span>
              </button>
            </div>

            {/* Quick Test Payloads */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium">Quick Test Payloads:</span>
              <button
                type="button"
                onClick={() => handlePresetClick("' OR '1'='1")}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 rounded-md font-mono text-[11px] font-semibold transition"
              >
                🚨 ' OR '1'='1 (Exploit)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("' OR 'a'='a")}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 rounded-md font-mono text-[11px] font-semibold transition"
              >
                🚨 ' OR 'a'='a (Alternate Exploit)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("CSE")}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-md font-mono text-[11px] font-semibold transition"
              >
                ✅ CSE (Normal Search)
              </button>
            </div>
          </div>

          {/* Results Area */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              
              {/* Verdict Banner */}
              {result.attackSuccessful ? (
                <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-lg text-rose-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>⚠️ VULNERABILITY EXPLOITED: {result.count} Records Leaked!</span>
                  </div>
                  <p className="text-xs text-rose-800">
                    Because the server concatenated input directly into the SQL string, the payload evaluated to <strong>TRUE</strong> for every row in the database. All students across all branches were dumped.
                  </p>
                </div>
              ) : result.attackBlocked ? (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-lg text-emerald-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-700">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>🛡️ DEFENSE VERIFIED: 0 Records Returned (Attack Blocked!)</span>
                  </div>
                  <p className="text-xs text-emerald-800">
                    The PostgreSQL engine treated <code>{result.input}</code> strictly as a literal character string value (via <code>$1</code> parameter). The SQL structure remained intact, completely preventing execution of injected logic.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Normal branch search completed: {result.count} matching student(s) found.</span>
                </div>
              )}

              {/* SQL Query Debug Inspector */}
              <div className="bg-slate-900 rounded-lg p-3 text-slate-100 text-xs font-mono space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    Executed SQL Statement
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase">PGlite PostgreSQL Engine</span>
                </div>
                <div className="text-emerald-400 break-all pt-1">
                  {result.executedSql}
                </div>
                {mode === 'secure' && (
                  <div className="text-indigo-300 text-[11px]">
                    Parameters: [ <span className="text-amber-300">"{result.input}"</span> ]
                  </div>
                )}
              </div>

              {/* Leaked / Returned Data Table */}
              <div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Query Results ({result.count} record{result.count === 1 ? '' : 's'})
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">Student Name</th>
                        <th className="py-2 px-3">USN</th>
                        <th className="py-2 px-3">Branch</th>
                        <th className="py-2 px-3">CGPA</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {result.students.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400 italic">
                            No records returned (Expected behavior for defense against injection payload)
                          </td>
                        </tr>
                      ) : (
                        result.students.map((st) => (
                          <tr key={st.id} className={result.attackSuccessful ? 'bg-rose-50/40 hover:bg-rose-50' : 'hover:bg-slate-50'}>
                            <td className="py-2 px-3 font-mono font-medium">{st.id}</td>
                            <td className="py-2 px-3 font-semibold text-slate-900">{st.full_name}</td>
                            <td className="py-2 px-3 font-mono text-slate-600">{st.usn}</td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-800">
                                {st.branch}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-medium">{st.cgpa}</td>
                            <td className="py-2 px-3">
                              {result.attackSuccessful ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  LEAKED DATA
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  NORMAL
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Educational Code Explanation for Viva */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Code className="w-4 h-4 text-indigo-600" />
              <span>Viva Explanation: What is the Difference in the Backend Code?</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded border border-rose-200 space-y-1">
                <span className="font-bold text-rose-700 block">❌ Insecure (Concatenation)</span>
                <pre className="text-[11px] font-mono bg-slate-900 text-rose-300 p-2 rounded overflow-x-auto">
{`// BAD: Concatenation allows code injection
const sql = "SELECT * FROM students " +
  "WHERE branch = '" + branch + "'";
await query(sql);`}
                </pre>
                <p className="text-[11px] text-slate-500">
                  Input escapes the quotes and alters SQL logic.
                </p>
              </div>
              <div className="p-3 bg-white rounded border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-700 block">✅ Secure (Prepared Statement)</span>
                <pre className="text-[11px] font-mono bg-slate-900 text-emerald-300 p-2 rounded overflow-x-auto">
{`// GOOD: Parameterized query ($1)
const sql = "SELECT * FROM students " +
  "WHERE branch = $1";
await query(sql, [branch]);`}
                </pre>
                <p className="text-[11px] text-slate-500">
                  PostgreSQL compiler separates SQL code from data parameters.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>KLE Tech • Laboratory 7: AI-Assisted Security Review & Remediation</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold transition"
          >
            Close Demo
          </button>
        </div>

      </div>
    </div>
  );
};
