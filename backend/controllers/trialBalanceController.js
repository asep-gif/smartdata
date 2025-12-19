const pool = require('../config/db');

/**
 * Mengambil semua data trial balance.
 */
exports.getAllTrialBalances = async (req, res, next) => {
    const { status } = req.query;
    try {
        let query = 'SELECT * FROM trial_balances';
        const params = [];

        // Filter berdasarkan status jika ada dan bukan 'all'
        if (status && status !== 'all') {
            params.push(status);
            query += ` WHERE status = $${params.length}`;
        }

        query += ' ORDER BY position ASC NULLS LAST, created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        next(err);
    }
};

/**
 * Mengambil satu data trial balance berdasarkan ID.
 */
exports.getTrialBalanceById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM trial_balances WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Data tidak ditemukan.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

/**
 * Membuat data trial balance baru.
 */
exports.createTrialBalance = async (req, res, next) => {
    const { title, link, status, thumbnail_url, drive_folder_link } = req.body;

    if (!title || !link || !status) {
        return res.status(400).json({ error: 'Judul, Link, dan Status wajib diisi.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO trial_balances (title, link, status, thumbnail_url, drive_folder_link) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, link, status, thumbnail_url || null, drive_folder_link || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

/**
 * Memperbarui data trial balance yang ada.
 */
exports.updateTrialBalance = async (req, res, next) => {
    const { id } = req.params;
    const { title, link, status, thumbnail_url, drive_folder_link } = req.body;

    if (!title || !link || !status) {
        return res.status(400).json({ error: 'Judul, Link, dan Status wajib diisi.' });
    }

    try {
        const result = await pool.query(
            'UPDATE trial_balances SET title = $1, link = $2, status = $3, thumbnail_url = $4, drive_folder_link = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
            [title, link, status, thumbnail_url || null, drive_folder_link || null, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Data tidak ditemukan.' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        next(err);
    }
};

/**
 * Menghapus data trial balance.
 */
exports.deleteTrialBalance = async (req, res, next) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM trial_balances WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Data tidak ditemukan.' });
        }

        res.status(200).json({ message: 'Data berhasil dihapus.' });
    } catch (err) {
        next(err);
    }
};

/**
 * Mengurutkan ulang posisi trial balance.
 */
exports.reorderTrialBalances = async (req, res, next) => {
    const { order } = req.body;

    // Validasi untuk memastikan 'order' adalah array berisi ID yang valid
    if (!Array.isArray(order) || order.some(id => isNaN(parseInt(id, 10)))) {
        return res.status(400).json({ error: '`order` harus berupa array ID (integer) yang valid.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Buat array of promises untuk setiap query update
        const updatePromises = order.map((id, index) => {
            const cleanId = parseInt(id, 10);
            const newPosition = index; // Posisi baru berdasarkan urutan di array
            return client.query('UPDATE trial_balances SET position = $1 WHERE id = $2', [newPosition, cleanId]);
        });

        // Jalankan semua promises secara paralel
        await Promise.all(updatePromises);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Urutan berhasil diperbarui.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Gagal mengurutkan ulang:', err); // Logging error
        next(err);
    } finally {
        client.release();
    }
};