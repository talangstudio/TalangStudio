const express = require('express');
const router = express.Router();
const { getDB } = require('../lib/database');
const { authMiddleware } = require('../lib/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
    const db = getDB();

    const totalKeys = db.prepare('SELECT COUNT(*) as c FROM license_keys').get().c;
    const activeKeys = db.prepare("SELECT COUNT(*) as c FROM license_keys WHERE status = 'active'").get().c;
    const unusedKeys = db.prepare("SELECT COUNT(*) as c FROM license_keys WHERE status = 'unused'").get().c;
    const revokedKeys = db.prepare("SELECT COUNT(*) as c FROM license_keys WHERE status IN ('revoked','blacklisted')").get().c;
    const totalSystems = db.prepare('SELECT COUNT(*) as c FROM systems').get().c;
    const bypassAttempts = db.prepare("SELECT COUNT(*) as c FROM activity_logs WHERE action = 'bypass_attempt'").get().c;
    const pendingTransfers = db.prepare("SELECT COUNT(*) as c FROM transfer_requests WHERE status = 'pending'").get().c;

    const recentLogs = db.prepare(`
        SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 5
    `).all();

    res.json({
        success: true,
        data: {
            total_keys: totalKeys,
            active_keys: activeKeys,
            unused_keys: unusedKeys,
            revoked_keys: revokedKeys,
            total_systems: totalSystems,
            bypass_attempts: bypassAttempts,
            pending_transfers: pendingTransfers,
            recent_logs: recentLogs
        }
    });
});

module.exports = router;
