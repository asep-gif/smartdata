const pool = require('../config/db');

// GET /api/hotels - Mengambil semua hotel
exports.getAllHotels = async (req, res) => {
    try {
        const user = req.user;
        let query = 'SELECT id, name, brand, city, address, number_of_rooms, created_at FROM hotels';
        const queryParams = [];

        // Jika pengguna bukan admin, hanya tampilkan hotel yang bisa mereka akses
        if (user.role !== 'admin') {
            const accessResult = await pool.query('SELECT hotel_id FROM user_hotel_access WHERE user_id = $1', [user.id]);
            const accessibleHotelIds = accessResult.rows.map(row => row.hotel_id);

            if (accessibleHotelIds.length === 0) {
                // Jika pengguna non-admin tidak punya akses ke hotel manapun, kembalikan array kosong.
                return res.json([]);
            }
            query += ' WHERE id = ANY($1::int[])';
            queryParams.push(accessibleHotelIds);
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching hotels:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/hotels - Menambahkan hotel baru
exports.createHotel = async (req, res) => {
    const { name, brand, city, address } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nama hotel wajib diisi.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO hotels (name, brand, city, address) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, brand || null, city || null, address || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating hotel:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/hotels/:id - Mengambil satu hotel
exports.getHotelById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT id, name, brand, city, address FROM hotels WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Hotel tidak ditemukan.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error fetching hotel ${id}:`, err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /api/hotels/:id - Memperbarui hotel
exports.updateHotel = async (req, res) => {
    const { id } = req.params;
    const { name, brand, city, address } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nama hotel wajib diisi.' });
    }

    try {
        const result = await pool.query(
            'UPDATE hotels SET name = $1, brand = $2, city = $3, address = $4 WHERE id = $5 RETURNING *',
            [name, brand || null, city || null, address || null, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Hotel tidak ditemukan.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(`Error updating hotel ${id}:`, err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /api/hotels/:id - Menghapus hotel
exports.deleteHotel = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM hotels WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Hotel tidak ditemukan.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(`Error deleting hotel ${id}:`, err);
        res.status(500).json({ error: 'Internal server error' });
    }
};