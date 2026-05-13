/**
 * CLI utility to import SIEM dataset from Hugging Face into MongoDB.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { importDataset, DEFAULT_DATASET } = require('../services/huggingFaceDatasetService');

const run = async () => {
  const dataset = process.argv[2] || DEFAULT_DATASET;
  const resetArg = process.argv[3] || 'false';
  const reset = String(resetArg).toLowerCase() === 'true';

  const mongoURI = process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI_DOCKER
    : process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error('MongoDB URI is missing. Set MONGODB_URI or MONGODB_URI_DOCKER.');
  }

  await mongoose.connect(mongoURI);

  const summary = await importDataset({ dataset, reset });
  console.log(JSON.stringify({ success: true, summary }, null, 2));

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(JSON.stringify({ success: false, error: error.message }, null, 2));
  try {
    await mongoose.disconnect();
  } catch (_) {
    // Ignore disconnect errors in failure path.
  }
  process.exit(1);
});
