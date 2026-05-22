const express = require('express');
const router = express.Router();
const { getDB } = require('../lib/database');
const { authMiddleware } = require('../lib/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
    const db = getDB();
    const { action, search, limit } = req.query;

    let query = 'SELECT * FROM activity_logs WHERE 1=1';
    const params = [];

    if (action) { query += ' AND action = ?'; params.push(action); }
    if (search) {
        query += ' AND (roblox_username LIKE ? OR key_code LIKE ? OR place_name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(parseInt(limit) || 100);

    const logs = db.prepare(query).all(...params);
    res.json({ success: true, data: logs });
});

module.exports = router;
