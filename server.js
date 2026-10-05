import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, 'data', 'coupons.json');

// Ensure data dir and file exist
if (!existsSync(resolve(__dirname, 'data'))) {
  mkdirSync(resolve(__dirname, 'data'));
}
if (!existsSync(DATA_FILE)) {
  writeFileSync(DATA_FILE, '[]', 'utf-8');
}

const app = express();
app.use(cors());
app.use(express.json());

// GET all coupons
app.get('/api/coupons', (req, res) => {
  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch {
    res.json([]);
  }
});

// POST - save all coupons (full overwrite)
app.post('/api/coupons', (req, res) => {
  try {
    const coupons = req.body;
    if (!Array.isArray(coupons)) return res.status(400).json({ error: 'Expected array' });
    writeFileSync(DATA_FILE, JSON.stringify(coupons, null, 2), 'utf-8');
    res.json({ ok: true, count: coupons.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ MCYM API running at http://localhost:${PORT}`);
});
