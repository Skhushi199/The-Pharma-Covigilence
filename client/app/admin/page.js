'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Shield, Search, AlertTriangle, Clock, CheckCircle, Activity,
  LogOut, ChevronDown, ChevronUp, X, RefreshCw, Loader2, TrendingUp,
  FileText, Users, Zap, FlaskConical
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Badge Components ──────────────────────────────────────────────────────────

function TriageBadge({ bucket, status }) {
  const display = bucket || status;
  if (display === 'Urgent Issue') return <span className="badge-urgent flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Urgent</span>;
  if (display === 'Queue for Assistance' || display === 'Queued for Review') return <span className="badge-queue flex items-center gap-1"><Clock className="w-3 h-3" />Queued</span>;
  if (display === 'Resolved') return <span className="badge-resolved flex items-center gap-1"><CheckCircle className="w-3 h-3" />Resolved</span>;
  return <span className="badge-routine flex items-center gap-1"><Activity className="w-3 h-3" />Routine</span>;
}

function CausalityBadge({ category }) {
  const colors = {
    Probable: 'text-red-400 bg-red-500/10 border-red-500/30',
    Possible: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    Doubtful: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[category] || 'text-emerald-700 bg-slate-500/10 border-slate-500/30'}`}>
      {category || 'N/A'}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`card flex items-center gap-4 border ${bg}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} border`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className="text-emerald-600 text-xs">{label}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Case Detail Modal ────────────────────────────────────────────────────────

function CaseModal({ complaint, onClose, onStatusUpdate }) {
  const [newStatus, setNewStatus] = useState(complaint.status);
  const [notes, setNotes] = useState(complaint.adminNotes || '');
  const [saving, setSaving] = useState(false);
  const [prr, setPrr] = useState(null);
  const [loadingPrr, setLoadingPrr] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateStatus(complaint._id, { status: newStatus, adminNotes: notes, adminValidated: true });
      toast.success('Case updated');
      onStatusUpdate();
      onClose();
    } catch (err) {
      toast.error('Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  const fetchPRR = async () => {
    if (!complaint.meddraTerm) return;
    setLoadingPrr(true);
    try {
      const res = await adminAPI.getPRR(complaint.medicineName, complaint.meddraTerm);
      setPrr(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch PRR signal');
    } finally {
      setLoadingPrr(false);
    }
  };

  const naranjoQuestionLabels = {
    q1: 'Started after taking drug?',
    q2: 'Improved when stopped?',
    q3: 'Reappeared when restarted?',
    q4: 'Severity changed with dose?',
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold gradient-text">{complaint.medicineName}</h2>
            <p className="text-emerald-700 text-sm">{complaint.companyName}</p>
          </div>
          <div className="flex items-center gap-3">
            <TriageBadge bucket={complaint.triageBucket} status={complaint.status} />
            <button onClick={onClose} className="text-emerald-600 hover:text-emerald-900 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl">
            <p className="text-emerald-600 text-xs mb-1">Patient</p>
            <p className="text-emerald-900 text-sm font-semibold">{complaint.userId?.name || 'Anonymous'}</p>
          </div>
          <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl">
            <p className="text-emerald-600 text-xs mb-1">Days Ill</p>
            <p className="text-emerald-900 text-sm font-semibold">{complaint.daysFeelingIll ?? 'N/A'}</p>
          </div>
        </div>

        {/* Symptoms */}
        <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl mb-4">
          <p className="text-emerald-600 text-xs mb-1">Raw Symptom Description</p>
          <p className="text-emerald-900 text-sm leading-relaxed">{complaint.rawSymptomDescription || '—'}</p>
        </div>

        {/* MedDRA + Scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl text-center">
            <p className="text-emerald-600 text-xs">MedDRA Term</p>
            <p className="text-emerald-700 text-xs font-semibold mt-1">{complaint.meddraTerm || '—'}</p>
          </div>
          <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl text-center">
            <p className="text-emerald-600 text-xs">API Severity</p>
            <p className="text-emerald-900 font-bold text-lg mt-1">{complaint.apiSeverityScore ?? '—'}</p>
          </div>
          <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl text-center">
            <p className="text-emerald-600 text-xs">Total Score</p>
            <p className={`font-bold text-lg mt-1 ${complaint.totalIssueScore >= 8 ? 'text-red-400' : complaint.totalIssueScore >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {complaint.totalIssueScore ?? '—'}
            </p>
          </div>
          <div className="p-3 bg-white/80 border border-emerald-100 rounded-xl text-center">
            <p className="text-emerald-600 text-xs">Naranjo Score</p>
            <p className="text-emerald-900 font-bold text-lg mt-1">{complaint.causalityScore ?? '—'}</p>
          </div>
        </div>

        {/* Causality */}
        <div className="flex items-center justify-between p-3 bg-white/80 border border-emerald-100 rounded-xl mb-4">
          <span className="text-emerald-700 text-sm">Causality Category</span>
          <CausalityBadge category={complaint.causalityCategory} />
        </div>

        {/* Naranjo Answers */}
        {complaint.naranjoAnswers && (
          <div className="mb-4">
            <p className="text-emerald-600 text-xs mb-2 uppercase tracking-wider">Naranjo Answers</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(complaint.naranjoAnswers).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-2.5 bg-white/80 border border-emerald-100 rounded-lg">
                  <span className="text-emerald-700 text-xs">{naranjoQuestionLabels[key]}</span>
                  <span className={`text-xs font-semibold capitalize ${val === 'yes' ? 'text-emerald-400' : val === 'no' ? 'text-red-400' : 'text-emerald-700'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRR Signal Detection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-emerald-600 text-xs uppercase tracking-wider">PRR Signal Detection</p>
            <button onClick={fetchPRR} disabled={loadingPrr} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
              {loadingPrr ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlaskConical className="w-3 h-3" />}
              Run PRR Analysis
            </button>
          </div>
          {prr && (
            <div className={`p-3 rounded-xl border ${prr.isSignal ? 'bg-red-500/10 border-red-500/30' : 'bg-white/80 border border-emerald-100 border-emerald-200'}`}>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <span className="text-emerald-700">PRR: <span className="text-emerald-900 font-bold">{prr.prr ?? 'N/A'}</span></span>
                <span className="text-emerald-700">χ²: <span className="text-emerald-900 font-bold">{prr.chiSquare ?? 'N/A'}</span></span>
                <span className="text-emerald-700">Reports (a): <span className="text-emerald-900 font-bold">{prr.matrix?.a}</span></span>
                <span className="text-emerald-700">Total (N): <span className="text-emerald-900 font-bold">{prr.N}</span></span>
              </div>
              <p className={`text-xs font-semibold ${prr.isSignal ? 'text-red-400' : 'text-emerald-700'}`}>{prr.interpretation}</p>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <div className="border-t border-emerald-200 pt-4 space-y-3">
          <div>
            <label className="text-emerald-700 text-xs mb-2 block">Update Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input-field text-sm"
            >
              {['Queued for Review', 'Urgent Issue', 'Resolved'].map(s => (
                <option key={s} value={s} className="bg-amber-50">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-emerald-700 text-xs mb-2 block">Admin Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add investigation notes..."
              className="input-field text-sm resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Save & Validate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Custom Tooltip for Recharts ───────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass px-4 py-3 rounded-xl border border-emerald-200">
        <p className="text-emerald-700 font-semibold text-xs mb-1">{label}</p>
        <p className="text-emerald-900 text-sm">Count: <span className="font-bold text-emerald-400">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [sortField, setSortField] = useState('totalIssueScore');
  const [sortDir, setSortDir] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('pv_token');
    const userData = localStorage.getItem('pv_user');
    if (!token || !userData) { router.replace('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'admin') { router.replace('/chat'); return; }
    setUser(parsed);
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, queueRes] = await Promise.all([adminAPI.getStats(), adminAPI.getQueue()]);
      setStats(statsRes.data.data);
      setQueue(queueRes.data.data);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setSearchLoading(true);
    try {
      const res = await adminAPI.getMedicineAnalytics(searchTerm);
      setAnalyticsData(res.data.data);
    } catch (err) {
      toast.error('No data found for this medicine');
      setAnalyticsData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('pv_token');
    localStorage.removeItem('pv_user');
    router.push('/');
  };

  const filteredQueue = queue
    .filter((c) => filterStatus === 'all' || c.status === filterStatus || c.triageBucket === filterStatus)
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      if (sortField === 'totalIssueScore') return dir * ((a.totalIssueScore || 0) - (b.totalIssueScore || 0));
      if (sortField === 'createdAt') return dir * (new Date(a.createdAt) - new Date(b.createdAt));
      return 0;
    });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-emerald-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Top Nav ── */}
      <nav className="glass border-b border-emerald-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold gradient-text">PharmaVigil</span>
              <span className="text-emerald-600 text-xs ml-2">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={loadDashboard} className="text-emerald-700 hover:text-emerald-900 transition-colors p-2">
              <RefreshCw className="w-4 h-4" />
            </button>
            <span className="text-emerald-700 text-sm hidden sm:block">{user?.name}</span>
            <button onClick={logout} className="text-emerald-600 hover:text-red-400 transition-colors p-2">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Stats Bar ── */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FileText} label="Total Reports" value={stats.total} color="text-emerald-600" bg="bg-emerald-50 border-emerald-500/20" />
            <StatCard icon={AlertTriangle} label="Urgent Issues" value={stats.urgent} color="text-red-400" bg="bg-red-500/10 border-red-500/20" />
            <StatCard icon={Clock} label="In Queue" value={stats.queued} color="text-amber-400" bg="bg-amber-500/10 border-amber-500/20" />
            <StatCard icon={CheckCircle} label="Resolved" value={stats.resolved} color="text-emerald-400" bg="bg-emerald-500/10 border-emerald-500/20" />
          </div>
        )}

        {/* ── Medicine Search & Analytics ── */}
        <div className="card">
          <h2 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Medicine Signal Analytics
          </h2>
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <input
                id="medicine-search"
                type="text"
                placeholder="Search medicine name (e.g. Aspirin)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field pl-10"
              />
            </div>
            <button id="run-analytics" onClick={handleSearch} disabled={searchLoading} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Analyse
            </button>
          </div>

          {analyticsData && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-white/80 border border-emerald-100 rounded-xl text-center">
                  <p className="text-emerald-600 text-xs mb-1">Total Reports</p>
                  <p className="text-3xl font-black text-emerald-600">{analyticsData.totalComplaints}</p>
                </div>
                <div className="p-4 bg-white/80 border border-emerald-100 rounded-xl text-center">
                  <p className="text-emerald-600 text-xs mb-1">Avg Severity</p>
                  <p className="text-3xl font-black text-amber-400">{analyticsData.severityStats?.avgSeverity?.toFixed(1) ?? '—'}</p>
                </div>
                <div className="p-4 bg-white/80 border border-emerald-100 rounded-xl text-center">
                  <p className="text-emerald-600 text-xs mb-1">Max Severity</p>
                  <p className={`text-3xl font-black ${analyticsData.severityStats?.maxSeverity >= 8 ? 'text-red-400' : 'text-emerald-900'}`}>
                    {analyticsData.severityStats?.maxSeverity ?? '—'}
                  </p>
                </div>
              </div>

              {/* Bar Chart */}
              {analyticsData.chartData?.length > 0 && (
                <div>
                  <h3 className="text-emerald-700 text-sm font-semibold mb-3 uppercase tracking-wider">
                    MedDRA Term Distribution — {analyticsData.medicineName}
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          angle={-35}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {analyticsData.chartData.map((_, i) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Sorted Table */}
              {analyticsData.complaints?.length > 0 && (
                <div>
                  <h3 className="text-emerald-700 text-sm font-semibold mb-3 uppercase tracking-wider">Cases Sorted by Severity</h3>
                  <div className="overflow-x-auto rounded-xl border border-emerald-200">
                    <table className="w-full text-sm">
                      <thead className="bg-white/80 border border-emerald-100">
                        <tr>
                          <th className="text-left px-4 py-3 text-emerald-700 font-semibold">MedDRA Term</th>
                          <th className="text-left px-4 py-3 text-emerald-700 font-semibold">Patient</th>
                          <th className="text-center px-4 py-3 text-emerald-700 font-semibold">Severity</th>
                          <th className="text-center px-4 py-3 text-emerald-700 font-semibold">Causality</th>
                          <th className="text-center px-4 py-3 text-emerald-700 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {analyticsData.complaints.map((c) => (
                          <tr key={c._id} className="hover:bg-white border border-emerald-100/30 transition-colors cursor-pointer" onClick={() => setSelectedCase(c)}>
                            <td className="px-4 py-3 text-emerald-700 text-xs">{c.meddraTerm || '—'}</td>
                            <td className="px-4 py-3 text-emerald-800">{c.userId?.name || 'Anonymous'}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-bold ${c.totalIssueScore >= 8 ? 'text-red-400' : c.totalIssueScore >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {c.totalIssueScore ?? '—'}/10
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center"><CausalityBadge category={c.causalityCategory} /></td>
                            <td className="px-4 py-3 text-center"><TriageBadge status={c.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Triage Queue ── */}
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Triage Queue
              <span className="text-emerald-600 text-sm font-normal">({filteredQueue.length} cases)</span>
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field text-sm py-2 w-auto"
              >
                <option value="all" className="bg-amber-50">All Cases</option>
                <option value="Urgent Issue" className="bg-amber-50">Urgent</option>
                <option value="Queued for Review" className="bg-amber-50">Queued</option>
                <option value="Resolved" className="bg-amber-50">Resolved</option>
              </select>
            </div>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="text-center py-16 text-emerald-600">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No cases in the queue</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-emerald-200">
              <table className="w-full text-sm">
                <thead className="bg-white border border-emerald-100/60">
                  <tr>
                    <th className="text-left px-4 py-3 text-emerald-700 font-semibold">Medicine</th>
                    <th className="text-left px-4 py-3 text-emerald-700 font-semibold hidden md:table-cell">MedDRA Term</th>
                    <th className="text-left px-4 py-3 text-emerald-700 font-semibold hidden lg:table-cell">Patient</th>
                    <th
                      className="text-center px-4 py-3 text-emerald-700 font-semibold cursor-pointer hover:text-emerald-900 transition-colors"
                      onClick={() => toggleSort('totalIssueScore')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Severity
                        {sortField === 'totalIssueScore' ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : null}
                      </div>
                    </th>
                    <th className="text-center px-4 py-3 text-emerald-700 font-semibold">Triage</th>
                    <th className="text-center px-4 py-3 text-emerald-700 font-semibold">Causality</th>
                    <th className="text-center px-4 py-3 text-emerald-700 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredQueue.map((c, i) => (
                    <tr
                      key={c._id}
                      className={`hover:bg-white border border-emerald-100/30 transition-colors ${c.triageBucket === 'Urgent Issue' ? 'bg-red-500/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-emerald-900">{c.medicineName}</p>
                        <p className="text-emerald-600 text-xs">{c.companyName}</p>
                      </td>
                      <td className="px-4 py-3 text-emerald-700 text-xs hidden md:table-cell">{c.meddraTerm || '—'}</td>
                      <td className="px-4 py-3 text-emerald-800 text-xs hidden lg:table-cell">{c.userId?.name || 'Anonymous'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-base ${c.totalIssueScore >= 8 ? 'text-red-400' : c.totalIssueScore >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {c.totalIssueScore ?? '—'}<span className="text-emerald-700 text-xs">/10</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center"><TriageBadge bucket={c.triageBucket} status={c.status} /></td>
                      <td className="px-4 py-3 text-center"><CausalityBadge category={c.causalityCategory} /></td>
                      <td className="px-4 py-3 text-center">
                        <button
                          id={`view-case-${i}`}
                          onClick={() => setSelectedCase(c)}
                          className="btn-secondary text-xs py-1.5 px-3"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Case Modal ── */}
      {selectedCase && (
        <CaseModal
          complaint={selectedCase}
          onClose={() => setSelectedCase(null)}
          onStatusUpdate={loadDashboard}
        />
      )}
    </div>
  );
}
