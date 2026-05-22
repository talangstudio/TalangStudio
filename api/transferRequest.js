const { getDB } = require('./lib/database');
const { generateId } = require('./lib/keygen');
const discord = require('./lib/discord');

module.exports = async (req, res) => {
    const { 
        key_code, place_id, user_id, username,
        new_place_id, new_place_name, api_secret 
    } = req.body;

    if (api_secret !== process.env.API_SECRET) {
        return res.status(403).json({ success: false, message: 'Invalid secret' });
    }

    const db = getDB();
    const key = db.prepare('SELECT * FROM license_keys WHERE key_code = ?').get(key_code);

    if (!key || key.status !== 'active') {
        return res.status(404).json({ success: false, message: 'Key tidak valid' });
    }

    if (key.bound_place_id !== String(place_id)) {
        return res.status(403).json({ success: false, message: 'Anda bukan pemilik key ini' });
    }

    // Cek apakah sudah ada pending request
    const existing = db.prepare(`
        SELECT * FROM transfer_requests WHERE key_id = ? AND status = 'pending'
    `).get(key.id);

    if (existing) {
        return res.status(400).json({ 
            success: false, 
            message: 'Sudah ada permintaan transfer yang sedang menunggu' 
        });
    }

    const now = new Date().toISOString();
    db.prepare(`
        INSERT INTO transfer_requests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        generateId(), key.id, key_code, key.system_name,
        user_id, username,
        key.bound_place_id, key.bound_place_name,
        new_place_id, new_place_name,
        'pending', now, null
    );

    db.prepare(`
        INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        generateId(), key.id, key_code, 'transfer_request',
        key.system_name, user_id, username, place_id, key.bound_place_name,
        `Meminta transfer ke maps: ${new_place_name} (${new_place_id})`, now
    );

    await discord.notifyTransferRequest({
        username, userId: user_id,
        keyCode: key_code,
        systemName: key.system_name,
        oldPlaceName: key.bound_place_name,
        oldPlaceId: key.bound_place_id,
        newPlaceName: new_place_name,
        newPlaceId: new_place_id
    });

    return res.json({ success: true, message: 'Permintaan transfer terkirim. Menunggu persetujuan admin.' });
};
