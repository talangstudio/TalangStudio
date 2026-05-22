require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting sederhana
const requestCounts = new Map();
app.use('/api/verify', (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.ip;
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 30;

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }

    const requests = requestCounts.get(ip).filter(t => now - t < windowMs);
    requests.push(now);
    requestCounts.set(ip, requests);

    if (requests.length > maxRequests) {
        return res.status(429).json({ 
            success: false, 
            message: 'Terlalu banyak request. Coba lagi nanti.' 
        });
    }
    next();
});

// Routes - Admin Auth
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    const { checkPassword, generateToken } = require('./lib/auth');

    if (!checkPassword(password)) {
        return res.status(401).json({ success: false, message: 'Kata sandi salah' });
    }

    const token = generateToken();
    res.json({ success: true, token });
});

// Routes - Systems
app.use('/api/admin/systems', require('./admin/systems'));

// Routes - Keys
app.use('/api/admin/keys', require('./admin/keys'));

// Routes - Logs
app.use('/api/admin/logs', require('./admin/logs'));

// Routes - Transfer
app.use('/api/admin/transfer', require('./admin/transfer'));

// Routes - Settings
app.use('/api/admin/settings', require('./admin/settings'));

// Routes - Stats
app.use('/api/admin/stats', require('./admin/stats'));

// Routes - Roblox API (Public)
app.post('/api/activate', require('./activate'));
app.post('/api/verify', require('./verify'));
app.post('/api/heartbeat', require('./heartbeat'));
app.post('/api/transfer/request', require('./transferRequest'));

// Fallback ke index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server berjalan di port ${PORT}`);
});

module.exports = app;
