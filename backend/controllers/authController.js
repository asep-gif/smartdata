const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/login - Otentikasi pengguna
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi.' });
    }

    try {
        // 1. Cari pengguna berdasarkan email
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Email atau password salah.' }); // Pesan generik
        }
        const user = userResult.rows[0];

        // 2. Bandingkan password yang diberikan dengan hash di database
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Email atau password salah.' });
        }

        // 3. Buat JSON Web Token (JWT)
        const payload = { id: user.id, role: user.role, fullName: user.full_name };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'your_default_secret_key', { expiresIn: '1d' });

        // Hapus password hash dari objek user sebelum dikirim ke client
        delete user.password_hash;
        
        // BARU: Ambil hak akses (permissions) untuk pengguna ini
        const permissionsQuery = `
            SELECT p.action
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN roles r ON rp.role_id = r.id
            WHERE r.name = $1;
        `;
        const permissionsResult = await pool.query(permissionsQuery, [user.role]);
        user.permissions = permissionsResult.rows.map(row => row.action);

        // Jika role adalah admin, berikan semua hak akses secara implisit untuk frontend
        if (user.role === 'admin') {
            const allPermissionsResult = await pool.query('SELECT action FROM permissions');
            user.permissions = allPermissionsResult.rows.map(row => row.action);
        }

        // Ambil hak akses hotel
        user.hotels = [];
        if (user.role === 'admin' || user.role === 'direksi') {
            const allHotelsResult = await pool.query('SELECT id, name, brand, city FROM hotels ORDER BY name ASC');
            user.hotels = allHotelsResult.rows;
        } else {
            const hotelsResult = await pool.query(
                'SELECT h.id, h.name, h.brand, h.city FROM hotels h JOIN user_hotel_access uha ON h.id = uha.hotel_id WHERE uha.user_id = $1 ORDER BY h.name ASC',
                [user.id]
            );
            user.hotels = hotelsResult.rows;
        }

        res.json({ message: 'Login berhasil', token, user });

    } catch (err) {
        next(err);
    }
};

// PUT /api/users/change-password - Mengubah password pengguna yang sedang login
exports.changePassword = async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Password saat ini dan password baru wajib diisi.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password baru minimal harus 6 karakter.' });
    }

    try {
        const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
        }
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Password saat ini salah.' });
        }

        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

        res.json({ message: 'Password berhasil diubah.' });
    } catch (err) {
        next(err);
    }
};
