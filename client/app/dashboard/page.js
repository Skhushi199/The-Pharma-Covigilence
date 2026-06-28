'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, FileText, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { complaintAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function PatientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintAPI.getMyComplaints();
      setComplaints(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load past reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('pv_token');
    const userData = localStorage.getItem('pv_user');
    
    if (!token || !userData) {
      router.replace('/login');
      return;
    }
    
    const parsed = JSON.parse(userData);
    if (parsed.role === 'admin') {
      router.replace('/admin');
      return;
    }
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(parsed);
    fetchMyComplaints();
  }, [router]);

  const logout = () => {
    localStorage.removeItem('pv_token');
    localStorage.removeItem('pv_user');
    router.push('/');
  };

  // Analytics calculations
  const totalReports = complaints.length;
  const highSeverityCount = complaints.filter(c => c.totalIssueScore >= 8).length;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-emerald-100 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-emerald-950 text-lg">PharmaVigil</h1>
              <p className="text-emerald-600 text-xs font-medium">Patient Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-emerald-950">{user?.name}</p>
              <p className="text-xs text-emerald-600">Patient</p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-emerald-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-emerald-950">Your ADR Reports</h2>
            <p className="text-emerald-700">Track and manage your submitted adverse drug reactions.</p>
          </div>
          <button 
            onClick={() => router.push('/chat')}
            className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-emerald-500/20 animate-pulse-glow"
          >
            <Plus className="w-5 h-5" />
            Report New Symptom
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p>Loading your reports...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <p className="text-emerald-600 font-medium">Total Reports Filed</p>
                  <p className="text-3xl font-black text-emerald-950">{totalReports}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <p className="text-red-600 font-medium">High Severity Reports (8+)</p>
                  <p className="text-3xl font-black text-red-950">{highSeverityCount}</p>
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-emerald-50 bg-emerald-50/30">
                <h3 className="font-bold text-emerald-950">Report History</h3>
              </div>
              
              {complaints.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-emerald-300" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-950 mb-1">No reports yet</h4>
                  <p className="text-emerald-600">You haven&apos;t filed any adverse drug reaction reports.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-emerald-50/50">
                        <th className="px-6 py-4 text-xs font-semibold text-emerald-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-xs font-semibold text-emerald-700 uppercase tracking-wider">Medicine</th>
                        <th className="px-6 py-4 text-xs font-semibold text-emerald-700 uppercase tracking-wider">MedDRA Term</th>
                        <th className="px-6 py-4 text-xs font-semibold text-emerald-700 uppercase tracking-wider">Causality</th>
                        <th className="px-6 py-4 text-xs font-semibold text-emerald-700 uppercase tracking-wider text-right">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50">
                      {complaints.map((c) => (
                        <tr key={c._id} className="hover:bg-emerald-50/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-emerald-900 whitespace-nowrap">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-emerald-950">{c.medicineName}</div>
                            <div className="text-xs text-emerald-600">{c.companyName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {c.meddraTerm || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                              ${c.causalityCategory === 'Definite' ? 'bg-red-50 text-red-700 border-red-200' :
                                c.causalityCategory === 'Probable' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                c.causalityCategory === 'Possible' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                              }
                            `}>
                              {c.causalityCategory || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-sm font-bold ${
                              c.totalIssueScore >= 8 ? 'text-red-500' :
                              c.totalIssueScore >= 4 ? 'text-amber-500' :
                              'text-emerald-500'
                            }`}>
                              {c.totalIssueScore || 0}/10
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
