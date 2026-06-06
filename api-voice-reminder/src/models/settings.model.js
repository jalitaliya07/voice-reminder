'use strict';

const { queryAll, execute } = require('../../database/db');

const SettingsModel = {

  getAll() {
    const rows = queryAll('SELECT key, value FROM settings');
    return rows.reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
  },

  get(key) {
    const rows = queryAll('SELECT value FROM settings WHERE key = ?', [key]);
    return rows[0]?.value ?? null;
  },

  set(key, value) {
    execute(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, String(value)]
    );
    return { key, value: String(value) };
  },

  bulkSet(updates) {
    for (const [key, value] of Object.entries(updates)) {
      execute(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        [key, String(value)]
      );
    }
    return this.getAll();
  },
};

module.exports = SettingsModel;
