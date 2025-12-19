const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Membuat konfigurasi penyimpanan Multer untuk tujuan tertentu.
 * @param {string} destination - Nama subfolder di dalam direktori 'uploads'.
 * @returns {multer} - Instance Multer yang sudah dikonfigurasi.
 */
const createStorage = (destination) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(__dirname, `../uploads/${destination}`);
            // Buat direktori jika belum ada
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            // Buat nama file yang unik untuk menghindari konflik
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
    return multer({ storage: storage });
};

// Ekspor instance upload untuk setiap fitur
const uploadAuditPhoto = createStorage('audit_photos');
const uploadReviewMedia = createStorage('reviews'); // Contoh untuk review
const uploadCompletionPhoto = createStorage('completion_tasks'); // Contoh untuk tugas

module.exports = {
    uploadAuditPhoto,
    uploadReviewMedia,
    uploadCompletionPhoto,
};
