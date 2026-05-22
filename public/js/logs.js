// ============================================
// LOGS.JS
// ============================================

let allLogs = [];
let currentAction = '';

async function loadLogs() {
    const data = await apiCall('GET', '/api/admin/logs?limit=200');
    if (!data || !data.success) return;
    allLogs = data.data;
    renderLogs(allLogs);
}

function renderLogs(logs) {
    const el = document.getElementById('logs-container');
    if (!logs.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-ico">📋</div><p>Belum ada log aktivitas</p></div>';
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
                        ${log.roblox_username ? `👤 <b>${log.roblox_username}</b> ${log.roblox_user_id ? `(ID: ${log.roblox_user_id})` : ''}` : ''}
                        ${log.system_name ? `• 🎮 ${log.system_name}` : ''}<br>
                        ${log.key_code ? `🔑 <code class="key">${log.key_code}</code>` : ''}
                        ${log.place_name ? `• 🗺️ ${log.place_name} ${log.place_id ? `(ID: ${log.place_id})` : ''}` : ''}
                        ${log.details ? `<br>📌 ${log.details}` : ''}
                    </div>
                </div>
                <div class="log-time">${formatDate(log.timestamp)}</div>
            </div>
        `;
    }).join('');
}

function filterByAction(action, btn) {
    currentAction = action;
    document.querySelectorAll('.fil-btn').forEach(b => b.classList.remove('act'));
    btn.classList.add('act');
    filterLogs();
}

function filterLogs() {
    const search = document.getElementById('search-log').value.toLowerCase();
    let filtered = allLogs;

    if (currentAction) {
        filtered = filtered.filter(l => l.action === currentAction);
    }

    if (search) {
        filtered = filtered.filter(l =>
            (l.roblox_username || '').toLowerCase().includes(search) ||
            (l.key_code || '').toLowerCase().includes(search) ||
            (l.place_name || '').toLowerCase().includes(search)
        );
    }

    renderLogs(filtered);
}

loadLogs();
