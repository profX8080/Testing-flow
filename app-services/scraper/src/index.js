/**
 * Lab Scraper Service
 * Simulates a data scraper that generates fresh dummy data every 30 seconds.
 * In a real project this would call external APIs or scrape websites.
 * Stores the latest scraped data to the EBS volume at /scraped-data.
 *
 * Endpoints:
 *   GET /          -> service info
 *   GET /health    -> OK (K8s probe)
 *   GET /latest    -> returns the latest scraped data
 *   GET /history   -> returns last 10 scrape results
 */

const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const app      = express();
const PORT     = process.env.PORT     || 9090;
const APP_ENV  = process.env.APP_ENV  || 'development';
const DATA_DIR = process.env.DATA_DIR || '/scraped-data';
const INTERVAL = parseInt(process.env.SCRAPE_INTERVAL || '30', 10) * 1000;

const LATEST_FILE  = path.join(DATA_DIR, 'latest.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Dummy scraper ──────────────────────────────────────────────────────────────

// Simulated external data sources the scraper "visits"
const SOURCES = ['source-alpha', 'source-beta', 'source-gamma'];

function generateDummyData() {
  const source = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  const count  = Math.floor(Math.random() * 5) + 1;
  const items  = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id:       Math.floor(Math.random() * 10000),
      title:    `Scraped Item ${i + 1} from ${source}`,
      value:    parseFloat((Math.random() * 100).toFixed(2)),
      tags:     ['lab', source, `batch-${Date.now()}`],
    });
  }
  return {
    scraped_at: new Date().toISOString(),
    source,
    item_count: count,
    items,
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({ scrapes: [] }, null, 2));
  }
}

function runScrape() {
  const data = generateDummyData();
  // Write latest
  fs.writeFileSync(LATEST_FILE, JSON.stringify(data, null, 2));
  // Append to history (keep last 10)
  const histRaw = fs.existsSync(HISTORY_FILE)
    ? JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'))
    : { scrapes: [] };
  histRaw.scrapes.unshift(data);
  if (histRaw.scrapes.length > 10) histRaw.scrapes = histRaw.scrapes.slice(0, 10);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(histRaw, null, 2));
  console.log(`[Scraper] Scraped ${data.item_count} items from ${data.source} at ${data.scraped_at}`);
}

// ── Routes ─────────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
  res.json({
    service:          'Lab Scraper',
    version:          '1.0.0',
    env:              APP_ENV,
    scrape_interval:  `${INTERVAL / 1000}s`,
    data_dir:         DATA_DIR,
    endpoints:        ['/', '/health', '/latest', '/history'],
    timestamp:        new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  const latestExists = fs.existsSync(LATEST_FILE);
  res.status(200).json({ status: 'ok', latest_file: latestExists ? 'exists' : 'pending first scrape' });
});

app.get('/latest', (req, res) => {
  if (!fs.existsSync(LATEST_FILE)) {
    return res.status(503).json({ status: 'pending', message: 'First scrape not completed yet. Try again in a few seconds.' });
  }
  const data = JSON.parse(fs.readFileSync(LATEST_FILE, 'utf8'));
  res.json({ status: 'ok', data });
});

app.get('/history', (req, res) => {
  if (!fs.existsSync(HISTORY_FILE)) {
    return res.json({ status: 'ok', count: 0, scrapes: [] });
  }
  const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  res.json({ status: 'ok', count: data.scrapes.length, scrapes: data.scrapes });
});

// ── Start ──────────────────────────────────────────────────────────────────────
ensureDataDir();

// Run first scrape immediately on startup
runScrape();

// Then run every INTERVAL seconds
setInterval(runScrape, INTERVAL);

app.listen(PORT, () => {
  console.log(`[Lab Scraper] Listening on port ${PORT}`);
  console.log(`[Lab Scraper] Scraping every ${INTERVAL / 1000} seconds`);
  console.log(`[Lab Scraper] Storing data in ${DATA_DIR}`);
});
