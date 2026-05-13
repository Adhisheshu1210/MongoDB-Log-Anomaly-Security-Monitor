import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Database, 
  ChevronRight, 
  FileJson,
  Hash,
  ExternalLink,
  Table as TableIcon
} from 'lucide-react';

const LogsView = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const mockLogs = [
    { id: "LOG-8821", timestamp: "2026-05-13 16:10:04", collection: "users", op: "find", status: 200, duration: "12ms", ip: "102.12.44.1" },
    { id: "LOG-8822", timestamp: "2026-05-13 16:10:08", collection: "orders", op: "aggregate", status: 200, duration: "145ms", ip: "192.168.1.5" },
    { id: "LOG-8823", timestamp: "2026-05-13 16:11:02", collection: "billing", op: "update", status: 403, duration: "5ms", ip: "45.22.11.90" },
    { id: "LOG-8824", timestamp: "2026-05-13 16:11:15", collection: "users", op: "insert", status: 201, duration: "22ms", ip: "102.12.44.1" },
    { id: "LOG-8825", timestamp: "2026-05-13 16:12:01", collection: "logs_archive", op: "find", status: 200, duration: "8ms", ip: "Internal" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      
      {/* Search & Filter Header */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <TableIcon className="text-indigo-500" size={24} /> Forensic Log Explorer
            </h1>
            <p className="text-slate-500 text-xs font-mono mt-1">Archive Search • 12,402 Total Records</p>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase hover:text-white transition-all">
              <Calendar size={14} /> Time Range
            </button>
            <button
              type="button"
              disabled
              title="Viewer role is read-only"
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase cursor-not-allowed"
            >
              <Download size={14} /> Export Dataset
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-grow group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Query logs (e.g. collection:users status:403)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-xs text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all font-mono"
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800">
            <Filter size={16} /> Advanced Filters
          </button>
        </div>
      </section>

      {/* Main Logs Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Collection</th>
                <th className="px-6 py-4">Operation</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Origin IP</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-mono text-slate-300">
              {mockLogs.map((log, i) => (
                <motion.tr 
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-800/50 hover:bg-indigo-500/5 transition-all cursor-default group"
                >
                  <td className="px-6 py-4 text-slate-600 font-bold">{log.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-indigo-400 font-bold">
                      <Database size={10} /> {log.collection}
                    </span>
                  </td>
                  <td className="px-6 py-4 uppercase font-black text-[10px] tracking-tighter italic">{log.op}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded ${
                      log.status >= 400 ? 'bg-rose-500/10 text-rose-500' : 
                      log.status >= 200 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{log.duration}</td>
                  <td className="px-6 py-4 font-bold">{log.ip}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-all">
                      <FileJson size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-6 py-4 bg-slate-900/20 border-t border-slate-800 flex justify-between items-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Showing 1-15 of 12,402 records
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 hover:text-white">PREV</button>
            <button className="px-3 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold">1</button>
            <button className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400">2</button>
            <button className="px-3 py-1 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400 hover:text-white">NEXT</button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2">Most Frequent Op</h4>
          <div className="flex justify-between items-end">
            <span className="text-xl font-black text-white italic tracking-tighter underline decoration-indigo-500 underline-offset-4">AGGREGATE</span>
            <span className="text-xs text-indigo-400 font-mono">42% of traffic</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2">Avg. Latency</h4>
          <div className="flex justify-between items-end">
            <span className="text-xl font-black text-white">34.2ms</span>
            <span className="text-xs text-emerald-400 font-mono">Within SLA</span>
          </div>
        </div>
        <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl">
          <h4 className="text-[10px] font-black text-slate-500 uppercase mb-2">Top Contributor</h4>
          <div className="flex justify-between items-end">
            <span className="text-xl font-black text-white">102.12.44.1</span>
            <span className="text-xs text-slate-500 font-mono">Retail-API Node</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsView;