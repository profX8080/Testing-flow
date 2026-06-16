/**
 * Lab API Service
 * A simple Express.js REST API that returns dummy JSON data.
 * No database needed — data is hardcoded.
 *
 * Endpoints:
 *   GET /          -> returns service info
 *   GET /health    -> returns OK (used by K8s readiness/liveness probes)
 *   GET /data      -> returns list of dummy items
 *   GET /items/:id -> returns a single dummy item by ID
 */

const express = require('express');
const app     = express();
const PORT    = process.env.PORT || 8080;
const APP_ENV = process.env.APP_ENV || 'development';
const APP_NAME= process.env.APP_NAME || 'Lab API';

// ── Dummy data — no database needed ───────────────────────────────────────────
const ITEMS = [
  { id: 1, name: 'Alpha',   category: 'typeA', value: 100, active: true  },
  { id: 2, name: 'Beta',    category: 'typeB', value: 200, active: true  },
  { id: 3, name: 'Gamma',   category: 'typeA', value: 150, active: false },
  { id: 4, name: 'Delta',   category: 'typeC', value: 300, active: true  },
  { id: 5, name: 'Epsilon', category: 'typeB', value: 250, active: true  },
];

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(express.json());

// Log every request (helpful for debugging in EKS logs)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────

// Root — service info
app.get('/', (req, res) => {
  res.json({
    service:   APP_NAME,
    version:   '1.0.0',
    env:       APP_ENV,
    endpoints: ['/', '/health', '/data', '/items/:id'],
    timestamp: new Date().toISOString(),
  });
});

// Health check — used by Kubernetes readiness and liveness probes
// Must return 200 or the pod will be restarted / removed from load balancer
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: APP_NAME });
});

// Data — returns all dummy items
app.get('/data', (req, res) => {
  res.json({
    status:    'ok',
    service:   APP_NAME,
    count:     ITEMS.length,
    data:      ITEMS,
    timestamp: new Date().toISOString(),
  });
});

// Single item by ID
app.get('/items/:id', (req, res) => {
  const id   = parseInt(req.params.id, 10);
  const item = ITEMS.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ status: 'error', message: `Item ${id} not found` });
  }
  res.json({ status: 'ok', data: item });
});

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[${APP_NAME}] Listening on port ${PORT}`);
  console.log(`[${APP_NAME}] Environment: ${APP_ENV}`);
  console.log(`[${APP_NAME}] Ready to serve requests`);
});
