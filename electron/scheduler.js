'use strict';

/**
 * Electron Background Reminder Scheduler
 * 
 * Polls the backend API every 30 seconds for reminders that are due now.
 * Fires a callback when a reminder should trigger.
 */

const http = require('http');

/** @type {NodeJS.Timeout | null} */
let schedulerInterval = null;

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const BACKEND_URL = `http://localhost:${process.env.PORT || 3000}`;

/** Set of already-fired reminder IDs to prevent double-firing within the same minute */
const firedThisMinute = new Set();
let lastMinute = '';

/**
 * Fetch JSON from the backend.
 * @param {string} url
 * @returns {Promise<any>}
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

/**
 * Start the reminder scheduler.
 * @param {(reminder: object) => void} onReminderDue - Callback fired for each due reminder
 */
function startScheduler(onReminderDue) {
  if (schedulerInterval) return;

  console.log('[Scheduler] Starting reminder scheduler (30s poll)...');

  async function poll() {
    try {
      // Reset fired set each minute
      const currentMinute = new Date().toTimeString().slice(0, 5);
      if (currentMinute !== lastMinute) {
        firedThisMinute.clear();
        lastMinute = currentMinute;
      }

      const result = await fetchJson(`${BACKEND_URL}/api/reminders/due`);
      const dueReminders = result.data || [];

      for (const reminder of dueReminders) {
        if (!firedThisMinute.has(reminder.id)) {
          firedThisMinute.add(reminder.id);
          console.log(`[Scheduler] Firing reminder: "${reminder.title}"`);
          onReminderDue(reminder);
        }
      }
    } catch (err) {
      // Backend might not be up yet — silently retry
      if (err.code !== 'ECONNREFUSED') {
        console.error('[Scheduler] Poll error:', err.message);
      }
    }
  }

  // Initial poll after 5 seconds (give backend time to start)
  setTimeout(poll, 5000);

  // Recurring poll
  schedulerInterval = setInterval(poll, POLL_INTERVAL_MS);
  console.log('[Scheduler] Scheduler running.');
}

/**
 * Stop the scheduler.
 */
function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Stopped.');
  }
}

module.exports = { startScheduler, stopScheduler };
