const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // PERBAIKAN: Path ke file koneksi database
const { authenticateToken } = require('../middleware/auth'); // PERBAIKAN: Path dan nama file middleware

// --- KODE BARU: Diambil dari reviewRoutes.js untuk sentralisasi ---
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getHotelsForReview, submitGuestReview, getReviewSettings, updateReviewSettings } = require('../controllers/reviewController');

// Konfigurasi Multer untuk penyimpanan file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../public/uploads');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Batas 10MB
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Tipe file tidak didukung! Hanya gambar dan video.'), false);
        }
    }
});
// --- AKHIR KODE BARU ---

// --- Rute untuk Form Publik (tidak perlu token) ---
router.get('/hotels', getHotelsForReview);
router.get('/settings/:hotelId', getReviewSettings);
router.post('/submit', upload.array('media[]', 5), submitGuestReview);

// --- Rute untuk Manajemen Internal (perlu token) ---
/**
 * @route   GET /api/reviews
 * @desc    Get all guest reviews with filtering and pagination
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
    const {
        page = 1,
        limit = 5,
        hotel_id,
        rating,
        status,
        start_date,
        end_date
    } = req.query;

    const offset = (page - 1) * limit;

    try {
        // --- Bagian untuk membangun query dinamis ---
        let whereClauses = [];
        let queryParams = [];
        let paramIndex = 1;

        // PERUBAHAN: Hapus filter status 'approved' agar semua ulasan (termasuk 'pending') bisa tampil.
        // Anda masih bisa memoderasi ulasan jika diperlukan di masa depan dengan membuat halaman moderasi.
        // whereClauses.push(`r.status = 'approved'`);

        if (hotel_id && hotel_id !== 'all') {
            whereClauses.push(`r.hotel_id = $${paramIndex++}`);
            queryParams.push(hotel_id);
        }

        if (rating && rating !== 'all') {
            whereClauses.push(`r.rating = $${paramIndex++}`);
            queryParams.push(rating);
        }

        if (status && status !== 'all') {
            // PERUBAHAN: Filter berdasarkan kolom status, bukan ada/tidaknya balasan.
            whereClauses.push(`r.status = $${paramIndex++}`);
            queryParams.push(status);
        }

        if (start_date) {
            whereClauses.push(`r.created_at >= $${paramIndex++}`);
            queryParams.push(start_date);
        }

        if (end_date) {
            // Tambahkan 1 hari untuk membuat rentang inklusif
            const nextDay = new Date(end_date);
            nextDay.setDate(nextDay.getDate() + 1);
            whereClauses.push(`r.created_at < $${paramIndex++}`);
            queryParams.push(nextDay.toISOString().split('T')[0]);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // --- Query untuk menghitung total item ---
        const totalQuery = `SELECT COUNT(*) FROM guest_reviews r ${whereString}`;
        const totalResult = await pool.query(totalQuery, queryParams);
        const totalReviews = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalReviews / limit);

        // --- Query utama untuk mengambil data ulasan ---
        const reviewsQuery = `
            SELECT 
                r.*,
                h.name as hotel_name,
                (
                    SELECT COALESCE(json_agg(json_build_object('file_path', m.file_path)), '[]'::json)
                    FROM review_media m
                    WHERE m.review_id = r.id
                ) as media
            FROM 
                guest_reviews r
            LEFT JOIN 
                hotels h ON r.hotel_id = h.id
            ${whereString}
            ORDER BY 
                r.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const reviewsResult = await pool.query(reviewsQuery, [...queryParams, limit, offset]);

        res.json({
            reviews: reviewsResult.rows,
            currentPage: parseInt(page, 10),
            totalPages,
            totalReviews
        });

    } catch (err) {
        console.error('Error fetching reviews:', err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/reviews/:id/reply
 * @desc    Submit a reply to a guest review
 * @access  Private
 */
router.post('/:id/reply', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { reply_text } = req.body;

    if (!reply_text || reply_text.trim() === '') {
        return res.status(400).json({ msg: 'Teks balasan tidak boleh kosong.' });
    }

    try {
        const updateQuery = `
            UPDATE guest_reviews
            SET reply_text = $1, replied_at = NOW()
            WHERE id = $2
            RETURNING *;
        `;

        const updatedReviewResult = await pool.query(updateQuery, [reply_text, id]);

        if (updatedReviewResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Ulasan tidak ditemukan.' });
        }

        // Mengambil data yang diperbarui dengan join untuk dikirim kembali ke frontend
        // Ini memastikan frontend bisa me-render ulang kartu dengan data lengkap (termasuk nama hotel dan media)
        const finalReview = await pool.query(`
            SELECT r.*, h.name as hotel_name, (SELECT COALESCE(json_agg(json_build_object('file_path', m.file_path)), '[]'::json) FROM review_media m WHERE m.review_id = r.id) as media
            FROM guest_reviews r LEFT JOIN hotels h ON r.hotel_id = h.id
            WHERE r.id = $1
        `, [id]);

        res.json({ review: finalReview.rows[0] });

    } catch (err) {
        console.error('Error submitting review reply:', err.message);
        res.status(500).send('Server Error');
    }
});

// BARU: Rute untuk menyimpan pengaturan form review (perlu token)
router.post('/settings', authenticateToken, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'promo_image', maxCount: 1 }
]), updateReviewSettings);

/**
 * @route   PUT /api/reviews/:id/approve
 * @desc    Approve a guest review
 * @access  Private
 */
router.put('/:id/approve', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE guest_reviews SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Ulasan tidak ditemukan.' });
        }
        // Ambil lagi dengan join untuk data yang lengkap
        const finalReview = await pool.query(`
            SELECT r.*, h.name as hotel_name FROM guest_reviews r LEFT JOIN hotels h ON r.hotel_id = h.id WHERE r.id = $1
        `, [id]);
        res.json({ message: 'Ulasan disetujui.', review: finalReview.rows[0] });
    } catch (error) {
        console.error('Error approving review:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   PUT /api/reviews/:id/reject
 * @desc    Reject a guest review
 * @access  Private
 */
router.put('/:id/reject', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "UPDATE guest_reviews SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Ulasan tidak ditemukan.' });
        }
        // Ambil lagi dengan join untuk data yang lengkap
        const finalReview = await pool.query(`
            SELECT r.*, h.name as hotel_name FROM guest_reviews r LEFT JOIN hotels h ON r.hotel_id = h.id WHERE r.id = $1
        `, [id]);
        res.json({ message: 'Ulasan ditolak.', review: finalReview.rows[0] });
    } catch (error) {
        console.error('Error rejecting review:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a guest review
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Hapus terlebih dahulu media yang terkait (jika ada) untuk menghindari foreign key constraint violation
        await pool.query('DELETE FROM review_media WHERE review_id = $1', [id]);

        // Hapus ulasan utama
        const deleteResult = await pool.query('DELETE FROM guest_reviews WHERE id = $1', [id]);

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'Ulasan tidak ditemukan.' });
        }

        res.status(204).send(); // 204 No Content, menandakan sukses tanpa body respons
    } catch (err) {
        console.error('Error deleting review:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route   GET /api/reviews/stats
 * @desc    Get statistics and chart data for the guest review dashboard.
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
    const { hotel_id, period = 'last30days' } = req.query;

    try {
        // --- Build dynamic WHERE clauses based on filters ---
        const whereClauses = [`status = 'approved'`]; // Only fetch approved reviews
        const queryParams = [];
        let paramIndex = 1;

        // Filter by hotel
        if (hotel_id && hotel_id !== 'all') {
            whereClauses.push(`hotel_id = $${paramIndex++}`);
            queryParams.push(hotel_id);
        }

        // Filter by time period
        let dateFilterClause = '';
        switch (period) {
            case 'last30days':
                dateFilterClause = `created_at >= NOW() - INTERVAL '30 days'`;
                break;
            case 'this_month':
                dateFilterClause = `created_at >= DATE_TRUNC('month', NOW())`;
                break;
            case 'last_month':
                dateFilterClause = `created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' AND created_at < DATE_TRUNC('month', NOW())`;
                break;
            case 'last90days':
                dateFilterClause = `created_at >= NOW() - INTERVAL '90 days'`;
                break;
            case 'all_time':
                // No date filter
                break;
        }
        if (dateFilterClause) {
            whereClauses.push(dateFilterClause);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // --- Run all queries in parallel for efficiency ---

        // 1. Query for main stat cards
        const statsQuery = `
            SELECT
                COUNT(*) AS total_reviews,
                AVG(rating) AS average_rating,
                COUNT(*) FILTER (WHERE reply_text IS NULL) AS unreplied_count,
                (COUNT(*) FILTER (WHERE reply_text IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0)) AS response_rate
            FROM guest_reviews
            ${whereString};
        `;

        // 2. Query for rating distribution chart
        const ratingDistributionQuery = `
            SELECT rating, COUNT(*) as count FROM guest_reviews ${whereString} GROUP BY rating;
        `;

        // 3. Query for monthly rating trend (last 6 months, unaffected by period filter)
        const monthlyTrendQuery = `
            SELECT TO_CHAR(month_series.month, 'Mon') AS month, COALESCE(AVG(gr.rating), 0) AS average_rating
            FROM (SELECT DATE_TRUNC('month', generate_series(NOW() - INTERVAL '5 months', NOW(), '1 month')) AS month) AS month_series
            LEFT JOIN guest_reviews gr ON DATE_TRUNC('month', gr.created_at) = month_series.month
                AND gr.status = 'approved'
                ${hotel_id && hotel_id !== 'all' ? `AND gr.hotel_id = $${paramIndex}` : ''}
            GROUP BY month_series.month ORDER BY month_series.month;
        `;
        const monthlyTrendParams = (hotel_id && hotel_id !== 'all') ? [hotel_id] : [];

        const [statsResult, ratingDistributionResult, monthlyTrendResult] = await Promise.all([
            pool.query(statsQuery, queryParams),
            pool.query(ratingDistributionQuery, queryParams),
            pool.query(monthlyTrendQuery, monthlyTrendParams)
        ]);

        const stats = statsResult.rows[0] || { total_reviews: 0, average_rating: null, unreplied_count: 0, response_rate: 0 };
        const ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        ratingDistributionResult.rows.forEach(row => { if (row.rating) ratingDistribution[row.rating.toString()] = parseInt(row.count, 10); });

        res.json({ stats, charts: { rating_distribution: ratingDistribution, monthly_trend: monthlyTrendResult.rows } });
    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ message: 'Gagal mengambil statistik ulasan.' });
    }
});

module.exports = router;