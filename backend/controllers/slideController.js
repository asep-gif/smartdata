const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

// GET /api/slides - Mendapatkan semua slide
exports.getAllSlides = async (req, res, next) => {
    try {
        const { hotels, type } = req.query;

        let query = `
            SELECT s.*, h.name as hotel_name, h.brand as hotel_brand
            FROM slides s
            LEFT JOIN hotels h ON s.hotel_id = h.id
        `;
        const queryParams = [];
        const whereClauses = [];

        if (hotels) {
            const hotelIds = hotels.split(',').map(id => parseInt(id.trim(), 10));
            whereClauses.push(`s.hotel_id = ANY($${queryParams.length + 1}::int[])`);
            queryParams.push(hotelIds);
        } else if (type === 'hotel') {
            whereClauses.push('s.hotel_id IS NOT NULL');
        } else if (type === 'corporate') {
            whereClauses.push('s.hotel_id IS NULL');
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        query += ` ORDER BY s.position ASC, s.created_at DESC`;

        const { rows } = await pool.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

// GET /api/slides/:id - Mendapatkan satu slide berdasarkan ID
exports.getSlideById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM slides WHERE id = $1', [id]);
        if (rows.length === 0) {
            res.status(404);
            throw new Error('Slide not found');
        }
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

// POST /api/slides - Membuat slide baru
exports.createSlide = async (req, res, next) => {
    const { title, link, hotel_id, thumbnail_base64 } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    let thumbnailUrl = null;
    if (thumbnail_base64) {
        try {
            const base64Data = thumbnail_base64.replace(/^data:image\/png;base64,/, "");
            const thumbFilename = `slide-thumb-${Date.now()}.png`;
            const thumbPath = path.join('uploads', thumbFilename);
            fs.writeFileSync(thumbPath, base64Data, 'base64');
            thumbnailUrl = thumbPath.replace(/\\/g, "/");
        } catch (thumbError) {
            console.error('Error saving thumbnail:', thumbError.message);
            // Anda bisa memilih untuk meneruskan error atau melanjutkan tanpa thumbnail
        }
    }

    try {
        const maxPosResult = await pool.query('SELECT MAX(position) as max_pos FROM slides');
        const newPosition = (maxPosResult.rows[0].max_pos || 0) + 1;

        const { rows } = await pool.query(
            'INSERT INTO slides (title, link, hotel_id, position, thumbnail_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, link || null, hotel_id ? parseInt(hotel_id, 10) : null, newPosition, thumbnailUrl]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        next(err);
    }
};

// PUT /api/slides/reorder - Mengatur ulang urutan slide
exports.reorderSlides = async (req, res, next) => {
    const { order } = req.body; // No change needed here, it's already correct.

    if (!Array.isArray(order) || order.length === 0) {
        return res.status(400).json({ error: '`order` harus berupa array yang tidak kosong.' });
    }

    const client = await pool.connect();
    try { // No change needed here, it's already correct.
        await client.query('BEGIN');
        const caseClauses = order.map((id, index) => `WHEN id = ${parseInt(id, 10)} THEN ${index}`).join(' ');
        const query = `UPDATE slides SET position = CASE ${caseClauses} END WHERE id = ANY($1::int[])`;
        await client.query(query, [order]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Slide order updated successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// PUT /api/slides/:id - Mengupdate slide
exports.updateSlide = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, link, thumbnail_url } = req.body;
        const hotelIdValue = req.body.hotel_id ? parseInt(req.body.hotel_id, 10) : null;

        const updatedSlide = await pool.query(
            'UPDATE slides SET title = $1, link = $2, hotel_id = $3, thumbnail_url = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
            [title, link, hotelIdValue, thumbnail_url || null, id]
        );
        if (updatedSlide.rows.length === 0) {
            res.status(404);
            throw new Error('Slide not found');
        }
        res.json(updatedSlide.rows[0]);
    } catch (err) {
        next(err);
    }
};

// DELETE /api/slides/:id - Menghapus slide
exports.deleteSlide = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM slides WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) return res.status(404).json({ error: 'Slide not found' });
        res.status(200).json({ message: 'Slide deleted successfully' });
    } catch (err) {
        next(err);
    }
};