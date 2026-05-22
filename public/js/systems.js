// ============================================
// SYSTEMS.JS
// ============================================

let systemsData = [];

async function loadSystems() {
    const data = await apiCall('GET', '/api/admin/systems');
    if (!data || !data.success) return;
    systemsData = data.data;
    renderSystems(systemsData);
}

function renderSystems(systems) {
    const el = document.getElementById('systems-grid');
    if (!systems.length) {
        el.innerHTML = '<div class="empty-state"><div class="empty-ico">🎮</div><p>Belum ada sistem. Tambahkan sistem baru!</p></div>';
        return;
    }

    el.innerHTML = systems.map((s, i) => `
        <div class="sys-card ${sysColors[i % sysColors.length]}">
            <div class="sys-ico">${s.icon || '🎮'}</div>
            <div class="sys-name">${s.name}</div>
            <div class="sys-desc">${s.description || 'Tidak ada deskripsi'}</div>
            <div class="sys-foot">
                <span style="color:var(--green)">✅ ${s.active_keys} Aktif</span>
                <span style="color:var(--text3)">${s.version}</span>
            </div>
            <div class="sys-actions">
                <button class="btn btn-gray btn-sm" onclick="openEditSystem('${s.id}')">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSystem('${s.id}','${s.name}')">🗑️ Hapus</button>
                <a href="keys.html" class="btn btn-success btn-sm">🔑 ${s.total_keys} Keys</a>
            </div>
        </div>
    `).join('');
}

function openAddSystem() {
    document.getElementById('sys-id').value = '';
    document.getElementById('sys-icon').value = '🎮';
    document.getElementById('sys-name').value = '';
    document.getElementById('sys-desc').value = '';
    document.getElementById('sys-ver').value = 'v1.0';
    document.getElementById('m-system-title').textContent = '🎮 Tambah Sistem Baru';
    document.getElementById('m-system').classList.remove('hide');
}

function openEditSystem(id) {
    const sys = systemsData.find(s => s.id === id);
    if (!sys) return;
    document.getElementById('sys-id').value = id;
    document.getElementById('sys-icon').value = sys.icon || '🎮';
    document.getElementById('sys-name').value = sys.name;
    document.getElementById('sys-desc').value = sys.description || '';
    document.getElementById('sys-ver').value = sys.version || 'v1.0';
    document.getElementById('m-system-title').textContent = '✏️ Edit Sistem';
    document.getElementById('m-system').classList.remove('hide');
}

async function saveSystem() {
    const id = document.getElementById('sys-id').value;
    const body = {
        icon: document.getElementById('sys-icon').value || '🎮',
        name: document.getElementById('sys-name').value.trim(),
        description: document.getElementById('sys-desc').value.trim(),
        version: document.getElementById('sys-ver').value.trim() || 'v1.0'
    };

    if (!body.name) { showToast('Nama sistem wajib diisi', 'error'); return; }

    let data;
    if (id) {
        data = await apiCall('PUT', `/api/admin/systems/${id}`, body);
    } else {
        data = await apiCall('POST', '/api/admin/systems', body);
    }

    if (data?.success) {
        showToast(data.message);
        closeModal('m-system');
        loadSystems();
    } else {
        showToast(data?.message || 'Gagal menyimpan', 'error');
    }
}

async function deleteSystem(id, name) {
    if (!confirm(`Hapus sistem "${name}"?\nPastikan tidak ada key yang menggunakan sistem ini.`)) return;
    const data = await apiCall('DELETE', `/api/admin/systems/${id}`);
    if (data?.success) {
        showToast(data.message);
        loadSystems();
    } else {
        showToast(data?.message || 'Gagal menghapus', 'error');
    }
}

loadSystems();
