/**
 * Lab Backend Service
 * A simple Node.js service that simulates business logic.
 * Reads and writes a JSON data file to the EBS volume mounted at /data.
 * No real database needed.
 *
 * Endpoints:
 *   GET /          -> service info
 *   GET /health    -> OK (K8s probe)
 *   GET /records   -> reads records from /data/records.json
 *   POST /records  -> appends a new record to /data/records.json
 *   DELETE /records/:id -> removes a record by ID
 */

const express = require('express');
const fs      = require('fs');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT     || 8080;
const APP_ENV = process.env.APP_ENV  || 'development';
const DATA_DIR= process.env.DATA_DIR || '/data';
const DATA_FILE = path.join(DATA_DIR, 'records.json');

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Helpers ────────────────────────────────────────────────────────────────────

// Ensure the data directory and file exist on startup
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    // Write initial dummy records to the file
    const initialData = {
      records: [
        { id: 1, title: 'Record Alpha',   status: 'active',   created: new Date().toISOString() },
        { id: 2, title: 'Record Beta',    status: 'inactive', created: new Date().toISOString() },
        { id: 3, title: 'Record Gamma',   status: 'active',   created: new Date().toISOString() },
      ],
      last_updated: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log(`[Backend] Created initial data file at ${DATA_FILE}`);
  }
}

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  data.last_updated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── Routes ─────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    service:    'Lab Backend',
    version:    '1.0.0',
    env:        APP_ENV,
    data_file:  DATA_FILE,
    endpoints:  ['/', '/health', '/records', 'POST /records', 'DELETE /records/:id'],
    timestamp:  new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  // Also check that the data file is accessible
  try {
    fs.accessSync(DATA_FILE, fs.constants.R_OK);
    res.status(200).json({ status: 'ok', data_file: 'accessible' });
  } catch {
    res.status(503).json({ status: 'error', message: 'Data file not accessible' });
  }
});

// Get all records
app.get('/records', (req, res) => {
  try {
    const data = readData();
    res.json({ status: 'ok', count: data.records.length, records: data.records });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Add a new record
app.post('/records', (req, res) => {
  try {
    const { title, status = 'active' } = req.body;
    if (!title) return res.status(400).json({ status: 'error', message: 'title is required' });
    const data     = readData();
    const maxId    = data.records.reduce((m, r) => Math.max(m, r.id), 0);
    const newRecord= { id: maxId + 1, title, status, created: new Date().toISOString() };
    data.records.push(newRecord);
    writeData(data);
    res.status(201).json({ status: 'ok', data: newRecord });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Delete a record
app.delete('/records/:id', (req, res) => {
  try {
    const id   = parseInt(req.params.id, 10);
    const data = readData();
    const idx  = data.records.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ status: 'error', message: `Record ${id} not found` });
    data.records.splice(idx, 1);
    writeData(data);
    res.json({ status: 'ok', message: `Record ${id} deleted` });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Start ──────────────────────────────────────────────────────────────────────
ensureDataFile();
app.listen(PORT, () => {
  console.log(`[Lab Backend] Listening on port ${PORT}`);
  console.log(`[Lab Backend] Data file: ${DATA_FILE}`);
});
