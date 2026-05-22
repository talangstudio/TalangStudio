// ============================================
// DASHBOARD.JS
// ============================================

async function loadDashboard() {
    const data = await apiCall('GET', '/api/admin/stats');
    if (!data || !data.success) return;

    const d = data.data;
    document.getElementById('stat-total').textContent = d.total_keys;
    document.getElementById('stat-active').textContent = d.active_keys;
    document.getElementById('stat-unused').textContent = d.unused_keys;
    document.getElementById('stat-revoked').textContent = d.revoked_keys;
    document.getElementById('stat-systems').textContent = d.total_systems;
    document.getElementById('stat-bypass').textContent = d.bypass_attempts;

    // Update badges
    if (document.getElementById('badge-keys'))
        document.getElementById('badge-keys').textContent = d.total_keys;
    if (document.getElementById('badge-transfer'))
        document.getElementById('badge-transfer').textContent = d.pending_transfers;

    // Update waktu
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 3600000);
    document.getElementById('last-update').textContent = 
        wib.toISOString().slice(0,10).split('-').reverse().join(' ') + ' • ' +
        wib.toISOString().slice(11,16) + ' WIB';

    // Recent logs
    renderRecentLogs(d.recent_logs || []);
}

function renderRecentLogs(logs) {
    const el = document.getElementById('recent-logs');
    if (!logs.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-ico">📋</div><p>Belum ada aktivitas</p></div>';
        return;
    }

    el.innerHTML = logs.map(log => {
        const { cls, icon } = getLogIcon(log.action);
        const color = getActionColor(log.action);
        const label = getActionLabel(log.action);

        return `
            <div class="log">
                <div class="log-ico ${cls}">${icon}</div>
                <div class="log-body">
                    <div class="log-title" style="color:${color}">${label}</div>
                    <div class="log-desc">
                        ${log.roblox_username ? `👤 <b>${log.roblox_username}</b>` : ''}
                        ${log.system_name ? `• 🎮 ${log.system_name}` : ''}<br>
                        ${log.key_code ? `🔑 <code class="key">${log.key_code}</code>` : ''}
                        ${log.place_name ? `• 🗺️ ${log.place_name}` : ''}
                        ${log.details ? `<br>📌 ${log.details}` : ''}
                    </div>
                </div>
                <div class="log-time">${timeAgo(log.timestamp)}</div>
            </div>
        `;
    }).join('');
}

// Auto refresh tiap 30 detik
loadDashboard();
setInterval(loadDashboard, 30000);
