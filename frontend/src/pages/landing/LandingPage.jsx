import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Activity, Cpu, Database, Lock, BarChart3, 
  Terminal, Share2, Layers, Zap, Bell, Globe, 
  ChevronRight, Menu, X, Download, Server
} from 'lucide-react';

// --- Reusable Components ---

const GlassCard = ({ children, className = "" }) => (
  <motion.div 
    whileHover={{ y: -5, boxShadow: "0 0 25px rgba(99, 102, 241, 0.2)" }}
    className={`bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-6 transition-all ${className}`}
  >
    {children}
  </motion.div>
);

const SectionHeading = ({ title, subtitle, badge }) => (
  <div className="text-center mb-16">
    {badge && (
      <span className="px-3 py-1 text-xs font-bold tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full mb-4 inline-block">
        {badge}
      </span>
    )}
    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{title}</h2>
    <p className="text-slate-400 max-w-2xl mx-auto">{subtitle}</p>
  </div>
);

// --- Section Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-[100] transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-lg border-b border-indigo-500/20 shadow-[0_0_20px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 p-2 rounded-lg group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tighter text-white hidden md:block">
            MongoDB Log Anomaly <span className="text-indigo-400">& Security Monitor</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
          <a href="#architecture" className="hover:text-indigo-400 transition-colors">Architecture</a>
          <a href="#ai" className="hover:text-indigo-400 transition-colors">AI Engine</a>
          <div className="h-6 w-[1px] bg-slate-800 mx-2" />
          <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link to="/register" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-lg shadow-indigo-600/20">
            Sign Up
          </Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-slate-800 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4 text-slate-300">
              <a href="#features" onClick={() => setIsOpen(false)}>Features</a>
              <a href="#architecture" onClick={() => setIsOpen(false)}>Architecture</a>
              <Link to="/login">Sign In</Link>
              <Link to="/register" className="text-indigo-400 font-bold">Sign Up Free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden px-4">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4">
              MongoDB Log Anomaly & Security Monitor
            </h1>
            <p className="text-lg text-slate-400 mb-6 max-w-xl leading-relaxed">
              A real-time monitoring system that uses AI and NLP to automatically detect security threats, performance issues, and unusual behavior in MongoDB logs. Ingest logs in real time, analyze them for anomalies, and manage alerts through an interactive MERN dashboard.
            </p>
            <p className="text-sm text-slate-400 mb-6 max-w-xl">
              Deployed with Docker and Kubernetes, leveraging message queues for scalable log processing. Built to reduce detection time, improve data integrity, and maintain high system availability.
            </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/register" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg flex items-center gap-2 transition-all shadow-xl shadow-indigo-600/20">
              Get Started <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="px-8 py-4 bg-slate-900 border border-slate-700 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all">
              View Demo
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          {/* Dashboard Mockup */}
          <div className="relative z-10 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl p-2 overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
             <img 
               src="https://cdn.dribbble.com/userupload/45838979/file/43fd96ea221dd25173f9c1f0a77cb4b5.png?resize=752x&vertical=center" // Replace with actual UI screenshot
               alt="Dashboard Preview" 
               className="rounded-xl w-full"
             />
             {/* Floating UI Elements */}
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="absolute top-10 -left-6 p-4 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/30 rounded-xl"
             >
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-mono text-emerald-400 font-bold"> SYSTEM HEALTH: 98%</span>
               </div>
             </motion.div>
          </div>
          {/* Decorative background grid */}
          <div className="absolute -inset-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
};

const ProblemStatement = () => (
  <section className="py-12 px-4">
    <div className="max-w-5xl mx-auto bg-slate-900/30 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-2xl font-bold text-white mb-3">Statement</h3>
      <p className="text-slate-400">Modern MongoDB deployments generate large volumes of operational logs. Manual log inspection is slow, error-prone, and does not scale. The system aims to provide automated, AI-driven detection of anomalies and security threats in MongoDB logs, with configurable alerts and an interactive dashboard for rapid response.</p>
    </div>
  </section>
);

const SolutionsList = () => (
  <section id="solutions" className="py-12 px-4 bg-slate-950">
    <div className="max-w-7xl mx-auto">
      <SectionHeading badge="Solution" title="Expected Solutions" subtitle="Key capabilities provided by the MongoDB Log Anomaly & Security Monitor" />
      <div className="grid md:grid-cols-2 gap-6">
        {[
          'Real-time Anomaly Detection: Automatically identifies unusual behavior, performance issues, and security threats in MongoDB logs as they occur.',
          'AI/NLP-Powered Log Analysis: Uses AI and Natural Language Processing to interpret log messages, detect patterns, and classify critical events.',
          'Interactive Web Dashboard: Visualize log trends, anomaly alerts, and system health metrics with role-based views.',
          'Configurable Alert Notifications: Send automated alerts through multiple channels when anomalies are detected.',
          'Scalable, Containerized Deployment: Message-queue backed processing, Docker and Kubernetes deployment manifests.'
        ].map((s, i) => (
          <GlassCard key={i} className="p-6">
            <h4 className="text-white font-bold mb-2">{s.split(':')[0]}</h4>
            <p className="text-slate-400 text-sm">{s.split(':').slice(1).join(':').trim()}</p>
          </GlassCard>
        ))}
      </div>
      <div className="mt-8 text-slate-400 text-sm">
        <strong>Technologies & Tools:</strong> MongoDB, MERN (MongoDB, Express, React, Node), Python (scikit-learn, TensorFlow/PyTorch, NLTK/spaCy), Kafka or RabbitMQ, Docker, Kubernetes.
        <div className="mt-2"><a className="text-indigo-400" href="https://www.mongodb.com/docs/atlas/architecture/current/monitoring-alerts/" target="_blank" rel="noreferrer">Reference: MongoDB Monitoring & Alerts</a></div>
      </div>
    </div>
  </section>
);

const FeaturesGrid = () => {
  const features = [
    { icon: <Activity className="text-cyan-400" />, title: "Realtime Logs", desc: "Sub-second log ingestion with Kafka streams." },
    { icon: <Cpu className="text-indigo-400" />, title: "AI Detection", desc: "Unsupervised ML identifying invisible threats." },
    { icon: <ShieldCheck className="text-emerald-400" />, title: "Threat Analysis", desc: "Automated risk scoring for every MongoDB operation." },
    { icon: <Share2 className="text-purple-400" />, title: "Kafka Pipeline", desc: "Distributed processing for high-throughput logging." },
    { icon: <Zap className="text-yellow-400" />, title: "Live Updates", desc: "Websocket-driven alerts directly to your console." },
    { icon: <Lock className="text-red-400" />, title: "RBAC Controls", desc: "Granular access for Admins, Analysts, and Viewers." },
    { icon: <BarChart3 className="text-blue-400" />, title: "Enterprise Reports", desc: "Exportable JSON/CSV audit reports for compliance." },
    { icon: <Layers className="text-indigo-400" />, title: "K8s Native", desc: "Full Kubernetes manifest support for cloud-native scale." },
  ];

  return (
    <section id="features" className="py-24 px-4 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <SectionHeading 
          badge="Capabilities"
          title="Engineered for Security"
          subtitle="A comprehensive suite of tools built for modern database monitoring and anomaly response."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <GlassCard key={i}>
              <div className="mb-4 p-3 bg-slate-800/50 rounded-lg w-fit">{f.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
};

const ArchitectureFlow = () => {
  const nodes = ["MongoDB Logs", "Kafka Pipeline", "AI Processor", "Backend API", "Live UI"];
  
  return (
    <section id="architecture" className="py-24 px-4 bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        <SectionHeading 
          badge="Pipeline"
          title="Production-Grade Architecture"
          subtitle="Built on a distributed microservices stack for ultimate reliability."
        />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-12 px-6 bg-slate-950/50 border border-slate-800 rounded-3xl overflow-x-auto">
          {nodes.map((node, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-4 min-w-[150px]">
                <div className="w-16 h-16 rounded-full bg-indigo-600/10 border border-indigo-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <span className="text-indigo-400 font-bold text-lg">{i+1}</span>
                </div>
                <span className="text-white font-medium text-sm whitespace-nowrap">{node}</span>
              </div>
              {i < nodes.length - 1 && (
                <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-500 relative">
                  <motion.div 
                    animate={{ x: [0, 100], opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-cyan-400 rounded-full blur-sm"
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
           {["React", "Node.js", "MongoDB", "Kafka", "Python", "Docker"].map(tech => (
             <span key={tech} className="px-4 py-2 bg-slate-800 rounded text-slate-300 font-mono text-xs border border-slate-700 uppercase tracking-widest">{tech}</span>
           ))}
        </div>
      </div>
    </section>
  );
};

const RealtimeFeedPreview = () => {
  const events = [
    { type: 'log:new', msg: 'Query executed: find({ user_id: 102 })', color: 'text-indigo-400', time: '14:20:01' },
    { type: 'anomaly:detected', msg: 'Multiple failed auth attempts from IP 192.168.1.1', color: 'text-red-400', time: '14:20:05' },
    { type: 'alert:new', msg: 'Storage threshold exceeded on Cluster-0', color: 'text-yellow-400', time: '14:20:12' },
  ];

  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <SectionHeading 
          badge="Live"
          title="Real-Time Event Stream"
          subtitle="See anomalies as they happen with low-latency WebSocket synchronization."
        />
        <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-2xl p-4 font-mono text-xs md:text-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-8 bg-slate-900 border-b border-slate-800 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <div className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="ml-4 text-slate-500 uppercase tracking-widest text-[10px]">Security_Monitor_V1.0.0</span>
          </div>
          <div className="mt-8 space-y-3 p-4">
            {events.map((e, i) => (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                key={i} 
                className="flex gap-4 border-l-2 border-slate-800 pl-4 py-1"
              >
                <span className="text-slate-600 shrink-0">[{e.time}]</span>
                <span className={`${e.color} font-bold uppercase shrink-0`}>{e.type}:</span>
                <span className="text-slate-300 break-all">{e.msg}</span>
              </motion.div>
            ))}
            <div className="flex items-center gap-2 text-indigo-500 pt-4">
              <span className="animate-pulse">_</span>
              <span className="animate-pulse font-bold italic text-xs">AWAITING NEXT KAFKA PACKET...</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="py-24 px-4 relative overflow-hidden">
    <div className="absolute inset-0 bg-indigo-600 -z-10 opacity-10" />
    <div className="max-w-4xl mx-auto text-center p-12 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 rounded-[3rem] backdrop-blur-xl">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Secure Your Data Infrastructure Today</h2>
      <p className="text-slate-300 mb-10 text-lg">Join forward-thinking engineers using AI to protect their MongoDB clusters.</p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/register" className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xl transition-all shadow-xl shadow-indigo-600/40">
          Create Account
        </Link>
        <Link to="/login" className="px-10 py-4 bg-slate-900 border border-slate-700 text-white rounded-2xl font-bold text-xl hover:bg-slate-800 transition-all">
          Sign In
        </Link>
      </div>
    </div>
  </section>
);

const ContactForm = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!name || !email || !message) {
      setErrorMessage('Please complete all fields');
      return;
    }

    try {
      setSending(true);
      const { contactAPI } = await import('../../services/api');
      await contactAPI.submit({ name, email, message });
      setName(''); setEmail(''); setMessage('');
      setSuccessMessage('Message sent successfully. We will respond shortly.');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to submit message. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="py-20 px-4 bg-slate-900/10">
      <div className="max-w-4xl mx-auto bg-slate-950/60 border border-slate-800 rounded-3xl p-8">
        <div className="mb-6">
          <h3 className="text-3xl font-bold text-white">Get in touch</h3>
          <p className="text-slate-400">Questions or feedback? Send us a message and we'll reply promptly.</p>
        </div>
        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-600/10 border border-emerald-600/30 text-emerald-300 rounded-lg">
            <strong className="block font-semibold">{successMessage}</strong>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-600/10 border border-red-600/30 text-red-300 rounded-lg">
            <strong className="block font-semibold">{errorMessage}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input aria-label="Full name" type="text" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} className="col-span-1 md:col-span-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          <input aria-label="Email address" type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} className="col-span-1 md:col-span-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          <textarea aria-label="Message" placeholder="Message" value={message} onChange={e=>setMessage(e.target.value)} rows={6} className="col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-white outline-none resize-none focus:ring-2 focus:ring-indigo-500" />
          <div className="col-span-1 md:col-span-2 flex justify-end">
            <button type="submit" disabled={sending} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold disabled:opacity-60">
              {sending ? 'Sending...' : 'Submit Message'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900 px-4">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
      <div>
          <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="text-indigo-500" />
          <span className="text-xl font-bold text-white tracking-tighter">MongoDB Log Anomaly & Security Monitor</span>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          The next generation of MongoDB security. AI-powered log auditing, 
          real-time anomaly tracking, and enterprise-grade reporting for 
          mission-critical deployments.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-white font-bold mb-6">Platform</h4>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li><a href="#" className="hover:text-indigo-400">Features</a></li>
            <li><a href="#" className="hover:text-indigo-400">Architecture</a></li>
            <li><a href="#" className="hover:text-indigo-400">Dashboards</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Security</h4>
          <ul className="space-y-4 text-slate-500 text-sm">
            <li><a href="#" className="hover:text-indigo-400">Audit Logs</a></li>
            <li><a href="#" className="hover:text-indigo-400">RBAC Guide</a></li>
            <li><a href="#" className="hover:text-indigo-400">Reports</a></li>
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-start md:items-end gap-4">
         <Link to="/register" className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-center">Sign Up</Link>
         <Link to="/login" className="w-full md:w-auto px-8 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg font-bold text-center">Sign In</Link>
      </div>
    </div>
    <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 text-xs">
      <p>© 2026 MongoDB Log Anomaly & Security Monitor. All rights reserved.</p>
      <div className="flex gap-8 italic">
        <span>V1.0.0-Stable</span>
        <span>Built for Pre-Final Year Excellence</span>
      </div>
    </div>
  </footer>
);

// --- Main Page Assembly ---

const LandingPage = () => {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-200 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemStatement />
        <SolutionsList />
        <FeaturesGrid />
        
        {/* Visual Architecture Section */}
        <ArchitectureFlow />

        {/* Dashboard Preview Section */}
        <section className="py-24 px-4 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            <SectionHeading 
              badge="Dashboards"
              title="Tailored for Every Role"
              subtitle="Optimized views for administrators, security analysts, and operational viewers."
            />
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Admin", items: ["Full RBAC Control", "System Config", "Infrastructure Stats"], icon: <Server /> },
                { title: "Analyst", items: ["Alert Triage", "Anomaly Hunting", "Security Intelligence"], icon: <Activity /> },
                { title: "Viewer", items: ["Read-only Metrics", "Log Stream", "Health Overview"], icon: <Globe /> }
              ].map((role, i) => (
                <GlassCard key={i} className="group cursor-default">
                   <div className="w-12 h-12 bg-indigo-600/10 rounded-full flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                     {role.icon}
                   </div>
                   <h3 className="text-2xl font-bold text-white mb-4">{role.title} Dashboard</h3>
                   <ul className="space-y-3">
                     {role.items.map(item => (
                       <li key={item} className="flex items-center gap-2 text-slate-400 text-sm">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {item}
                       </li>
                     ))}
                   </ul>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        <RealtimeFeedPreview />
        
        {/* Reports Preview */}
        <section className="py-24 px-4 bg-slate-900/20 border-y border-slate-900">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <span className="text-emerald-400 font-mono text-sm tracking-widest mb-4 block uppercase font-bold">Analytics Engine</span>
              <h2 className="text-4xl font-bold text-white mb-6">Advanced Reporting & Forensics</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Export deep-dive analytics in JSON or CSV format. Our AI confidence scoring 
                helps you focus on threats that matter, reducing alert fatigue.
              </p>
              <div className="flex gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                   <Download className="text-indigo-400 mb-2" />
                   <div className="text-white font-bold">CSV Export</div>
                   <div className="text-slate-500 text-xs">For Spreadsheets</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                   <Terminal className="text-cyan-400 mb-2" />
                   <div className="text-white font-bold">JSON API</div>
                   <div className="text-slate-500 text-xs">For Automation</div>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner">
               <div className="h-64 flex items-end justify-between gap-2">
                 {[40, 70, 45, 90, 65, 80, 95, 60, 85].map((h, i) => (
                   <motion.div 
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ delay: i * 0.1, duration: 1 }}
                    key={i} 
                    className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-md opacity-80" 
                   />
                 ))}
               </div>
               <div className="mt-4 text-center text-slate-500 text-xs font-mono uppercase">Anomaly Confidence Distribution (Last 24h)</div>
            </div>
          </div>
        </section>

        <CTASection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;