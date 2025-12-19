const pool = require('../config/db');
const bcrypt = require('bcrypt');

// GET /api/users - Mengambil semua pengguna
exports.getAllUsers = async (req, res) => {
    try {
        const query = `
            SELECT
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.role,
                u.created_at,
                COALESCE(
                    jsonb_agg(DISTINCT jsonb_build_object('id', h.id, 'name', h.name)) FILTER (WHERE h.id IS NOT NULL),
                    '[]'::jsonb
                ) AS hotels
            FROM users u
            LEFT JOIN user_hotel_access uha ON u.id = uha.user_id
            LEFT JOIN hotels h ON uha.hotel_id = h.id
            GROUP BY u.id
            ORDER BY u.created_at DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/users - Menambahkan pengguna baru
exports.createUser = async (req, res) => {
    const { username, email, password, fullName, role, hotelIds } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ error: 'Username, email, password, dan role wajib diisi.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const userResult = await client.query(
            'INSERT INTO users (username, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING RETURNING id, username, email, full_name, role, created_at',
            [username, email, passwordHash, fullName, role]
        );
        const newUser = userResult.rows[0];

        if (newUser.role !== 'admin' && Array.isArray(hotelIds) && hotelIds.length > 0) {
            const insertAccessQuery = 'INSERT INTO user_hotel_access (user_id, hotel_id) VALUES ($1, $2)';
            for (const hotelId of hotelIds) {
                await client.query(insertAccessQuery, [newUser.id, hotelId]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json(newUser);
    } catch (err) {
        await client.query('ROLLBACK');
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Username atau email sudah terdaftar.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

// GET /api/users/assignable - Mendapatkan pengguna yang bisa ditugaskan
exports.getAssignableUsers = async (req, res) => {
    const { hotelId, role } = req.query;
    if (!hotelId) {
        return res.status(400).json({ error: 'Hotel ID is required.' });
    }

    try {
        let query;
        const queryParams = [hotelId];

        if (role) {
            queryParams.push(role);
            query = `
                SELECT u.id, u.full_name, u.role
                FROM users u
                WHERE
                    u.role = 'admin'::user_role
                    OR (u.role = $2::user_role AND EXISTS (SELECT 1 FROM user_hotel_access uha WHERE uha.user_id = u.id AND uha.hotel_id = $1))
                ORDER BY u.full_name ASC;
            `;
        } else {
            query = `
                SELECT u.id, u.full_name, u.role FROM users u
                WHERE u.role IN ('manager'::user_role, 'admin'::user_role, 'direksi'::user_role) OR EXISTS (SELECT 1 FROM user_hotel_access uha WHERE uha.user_id = u.id AND uha.hotel_id = $1)
                ORDER BY u.full_name;
            `;
        }
        const { rows } = await pool.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching assignable users:', err.message);
        res.status(500).json({ error: 'Gagal mengambil daftar pengguna.' });
    }
};

// GET /api/users/:id - Mengambil satu pengguna
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT
                u.id, u.username, u.email, u.full_name, u.role,
                COALESCE(
                    jsonb_agg(DISTINCT jsonb_build_object('id', h.id, 'name', h.name)) FILTER (WHERE h.id IS NOT NULL),
                    '[]'::jsonb
                ) AS hotels
            FROM users u
            LEFT JOIN user_hotel_access uha ON u.id = uha.user_id
            LEFT JOIN hotels h ON uha.hotel_id = h.id
            WHERE u.id = $1
            GROUP BY u.id;
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /api/users/:id - Memperbarui pengguna
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { fullName, password, role, hotelIds } = req.body;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let passwordHash;
        if (password) {
            const saltRounds = 10;
            passwordHash = await bcrypt.hash(password, saltRounds);
        }

        const fields = [];
        const values = [];
        let queryIndex = 1;

        if (fullName !== undefined) { fields.push(`full_name = $${queryIndex++}`); values.push(fullName); }
        if (role) { fields.push(`role = $${queryIndex++}`); values.push(role); }
        if (passwordHash) { fields.push(`password_hash = $${queryIndex++}`); values.push(passwordHash); }

        let result;
        if (fields.length > 0) {
            values.push(id);
            const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING id, username, email, full_name, role`;
            result = await client.query(query, values);
        } else {
            result = await client.query('SELECT id, username, email, full_name, role FROM users WHERE id = $1', [id]);
        }
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
        }

        await client.query('DELETE FROM user_hotel_access WHERE user_id = $1', [id]);

        if (role !== 'admin' && Array.isArray(hotelIds) && hotelIds.length > 0) {
            const insertAccessQuery = 'INSERT INTO user_hotel_access (user_id, hotel_id) VALUES ($1, $2)';
            for (const hotelId of hotelIds) {
                await client.query(insertAccessQuery, [id, hotelId]);
            }
        }

        await client.query('COMMIT');
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

// DELETE /api/users/:id - Menghapus pengguna
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    if (id === String(adminId)) {
        return res.status(403).json({ error: 'Admin tidak dapat menghapus akunnya sendiri.' });
    }
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};