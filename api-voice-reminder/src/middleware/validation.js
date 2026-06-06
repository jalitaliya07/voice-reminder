'use strict';

const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'Validation failed', details: errors.array() });
  }
  next();
};

const validateCreateReminder = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('date').notEmpty().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be YYYY-MM-DD'),
  body('time').notEmpty().matches(/^\d{2}:\d{2}$/).withMessage('Time must be HH:MM'),
  body('description').optional().isLength({ max: 1000 }),
  body('category').optional().isIn(['general', 'work', 'health', 'personal', 'study']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('repeat_mode').optional().isIn(['none', 'daily', 'weekly', 'monthly', 'custom']),
  body('voice_enabled').optional().isBoolean(),
  handleValidationErrors,
];

const validateUpdateReminder = [
  param('id').isInt({ min: 1 }),
  body('title').optional().trim().isLength({ max: 200 }),
  body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
  body('time').optional().matches(/^\d{2}:\d{2}$/),
  body('category').optional().isIn(['general', 'work', 'health', 'personal', 'study']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('repeat_mode').optional().isIn(['none', 'daily', 'weekly', 'monthly', 'custom']),
  handleValidationErrors,
];

const validateIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  handleValidationErrors,
];

module.exports = { validateCreateReminder, validateUpdateReminder, validateIdParam };
