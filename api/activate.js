const { getDB } = require('./lib/database');
const { generateId } = require('./lib/keygen');
const discord = require('./lib/discord');

module.exports = async (req, res) => {
    const { 
        key_code, 
        place_id, 
        place_name, 
        user_id, 
        username,
        api_secret
    } = req.body;

    // Validasi API secret
    if (api_secret !== process.env.API_SECRET) {
        return res.status(403).json({ 
            success: false, 
            message: 'API secret tidak valid' 
        });
    }

    if (!key_code || !place_id || !user_id || !username) {
        return res.status(400).json({ 
            success: false, 
            message: 'Data tidak lengkap' 
        });
    }

    const db = getDB();
    const key = db.prepare('SELECT * FROM license_keys WHERE key_code = ?').get(key_code);

    if (!key) {
        // Log percobaan
        db.prepare(`
            INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            generateId(), null, key_code, 'invalid_key',
            null, user_id, username, place_id, place_name,
            'Key tidak ditemukan di database', new Date().toISOString()
        );

        await discord.notifyBypass({
            username, userId: user_id,
            keyCode: key_code,
            systemName: 'Unknown',
            placeName: place_name,
            bypassType: 'Key tidak valid / tidak terdaftar'
        });

        return res.status(404).json({ 
            success: false, 
            message: 'Key tidak ditemukan' 
        });
    }

    // Cek status key
    if (key.status === 'revoked' || key.status === 'blacklisted') {
        db.prepare(`
            INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            generateId(), key.id, key_code, 'rejected',
            key.system_name, user_id, username, place_id, place_name,
            `Key berstatus ${key.status}`, new Date().toISOString()
        );

        await discord.notifyBypass({
            username, userId: user_id,
            keyCode: key_code,
            systemName: key.system_name,
            placeName: place_name,
            bypassType: `Menggunakan key yang sudah ${key.status}`
        });

        return res.status(403).json({ 
            success: false, 
            message: `Key telah ${key.status}` 
        });
    }

    // Jika key sudah aktif
    if (key.status === 'active') {
        // Cek apakah place_id sama
        if (key.bound_place_id !== String(place_id)) {
            // Place ID berbeda - BYPASS TERDETEKSI
            db.prepare(`UPDATE license_keys SET status = 'blacklisted' WHERE id = ?`).run(key.id);
            
            db.prepare(`
                INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                generateId(), key.id, key_code, 'bypass_attempt',
                key.system_name, user_id, username, place_id, place_name,
                `Mencoba pakai key di maps berbeda. Asli: ${key.bound_place_name} (${key.bound_place_id}), Percobaan: ${place_name} (${place_id})`,
                new Date().toISOString()
            );

            await discord.notifyBypass({
                username, userId: user_id,
                keyCode: key_code,
                systemName: key.system_name,
                placeName: place_name,
                boundPlaceName: key.bound_place_name,
                bypassType: 'Mencoba memindahkan key ke maps berbeda tanpa transfer resmi'
            });

            return res.status(403).json({ 
                success: false, 
                message: 'Key terikat ke maps berbeda. Key telah diblacklist.' 
            });
        }

        // Place ID sama, key sudah aktif - return success
        return res.json({ 
            success: true, 
            message: 'Key valid',
            system: key.system_name
        });
    }

    // Key masih unused - aktivasi pertama kali
    const now = new Date().toISOString();
    db.prepare(`
        UPDATE license_keys SET 
            status = 'active',
            bound_place_id = ?,
            bound_place_name = ?,
            bound_user_id = ?,
            bound_username = ?,
            activated_at = ?
        WHERE id = ?
    `).run(String(place_id), place_name, String(user_id), username, now, key.id);

    // Log aktivasi
    db.prepare(`
        INSERT INTO activity_logs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        generateId(), key.id, key_code, 'activated',
        key.system_name, user_id, username, place_id, place_name,
        'Aktivasi pertama kali - key berhasil terikat ke maps', now
    );

    // Notifikasi Discord
    await discord.notifyActivation({
        username, userId: user_id,
        keyCode: key_code,
        systemName: key.system_name,
        placeName: place_name,
        placeId: place_id
    });

    return res.json({ 
        success: true, 
        message: 'Key berhasil diaktifkan',
        system: key.system_name
    });
};
