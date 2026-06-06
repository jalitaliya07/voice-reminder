'use strict';

const { queryAll, queryOne, execute } = require('../../database/db');

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
}

const AnalyticsModel = {

  getSummary(fromDate, toDate) {
    return queryOne(
      `SELECT
         SUM(reminders_created)   AS total_created,
         SUM(reminders_completed) AS total_completed,
         SUM(reminders_missed)    AS total_missed,
         SUM(reminders_snoozed)   AS total_snoozed,
         AVG(productivity_score)  AS avg_score,
         MAX(productivity_score)  AS best_score,
         COUNT(DISTINCT date)     AS active_days
       FROM analytics WHERE date BETWEEN ? AND ?`,
      [fromDate, toDate]
    );
  },

  getDailyBreakdown(days = 7) {
    const from = getLocalDateString(new Date(Date.now() - (days - 1) * 86400000));
    return queryAll(
      `SELECT date, reminders_completed, reminders_missed, productivity_score
       FROM analytics WHERE date >= ? ORDER BY date ASC`,
      [from]
    );
  },

  recalculateToday() {
    const today = getLocalDateString();
    const stats = queryOne(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) AS completed
       FROM reminders WHERE date = ?`,
      [today]
    );
    const total     = Number(stats?.total || 0);
    const completed = Number(stats?.completed || 0);
    const score     = total > 0 ? Math.round((completed / total) * 100) : 0;

    execute(
      `INSERT INTO analytics (date, reminders_completed, productivity_score) VALUES (?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         reminders_completed = excluded.reminders_completed,
         productivity_score  = excluded.productivity_score`,
      [today, completed, score]
    );
  },
};

module.exports = AnalyticsModel;
