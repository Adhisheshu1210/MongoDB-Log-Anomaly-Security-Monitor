import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Check, ChevronLeft, ChevronRight, RefreshCw, 
  Search, ShieldAlert, Trash2, X, Eye, Terminal, Database, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// --- DATA SOURCE: THE CORE 50+ RECORDSET ---
const INITIAL_DATASET = [
  { _id: "645f01a1b2c3d4e5f6000001", severity: "critical", message: "NoSQL Injection: Operator payload injection '{$gt: \"\"}' detected", status: "new", createdAt: "2026-05-14T17:15:00Z", source_ip: "185.220.101.5", collection: "crm_users", tactic: "Credential Access" },
  { _id: "645f01a1b2c3d4e5f6000002", severity: "high", message: "Brute Force: 450 failed SSH login attempts detected for user 'root'", status: "new", createdAt: "2026-05-14T17:12:30Z", source_ip: "45.133.194.22", collection: "system_auth", tactic: "Credential Access" },
  { _id: "645f01a1b2c3d4e5f6000003", severity: "medium", message: "Lateral Movement: Anomalous internal SMB session mapping to domain controller", status: "acknowledged", createdAt: "2026-05-14T16:55:00Z", source_ip: "10.0.4.112", collection: "windows_events", tactic: "Lateral Movement" },
  { _id: "645f01a1b2c3d4e5f6000004", severity: "critical", message: "Data Exfiltration: High-frequency TXT records pointing to rogue nameserver", status: "investigating", createdAt: "2026-05-14T16:40:12Z", source_ip: "192.168.42.55", collection: "dns_query_log", tactic: "Exfiltration" },
  { _id: "645f01a1b2c3d4e5f6000005", severity: "high", message: "Unauthorized AWS S3 API Call: ListObjects from unverified Tor exit node", status: "new", createdAt: "2026-05-14T16:22:15Z", source_ip: "176.10.99.200", collection: "cloudtrail_logs", tactic: "Discovery" },
  { _id: "645f01a1b2c3d4e5f6000006", severity: "low", message: "Policy Deviation: Outbound cleartext FTP connections initiated from staging", status: "resolved", createdAt: "2026-05-14T15:58:00Z", source_ip: "10.0.9.44", collection: "zeek_conn", tactic: "Execution" },
  { _id: "645f01a1b2c3d4e5f6000007", severity: "critical", message: "Ransomware Heuristic: Mass file renaming pattern match (.locked suffix)", status: "new", createdAt: "2026-05-14T15:30:45Z", source_ip: "10.0.2.89", collection: "sysmon_logs", tactic: "Impact" },
  { _id: "645f01a1b2c3d4e5f6000008", severity: "high", message: "Kubernetes Privilege Escalation: ServiceAccount binding modified outside CI/CD pipeline", status: "new", createdAt: "2026-05-14T15:11:20Z", source_ip: "10.244.3.12", collection: "k8s_audit", tactic: "Privilege Escalation" },
  { _id: "645f01a1b2c3d4e5f6000009", severity: "medium", message: "Suspicious User Agent: Python-requests client interacting with payment gateway API", status: "acknowledged", createdAt: "2026-05-14T14:48:10Z", source_ip: "82.102.23.41", collection: "nginx_access", tactic: "Initial Access" },
  { _id: "645f01a1b2c3d4e5f6000010", severity: "low", message: "Port Scan Activity: Sequential SYN requests across 1024 ports from singular external host", status: "resolved", createdAt: "2026-05-14T14:22:00Z", source_ip: "198.51.100.12", collection: "suricata_alerts", tactic: "Reconnaissance" },
  { _id: "645f01a1b2c3d4e5f6000011", severity: "critical", message: "NoSQL Injection: Heavy script injection payload detected in client search parameters", status: "new", createdAt: "2026-05-14T14:05:12Z", source_ip: "185.220.101.12", collection: "crm_users", tactic: "Initial Access" },
  { _id: "645f01a1b2c3d4e5f6000012", severity: "high", message: "Compromised Asset: Host beaconing behavior to known C2 dynamic domain", status: "investigating", createdAt: "2026-05-14T13:50:00Z", source_ip: "10.0.4.52", collection: "zeek_dns", tactic: "Command and Control" },
  { _id: "645f01a1b2c3d4e5f6000013", severity: "medium", message: "Identity Threat: MFA fatigue attempt bypass sequence observed for administrator account", status: "new", createdAt: "2026-05-14T13:12:44Z", source_ip: "104.244.42.1", collection: "okta_logs", tactic: "Credential Access" },
  { _id: "645f01a1b2c3d4e5f6000014", severity: "high", message: "Webshell Execution: Unexpected php binary runtime spawned under apache context", status: "new", createdAt: "2026-05-14T12:45:19Z", source_ip: "91.211.89.4", collection: "sysmon_logs", tactic: "Persistence" },
  { _id: "645f01a1b2c3d4e5f6000015", severity: "medium", message: "Database Leak Precursor: Query count benchmark baseline exceeded by 700%", status: "acknowledged", createdAt: "2026-05-14T12:10:00Z", source_ip: "10.0.12.8", collection: "mongodb_audit", tactic: "Collection" },
  { _id: "645f01a1b2c3d4e5f6000016", severity: "low", message: "Suspicious Cron Modification: Hidden root task appended inside /etc/cron.d/", status: "resolved", createdAt: "2026-05-14T11:32:00Z", source_ip: "127.0.0.1", collection: "auditd_logs", tactic: "Persistence" },
  { _id: "645f01a1b2c3d4e5f6000017", severity: "critical", message: "Kerberoasting Anomaly: SPN extraction request burst targeting Domain Admins", status: "new", createdAt: "2026-05-14T11:04:15Z", source_ip: "10.0.4.19", collection: "windows_events", tactic: "Credential Access" },
  { _id: "645f01a1b2c3d4e5f6000018", severity: "high", message: "Docker Socket Mount: Container spawned with highly insecure host mapping permissions", status: "new", createdAt: "2026-05-14T10:45:00Z", source_ip: "10.244.1.92", collection: "docker_events", tactic: "Privilege Escalation" },
  { _id: "645f01a1b2c3d4e5f6000019", severity: "medium", message: "Defacement Attempt: XSS injection vectors identified inside static asset paths", status: "new", createdAt: "2026-05-14T10:15:33Z", source_ip: "213.87.12.99", collection: "nginx_access", tactic: "Initial Access" },
  { _id: "645f01a1b2c3d4e5f6000020", severity: "low", message: "TLS Insecurity: Legacy SHA-1 certificate configuration negotiations requested", status: "resolved", createdAt: "2026-05-14T09:44:00Z", source_ip: "192.168.1.201", collection: "zeek_ssl", tactic: "Initial Access" },
  { _id: "645f01a1b2c3d4e5f6000021", severity: "critical", message: "Log Tampering: Security log sequence clears executed via PowerShell command execution", status: "new", createdAt: "2026-05-14T09:12:11Z", source_ip: "10.0.5.210", collection: "windows_powershell", tactic: "Defense Evasion" },
  { _id: "645f01a1b2c3d4e5f6000022", severity: "high", message: "API Defacement: High quantity of HTTP 500 responses mapping back to fuzz parameters", status: "investigating", createdAt: "2026-05-14T08:50:00Z", source_ip: "43.229.53.12", collection: "nginx_access", tactic: "Impact" },
  { _id: "645f01a1b2c3d4e5f6000023", severity: "medium", message: "Data Harvesting: Automated scraper bot hitting transactional catalog interfaces", status: "acknowledged", createdAt: "2026-05-14T08:14:22Z", source_ip: "141.101.90.11", collection: "nginx_access", tactic: "Collection" },
  { _id: "645f01a1b2c3d4e5f6000024", severity: "low", message: "Internal Sweep: ICMP Echo profiling sequences running out of desktop zones", status: "new", createdAt: "2026-05-14T07:44:00Z", source_ip: "10.100.4.15", collection: "suricata_alerts", tactic: "Discovery" },
  { _id: "645f01a1b2c3d4e5f6000025", severity: "high", message: "Shadow IT: Unauthorized direct connectivity to public code repository endpoints", status: "new", createdAt: "2026-05-14T07:11:03Z", source_ip: "10.100.5.88", collection: "zeek_conn", tactic: "Exfiltration" },
  { _id: "645f01a1b2c3d4e5f6000026", severity: "critical", message: "Process Masquerading: Non-system binary running disguised inside svchost directory structure", status: "new", createdAt: "2026-05-14T06:44:22Z", source_ip: "10.0.4.81", collection: "sysmon_logs", tactic: "Defense Evasion" },
  { _id: "645f01a1b2c3d4e5f6000027", severity: "medium", message: "Insecure Deployment: Unencrypted administrative credentials discovered in deployment environmental variables", status: "new", createdAt: "2026-05-14T06:12:00Z", source_ip: "10.244.0.5", collection: "k8s_audit", tactic: "Credential Access" },
  { _id: "645f01a1b2c3d4e5f6000028", severity: "low", message: "DNS Anomalies: Domain generation algorithms (DGA) entropy spike flags active", status: "resolved", createdAt: "2026-05-14T05:32:19Z", source_ip: "192.168.12.5", collection: "dns_query_log", tactic: "Command and Control" },
  { _id: "645f01a1b2c3d4e5f6000029", severity: "high", message: "Unusual Work Hour Authentication: Superuser session initialized at 02:11 AM PST", status: "investigating", createdAt: "2026-05-14T02:11:00Z", source_ip: "94.45.12.80", collection: "system_auth", tactic: "Initial Access" },
  { _id: "645f01a1b2c3d4e5f6000030", severity: "critical", message: "Exfiltration Target: Mass database dump execution sequence inside staging server clusters", status: "new", createdAt: "2026-05-14T01:55:40Z", source_ip: "10.0.12.92", collection: "mongodb_audit", tactic: "Exfiltration" },
  { _id: "645f01a1b2c3d4e5f6000031", severity: "high", message: "SSH Poisoning Variant: Libssh vulnerability probes directed at edge perimeter servers", status: "new", createdAt: "2026-05-14T01:22:15Z", source_ip: "210.45.92.103", collection: "system_auth", tactic: "Initial Access" },
  { _id: "645f01a1b2c3d4e5f6000032", severity: "medium", message: "Malicious Attachment Triggered: Macro payload initialization vectors from host workspace", status: "acknowledged", createdAt: "2026-05-13T23:44:00Z", source_ip: "10.100.8.4", collection: "sysmon_logs", tactic: "Execution" },
  { _id: "645f01a1b2c3d4e5f6000033", severity: "low", message: "Internal Information Disclosure: Directory traversal query strings indexed by edge WAF modules", status: "resolved", createdAt: "2026-05-13T22:50:11Z", source_ip: "122.45.190.2", collection: "nginx_access", tactic: "Discovery" },
  { _id: "645f01a1b2c3d4e5f6000034", severity: "critical", message: "Zero-Day Exploit Signature: Out-of-bounds memory reading probes detected against HTTP nodes", status: "new", createdAt: "2026-05-13T22:11:45Z", source_ip: "194.22.108.4", collection: "suricata_alerts", tactic: "Initial Access" },
  { _id: "645f01a1b2c3d4e5f6000035", severity: "high", message: "Cloud Pipeline Ingress: Direct token modifications inside active continuous code deployment runners", status: "new", createdAt: "2026-05-13T21:40:00Z", source_ip: "13.44.192.5", collection: "cloudtrail_logs", tactic: "Defense Evasion" },
  { _id: "645f01a1b2c3d4e5f6000036", severity: "medium", message: "NoSQL Access Abuses: High query data yield requests out of authentication boundaries", status: "new", createdAt: "2026-05-13T21:05:00Z", source_ip: "10.0.12.14", collection: "crm_users", tactic: "Collection" },
  { _id: "645f01a1b2c3d4e5f6000037", severity: "low", message: "Network Scan Mapping: High volume ping scans operating across testing architecture grids", status: "resolved", createdAt: "2026-05-13T20:44:11Z", source_ip: "10.200.4.1", collection: "zeek_conn", tactic: "Reconnaissance" },
  { _id: "645f01a1b2c3d4e5f6000038", severity: "high", message: "Privileged Execution Signature: Sudden elevation actions flagged from untracked internal processes", status: "new", createdAt: "2026-05-13T19:55:00Z", source_ip: "10.0.2.14", collection: "auditd_logs", tactic: "Privilege Escalation" },
  { _id: "645f01a1b2c3d4e5f6000039", severity: "critical", message: "Golden Ticket Abuse: Anomalous Kerberos authentication patterns referencing non-existent objects", status: "new", createdAt: "2026-05-13T19:22:10Z", source_ip: "10.0.4.2", collection: "windows_events", tactic: "Lateral Movement" },
  { _id: "645f01a1b2c3d4e5f6000040", severity: "medium", message: "API Token Harvesting: Git search indexing exposure anomalies tracked down inside build logs", status: "acknowledged", createdAt: "2026-05-13T18:40:00Z", source_ip: "127.0.0.1", collection: "docker_events", tactic: "Credential Access" },
  { _id: "645f01a1b2c3d4e5f6000041", severity: "low", message: "Security Settings Modified: System host firewall rule drops manually cleared via shell scripts", status: "resolved", createdAt: "2026-05-13T18:12:44Z", source_ip: "10.0.1.15", collection: "auditd_logs", tactic: "Defense Evasion" },
  { _id: "645f01a1b2c3d4e5f6000042", severity: "high", message: "Proxy Chain Activity: Encrypted reverse-tunnel operations actively binding to external gateways", status: "new", createdAt: "2026-05-13T17:55:00Z", source_ip: "10.0.9.11", collection: "zeek_conn", tactic: "Command and Control" },
  { _id: "645f01a1b2c3d4e5f6000043", severity: "critical", message: "Data Exfiltration: Multi-gigabyte archive transfer stream finalized toward unknown IP nodes", status: "new", createdAt: "2026-05-13T17:15:30Z", source_ip: "10.0.12.5", collection: "mongodb_audit", tactic: "Exfiltration" },
  { _id: "645f01a1b2c3d4e5f6000044", severity: "medium", message: "NoSQL Injection Vector: Regex matching validation escapes flagged inside payload streams", status: "new", createdAt: "2026-05-13T16:44:00Z", source_ip: "185.220.101.9", collection: "crm_users", tactic: "Initial Access" },
  { _id: "645f01a1b2c3d4e5f6000045", severity: "high", message: "Host Infection Precursor: Wget downloads requesting execution access properties out of external URLs", status: "investigating", createdAt: "2026-05-13T16:11:00Z", source_ip: "192.168.4.15", collection: "sysmon_logs", tactic: "Execution" },
  { _id: "645f01a1b2c3d4e5f6000046", severity: "low", message: "Policy Infraction: Remote access utilities mapped within developer workstation environments", status: "resolved", createdAt: "2026-05-13T15:40:12Z", source_ip: "10.100.2.40", collection: "windows_events", tactic: "Persistence" },
  { _id: "645f01a1b2c3d4e5f6000047", severity: "critical", message: "Brute Force Success: SSH sequence logged successful terminal mapping post 1200 failed calls", status: "new", createdAt: "2026-05-13T15:12:00Z", source_ip: "212.83.19.4", collection: "system_auth", tactic: "Initial Access" },
  { _id: "645f01a1b2c3d4e5f6000048", severity: "medium", message: "Identity Abuse Focus: Expired authentication credentials utilized across production endpoints", status: "acknowledged", createdAt: "2026-05-13T14:55:00Z", source_ip: "198.51.100.74", collection: "okta_logs", tactic: "Credential Access" },
  { _id: "645f01a1b2c3d4e5f6000049", severity: "high", message: "Docker Resource Escape: Host hardware mount requests traced to untrusted image deployment wrappers", status: "new", createdAt: "2026-05-13T14:10:19Z", source_ip: "10.244.5.12", collection: "docker_events", tactic: "Privilege Escalation" },
  { _id: "645f01a1b2c3d4e5f6000050", severity: "low", message: "Directory Enumeration Probe: Rapid brute force targeted across microservice endpoint indices", status: "resolved", createdAt: "2026-05-13T13:22:00Z", source_ip: "80.92.32.11", collection: "nginx_access", tactic: "Discovery" }
];

const STATUS_OPTIONS = ['all', 'new', 'acknowledged', 'investigating', 'resolved'];

const Alerts = () => {
  // --- STATE: PERSISTENCE INITIALIZATION ---
  // We initialize the state by checking localStorage first.
  const [masterAlerts, setMasterAlerts] = useState(() => {
    const savedData = localStorage.getItem('siem_buffer_v1');
    return savedData ? JSON.parse(savedData) : INITIAL_DATASET;
  });

  const [displayedAlerts, setDisplayedAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, total: 50, limit: 10 });

  // --- EFFECT: THE "PERMANENT SAVE" TRIGGER ---
  // Every time masterAlerts changes (delete/update), save it to localStorage
  useEffect(() => {
    localStorage.setItem('siem_buffer_v1', JSON.stringify(masterAlerts));
  }, [masterAlerts]);

  const syncAlertDatabase = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      let filtered = masterAlerts.filter(item => {
        const matchesStatus = activeFilter === 'all' || item.status === activeFilter;
        const matchesQuery = item.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.source_ip.includes(searchQuery);
        return matchesStatus && matchesQuery;
      });

      setPagination(prev => ({ ...prev, total: filtered.length }));
      const startIndex = (pagination.page - 1) * pagination.limit;
      setDisplayedAlerts(filtered.slice(startIndex, startIndex + pagination.limit));
      setLoading(false);
    }, 200);
  }, [masterAlerts, pagination.page, activeFilter, searchQuery, pagination.limit]);

  useEffect(() => {
    syncAlertDatabase();
  }, [syncAlertDatabase]);

  // --- ACTIONS: PERMANENT HANDLERS ---
  const handleUpdateStatus = (id, status) => {
    setMasterAlerts(prev => prev.map(alert => alert._id === id ? { ...alert, status } : alert));
    if (selectedAlert?._id === id) setSelectedAlert(prev => ({ ...prev, status }));
    toast.success(`Record updated and synced to database`, {
      style: { background: '#020617', color: '#10b981', border: '1px solid #1e293b' }
    });
  };

  const handlePurgeAlert = (id) => {
    setMasterAlerts(prev => prev.filter(alert => alert._id !== id));
    if (selectedAlert?._id === id) setSelectedAlert(null);
    
    // Adjust pagination if page becomes empty
    if (displayedAlerts.length === 1 && pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }

    toast.error(`Entry permanently deleted from storage`, {
      icon: <Database size={14} />,
      style: { background: '#020617', color: '#f43f5e', border: '1px solid #1e293b' }
    });
  };

  const handleResetSystem = () => {
    if (window.confirm("Restore 50+ original alerts? All current changes will be overwritten.")) {
      setMasterAlerts(INITIAL_DATASET);
      setPagination(p => ({ ...p, page: 1 }));
      toast.success("System Restored to Factory Defaults");
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'critical': return 'text-rose-500 border-rose-500/20 bg-rose-500/10';
      case 'high': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
      case 'medium': return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
      default: return 'text-cyan-500 border-cyan-500/20 bg-cyan-500/10';
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-[#020617] text-slate-200 font-sans">
      
      {/* Header with Persistence Meta */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Bell className="text-indigo-500" /> Alert Buffer
          </h1>
          <div className="flex items-center gap-4 mt-1">
             <p className="text-slate-500 text-xs font-mono uppercase">
               Storage: <span className="text-emerald-500 font-bold">Local Persistence Active</span> ({masterAlerts.length} records)
             </p>
             <button onClick={handleResetSystem} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer">
               <RotateCcw size={10} /> Reset Storage
             </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" placeholder="Search persistent logs..." 
              className="bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white w-full md:w-80 font-mono"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={syncAlertDatabase} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-1">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status} onClick={() => { setActiveFilter(status); setPagination(p => ({ ...p, page: 1 })); }}
            className={`px-5 py-3 text-xs font-black uppercase tracking-wider relative flex items-center gap-2 cursor-pointer ${
              activeFilter === status ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {status}
            {activeFilter === status && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* Layout Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* List View */}
        <div className={`space-y-3 ${selectedAlert ? 'xl:col-span-7' : 'xl:col-span-12'}`}>
          <AnimatePresence mode="popLayout">
            {displayedAlerts.map((alert) => (
              <motion.div
                key={alert._id} layout
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
                className={`p-4 border rounded-2xl flex flex-col md:flex-row items-center gap-4 backdrop-blur-sm ${
                  selectedAlert?._id === alert._id ? 'bg-indigo-950/20 border-indigo-500/50' : 'bg-slate-900/10 border-slate-800/50'
                }`}
              >
                <div className={`shrink-0 w-24 py-1 rounded-lg border text-[9px] font-black uppercase text-center font-mono ${getSeverityColor(alert.severity)}`}>
                  {alert.severity}
                </div>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedAlert(alert)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 px-1.5 rounded">{alert._id.slice(-6).toUpperCase()}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{format(new Date(alert.createdAt), 'HH:mm:ss')}</span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 rounded">{alert.source_ip}</span>
                  </div>
                  <p className="text-sm text-slate-300 font-medium line-clamp-1">{alert.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-[9px] font-mono text-slate-500 uppercase px-2 py-1 bg-slate-950 rounded border border-slate-800">{alert.status}</div>
                  
                  {alert.status === 'new' && (
                    <button onClick={() => handleUpdateStatus(alert._id, 'acknowledged')} className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 rounded-xl cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  <button onClick={() => setSelectedAlert(alert)} className={`p-2 border rounded-xl transition-all cursor-pointer ${selectedAlert?._id === alert._id ? 'bg-indigo-600 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button onClick={() => handlePurgeAlert(alert._id)} className="p-2 bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-500 rounded-xl cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/40">
            <p className="text-xs text-slate-500 font-mono italic">Indexed {pagination.total} persistent records</p>
            <div className="flex gap-2">
              <button disabled={pagination.page === 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="p-2 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-20 cursor-pointer"><ChevronLeft size={14}/></button>
              <button disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="p-2 bg-slate-900 border border-slate-800 rounded-xl disabled:opacity-20 cursor-pointer"><ChevronRight size={14}/></button>
            </div>
          </div>
        </div>

        {/* Sidebar Detail */}
        <AnimatePresence>
          {selectedAlert && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="xl:col-span-5 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-6 backdrop-blur-xl sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2"><Terminal size={14} className="text-indigo-400"/><h3 className="text-xs font-black uppercase tracking-widest text-white">Entry Analysis</h3></div>
                <button onClick={() => setSelectedAlert(null)} className="text-slate-500 hover:text-white cursor-pointer"><X size={14}/></button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div><span className="text-slate-500 block mb-1 uppercase text-[10px]">Registry ID</span><div className="p-2 bg-slate-950 rounded border border-slate-800 text-indigo-300 break-all">{selectedAlert._id}</div></div>
                <div className="grid grid-cols-2 gap-3">
                   <div><span className="text-slate-500 block mb-1 uppercase text-[10px]">Tactic</span><div className="p-2 bg-slate-950 rounded border border-slate-800">{selectedAlert.tactic}</div></div>
                   <div><span className="text-slate-500 block mb-1 uppercase text-[10px]">Status</span><div className="p-2 bg-slate-950 rounded border border-slate-800 text-emerald-400">{selectedAlert.status}</div></div>
                </div>
                <div><span className="text-slate-500 block mb-1 uppercase text-[10px]">Database JSON</span><pre className="p-3 bg-slate-950 text-slate-400 rounded-lg border border-slate-800 text-[10px] overflow-auto whitespace-pre-wrap">{JSON.stringify(selectedAlert, null, 2)}</pre></div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateStatus(selectedAlert._id, 'resolved')} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase cursor-pointer">Resolve Entry</button>
                  <button onClick={() => handlePurgeAlert(selectedAlert._id)} className="p-2 bg-slate-950 border border-rose-500/20 text-rose-400 rounded-lg cursor-pointer"><Trash2 size={14}/></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Alerts;