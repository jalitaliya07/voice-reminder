'use strict';

/**
 * SQLite Database Singleton using sql.js (pure JavaScript — no native build required).
 * Loads from / saves to disk as a binary buffer.
 */

const path = require('path');
const fs   = require('fs');

const isDev  = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const dbPath = path.join(__dirname, 'voice_reminder.db');
const schemaPath = path.join(__dirname, 'schema.sql');

/** @type {import('sql.js').Database | null} */
let db = null;
let saveInterval = null;

// ─── Query helpers (exported for models) ─────────────────────────────────────

/**
 * Run SELECT → return all rows as plain objects.
 * @param {string} sql
 * @param {any[]} params
 */
function queryAll(sql, params = []) {
  const stmt = getDb().prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

/**
 * Run SELECT → return single row or undefined.
 */
function queryOne(sql, params = []) {
  return queryAll(sql, params)[0];
}

/**
 * Run INSERT / UPDATE / DELETE.
 */
function execute(sql, params = []) {
  getDb().run(sql, params);
  saveDb();
}

/**
 * Get the id of the last inserted row.
 */
function lastInsertId() {
  const row = queryOne('SELECT last_insert_rowid() AS id');
  return row ? row.id : 0;
}

// ─── Core DB API ─────────────────────────────────────────────────────────────

async function initDb() {
  if (db) return db;

  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buf = fs.readFileSync(dbPath);
    db = new SQL.Database(buf);
    console.log(`[DB] Loaded from: ${dbPath}`);
  } else {
    db = new SQL.Database();
    console.log(`[DB] Created new DB at: ${dbPath}`);
  }

  if (fs.existsSync(schemaPath)) {
    db.run(fs.readFileSync(schemaPath, 'utf8'));
  }

  saveInterval = setInterval(saveDb, 30_000);
  process.on('exit',    saveDb);
  process.on('SIGINT',  () => { saveDb(); process.exit(0); });
  process.on('SIGTERM', () => { saveDb(); process.exit(0); });

  return db;
}

function saveDb() {
  if (!db) return;
  try {
    fs.writeFileSync(dbPath, Buffer.from(db.export()));
  } catch (e) {
    console.error('[DB] Save error:', e.message);
  }
}

function getDb() {
  if (!db) throw new Error('[DB] Not initialized. Call initDb() first.');
  return db;
}

function closeDb() {
  if (saveInterval) { clearInterval(saveInterval); saveInterval = null; }
  saveDb();
  if (db) { db.close(); db = null; }
}

module.exports = { initDb, getDb, saveDb, closeDb, queryAll, queryOne, execute, lastInsertId };
