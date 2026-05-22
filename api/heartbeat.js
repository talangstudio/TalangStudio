const { getDB } = require('./lib/database');
const { generateId } = require('./lib/keygen');
const discord = require('./lib/discord');

module.exports = async (req, res) => {
    const { key_code, place_id, place_name, user_id, username, api_secret } = req.body;

    if (api_secret !== process.env.API_SECRET) {
        return res.status(403).json({ success: false, message: 'Invalid secret' });
    }

    const db = getDB();
    const key = db.prepare('SELECT * FROM license_keys WHERE key_code = ?').get(key_code);

    if (!key || key.status !== 'active') {
        return res.status(403).json({ success: false, message: 'Key tidak valid' });
    }

    if (key.bound_place_id !== String(place_id)) {
        db.prepare(`UPDATE license_keys SET status = 'blacklisted' WHERE id = ?`).run(key.id);
        
        await discord.notifyBypass({
            username, userId: user_id,
            keyCode: key_code,
            systemName: key.system_name,
            placeName: place_name,
            boundPlaceName: key.bound_place_name,
            bypassType: 'Heartbeat dari Place ID berbeda — kemungkinan script dipindah'
        });

        return res.status(403).json({ success: false, message: 'Place ID tidak cocok' });
    }

    // Log heartbeat (tidak kirim Discord agar tidak spam)
    db.prepare(`
        INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        generateId(), key.id, key_code, 'heartbeat',
        key.system_name, user_id, username, place_id, place_name,
        'Heartbeat - sistem berjalan normal', new Date().toISOString()
    );

    return res.json({ success: true, message: 'OK' });
};
