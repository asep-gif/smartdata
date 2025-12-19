const jwt = require('jsonwebtoken');

/**
 * Middleware untuk memverifikasi JWT (JSON Web Token).
 * Token diharapkan ada di header 'Authorization' dengan format 'Bearer <token>'.
 * Jika token valid, payload token (data pengguna) akan ditambahkan ke `req.user`.
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Mengambil token dari "Bearer TOKEN"

    if (token == null) {
        // Jika tidak ada token, kirim status 401 Unauthorized
        return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Jika token tidak valid (misalnya, kedaluwarsa), kirim status 403 Forbidden
            return res.status(403).json({ error: 'Token tidak valid atau telah kedaluwarsa.' });
        }
        // Simpan payload pengguna ke dalam objek request untuk digunakan oleh rute selanjutnya
        req.user = user;
        next(); // Lanjutkan ke middleware atau handler rute berikutnya
    });
}

/**
 * Middleware untuk otorisasi peran 'admin'.
 * Harus digunakan SETELAH authenticateToken.
 */
function authorizeAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Akses ditolak. Hanya admin yang diizinkan.' });
    }
}

/**
 * Middleware untuk otorisasi peran 'manager' atau 'admin'.
 * Harus digunakan SETELAH authenticateToken.
 */
function authorizeManagerOrAdmin(req, res, next) {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
        next();
    } else {
        res.status(403).json({ error: 'Akses ditolak. Hanya manager atau admin yang diizinkan.' });
    }
}

module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeManagerOrAdmin,
};