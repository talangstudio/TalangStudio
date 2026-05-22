// ============================================
// APP.JS - Global functions
// ============================================

const API_BASE = '';

// Auth check - redirect ke login jika tidak ada token
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token && !window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
        window.location.href = '/index.html';
    }
    return token;
}

// Logout
function logout() {
    localStorage.removeItem('admin_token');
    window.location.href = '/index.html';
}

// API helper
async function apiCall(method, endpoint, body = null) {
    const token = localStorage.getItem('admin_token');
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(API_BASE + endpoint, options);

    if (res.status === 401) {
        logout();
        return null;
    }

    return await res.json();
}

// Close modal
function closeModal(id) {
    document.getElementById(id).classList.add('hide');
}

// Toast notification
function showToast(message, type = 'success') {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 25px;
        right: 25px;
        padding: 14px 20px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        z-index: 99999;
        animation: fadeUp 0.3s ease;
        max-width: 350px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    `;

    if (type === 'success') {
        toast.style.background = 'rgba(16,185,129,0.9)';
        toast.style.color = 'white';
        toast.textContent = '✅ ' + message;
    } else if (type === 'error') {
        toast.style.background = 'rgba(239,68,68,0.9)';
        toast.style.color = 'white';
        toast.textContent = '❌ ' + message;
    } else {
        toast.style.background = 'rgba(79,124,255,0.9)';
        toast.style.color = 'white';
        toast.textContent = 'ℹ️ ' + message;
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// Format tanggal
function formatDate(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    const wib = new Date(d.getTime() + (7 * 60 * 60 * 1000));
    const day = wib.toISOString().slice(8,10);
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const month = months[wib.getMonth()];
    const year = wib.getFullYear();
    const time = wib.toISOString().slice(11,16);
    return `${day} ${month} ${year}<br><span style="font-size:11px;color:var(--text3)">${time} WIB</span>`;
}

// Format waktu relatif
function timeAgo(isoString) {
    if (!isoString) return '-';
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diff = now - then;
    
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
}

// Get status badge HTML
function getStatusBadge(status) {
    const map = {
        'active': '<span class="badge b-active">● Aktif</span>',
        'unused': '<span class="badge b-unused">● Belum Dipakai</span>',
        'revoked': '<span class="badge b-revoked">● Dicabut</span>',
        'blacklisted': '<span class="badge b-black">⛔ Blacklist</span>'
    };
    return map[status] || `<span class="badge b-unused">${status}</span>`;
}

// Get log icon
function getLogIcon(action) {
    const map = {
        'activated': { cls: 'g', icon: '✅' },
        'heartbeat': { cls: 'b', icon: '🔄' },
        'verified': { cls: 'b', icon: '🔄' },
        'bypass_attempt': { cls: 'r', icon: '🚫' },
        'rejected': { cls: 'y', icon: '⚠️' },
        'invalid_key': { cls: 'r', icon: '❌' },
        'revoked': { cls: 'r', icon: '🗑️' },
        'transfer_request': { cls: 'o', icon: '🔄' },
        'transfer_approved': { cls: 'g', icon: '✅' },
        'transfer_rejected': { cls: 'r', icon: '❌' },
    };
    return map[action] || { cls: 'b', icon: '📋' };
}

// Get action label
function getActionLabel(action) {
    const map = {
        'activated': 'Key Berhasil Diaktifkan',
        'heartbeat': 'Verifikasi Heartbeat',
        'verified': 'Verifikasi Key Berhasil',
        'bypass_attempt': '⚠️ PERCOBAAN BYPASS TERDETEKSI!',
        'rejected': 'Key Ditolak — Maps Berbeda',
        'invalid_key': 'Key Tidak Ditemukan',
        'revoked': 'Key Dicabut Admin',
        'transfer_request': 'Permintaan Transfer Key',
        'transfer_approved': 'Transfer Key Disetujui',
        'transfer_rejected': 'Transfer Key Ditolak',
    };
    return map[action] || action;
}

// Colors for action
function getActionColor(action) {
    const map = {
        'activated': 'var(--green)',
        'heartbeat': 'var(--blue)',
        'verified': 'var(--blue)',
        'bypass_attempt': 'var(--red)',
        'rejected': 'var(--yellow)',
        'invalid_key': 'var(--red)',
        'revoked': 'var(--text2)',
        'transfer_request': 'var(--orange)',
        'transfer_approved': 'var(--green)',
        'transfer_rejected': 'var(--red)',
    };
    return map[action] || 'var(--text)';
}

// Colors for sys card
const sysColors = ['blue', 'purple', 'green', 'yellow', 'red', 'cyan', 'orange'];

// Run auth check on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') {
        checkAuth();
    }
});
