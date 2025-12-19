/**
 * Middleware untuk menangani error secara terpusat.
 * Middleware ini harus ditempatkan paling akhir di dalam rantai middleware di server.js.
 */
const errorHandler = (err, req, res, next) => {
    // Jika status code sudah diatur di controller (misal: res.status(404)), gunakan itu.
    // Jika tidak, gunakan status code dari error itu sendiri, atau default ke 500.
    let statusCode = res.statusCode !== 200 ? res.statusCode : (err.statusCode || 500);

    // Tentukan pesan error yang akan dikirim ke client
    let message = err.message;

    // Untuk error 500 di lingkungan produksi, kirim pesan generik untuk keamanan
    if (statusCode === 500 && process.env.NODE_ENV === 'production') {
        message = 'Terjadi kesalahan pada server.';
    }

    // Log error secara terstruktur untuk debugging yang lebih baik
    // Di produksi, ini bisa diganti dengan logger seperti Winston atau Pino
    console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        statusCode: statusCode,
        message: err.message, // Selalu log pesan error asli
        path: req.originalUrl,
        method: req.method,
        stack: err.stack,
    }, null, 2));

    res.status(statusCode).json({
        message: message,
    });
};

module.exports = { errorHandler };