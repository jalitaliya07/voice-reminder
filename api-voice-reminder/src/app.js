'use strict';

/**
 * api-voice-reminder — Express application entry point.
 */

const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initDb } = require('../database/db');

const remindersRouter = require('./routes/reminders');
const analyticsRouter = require('./routes/analytics');
const settingsRouter  = require('./routes/settings');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:4200', 'file://'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/reminders', remindersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings',  settingsRouter);

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Error handler ────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`[api-voice-reminder] Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[api-voice-reminder] Failed to start:', err);
    process.exit(1);
  }
})();

module.exports = app;
