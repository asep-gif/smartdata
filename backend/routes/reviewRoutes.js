const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getHotelsForReview, submitGuestReview, getReviewSettings, updateReviewSettings, getDashboardStats } = require('../controllers/reviewController');
const { authenticateToken, authorizeManagerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// --- Middleware Konfigurasi Multer ---
// Middleware ini spesifik untuk rute ulasan, jadi tetap di sini.
// Konfigurasi Multer untuk penyimpanan file
// File akan disimpan di folder 'public/uploads/reviews'
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Pastikan direktori ini ada atau buat secara otomatis
        const uploadPath = path.join(__dirname, '../../public/uploads');
        // BARU: Buat direktori jika belum ada
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Buat nama file yang unik untuk menghindari konflik
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Batas ukuran file 10MB
    fileFilter: function (req, file, cb) {
        // Filter hanya untuk gambar dan video
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Tipe file tidak didukung! Hanya gambar dan video yang diizinkan.'), false);
        }
    }
});

// --- Definisi Rute ---

// Rute untuk mendapatkan daftar hotel, memanggil controller getHotelsForReview
router.get('/reviews/hotels', getHotelsForReview);

// BARU: Rute untuk data statistik dasbor (memerlukan login)
router.get('/reviews/dashboard-stats', authenticateToken, getDashboardStats);

// BARU: Rute untuk mendapatkan pengaturan form review untuk hotel tertentu (memerlukan login)
router.get('/reviews/settings/:hotelId', authenticateToken, getReviewSettings);

// BARU: Rute untuk menyimpan pengaturan form review (memerlukan akses manager/admin)
// Menggunakan upload.fields untuk menangani beberapa file dengan nama field yang berbeda
router.post('/reviews/settings', authenticateToken, authorizeManagerOrAdmin, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'promo_image', maxCount: 1 }
]), updateReviewSettings);

// Rute untuk mengirim ulasan, menggunakan middleware 'upload' lalu memanggil controller submitGuestReview
// 'media[]' harus cocok dengan nama yang dikirim dari FormData di frontend
router.post('/reviews/submit', upload.array('media[]', 5), submitGuestReview); // Rute publik

module.exports = router;