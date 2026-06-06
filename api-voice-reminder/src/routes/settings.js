'use strict';

const express = require('express');
const router  = express.Router();
const SettingsModel = require('../models/settings.model');

// GET /api/settings
router.get('/', (_req, res, next) => {
  try {
    res.json({ data: SettingsModel.getAll() });
  } catch (err) { next(err); }
});

// PUT /api/settings  (bulk update)
router.put('/', (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object')
      return res.status(400).json({ error: 'Body must be a key-value object' });
    const data = SettingsModel.bulkSet(req.body);
    res.json({ data, message: 'Settings updated' });
  } catch (err) { next(err); }
});

// PATCH /api/settings/:key  (single key update)
router.patch('/:key', (req, res, next) => {
  try {
    const { value } = req.body;
    if (value === undefined) return res.status(400).json({ error: 'Value is required' });
    const data = SettingsModel.set(req.params.key, value);
    res.json({ data, message: 'Setting updated' });
  } catch (err) { next(err); }
});

module.exports = router;
