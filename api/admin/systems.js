const express = require('express');
const router = express.Router();
const { getDB } = require('../lib/database');
const { generateId } = require('../lib/keygen');
const { authMiddleware } = require('../lib/auth');

router.use(authMiddleware);

// GET semua systems
router.get('/', (req, res) => {
    const db = getDB();
    const systems = db.prepare('SELECT * FROM systems ORDER BY created_at DESC').all();
    
    // Hitung jumlah key per system
    const result = systems.map(s => {
        const total = db.prepare('SELECT COUNT(*) as c FROM license_keys WHERE system_id = ?').get(s.id);
        const active = db.prepare("SELECT COUNT(*) as c FROM license_keys WHERE system_id = ? AND status = 'active'").get(s.id);
        return { ...s, total_keys: total.c, active_keys: active.c };
    });

    res.json({ success: true, data: result });
});

// POST tambah system
router.post('/', (req, res) => {
    const { name, description, version, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama sistem wajib diisi' });

    const db = getDB();
    const id = generateId();
    const now = new Date().toISOString();

    db.prepare(`
        INSERT INTO systems VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', version || 'v1.0', icon || '🎮', now);

    res.json({ success: true, message: 'Sistem berhasil ditambahkan', id });
});

// PUT update system
router.put('/:id', (req, res) => {
    const { name, description, version, icon } = req.body;
    const db = getDB();
    
    db.prepare(`
        UPDATE systems SET name = ?, description = ?, version = ?, icon = ? WHERE id = ?
    `).run(name, description, version, icon, req.params.id);

    res.json({ success: true, message: 'Sistem berhasil diperbarui' });
});

// DELETE system
router.delete('/:id', (req, res) => {
    const db = getDB();
    const keys = db.prepare('SELECT COUNT(*) as c FROM license_keys WHERE system_id = ?').get(req.params.id);
    
    if (keys.c > 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tidak dapat menghapus sistem yang masih memiliki key' 
        });
    }

    db.prepare('DELETE FROM systems WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Sistem berhasil dihapus' });
});

module.exports = router;
