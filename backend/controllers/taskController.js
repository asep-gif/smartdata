const pool = require('../config/db');
const fs = require('fs');

// GET /api/tasks - Mengambil daftar tugas
exports.getAllTasks = async (req, res, next) => {
    const { hotelId, status, priority } = req.query;

    try {
        let query = `
            SELECT
                t.id, 
                t.description,
                t.notes, t.status, t.priority, t.due_date, t.assigned_to, t.created_at, t.completion_photo_url, t.hotel_id,
                COALESCE(h.name, 'Hotel Dihapus') as hotel_name,
                t.inspection_id,
                COALESCE(it.name, 'Tipe Inspeksi Dihapus') as inspection_type_name,
                i.inspection_date,
                i.room_number_or_area,
                COALESCE(ii.name, 'Item Dihapus') as item_name,
                COALESCE(i.inspector_name, 'Inspektor Dihapus') as inspector_name
            FROM inspection_tasks t
            LEFT JOIN hotels h ON t.hotel_id = h.id
            LEFT JOIN inspections i ON t.inspection_id = i.id
            LEFT JOIN inspection_types it ON i.inspection_type_id = it.id
            LEFT JOIN inspection_items ii ON t.item_id = ii.id
        `;

        const whereClauses = [];
        const queryParams = [];

        if (hotelId && hotelId !== 'all') {
            queryParams.push(hotelId);
            whereClauses.push(`t.hotel_id = $${queryParams.length}`);
        }
        if (status && status !== 'all') {
            queryParams.push(status);
            whereClauses.push(`t.status = $${queryParams.length}`);
        }
        if (priority && priority !== 'all') {
            queryParams.push(priority);
            whereClauses.push(`t.priority = $${queryParams.length}`);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        query += ' ORDER BY t.created_at DESC';
        const { rows } = await pool.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

// GET /api/tasks/:id - Mengambil detail satu tugas
exports.getTaskById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT
                t.*,
                h.name as hotel_name,
                it.name as inspection_type_name,
                ii.name as item_name,
                ii.standard as item_standard,
                i.inspector_name,
                i.inspection_date
            FROM inspection_tasks t
            JOIN hotels h ON t.hotel_id = h.id
            JOIN inspections i ON t.inspection_id = i.id
            JOIN inspection_items ii ON t.item_id = ii.id
            JOIN inspection_types it ON i.inspection_type_id = it.id
            WHERE t.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) {
            res.status(404);
            throw new Error('Tugas tidak ditemukan.');
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

// PUT /api/tasks/:id - Mengupdate status, due date, assigned to, dan foto penyelesaian tugas
exports.updateTask = async (req, res, next) => {
    const { id } = req.params;
    const { status, dueDate, assignedTo } = req.body;
    const photoFile = req.file;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
        if (photoFile) fs.unlinkSync(photoFile.path);
        return res.status(400).json({ error: 'Status tidak valid.' });
    }

    try {
        const updateFields = [];
        const queryParams = [];
        let paramIndex = 1;

        if (status) { updateFields.push(`status = $${paramIndex++}`); queryParams.push(status); }
        if (dueDate) { updateFields.push(`due_date = $${paramIndex++}`); queryParams.push(dueDate); }
        if (assignedTo) { updateFields.push(`assigned_to = $${paramIndex++}`); queryParams.push(assignedTo); }
        if (photoFile) { updateFields.push(`completion_photo_url = $${paramIndex++}`); queryParams.push(photoFile.path.replace(/\\/g, "/")); }
        if (status === 'completed') { updateFields.push(`completed_at = NOW()`); }

        if (updateFields.length === 0) return res.status(400).json({ error: 'Tidak ada data yang diperbarui.' });

        const query = `UPDATE inspection_tasks SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex++} RETURNING *;`;
        queryParams.push(id);

        const { rows } = await pool.query(query, queryParams);
        if (rows.length === 0) {
            res.status(404);
            throw new Error('Tugas tidak ditemukan.');
        }
        res.json({ message: 'Tugas berhasil diperbarui.', task: rows[0] });
    } catch (err) {
        next(err);
    }
};