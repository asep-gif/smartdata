const pool = require('../config/db');


/**
 * @desc    Mendapatkan semua agenda audit
 * @route   GET /api/audit/agendas
 * @access  Private
 */
const getAgendas = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                a.id, 
                a.date, 
                a.hotel_id, 
                h.name AS hotel_name, 
                a.auditor, 
                a.status, 
                a.notes 
            FROM audit_agendas a
            JOIN hotels h ON a.hotel_id = h.id
            ORDER BY a.date DESC, a.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching audit agendas:', err.message);
        res.status(500).json({ message: 'Server error while fetching audit agendas.' });
    }
};

/**
 * @desc    Mendapatkan satu agenda audit berdasarkan ID
 * @route   GET /api/audit/agendas/:id
 * @access  Private
 */
const getAgendaById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM audit_agendas WHERE id = $1', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Audit agenda not found.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error fetching audit agenda ${id}:`, err.message);
        res.status(500).json({ message: 'Server error while fetching audit agenda.' });
    }
};

/**
 * @desc    Mendapatkan data lengkap untuk laporan audit
 * @route   GET /api/audit-agendas/:id/report
 * @access  Private
 */
const getAgendaReport = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Dapatkan Detail Agenda
        const agendaRes = await pool.query(
            `SELECT a.*, h.name as hotel_name 
             FROM audit_agendas a 
             JOIN hotels h ON a.hotel_id = h.id 
             WHERE a.id = $1`, [id]
        );
        if (agendaRes.rows.length === 0) {
            return res.status(404).json({ message: 'Agenda audit tidak ditemukan.' });
        }
        const agendaDetails = agendaRes.rows[0];

        // 2. Dapatkan semua item checklist yang aktif dan gabungkan dengan hasil audit untuk agenda ini
        const checklistRes = await pool.query(`
            SELECT 
                cat.id as category_id, 
                cat.name as category_name,
                item.id as item_id,
                item.name as item_name,
                item.standard as item_standard,
                res.result,
                res.notes,
                res.image_url
            FROM audit_checklist_categories cat
            JOIN audit_checklist_items item ON cat.id = item.category_id
            LEFT JOIN audit_results res ON item.id = res.item_id AND res.agenda_id = $1
            WHERE item.is_active = true
            ORDER BY cat.position, cat.name, item.position, item.name;
        `, [id]);

        // 3. Proses dan kelompokkan hasilnya
        const categories = {};
        let passCount = 0;
        let failCount = 0;

        checklistRes.rows.forEach(row => {
            if (!categories[row.category_id]) {
                categories[row.category_id] = { id: row.category_id, name: row.category_name, items: [] };
            }
            categories[row.category_id].items.push({ id: row.item_id, name: row.item_name, standard: row.item_standard, result: row.result || 'n/a', notes: row.notes, imageUrl: row.image_url });
            if (row.result === 'pass') passCount++;
            else if (row.result === 'fail') failCount++;
        });
        
        const totalScorableItems = passCount + failCount;
        const score = totalScorableItems > 0 ? (passCount / totalScorableItems) * 100 : 0;

        const reportData = {
            agenda: agendaDetails,
            summary: { totalItems: checklistRes.rows.length, passCount, failCount, naCount: checklistRes.rows.length - totalScorableItems, score: parseFloat(score.toFixed(2)) },
            checklist: Object.values(categories)
        };
        res.json(reportData);
    } catch (err) {
        console.error(`Error fetching audit report for agenda ${id}:`, err.message);
        res.status(500).json({ message: 'Server error while fetching audit report.' });
    }
};

/**
 * @desc    Membuat agenda audit baru
 * @route   POST /api/audit/agendas
 * @access  Private
 */
const createAgenda = async (req, res) => {
    const { date, hotel_id, auditor, status, notes } = req.body;

    if (!date || !hotel_id || !auditor || !status) {
        return res.status(400).json({ message: 'Tanggal, hotel, auditor, dan status wajib diisi.' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO audit_agendas (date, hotel_id, auditor, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [date, hotel_id, auditor, status, notes]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating audit agenda:', err.message);
        res.status(500).json({ message: 'Server error while creating audit agenda.' });
    }
};

/**
 * @desc    Memperbarui agenda audit
 * @route   PUT /api/audit/agendas/:id
 * @access  Private
 */
const updateAgenda = async (req, res) => {
    const { id } = req.params;
    const { date, hotel_id, auditor, status, notes } = req.body;

    if (!date || !hotel_id || !auditor || !status) {
        return res.status(400).json({ message: 'Tanggal, hotel, auditor, dan status wajib diisi.' });
    }

    try {
        const { rows } = await pool.query(
            `UPDATE audit_agendas 
             SET date = $1, hotel_id = $2, auditor = $3, status = $4, notes = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [date, hotel_id, auditor, status, notes, id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Audit agenda not found.' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(`Error updating audit agenda ${id}:`, err.message);
        res.status(500).json({ message: 'Server error while updating audit agenda.' });
    }
};

/**
 * @desc    Menghapus agenda audit
 * @route   DELETE /api/audit/agendas/:id
 * @access  Private
 */
const deleteAgenda = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM audit_agendas WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Audit agenda not found.' });
        }
        res.status(204).send(); // No Content
    } catch (err) {
        console.error(`Error deleting audit agenda ${id}:`, err.message);
        res.status(500).json({ message: 'Server error while deleting audit agenda.' });
    }
};

module.exports = {
    getAgendas,
    getAgendaById,
    createAgenda,
    updateAgenda,
    deleteAgenda,
    getAgendaReport,
};