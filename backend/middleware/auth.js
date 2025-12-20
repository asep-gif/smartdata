const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Middleware untuk memverifikasi token JWT.
 * Jika valid, akan mengambil data pengguna beserta hak aksesnya dari database
 * dan menempelkannya ke `req.user`.
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Akses ditolak. Token tidak tersedia.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_secret_key');

        // Ambil data pengguna dan hak aksesnya dalam satu query
        const userQuery = `
            SELECT 
                u.id, u.username, u.email, u.full_name, r.name as role,
                            COALESCE(
                                jsonb_agg(DISTINCT p.action) FILTER (WHERE p.action IS NOT NULL), 
                                '[]'::jsonb
                            ) as permissions,
                            COALESCE(
                                jsonb_agg(DISTINCT uha.hotel_id) FILTER (WHERE uha.hotel_id IS NOT NULL),
                                '[]'::jsonb
                            ) as accessible_hotel_ids
                            FROM users u
                            JOIN roles r ON u.role::text = r.name
                            LEFT JOIN role_permissions rp ON r.id = rp.role_id
                            LEFT JOIN permissions p ON rp.permission_id = p.id
                            LEFT JOIN user_hotel_access uha ON u.id = uha.user_id
                            WHERE u.id = $1
                            GROUP BY u.id, r.name;        `;
        
        const { rows } = await pool.query(userQuery, [decoded.id]);

        if (rows.length === 0) {
            return res.status(403).json({ message: 'Pengguna tidak ditemukan.' });
        }

        req.user = rows[0]; // Tempelkan user object ke request
        next();

    } catch (err) {
        console.error('Authentication error:', err);
        return res.status(403).json({ message: 'Token tidak valid atau telah kedaluwarsa.' });
    }
};

/**
 * Factory function untuk membuat middleware otorisasi berdasarkan hak akses.
 * @param {string[]} requiredPermissions - Array berisi string hak akses yang diperlukan.
 * @returns Middleware function.
 */
const authorize = (requiredPermissions) => {
    return (req, res, next) => {
        const userPermissions = req.user?.permissions || [];
        
        // Izinkan jika pengguna adalah 'admin'
        if (req.user?.role === 'admin') {
            return next();
        }

        // Cek apakah pengguna memiliki setidaknya salah satu hak akses yang diperlukan
        const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

        if (hasPermission) {
            return next();
        }

        return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki hak akses yang diperlukan.' });
    };
};

/**
 * BARU: Middleware untuk otorisasi peran 'admin' secara spesifik.
 * Harus digunakan SETELAH authenticateToken.
 */
const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
};

const authorizeManagerOrAdmin = authorize(['users:manage', 'hotels:manage', 'roles:manage']); // Contoh penggunaan ulang

module.exports = { authenticateToken, authorize, authorizeManagerOrAdmin, authorizeAdmin };