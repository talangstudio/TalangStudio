const express = require('express');
const router = express.Router();
const { getDB } = require('../lib/database');
const { generateId, generateKey } = require('../lib/keygen');
const { authMiddleware } = require('../lib/auth');
const discord = require('../lib/discord');

router.use(authMiddleware);

// GET semua keys
router.get('/', (req, res) => {
    const db = getDB();
    const { status, system_id, search } = req.query;
    
    let query = 'SELECT * FROM license_keys WHERE 1=1';
    const params = [];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (system_id) { query += ' AND system_id = ?'; params.push(system_id); }
    if (search) { 
        query += ' AND (key_code LIKE ? OR bound_username LIKE ? OR bound_place_name LIKE ?)'; 
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const keys = db.prepare(query).all(...params);
    res.json({ success: true, data: keys });
});

// POST generate key
router.post('/generate', async (req, res) => {
    const { system_id, count } = req.body;
    if (!system_id) return res.status(400).json({ success: false, message: 'System ID wajib diisi' });

    const db = getDB();
    const system = db.prepare('SELECT * FROM systems WHERE id = ?').get(system_id);
    if (!system) return res.status(404).json({ success: false, message: 'Sistem tidak ditemukan' });

    const jumlah = Math.min(parseInt(count) || 1, 50);
    const generated = [];
    const now = new Date().toISOString();

    for (let i = 0; i < jumlah; i++) {
        let keyCode;
        let exists = true;
        while (exists) {
            keyCode = generateKey();
            exists = db.prepare('SELECT id FROM license_keys WHERE key_code = ?').get(keyCode);
        }

        const id = generateId();
        db.prepare(`
            INSERT INTO license_keys VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, keyCode, system_id, system.name, 'unused', null, null, null, null, null, now);

        generated.push(keyCode);
    }

    // Notifikasi Discord untuk key pertama (atau semua jika bulk)
    await discord.notifyKeyCreated({
        keyCode: jumlah === 1 ? generated[0] : `${jumlah} keys baru`,
        systemName: system.name,
        count: jumlah
    });

    res.json({ success: true, message: `${jumlah} key berhasil dibuat`, keys: generated });
});

// POST revoke key
router.post('/:id/revoke', async (req, res) => {
    const db = getDB();
    const key = db.prepare('SELECT * FROM license_keys WHERE id = ?').get(req.params.id);
    if (!key) return res.status(404).json({ success: false, message: 'Key tidak ditemukan' });

    db.prepare(`UPDATE license_keys SET status = 'revoked' WHERE id = ?`).run(key.id);

    db.prepare(`
        INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        generateId(), key.id, key.key_code, 'revoked',
        key.system_name, key.bound_user_id, key.bound_username,
        key.bound_place_id, key.bound_place_name,
        'Admin mencabut license key', new Date().toISOString()
    );

    await discord.notifyKeyRevoked({
        keyCode: key.key_code,
        systemName: key.system_name,
        username: key.bound_username
    });

    res.json({ success: true, message: 'Key berhasil dicabut' });
});

// DELETE key
router.delete('/:id', (req, res) => {
    const db = getDB();
    db.prepare('DELETE FROM license_keys WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Key berhasil dihapus' });
});

module.exports = router;
