'use strict';

const express = require('express');
const router  = express.Router();
const AnalyticsModel = require('../models/analytics.model');

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
}

// GET /api/analytics/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/summary', (req, res, next) => {
  try {
    const to   = req.query.to   || getLocalDateString();
    const from = req.query.from || getLocalDateString(new Date(Date.now() - 7 * 86400000));
    const data = AnalyticsModel.getSummary(from, to);
    res.json({ data, from, to });
  } catch (err) { next(err); }
});

// GET /api/analytics/daily?days=7
router.get('/daily', (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const data = AnalyticsModel.getDailyBreakdown(days);
    res.json({ data, days });
  } catch (err) { next(err); }
});

// POST /api/analytics/recalculate
router.post('/recalculate', (_req, res, next) => {
  try {
    AnalyticsModel.recalculateToday();
    res.json({ message: 'Analytics recalculated' });
  } catch (err) { next(err); }
});

module.exports = router;
