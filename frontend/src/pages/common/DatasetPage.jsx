import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, Download, RefreshCw, Link as LinkIcon, Upload, Check, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { siemDatasetAPI } from '../../services/api';
import useRBAC from '../../hooks/useRBAC';

const DEFAULT_DATASET = 'darkknight25/Advanced_SIEM_Dataset';
const LOCAL_DATASET = '../advanced_siem_dataset.jsonl';

const DatasetPage = ({ title = 'SIEM Datasets', role }) => {
  const { can } = useRBAC();
  const [datasetName, setDatasetName] = useState(DEFAULT_DATASET);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [fileInput, setFileInput] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const canViewDatasets = can('view_datasets');
  const canManageDatasets = can('manage_datasets');

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.jsonl')) {
      toast.error('Please select a .jsonl file');
      return;
    }

    setUploading(true);
    try {
      // For now, we'll use the local file path reference
      // In production, you'd want to upload the file to the server
      const datasetPath = `../advanced_siem_dataset.jsonl`;
      setDatasetName(datasetPath);
      
      // Call import API with the local dataset path
      const result = await siemDatasetAPI.importAll({ dataset: datasetPath, reset: true });
      toast.success(`Dataset imported: ${result.data?.summary?.imported || 0} records`);
      setShowUploadForm(false);
      fetchDataset();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Dataset upload/import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLocalDatasetImport = async () => {
    setUploading(true);
    try {
      const result = await siemDatasetAPI.importAll({ dataset: LOCAL_DATASET, reset: true });
      toast.success(`Local dataset imported: ${result.data?.summary?.imported || 0} records`);
      setDatasetName(LOCAL_DATASET);
      fetchDataset();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Local dataset import failed');
    } finally {
      setUploading(false);
    }
  };

  const fetchDataset = useCallback(async () => {
    if (!canViewDatasets) return;

    setLoading(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        siemDatasetAPI.getAll({ dataset: datasetName, page: pagination.page, limit: pagination.limit }),
        siemDatasetAPI.getStats({ dataset: datasetName })
      ]);

      setRecords(recordsRes.data?.data || []);
      setPagination(recordsRes.data?.pagination || { page: 1, limit: 50, total: 0, pages: 1 });
      setStats(statsRes.data?.data || null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load dataset records');
    } finally {
      setLoading(false);
    }
  }, [canViewDatasets, datasetName, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchDataset();
  }, [fetchDataset]);

  const handleImport = async () => {
    if (!canManageDatasets) return;
    try {
      await siemDatasetAPI.importAll({ dataset: datasetName, reset: false });
      toast.success('Dataset import started/completed successfully');
      fetchDataset();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Dataset import failed');
    }
  };

  const handleSync = async () => {
    if (!canManageDatasets) return;
    try {
      await siemDatasetAPI.syncToCore({ dataset: datasetName, reset: false, limit: 5000 });
      toast.success('Dataset synced to dashboard collections');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Dataset sync failed');
    }
  };

  const splitSummary = useMemo(() => {
    if (!stats?.bySplit) return [];
    return stats.bySplit.map((item) => `${item?._id?.config}/${item?._id?.split}: ${item?.count}`).join(' | ');
  }, [stats]);

  if (!canViewDatasets) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-slate-300">
          You do not have dataset visibility permissions.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Database className="text-indigo-400" /> {title}
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">Role: {String(role || 'user').toUpperCase()}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDataset}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 inline-block mr-2" /> Refresh
          </button>
          <button
            type="button"
            disabled={!canManageDatasets}
            onClick={handleLocalDatasetImport}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 ${uploading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : canManageDatasets ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            title={canManageDatasets ? 'Import local JSONL file' : 'Admin permission required'}
          >
            {uploading ? 'Importing...' : <><Upload className="w-4 h-4" /> Import Local</>}
          </button>
          <button
            type="button"
            disabled={!canManageDatasets}
            onClick={() => setShowUploadForm(!showUploadForm)}
            className={`px-4 py-2 rounded-xl ${canManageDatasets ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            title={canManageDatasets ? 'Upload and import new JSONL' : 'Admin permission required'}
          >
            Upload
          </button>
          <button
            type="button"
            disabled={!canManageDatasets}
            onClick={handleSync}
            className={`px-4 py-2 rounded-xl ${canManageDatasets ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            title={canManageDatasets ? 'Sync into Logs/Anomalies' : 'Admin permission required'}
          >
            Sync
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="flex-1">
            <label className="text-xs text-slate-400">Dataset Name</label>
            <input
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="text-xs text-slate-400">
            Total Rows: <span className="text-white font-bold">{stats?.total || 0}</span>
          </div>
        </div>
        {!!splitSummary.length && (
          <p className="mt-3 text-xs text-slate-500">Splits: {splitSummary}</p>
        )}
      </section>

      {/* Upload Form Section */}
      {showUploadForm && canManageDatasets && (
        <section className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-6 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-400" /> Upload JSONL Dataset
          </h3>
          <div className="flex flex-col gap-4">
            <div className="border-2 border-dashed border-indigo-500/30 rounded-xl p-8 text-center hover:border-indigo-500/50 transition-colors">
              <input
                ref={(input) => setFileInput(input)}
                type="file"
                accept=".jsonl"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInput?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {uploading ? 'Processing...' : <>
                  <Upload className="w-4 h-4" /> Select JSONL File
                </>}
              </button>
              <p className="text-xs text-slate-500 mt-4">or drag and drop a .jsonl file here</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!fileInput?.files?.[0] || uploading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all"
              >
                Import Selected File
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="space-y-2 max-h-[800px] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading dataset records...</div>
          ) : records.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No dataset records found.</div>
          ) : (
            records.map((item, idx) => (
              <div key={item.id || idx} className="border-b border-slate-800 last:border-b-0">
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }))}
                  className="w-full px-4 py-3 hover:bg-slate-900/40 transition-colors flex items-center gap-3 text-left"
                >
                  <span className="text-slate-500">
                    {expandedRows[idx] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    <div className="text-xs">
                      <span className="text-slate-500">Row</span>
                      <p className="text-white font-mono">{item.rowIdx || idx + 1}</p>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Timestamp</span>
                      <p className="text-white font-mono">{item.timestamp ? new Date(item.timestamp).toLocaleString() : '-'}</p>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Severity</span>
                      <p className={`font-bold ${
                        item.severity === 'critical' ? 'text-rose-400' :
                        item.severity === 'high' ? 'text-amber-400' :
                        item.severity === 'medium' ? 'text-yellow-400' :
                        'text-slate-400'
                      }`}>{item.severity || '-'}</p>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-500">Classification</span>
                      <p className="text-white">{item.classification || '-'}</p>
                    </div>
                  </div>
                </button>

                {/* Expanded JSON View */}
                {expandedRows[idx] && (
                  <div className="bg-slate-900/50 border-t border-slate-800 px-4 py-4">
                    <div className="mb-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Record JSON</h4>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words max-w-[900px]">
                          {JSON.stringify({
                            id: item.id,
                            timestamp: item.timestamp,
                            severity: item.severity,
                            classification: item.classification,
                            isAnomaly: item.isAnomaly,
                            anomalyScore: item.anomalyScore,
                            source: item.source,
                            rawRecord: item.record
                          }, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Key Fields */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-slate-950 border border-slate-800 rounded p-3">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Anomaly</p>
                        <p className={`text-sm font-bold mt-1 ${item.isAnomaly ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {item.isAnomaly ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded p-3">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Anomaly Score</p>
                        <p className="text-sm font-mono text-slate-200 mt-1">{(item.anomalyScore || 0).toFixed(4)}</p>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded p-3">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Source</p>
                        <p className="text-sm font-mono text-slate-200 mt-1 truncate">{item.source || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <footer className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Page <span className="text-white">{pagination.page}</span> of <span className="text-white">{pagination.pages}</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
            disabled={pagination.page <= 1}
            className="px-3 py-1 rounded-lg bg-slate-900 text-slate-300 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages || 1, p.page + 1) }))}
            disabled={pagination.page >= (pagination.pages || 1)}
            className="px-3 py-1 rounded-lg bg-slate-900 text-slate-300 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
};

export default DatasetPage;
