const express = require('express');
const router = express.Router();
const { getDB } = require('../lib/database');
const { authMiddleware, checkPassword } = require('../lib/auth');

router.use(authMiddleware);

// GET settings
router.get('/', (req, res) => {
    const db = getDB();
    const webhook = db.prepare('SELECT value FROM settings WHERE key = ?').get('discord_webhook');
    const apiSecret = process.env.API_SECRET || '';
    const baseUrl = process.env.VERCEL_URL ? 
        `https://${process.env.VERCEL_URL}` : 
        'http://localhost:3000';

    res.json({ 
        success: true, 
        data: { 
            webhook_url: webhook?.value || '',
            api_secret: apiSecret,
            base_url: baseUrl
        } 
    });
});

// POST update webhook
router.post('/webhook', (req, res) => {
    const { webhook_url } = req.body;
    const db = getDB();
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('discord_webhook', webhook_url || '');
    res.json({ success: true, message: 'Webhook berhasil disimpan' });
});

// POST ganti password
router.post('/password', (req, res) => {
    const { old_password, new_password } = req.body;
    if (!checkPassword(old_password)) {
        return res.status(401).json({ success: false, message: 'Kata sandi lama salah' });
    }
    if (!new_password || new_password.length < 6) {
        return res.status(400).json({ success: false, message: 'Kata sandi baru minimal 6 karakter' });
    }
    process.env.ADMIN_PASSWORD = new_password;
    res.json({ success: true, message: 'Kata sandi berhasil diubah' });
});

module.exports = router;
