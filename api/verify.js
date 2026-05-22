const { getDB } = require('./lib/database');
const { generateId } = require('./lib/keygen');
const discord = require('./lib/discord');

module.exports = async (req, res) => {
    const { key_code, place_id, place_name, user_id, username, api_secret } = req.body;

    if (api_secret !== process.env.API_SECRET) {
        return res.status(403).json({ success: false, message: 'API secret tidak valid' });
    }

    if (!key_code || !place_id) {
        return res.status(400).json({ success: false, message: 'Data tidak lengkap' });
    }

    const db = getDB();
    const key = db.prepare('SELECT * FROM license_keys WHERE key_code = ?').get(key_code);

    if (!key) {
        return res.status(404).json({ success: false, message: 'Key tidak ditemukan' });
    }

    if (key.status !== 'active') {
        await discord.notifyBypass({
            username, userId: user_id,
            keyCode: key_code,
            systemName: key.system_name,
            placeName: place_name,
            bypassType: `Verifikasi key yang berstatus ${key.status}`
        });
        return res.status(403).json({ success: false, message: 'Key tidak aktif' });
    }

    if (key.bound_place_id !== String(place_id)) {
        db.prepare(`UPDATE license_keys SET status = 'blacklisted' WHERE id = ?`).run(key.id);
        
        db.prepare(`
            INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            generateId(), key.id, key_code, 'bypass_attempt',
            key.system_name, user_id, username, place_id, place_name,
            `Verifikasi dari maps berbeda. Asli: ${key.bound_place_id}`, new Date().toISOString()
        );

        await discord.notifyBypass({
            username, userId: user_id,
            keyCode: key_code,
            systemName: key.system_name,
            placeName: place_name,
            boundPlaceName: key.bound_place_name,
            bypassType: 'Verifikasi dari Place ID yang berbeda dari yang terdaftar'
        });

        return res.status(403).json({ success: false, message: 'Place ID tidak cocok. Key diblacklist.' });
    }

    return res.json({ success: true, message: 'Key valid', system: key.system_name });
};
