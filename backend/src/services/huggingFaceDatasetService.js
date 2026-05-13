/**
 * Hugging Face datasets-server integration service.
 * Imports rows from dataset into MongoDB.
 */

const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const path = require('path');
const SiemDatasetRecord = require('../models/SiemDatasetRecord');
const logger = require('../utils/logger');

const DATASET_SERVER_BASE_URL = process.env.HF_DATASET_SERVER_URL || 'https://datasets-server.huggingface.co';
const DEFAULT_DATASET = process.env.HF_SIEM_DATASET || 'darkknight25/Advanced_SIEM_Dataset';
const PAGE_SIZE = parseInt(process.env.HF_IMPORT_PAGE_SIZE || '100', 10);
const HF_TOKEN = process.env.HF_TOKEN;

const getRequestConfig = (params, timeout) => {
  const config = {
    params,
    timeout
  };

  if (HF_TOKEN) {
    config.headers = {
      Authorization: `Bearer ${HF_TOKEN}`
    };
  }

  return config;
};

const parseAsDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value > 0;
  return false;
};

const normalizeRow = (dataset, config, split, rowIdx, row) => {
  const timestamp = parseAsDate(
    row.timestamp || row.time || row.event_time || row.datetime || row.log_time
  );

  const severity = String(
    row.severity || row.level || row.log_level || row.priority || 'UNKNOWN'
  ).toUpperCase();

  const source = String(
    row.source || row.component || row.service || row.host || 'unknown'
  );

  const classification = String(
    row.classification || row.label || row.category || 'unknown'
  );

  const anomalyScore = Number(
    row.anomalyScore || row.anomaly_score || row.score || 0
  );

  const isAnomaly = toBool(
    row.isAnomaly || row.is_anomaly || row.anomaly || anomalyScore > 0.5
  );

  return {
    dataset,
    config,
    split,
    rowIdx,
    timestamp,
    severity,
    source,
    classification,
    isAnomaly,
    anomalyScore: Number.isFinite(anomalyScore) ? anomalyScore : 0,
    rawRecord: row
  };
};

const fetchSplits = async (dataset) => {
  const url = `${DATASET_SERVER_BASE_URL}/splits`;
  const { data } = await axios.get(
    url,
    getRequestConfig({ dataset }, 30000)
  );

  const splits = [];
  for (const item of data.splits || []) {
    if (item.dataset !== dataset) continue;
    splits.push({
      config: item.config,
      split: item.split,
      numRows: item.num_rows
    });
  }

  return splits;
};

const fetchRowsPage = async ({ dataset, config, split, offset, length }) => {
  const url = `${DATASET_SERVER_BASE_URL}/rows`;
  const { data } = await axios.get(
    url,
    getRequestConfig({ dataset, config, split, offset, length }, 60000)
  );

  return data.rows || [];
};

const importDataset = async ({
  dataset = DEFAULT_DATASET,
  reset = false
} = {}) => {
  // If dataset is a local file path (JSONL), import from the file instead
  try {
    if (typeof dataset === 'string' && fs.existsSync(dataset) && fs.statSync(dataset).isFile()) {
      logger.info(`Importing local JSONL dataset from ${dataset}`);
      return await importLocalJsonl({ datasetPath: dataset, reset });
    }
  } catch (err) {
    // Fall back to remote import if any FS checks fail
    logger.warn(`Local dataset check failed: ${err.message}`);
  }
  const summary = {
    dataset,
    imported: 0,
    upserted: 0,
    skipped: 0,
    splits: []
  };

  const splitDefs = await fetchSplits(dataset);
  if (splitDefs.length === 0) {
    throw new Error(`No splits found for dataset: ${dataset}`);
  }

  if (reset) {
    const deleteResult = await SiemDatasetRecord.deleteMany({ dataset });
    logger.info(`Cleared ${deleteResult.deletedCount} existing records for ${dataset}`);
  }

  for (const splitDef of splitDefs) {
    const { config, split, numRows } = splitDef;
    let offset = 0;
    let splitImported = 0;
    let splitUpserted = 0;

    while (offset < numRows) {
      const rows = await fetchRowsPage({
        dataset,
        config,
        split,
        offset,
        length: PAGE_SIZE
      });

      if (!rows.length) break;

      const operations = rows.map((item) => {
        const normalized = normalizeRow(dataset, config, split, item.row_idx, item.row || {});
        return {
          updateOne: {
            filter: {
              dataset,
              config,
              split,
              rowIdx: item.row_idx
            },
            update: { $set: normalized },
            upsert: true
          }
        };
      });

      const bulkResult = await SiemDatasetRecord.bulkWrite(operations, { ordered: false });
      const matched = bulkResult.matchedCount || 0;
      const modified = bulkResult.modifiedCount || 0;
      const upserted = bulkResult.upsertedCount || 0;

      splitImported += rows.length;
      splitUpserted += upserted;
      summary.skipped += Math.max(0, matched - modified);

      offset += rows.length;
    }

    summary.imported += splitImported;
    summary.upserted += splitUpserted;
    summary.splits.push({ config, split, numRows, imported: splitImported, upserted: splitUpserted });
  }

  return summary;
};

const importLocalJsonl = async ({ datasetPath, reset = false } = {}) => {
  const summary = {
    dataset: datasetPath,
    imported: 0,
    upserted: 0,
    skipped: 0,
    splits: []
  };

  if (reset) {
    const deleteResult = await SiemDatasetRecord.deleteMany({ dataset: datasetPath });
    logger.info(`Cleared ${deleteResult.deletedCount} existing records for ${datasetPath}`);
  }

  const stream = fs.createReadStream(datasetPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let operations = [];
  let lineIdx = 0;
  const BATCH_SIZE = PAGE_SIZE || 100;

  for await (const line of rl) {
    lineIdx += 1;
    if (!line || !line.trim()) continue;
    let row;
    try {
      row = JSON.parse(line);
    } catch (err) {
      logger.warn(`Skipping malformed JSONL line ${lineIdx} in ${datasetPath}: ${err.message}`);
      summary.skipped += 1;
      continue;
    }

    const normalized = normalizeRow(datasetPath, 'local', 'full', lineIdx, row || {});

    operations.push({
      updateOne: {
        filter: { dataset: datasetPath, config: 'local', split: 'full', rowIdx: lineIdx },
        update: { $set: normalized },
        upsert: true
      }
    });

    if (operations.length >= BATCH_SIZE) {
      const bulkResult = await SiemDatasetRecord.bulkWrite(operations, { ordered: false });
      summary.imported += operations.length;
      summary.upserted += bulkResult.upsertedCount || 0;
      operations = [];
    }
  }

  if (operations.length) {
    const bulkResult = await SiemDatasetRecord.bulkWrite(operations, { ordered: false });
    summary.imported += operations.length;
    summary.upserted += bulkResult.upsertedCount || 0;
  }

  summary.splits.push({ config: 'local', split: 'full', numRows: lineIdx, imported: summary.imported, upserted: summary.upserted });

  return summary;
};

module.exports = {
  importDataset,
  DEFAULT_DATASET
};
