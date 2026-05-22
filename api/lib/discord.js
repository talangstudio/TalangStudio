const axios = require('axios');
const { getDB } = require('./database');

function getWebhookURL() {
    const db = getDB();
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('discord_webhook');
    return setting ? setting.value : process.env.DISCORD_WEBHOOK_URL || '';
}

function getWIBTime() {
    const now = new Date();
    const wib = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const date = wib.toISOString().slice(0, 10).split('-').reverse().join(' ');
    const time = wib.toISOString().slice(11, 19);
    return `${date} • ${time} WIB`;
}

async function sendWebhook(embed) {
    const webhookURL = getWebhookURL();
    if (!webhookURL || webhookURL.trim() === '') {
        console.log('[Discord] Webhook URL belum dikonfigurasi');
        return;
    }

    try {
        await axios.post(webhookURL, {
            username: '🔐 License Manager',
            avatar_url: 'https://i.imgur.com/AfFp7pu.png',
            embeds: [embed]
        });
    } catch (err) {
        console.error('[Discord] Gagal mengirim webhook:', err.message);
    }
}

// Notifikasi: Key Diaktifkan
async function notifyActivation(data) {
    await sendWebhook({
        title: '✅ Key Lisensi Diaktifkan',
        color: 0x10b981,
        fields: [
            { name: '👤 Username Roblox', value: data.username || '-', inline: true },
            { name: '🆔 User ID Roblox', value: data.userId || '-', inline: true },
            { name: '🎮 Sistem', value: data.systemName || '-', inline: true },
            { name: '🗺️ Nama Maps', value: data.placeName || '-', inline: true },
            { name: '📍 Place ID', value: data.placeId || '-', inline: true },
            { name: '🔑 License Key', value: `\`${data.keyCode}\``, inline: true },
            { name: '📅 Waktu', value: getWIBTime(), inline: false },
            { name: '📌 Kegiatan', value: 'Aktivasi pertama kali — key berhasil terikat ke maps ini', inline: false }
        ],
        footer: { text: 'Roblox License Manager' },
        timestamp: new Date().toISOString()
    });
}

// Notifikasi: Key Diverifikasi (Heartbeat)
async function notifyVerification(data) {
    await sendWebhook({
        title: '🔄 Verifikasi Key Berhasil',
        color: 0x4f7cff,
        fields: [
            { name: '👤 Username Roblox', value: data.username || '-', inline: true },
            { name: '🆔 User ID Roblox', value: data.userId || '-', inline: true },
            { name: '🎮 Sistem', value: data.systemName || '-', inline: true },
            { name: '🗺️ Maps', value: data.placeName || '-', inline: true },
            { name: '📍 Place ID', value: data.placeId || '-', inline: true },
            { name: '🔑 License Key', value: `\`${data.keyCode}\``, inline: true },
            { name: '📅 Waktu', value: getWIBTime(), inline: false },
            { name: '📌 Kegiatan', value: 'Heartbeat check — sistem berjalan normal', inline: false }
        ],
        footer: { text: 'Roblox License Manager' },
        timestamp: new Date().toISOString()
    });
}

// Notifikasi: Key Invalid / Maps Berbeda
async function notifyInvalidKey(data) {
    await sendWebhook({
        title: '⚠️ Key Ditolak — Maps Berbeda',
        color: 0xf59e0b,
        fields: [
            { name: '👤 Username Roblox', value: data.username || '-', inline: true },
            { name: '🆔 User ID Roblox', value: data.userId || '-', inline: true },
            { name: '🎮 Sistem', value: data.systemName || '-', inline: true },
            { name: '🗺️ Maps Terdaftar', value: data.boundPlaceName || '-', inline: true },
            { name: '🗺️ Maps Sekarang', value: data.placeName || '-', inline: true },
            { name: '🔑 License Key', value: `\`${data.keyCode}\``, inline: true },
            { name: '📅 Waktu', value: getWIBTime(), inline: false },
            { name: '📌 Kegiatan', value: 'Key tidak cocok dengan maps terdaftar — AKSES DITOLAK', inline: false }
        ],
        footer: { text: 'Roblox License Manager' },
        timestamp: new Date().toISOString()
    });
}

// Notifikasi: Percobaan Bypass
async function notifyBypass(data) {
    await sendWebhook({
        title: '🚫 PERCOBAAN BYPASS TERDETEKSI!',
        color: 0xef4444,
        fields: [
            { name: '👤 Pelaku', value: data.username || 'Tidak diketahui', inline: true },
            { name: '🆔 User ID', value: data.userId || '-', inline: true },
            { name: '🎮 Sistem', value: data.systemName || '-', inline: true },
            { name: '⚠️ Jenis Bypass', value: data.bypassType || 'Unknown', inline: true },
            { name: '🗺️ Maps Asli', value: data.boundPlaceName || '-', inline: true },
            { name: '🗺️ Maps Percobaan', value: data.placeName || '-', inline: true },
            { name: '🔑 Key Digunakan', value: `\`${data.keyCode || '-'}\``, inline: true },
            { name: '📅 Waktu', value: getWIBTime(), inline: false },
            { name: '🛡️ Tindakan', value: 'Key otomatis di-blacklist, akses ditolak sepenuhnya', inline: false }
        ],
        footer: { text: '⚠️ Roblox License Manager — Security Alert' },
        timestamp: new Date().toISOString()
    });
}

// Notifikasi: Key Baru Dibuat
async function notifyKeyCreated(data) {
    await sendWebhook({
        title: '🆕 License Key Baru Dibuat',
        color: 0x94a3b8,
        fields: [
            { name: '🔑 Key', value: `\`${data.keyCode}\``, inline: true },
            { name: '🎮 Sistem', value: data.systemName || '-', inline: true },
            { name: '📦 Jumlah', value: `${data.count || 1} key`, inline: true },
            { name: '📅 Waktu', value: getWIBTime(), inline: false },
            { name: '📌 Kegiatan', value: 'Admin membuat license key baru — status: Belum Digunakan', inline: false }
        ],
        footer: { text: 'Roblox License Manager' },
        timestamp: new Date().toISOString()
    });
}

// Notifikasi: Key Dicabut
async function notifyKeyRevoked(data) {
    await sendWebhook({
        title: '🗑️ License Key Dicabut',
        color: 0x64748b,
        fields: [
            { name: '🔑 Key', value: `\`${data.keyCode}\``, inline: true },
            { name: '🎮 Sistem', value: data.systemName || '-', inline: true },
            { name: '👤 Pengguna Terakhir', value: data.username || '-', inline: true },
            { name: '📅 Waktu', value: getWIBTime(), inline: false },
            { name: '📌 Kegiatan', value: 'Admin mencabut license key', inline: false }
        ],
        footer: { text: 'Roblox License Manager' },
        timestamp: new Date().toISOString()
    });
}

// Notifikasi: Permintaan Transfer
async function notifyTransferRequest(data) {
    await sendWebhook({
        title: '🔄 Permintaan Transfer Key',
        color: 0xf97316,
        fields: [
            { name: '👤 Username Roblox', value: data.username || '-', inline: true },
            { name: '🆔 User ID', value: data.userId || '-', inline: true },
            { name: '🎮 Sistem', value: data.systemName || '-', inline: true },
            { name: '🔑 Key', value: `\`${data.keyCode}\``, inline: true },
            { name: '🗺️ Maps Lama', value: `${data.oldPlaceName} (ID: ${data.oldPlaceId})`, inline: false },
            { name: '🗺️ Maps Baru', value: `${data.newPlaceName} (ID: ${data.newPlaceId})`, inline: false },
            { name: '📅 Waktu', value: getWIBTime(), inline: false },
            { name: '📌 Kegiatan', value: 'Pengguna meminta transfer key ke maps baru — MENUNGGU PERSETUJUAN ADMIN', inline: false }
        ],
        footer: { text: 'Roblox License Manager' },
        timestamp: new Date().toISOString()
    });
}

// Notifikasi: Transfer Disetujui
async function notifyTransferApproved(data) {
    await sendWebhook({
        title: '✅ Transfer Key Disetujui',
        color: 0x10b981,
        fields: [
            { name: '👤 Username Roblox', value: data.username || '-', inline: true },
            { name: '🔑 Key', value: `\`${data.keyCode}\``, inline: true },
            { name: '🎮 Sistem', value: data.systemName || '-', inline: true },
            { name: '🗺️ Maps Baru', value: `${data.newPlaceName} (ID: ${data.newPlaceId})`, inline: false },
            { name: '📅 Waktu', value: getWIBTime(), inline: false },
            { name: '📌 Kegiatan', value: 'Admin menyetujui transfer key — key sekarang terikat ke maps baru', inline: false }
        ],
        footer: { text: 'Roblox License Manager' },
        timestamp: new Date().toISOString()
    });
}

// Notifikasi: Transfer Ditolak
async function notifyTransferRejected(data) {
    await sendWebhook({
        title: '❌ Transfer Key Ditolak',
        color: 0xef4444,
        fields: [
            { name: '👤 Username Roblox', value: data.username || '-', inline: true },
            { name: '🔑 Key', value: `\`${data.keyCode}\``, inline: true },
            { name: '🎮 Sistem', value: data.systemName || '-', inline: true },
            { name: '📅 Waktu', value: getWIBTime(), inline: false },
            { name: '📌 Kegiatan', value: 'Admin menolak permintaan transfer key', inline: false }
        ],
        footer: { text: 'Roblox License Manager' },
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    notifyActivation,
    notifyVerification,
    notifyInvalidKey,
    notifyBypass,
    notifyKeyCreated,
    notifyKeyRevoked,
    notifyTransferRequest,
    notifyTransferApproved,
    notifyTransferRejected
};
