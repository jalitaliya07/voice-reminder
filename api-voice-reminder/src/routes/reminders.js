'use strict';

const express = require('express');
const router  = express.Router();
const ReminderModel = require('../models/reminder.model');
const { validateCreateReminder, validateUpdateReminder, validateIdParam } = require('../middleware/validation');

// GET /api/reminders?category=work&priority=high&completed=false
router.get('/', (req, res, next) => {
  try {
    const { category, priority, completed } = req.query;
    const filters = {};
    if (category)  filters.category  = category;
    if (priority)  filters.priority  = priority;
    if (completed !== undefined) filters.completed = completed === 'true';
    const data = ReminderModel.findAll(filters);
    res.json({ data, count: data.length });
  } catch (err) { next(err); }
});

// GET /api/reminders/today
router.get('/today', (_req, res, next) => {
  try {
    const data = ReminderModel.findToday();
    res.json({ data, count: data.length });
  } catch (err) { next(err); }
});

// GET /api/reminders/upcoming
router.get('/upcoming', (_req, res, next) => {
  try {
    const data = ReminderModel.findUpcoming();
    res.json({ data, count: data.length });
  } catch (err) { next(err); }
});

// GET /api/reminders/completed
router.get('/completed', (_req, res, next) => {
  try {
    const data = ReminderModel.findCompleted();
    res.json({ data, count: data.length });
  } catch (err) { next(err); }
});

// GET /api/reminders/due  (used by Electron scheduler)
router.get('/due', (_req, res, next) => {
  try {
    const data = ReminderModel.findDueNow();
    res.json({ data, count: data.length });
  } catch (err) { next(err); }
});

// GET /api/reminders/:id
router.get('/:id', validateIdParam, (req, res, next) => {
  try {
    const reminder = ReminderModel.findById(Number(req.params.id));
    if (!reminder) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ data: reminder });
  } catch (err) { next(err); }
});

// POST /api/reminders
router.post('/', validateCreateReminder, (req, res, next) => {
  try {
    const data = ReminderModel.create(req.body);
    res.status(201).json({ data, message: 'Reminder created' });
  } catch (err) { next(err); }
});

// PUT /api/reminders/:id
router.put('/:id', validateUpdateReminder, (req, res, next) => {
  try {
    if (!ReminderModel.findById(Number(req.params.id)))
      return res.status(404).json({ error: 'Reminder not found' });
    const data = ReminderModel.update(Number(req.params.id), req.body);
    res.json({ data, message: 'Reminder updated' });
  } catch (err) { next(err); }
});

// PATCH /api/reminders/:id/complete
router.patch('/:id/complete', validateIdParam, (req, res, next) => {
  try {
    if (!ReminderModel.findById(Number(req.params.id)))
      return res.status(404).json({ error: 'Reminder not found' });
    const data = ReminderModel.complete(Number(req.params.id));
    res.json({ data, message: 'Reminder completed' });
  } catch (err) { next(err); }
});

// PATCH /api/reminders/:id/snooze
router.patch('/:id/snooze', validateIdParam, (req, res, next) => {
  try {
    if (!ReminderModel.findById(Number(req.params.id)))
      return res.status(404).json({ error: 'Reminder not found' });
    const snoozeUntil = req.body.snoozeUntil
      || new Date(Date.now() + (req.body.minutes || 10) * 60000).toISOString();
    const data = ReminderModel.snooze(Number(req.params.id), snoozeUntil);
    res.json({ data, message: 'Reminder snoozed' });
  } catch (err) { next(err); }
});

// DELETE /api/reminders/:id
router.delete('/:id', validateIdParam, (req, res, next) => {
  try {
    if (!ReminderModel.findById(Number(req.params.id)))
      return res.status(404).json({ error: 'Reminder not found' });
    ReminderModel.delete(Number(req.params.id));
    res.json({ message: 'Reminder deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
