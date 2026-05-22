// ============================================
// TRANSFER.JS
// ============================================

async function loadTransfers() {
    const pending = await apiCall('GET', '/api/admin/transfer?status=pending');
    const all = await apiCall('GET', '/api/admin/transfer');

    if (pending?.success) {
        const count = pending.data.length;
        document.getElementById('transfer-count').textContent = `${count} Menunggu`;
        renderPendingTransfers(pending.data);
    }

    if (all?.success) {
        const history = all.data.filter(t => t.status !== 'pending');
        renderTransferHistory(history);
    }
}

function renderPendingTransfers(transfers) {
    const el = document.getElementById('transfer-container');
    if (!transfers.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-ico">🔄</div><p>Tidak ada permintaan transfer yang menunggu</p></div>';
        return;
    }

    el.innerHTML = transfers.map(t => `
        <div class="tf-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div>
                    <b>👤 ${t.roblox_username}</b>
                    <span style="font-size:11px;color:var(--text3)"> (ID: ${t.roblox_user_id})</span>
                </div>
                <span class="badge b-transfer">⏳ Menunggu</span>
            </div>
            <div style="font-size:12px;color:var(--text3);margin-bottom:12px">
                🔑 <code class="key">${t.key_code}</code> • 🎮 ${t.system_name}
            </div>
            <div class="tf-row">
                <div class="tf-box">
                    <div class="tf-lbl">Maps Lama</div>
                    <div class="tf-val">🗺️ ${t.old_place_name}</div>
                    <div style="font-size:11px;color:var(--text3)">Place ID: ${t.old_place_id}</div>
                </div>
                <div class="tf-arrow">→</div>
                <div class="tf-box">
                    <div class="tf-lbl">Maps Baru</div>
                    <div class="tf-val">🗺️ ${t.new_place_name}</div>
                    <div style="font-size:11px;color:var(--text3)">Place ID: ${t.new_place_id}</div>
                </div>
            </div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:12px">
                📅 Diminta: ${formatDate(t.requested_at)}
            </div>
            <div class="tf-actions">
                <button class="btn btn-success btn-sm" onclick="approveTransfer('${t.id}')">✅ Setujui</button>
                <button class="btn btn-danger btn-sm" onclick="rejectTransfer('${t.id}')">❌ Tolak</button>
            </div>
        </div>
    `).join('');
}

function renderTransferHistory(transfers) {
    const el = document.getElementById('transfer-history');
    if (!transfers.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-ico">📜</div><p>Belum ada riwayat transfer</p></div>';
        return;
    }

    el.innerHTML = transfers.map(t => `
        <div class="log">
            <div class="log-ico ${t.status === 'approved' ? 'g' : 'r'}">
                ${t.status === 'approved' ? '✅' : '❌'}
            </div>
            <div class="log-body">
                <div class="log-title" style="color:${t.status === 'approved' ? 'var(--green)' : 'var(--red)'}">
                    Transfer ${t.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                </div>
                <div class="log-desc">
                    👤 <b>${t.roblox_username}</b> • 🎮 ${t.system_name}<br>
                    🔑 <code class="key">${t.key_code}</code><br>
                    🗺️ ${t.old_place_name} → ${t.new_place_name}
                </div>
            </div>
            <div class="log-time">${formatDate(t.resolved_at)}</div>
        </div>
    `).join('');
}

async function approveTransfer(id) {
    if (!confirm('Setujui transfer key ini?')) return;
    const data = await apiCall('POST', `/api/admin/transfer/${id}/approve`);
    if (data?.success) {
        showToast('Transfer berhasil disetujui');
        loadTransfers();
    } else {
        showToast(data?.message || 'Gagal menyetujui', 'error');
    }
}

async function rejectTransfer(id) {
    if (!confirm('Tolak transfer key ini?')) return;
    const data = await apiCall('POST', `/api/admin/transfer/${id}/reject`);
    if (data?.success) {
        showToast('Transfer berhasil ditolak', 'info');
        loadTransfers();
    } else {
        showToast(data?.message || 'Gagal menolak', 'error');
    }
}

loadTransfers();
