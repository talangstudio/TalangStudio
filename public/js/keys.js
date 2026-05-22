// ============================================
// KEYS.JS
// ============================================

let allKeys = [];
let currentStatus = '';
let generatedKeys = [];

async function loadKeys() {
    const data = await apiCall('GET', '/api/admin/keys');
    if (!data || !data.success) return;
    allKeys = data.data;
    renderKeys(allKeys);
}

function renderKeys(keys) {
    const tbody = document.getElementById('keys-tbody');
    if (!keys.length) {
        tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="empty-ico">🔑</div><p>Belum ada key</p></div></td></tr>';
        return;
    }

    tbody.innerHTML = keys.map(k => `
        <tr>
            <td><code class="key">${k.key_code}</code></td>
            <td>${k.system_name || '-'}</td>
            <td>${getStatusBadge(k.status)}</td>
            <td>
                ${k.bound_username ? `<b>${k.bound_username}</b><br><span style="font-size:11px;color:var(--text3)">ID: ${k.bound_user_id}</span>` : '<span style="color:var(--text3)">-</span>'}
            </td>
            <td>
                ${k.bound_place_name ? `${k.bound_place_name}<br><span style="font-size:11px;color:var(--text3)">ID: ${k.bound_place_id}</span>` : '<span style="color:var(--text3)">-</span>'}
            </td>
            <td>${k.activated_at ? formatDate(k.activated_at) : '<span style="color:var(--text3)">-</span>'}</td>
            <td>
                <div style="display:flex;gap:5px;flex-wrap:wrap">
                    ${k.status === 'unused' ? `<button class="btn btn-warning btn-sm" style="padding:4px 9px;font-size:11px" onclick="copyKey('${k.key_code}')">📋 Copy</button>` : ''}
                    ${k.status === 'active' ? `<button class="btn btn-danger btn-sm" style="padding:4px 9px;font-size:11px" onclick="revokeKey('${k.id}','${k.key_code}')">🚫 Cabut</button>` : ''}
                    <button class="btn btn-gray btn-sm" style="padding:4px 9px;font-size:11px" onclick="deleteKey('${k.id}')">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterByStatus(status, btn) {
    currentStatus = status;
    document.querySelectorAll('.fil-btn').forEach(b => b.classList.remove('act'));
    btn.classList.add('act');
    filterKeys();
}

function filterKeys() {
    const search = document.getElementById('search-key').value.toLowerCase();
    let filtered = allKeys;

    if (currentStatus) {
        filtered = filtered.filter(k => k.status === currentStatus);
    }

    if (search) {
        filtered = filtered.filter(k =>
            (k.key_code || '').toLowerCase().includes(search) ||
            (k.bound_username || '').toLowerCase().includes(search) ||
            (k.bound_place_name || '').toLowerCase().includes(search) ||
            (k.system_name || '').toLowerCase().includes(search)
        );
    }

    renderKeys(filtered);
}

async function openGenKey() {
    const systems = await apiCall('GET', '/api/admin/systems');
    if (!systems?.success) return;

    const select = document.getElementById('gen-system-id');
    select.innerHTML = systems.data.map(s => `<option value="${s.id}">${s.icon || '🎮'} ${s.name}</option>`).join('');
    document.getElementById('gen-count').value = 1;
    document.getElementById('m-gen-key').classList.remove('hide');
}

async function openBulkGen() {
    const systems = await apiCall('GET', '/api/admin/systems');
    if (!systems?.success) return;

    const select = document.getElementById('bulk-system-id');
    select.innerHTML = systems.data.map(s => `<option value="${s.id}">${s.icon || '🎮'} ${s.name}</option>`).join('');
    document.getElementById('m-bulk-gen').classList.remove('hide');
}

async function doGenerate() {
    const systemId = document.getElementById('gen-system-id').value;
    const count = document.getElementById('gen-count').value;

    const data = await apiCall('POST', '/api/admin/keys/generate', { system_id: systemId, count });
    if (data?.success) {
        closeModal('m-gen-key');
        generatedKeys = data.keys;
        showResultModal(data.keys);
        loadKeys();
    } else {
        showToast(data?.message || 'Gagal generate key', 'error');
    }
}

async function doBulkGenerate() {
    const systemId = document.getElementById('bulk-system-id').value;
    const count = document.getElementById('bulk-count').value;

    const data = await apiCall('POST', '/api/admin/keys/generate', { system_id: systemId, count });
    if (data?.success) {
        closeModal('m-bulk-gen');
        generatedKeys = data.keys;
        showResultModal(data.keys);
        loadKeys();
    } else {
        showToast(data?.message || 'Gagal generate key', 'error');
    }
}

function showResultModal(keys) {
    const el = document.getElementById('result-keys');
    el.innerHTML = keys.map(k => `<div style="color:var(--cyan);padding:2px 0">${k}</div>`).join('');
    document.getElementById('m-result').classList.remove('hide');
}

function copyAllKeys() {
    navigator.clipboard.writeText(generatedKeys.join('\n'));
    showToast('Semua key berhasil dicopy!');
}

function copyKey(keyCode) {
    navigator.clipboard.writeText(keyCode);
    showToast('Key berhasil dicopy!');
}

async function revokeKey(id, keyCode) {
    if (!confirm(`Cabut key "${keyCode}"?\nKey tidak bisa diaktifkan kembali.`)) return;
    const data = await apiCall('POST', `/api/admin/keys/${id}/revoke`);
    if (data?.success) {
        showToast('Key berhasil dicabut');
        loadKeys();
    } else {
        showToast(data?.message || 'Gagal mencabut key', 'error');
    }
}

async function deleteKey(id) {
    if (!confirm('Hapus key ini dari database?')) return;
    const data = await apiCall('DELETE', `/api/admin/keys/${id}`);
    if (data?.success) {
        showToast('Key berhasil dihapus');
        loadKeys();
    } else {
        showToast(data?.message || 'Gagal menghapus', 'error');
    }
}

loadKeys();
