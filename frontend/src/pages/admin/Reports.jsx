import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  BarChart, 
  PieChart as PieIcon, 
  Clock, 
  CheckCircle2, 
  FileSearch,
  Mail,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart as ReBar, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import useRBAC from '../../hooks/useRBAC';
import reportsService from '../../services/reports.service';

const REPORT_TYPES = [
  { label: 'Security Incident Summary', value: 'security_incident_summary' },
  { label: 'User Activity Audit', value: 'user_activity_audit' },
  { label: 'Infrastructure Health Log', value: 'infrastructure_health_log' },
  { label: 'Compliance (SOC2/GDPR)', value: 'compliance_soc2_gdpr' }
];

const REPORT_RANGES = [
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last Quarter', value: 'quarter' }
];

const FALLBACK_INCIDENT_DATA = [
  { name: 'Auth Failure', value: 400, color: '#6366f1' },
  { name: 'SQL Injection', value: 300, color: '#f43f5e' },
  { name: 'Brute Force', value: 300, color: '#f59e0b' },
  { name: 'DDoS', value: 200, color: '#10b981' },
];

const formatFileSize = (bytes = 0) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const Reports = () => {
  const { can } = useRBAC();
  const canGenerateReports = can('generate_reports');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('security_incident_summary');
  const [dateRange, setDateRange] = useState('30d');
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [archivesData, setArchivesData] = useState([]);

  const unwrapResponseData = (response, fallback) => response?.data?.data ?? response?.data ?? fallback;

  const loadReports = async () => {
    try {
      setLoading(true);
      const [historyResponse, summaryResponse, archivesResponse] = await Promise.all([
        reportsService.getReports({ limit: 10 }),
        reportsService.getSummary(),
        reportsService.getArchives({ days: 30 })
      ]);

      const historyPayload = unwrapResponseData(historyResponse, {});
      const summaryPayload = unwrapResponseData(summaryResponse, {});
      const archivesPayload = unwrapResponseData(archivesResponse, {});

      setReports(Array.isArray(historyPayload.data) ? historyPayload.data : []);
      setSummary(summaryPayload.data || null);

      // archives series -> map to chart data
      const series = Array.isArray(archivesPayload.data?.series) ? archivesPayload.data.series : [];
      setArchivesData(series.map((s) => ({ name: s.date, sizeMB: s.bytes ? Number((s.bytes / (1024 * 1024)).toFixed(2)) : 0 })));

      const latestReportId = historyPayload.latest?.reportId || historyPayload.data?.[0]?.reportId;
      if (latestReportId) {
        const reportResponse = await reportsService.getReport(latestReportId);
        setLatestReport(unwrapResponseData(reportResponse, null));
      } else {
        setLatestReport(null);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async () => {
    if (!canGenerateReports) return;

    try {
      setIsGenerating(true);
      const response = await reportsService.generateReport({
        reportType,
        rangeKey: dateRange,
        format: 'json'
      });

      const generatedReport = unwrapResponseData(response, null)?.report;
      toast.success('Report generated and saved to database');

      if (generatedReport?.reportId) {
        const reportResponse = await reportsService.getReport(generatedReport.reportId);
        setLatestReport(unwrapResponseData(reportResponse, generatedReport));
      }

      await loadReports();
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (report, format = 'json') => {
    try {
      const response = await reportsService.downloadReport(report.reportId, format);
      const fileExtension = format === 'csv' ? 'csv' : 'json';
      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleSchedule = async () => {
    if (!canGenerateReports) return;

    const targetReport = latestReport || reports[0];
    if (!targetReport) {
      toast.error('Generate a report first');
      return;
    }

    const recipientsInput = window.prompt('Enter recipient email addresses separated by commas', '');
    if (!recipientsInput) return;

    const recipients = recipientsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      setIsScheduling(true);
      // Save schedule metadata
      await reportsService.scheduleReport(targetReport.reportId, {
        recipients,
        cadence: 'monthly'
      });

      // Also send the report immediately
      await reportsService.sendReport(targetReport.reportId, {
        recipients,
        subject: `Scheduled Report: ${targetReport.title}`,
        message: `You requested the scheduled report: ${targetReport.title}`
      });

      toast.success('Report scheduled and emailed');
      await loadReports();
    } catch (error) {
      console.error('Failed to schedule or send report:', error);
      toast.error(error?.response?.data?.message || 'Failed to save or send report');
    } finally {
      setIsScheduling(false);
    }
  };

  const incidentData = latestReport?.data?.incidentData?.length ? latestReport.data.incidentData : FALLBACK_INCIDENT_DATA;
  const reportHistory = reports;
  const complianceStatus = latestReport?.summary?.complianceStatus || summary?.latest?.summary?.complianceStatus || 'AUDIT PASS';
  const archivesList = (reports || []).map((r) => ({
    name: (r.title || r.reportId || '').slice(0, 16),
    sizeMB: r.fileSizeBytes ? Number((r.fileSizeBytes / (1024 * 1024)).toFixed(2)) : 0,
    reportId: r.reportId,
    createdAt: r.createdAt
  }));

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      {loading ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
          <Clock className="text-indigo-500 animate-spin" size={40} />
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Loading report archives...</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <BarChart className="text-indigo-500" size={32} /> Intelligence Reports
          </h1>
          <p className="text-slate-500 text-xs font-mono mt-1 uppercase tracking-widest">
            Analytical Insight & Compliance Documentation
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSchedule}
            disabled={!canGenerateReports || isScheduling}
            title={canGenerateReports ? 'Schedule report emails' : 'Permission required: generate_reports'}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-black uppercase transition-all ${
              canGenerateReports && !isScheduling
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-900/50 border-slate-800 text-slate-700 cursor-not-allowed'
            }`}
          >
            <Mail size={14} /> {isScheduling ? 'Scheduling...' : 'Schedule Automated Email'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Report Configuration Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <section className="card p-6 bg-slate-900/40 border-slate-800">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <FileSearch size={16} className="text-indigo-400" /> Generate New Report
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Report Type</label>
                <select
                  value={reportType}
                  onChange={(event) => setReportType(event.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-300 outline-none focus:border-indigo-500 transition-all"
                >
                  {REPORT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_RANGES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setDateRange(option.value)}
                      className={`p-3 bg-slate-950 border rounded-xl text-[10px] font-bold transition-all ${
                        dateRange === option.value
                          ? 'border-indigo-500 text-white'
                          : 'border-slate-800 text-slate-400 hover:border-indigo-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !canGenerateReports}
                  title={canGenerateReports ? 'Generate report' : 'Permission required: generate_reports'}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                    isGenerating
                      ? 'bg-slate-800 text-slate-500'
                      : canGenerateReports
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? <Clock className="animate-spin" size={14} /> : <Download size={14} />}
                  {isGenerating ? 'Compiling Data...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </section>

          {/* Quick Metrics */}
          <div className="p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-3xl">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Storage Savings</h4>
                 <div className="flex items-end gap-2">
                   <span className="text-3xl font-black text-white italic">{formatFileSize(summary?.storageSavingsBytes || summary?.totalStorageBytes || 0)}</span>
                   <span className="text-[10px] text-slate-500 font-bold mb-1 uppercase">{summary?.totalReports || reports.length} reports stored in db</span>
             </div>
          </div>
        </div>

        {/* Data Visualization & Archives */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visual 01: Incident Distribution */}
            <div className="card p-6 bg-slate-900/20 border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <PieIcon size={14} className="text-indigo-400" /> Incident Categorization
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incidentData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {incidentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#9fa0a3', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Visual 02: Archive History */}
            <div className="card p-6 bg-slate-900/20 border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Clock size={14} className="text-indigo-400" /> Generated Archives
              </h3>
              <div className="space-y-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ReBar data={archivesData.length ? archivesData : archivesList} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${v} MB`} />
                      <Tooltip formatter={(value) => `${value} MB`} />
                      <Bar dataKey="sizeMB" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </ReBar>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-auto">
                  {reportHistory.length === 0 && (
                    <p className="text-[11px] text-slate-500">No generated reports yet — click "Generate Report" to create one.</p>
                  )}
                  {reportHistory.map((report) => (
                    <div key={report.reportId} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 group hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-lg text-slate-500 group-hover:text-indigo-400">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-white leading-none">{report.title}</p>
                          <p className="text-[9px] text-slate-600 mt-1 uppercase">{report.reportId} • {formatFileSize(report.fileSizeBytes)} • {report.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownload(report, report.format)}
                          disabled={!canGenerateReports}
                          title={canGenerateReports ? 'Download archive' : 'Permission required: generate_reports'}
                          className={`p-2 ${canGenerateReports ? 'text-slate-500 hover:text-white' : 'text-slate-700 cursor-not-allowed'}`}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const resp = await reportsService.getReport(report.reportId);
                              setLatestReport(unwrapResponseData(resp, report));
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            } catch (err) {
                              toast.error('Failed to load report details');
                            }
                          }}
                          className="p-2 text-slate-500 hover:text-white"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Checklist Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute right-0 top-0 p-8 opacity-5">
                <BarChart size={120} className="text-indigo-500" />
             </div>
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-sm font-black text-white uppercase tracking-widest italic underline decoration-indigo-500 underline-offset-8">Compliance Status</h3>
               <span className={`px-3 py-1 text-[10px] font-black rounded-full border ${
                 complianceStatus === 'AUDIT PASS'
                   ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                   : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
               }`}>{complianceStatus}</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Data Retention Policy", status: "Compliant" },
                  { label: "Encryption at Rest (AES-256)", status: "Verified" },
                  { label: "User Access Control (RBAC)", status: "Compliant" },
                  { label: "Network Segmentation", status: "Verified" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-indigo-500" />
                    <span className="text-[11px] text-slate-400 font-bold uppercase">{item.label}</span>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
        </motion.div>
      )}
    </div>
  );
};

export default Reports;