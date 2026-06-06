'use strict';

const { queryAll, queryOne, execute, lastInsertId } = require('../../database/db');

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
}

function calculateNextRepeatDate(repeatMode) {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localToday = new Date(now.getTime() - (offset * 60 * 1000));

  switch (repeatMode) {
    case 'daily':
      localToday.setDate(localToday.getDate() + 1);
      break;
    case 'weekly':
      localToday.setDate(localToday.getDate() + 7);
      break;
    case 'monthly':
      localToday.setMonth(localToday.getMonth() + 1);
      break;
    case 'yearly':
      localToday.setFullYear(localToday.getFullYear() + 1);
      break;
    default:
      return null;
  }

  return localToday.toISOString().split('T')[0];
}

/**
 * Reminder Model — all CRUD operations against the reminders table.
 */
const ReminderModel = {

  findAll(filters = {}) {
    let sql = 'SELECT * FROM reminders WHERE 1=1';
    const params = [];
    if (filters.category)  { sql += ' AND category = ?';    params.push(filters.category); }
    if (filters.priority)  { sql += ' AND priority = ?';    params.push(filters.priority); }
    if (typeof filters.completed === 'boolean') {
      sql += ' AND is_completed = ?';
      params.push(filters.completed ? 1 : 0);
    }
    sql += ' ORDER BY date ASC, time ASC';
    return queryAll(sql, params);
  },

  findToday() {
    const today = getLocalDateString();
    return queryAll(
      'SELECT * FROM reminders WHERE date = ? AND is_completed = 0 ORDER BY time ASC',
      [today]
    );
  },

  findUpcoming() {
    const today = getLocalDateString();
    const nextWeek = getLocalDateString(new Date(Date.now() + 7 * 86400000));
    return queryAll(
      'SELECT * FROM reminders WHERE date > ? AND date <= ? AND is_completed = 0 ORDER BY date ASC, time ASC',
      [today, nextWeek]
    );
  },

  findCompleted() {
    return queryAll(
      'SELECT * FROM reminders WHERE is_completed = 1 ORDER BY completed_at DESC LIMIT 100'
    );
  },

  findById(id) {
    return queryOne('SELECT * FROM reminders WHERE id = ?', [id]);
  },

  findDueNow() {
    const now  = new Date();
    const date = getLocalDateString(now);
    const time = now.toTimeString().slice(0, 5);
    const currentIso = now.toISOString();

    const dueReminders = queryAll(
      `SELECT * FROM reminders
       WHERE is_completed = 0
         AND (
           (is_snoozed = 0 AND date = ? AND time = ?)
           OR
           (is_snoozed = 1 AND snooze_until <= ?)
         )`,
      [date, time, currentIso]
    );

    // Clear snooze state for those that are firing
    dueReminders.forEach(r => {
      if (r.is_snoozed === 1) {
        execute(
          `UPDATE reminders SET is_snoozed = 0, snooze_until = NULL, updated_at = datetime('now') WHERE id = ?`,
          [r.id]
        );
        r.is_snoozed = 0;
        r.snooze_until = null;
      }
    });

    return dueReminders;
  },

  create(data) {
    execute(
      `INSERT INTO reminders
         (title, description, date, time, repeat_mode, repeat_interval, repeat_unit,
          category, priority, voice_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.description    || '',
        data.date,
        data.time,
        data.repeat_mode    || 'none',
        data.repeat_interval || 0,
        data.repeat_unit    || null,
        data.category       || 'general',
        data.priority       || 'medium',
        data.voice_enabled !== undefined ? (data.voice_enabled ? 1 : 0) : 1,
      ]
    );
    return this.findById(lastInsertId());
  },

  update(id, data) {
    const allowed = ['title', 'description', 'date', 'time', 'repeat_mode',
                     'repeat_interval', 'repeat_unit', 'category', 'priority', 'voice_enabled'];
    const keys    = Object.keys(data).filter(k => allowed.includes(k));
    if (!keys.length) return this.findById(id);

    const sets   = keys.map(k => `${k} = ?`).join(', ');
    const values = [...keys.map(k => data[k]), id];
    execute(`UPDATE reminders SET ${sets}, updated_at = datetime('now') WHERE id = ?`, values);
    return this.findById(id);
  },

  complete(id) {
    const reminder = this.findById(id);
    if (!reminder) return null;

    execute(
      `UPDATE reminders SET is_completed = 1, completed_at = datetime('now'),
       updated_at = datetime('now') WHERE id = ?`, [id]
    );

    // If it has a repeat mode, schedule the next one!
    if (reminder.repeat_mode && reminder.repeat_mode !== 'none') {
      const nextDate = calculateNextRepeatDate(reminder.repeat_mode);
      if (nextDate) {
        this.create({
          title: reminder.title,
          description: reminder.description,
          date: nextDate,
          time: reminder.time,
          repeat_mode: reminder.repeat_mode,
          repeat_interval: reminder.repeat_interval || 1,
          repeat_unit: reminder.repeat_unit || null,
          category: reminder.category,
          priority: reminder.priority,
          voice_enabled: reminder.voice_enabled
        });
      }
    }

    return this.findById(id);
  },

  snooze(id, snoozeUntil) {
    execute(
      `UPDATE reminders SET is_snoozed = 1, snooze_until = ?, updated_at = datetime('now') WHERE id = ?`,
      [snoozeUntil, id]
    );
    return this.findById(id);
  },

  delete(id) {
    execute('DELETE FROM reminders WHERE id = ?', [id]);
  },
};

module.exports = ReminderModel;
