// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes    = require('./routes/auth');
const foodRoutes    = require('./routes/foods');
const aiRoutes      = require('./routes/ai');
const profileRoutes = require('./routes/profile');

const app = express();

// ── Middleware ──────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' })); // butuh besar untuk base64 gambar
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', app: 'Kitch-A Backend', version: '1.0.0' });
});

// ── Routes ──────────────────────────────────────────────────────
app.use('/auth',    authRoutes);
app.use('/foods',   foodRoutes);
app.use('/ai',      aiRoutes);
app.use('/profile', profileRoutes);

// ── Global error handler ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ── Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🍳 Kitch-A backend running on port ${PORT}`);
});
