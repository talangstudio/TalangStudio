// ============================================
// SETTINGS.JS
// ============================================

async function loadSettings() {
    const data = await apiCall('GET', '/api/admin/settings');
    if (!data?.success) return;

    document.getElementById('webhook-url').value = data.data.webhook_url || '';
    document.getElementById('api-base-url').value = data.data.base_url || window.location.origin;
    document.getElementById('api-secret-display').value = data.data.api_secret || '-';
}

async function saveWebhook() {
    const webhook_url = document.getElementById('webhook-url').value.trim();
    const data = await apiCall('POST', '/api/admin/settings/webhook', { webhook_url });

    if (data?.success) {
        showToast('Webhook berhasil disimpan');
    } else {
        showToast(data?.message || 'Gagal menyimpan webhook', 'error');
    }
}

async function testWebhook() {
    const webhook_url = document.getElementById('webhook-url').value.trim();
    if (!webhook_url) {
        showToast('Masukkan URL webhook terlebih dahulu', 'error');
        return;
    }

    try {
        const res = await fetch(webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: '🔐 License Manager',
                embeds: [{
                    title: '🧪 Test Webhook',
                    description: 'Webhook Discord berhasil terhubung ke License Manager!',
                    color: 0x10b981,
                    footer: { text: 'Roblox License Manager — Test' },
                    timestamp: new Date().toISOString()
                }]
            })
        });

        if (res.ok) {
            showToast('Test webhook berhasil dikirim ke Discord!');
        } else {
            showToast('Webhook URL tidak valid', 'error');
        }
    } catch {
        showToast('Gagal mengirim test webhook', 'error');
    }
}

async function changePassword() {
    const old_password = document.getElementById('old-pass').value;
    const new_password = document.getElementById('new-pass').value;
    const confirm_pass = document.getElementById('confirm-pass').value;

    if (!old_password || !new_password) {
        showToast('Isi semua field kata sandi', 'error');
        return;
    }

    if (new_password !== confirm_pass) {
        showToast('Konfirmasi kata sandi tidak cocok', 'error');
        return;
    }

    if (new_password.length < 6) {
        showToast('Kata sandi minimal 6 karakter', 'error');
        return;
    }

    const data = await apiCall('POST', '/api/admin/settings/password', { old_password, new_password });
    if (data?.success) {
        showToast('Kata sandi berhasil diubah');
        document.getElementById('old-pass').value = '';
        document.getElementById('new-pass').value = '';
        document.getElementById('confirm-pass').value = '';
    } else {
        showToast(data?.message || 'Gagal mengubah kata sandi', 'error');
    }
}

function copyApiSecret() {
    const val = document.getElementById('api-secret-display').value;
    if (val && val !== '-') {
        navigator.clipboard.writeText(val);
        showToast('API Secret berhasil dicopy!');
    }
}

loadSettings();
