const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Pastikan folder data ada
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(dataDir, 'database.db');

let db;

function getDB() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        initDB(db);
    }
    return db;
}

function initDB(db) {
    // Tabel systems
    db.exec(`
        CREATE TABLE IF NOT EXISTS systems (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            version TEXT DEFAULT 'v1.0',
            icon TEXT DEFAULT '🎮',
            created_at TEXT NOT NULL
        )
    `);

    // Tabel license_keys
    db.exec(`
        CREATE TABLE IF NOT EXISTS license_keys (
            id TEXT PRIMARY KEY,
            key_code TEXT UNIQUE NOT NULL,
            system_id TEXT NOT NULL,
            system_name TEXT NOT NULL,
            status TEXT DEFAULT 'unused',
            bound_place_id TEXT,
            bound_place_name TEXT,
            bound_user_id TEXT,
            bound_username TEXT,
            activated_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (system_id) REFERENCES systems(id)
        )
    `);

    // Tabel activity_logs
    db.exec(`
        CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            key_id TEXT,
            key_code TEXT,
            action TEXT NOT NULL,
            system_name TEXT,
            roblox_user_id TEXT,
            roblox_username TEXT,
            place_id TEXT,
            place_name TEXT,
            details TEXT,
            timestamp TEXT NOT NULL
        )
    `);

    // Tabel transfer_requests
    db.exec(`
        CREATE TABLE IF NOT EXISTS transfer_requests (
            id TEXT PRIMARY KEY,
            key_id TEXT NOT NULL,
            key_code TEXT NOT NULL,
            system_name TEXT NOT NULL,
            roblox_user_id TEXT NOT NULL,
            roblox_username TEXT NOT NULL,
            old_place_id TEXT NOT NULL,
            old_place_name TEXT NOT NULL,
            new_place_id TEXT NOT NULL,
            new_place_name TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            requested_at TEXT NOT NULL,
            resolved_at TEXT
        )
    `);

    // Tabel settings
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `);

    // Insert default settings jika belum ada
    const webhookSetting = db.prepare('SELECT * FROM settings WHERE key = ?').get('discord_webhook');
    if (!webhookSetting) {
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('discord_webhook', '');
    }
}

module.exports = { getDB };
