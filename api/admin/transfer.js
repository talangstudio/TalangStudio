const express = require('express');
const router = express.Router();
const { getDB } = require('../lib/database');
const { generateId } = require('../lib/keygen');
const { authMiddleware } = require('../lib/auth');
const discord = require('../lib/discord');

router.use(authMiddleware);

// GET semua transfer requests
router.get('/', (req, res) => {
    const db = getDB();
    const { status } = req.query;
    let query = 'SELECT * FROM transfer_requests WHERE 1=1';
    const params = [];
    if (status) { query += ' AND status = ?'; params.push(status); }
    query += ' ORDER BY requested_at DESC';
    const transfers = db.prepare(query).all(...params);
    res.json({ success: true, data: transfers });
});

// POST setujui transfer
router.post('/:id/approve', async (req, res) => {
    const db = getDB();
    const transfer = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Request tidak ditemukan' });
    if (transfer.status !== 'pending') return res.status(400).json({ success: false, message: 'Request sudah diproses' });

    const now = new Date().toISOString();

    // Update key binding
    db.prepare(`
        UPDATE license_keys SET 
            bound_place_id = ?,
            bound_place_name = ?
        WHERE id = ?
    `).run(transfer.new_place_id, transfer.new_place_name, transfer.key_id);

    // Update transfer request
    db.prepare(`UPDATE transfer_requests SET status = 'approved', resolved_at = ? WHERE id = ?`).run(now, transfer.id);

    // Log
    db.prepare(`
        INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        generateId(), transfer.key_id, transfer.key_code, 'transfer_approved',
        transfer.system_name, transfer.roblox_user_id, transfer.roblox_username,
        transfer.new_place_id, transfer.new_place_name,
        `Transfer disetujui admin. Dari: ${transfer.old_place_name} → ${transfer.new_place_name}`, now
    );

    await discord.notifyTransferApproved({
        username: transfer.roblox_username,
        keyCode: transfer.key_code,
        systemName: transfer.system_name,
        newPlaceName: transfer.new_place_name,
        newPlaceId: transfer.new_place_id
    });

    res.json({ success: true, message: 'Transfer berhasil disetujui' });
});

// POST tolak transfer
router.post('/:id/reject', async (req, res) => {
    const db = getDB();
    const transfer = db.prepare('SELECT * FROM transfer_requests WHERE id = ?').get(req.params.id);
    if (!transfer) return res.status(404).json({ success: false, message: 'Request tidak ditemukan' });

    const now = new Date().toISOString();
    db.prepare(`UPDATE transfer_requests SET status = 'rejected', resolved_at = ? WHERE id = ?`).run(now, transfer.id);

    db.prepare(`
        INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        generateId(), transfer.key_id, transfer.key_code, 'transfer_rejected',
        transfer.system_name, transfer.roblox_user_id, transfer.roblox_username,
        transfer.old_place_id, transfer.old_place_name,
        'Transfer ditolak oleh admin', now
    );

    await discord.notifyTransferRejected({
        username: transfer.roblox_username,
        keyCode: transfer.key_code,
        systemName: transfer.system_name
    });

    res.json({ success: true, message: 'Transfer berhasil ditolak' });
});

module.exports = router;
