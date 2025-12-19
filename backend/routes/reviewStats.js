const express = require('express');
const router = express.Router();
const pool = require('../db'); // Pastikan path ini sesuai dengan konfigurasi database Anda

/**
 * GET /api/reviews/stats
 * Endpoint untuk mendapatkan statistik dan data chart untuk dashboard ulasan tamu.
 * Query Params:
 * - hotel_id: ID hotel atau 'all'
 * - period: Rentang waktu ('last30days', 'this_month', 'last_month', 'last90days', 'all_time')
 */
router.get('/', async (req, res) => {
    const { hotel_id, period = 'last30days' } = req.query;

    try {
        // --- Membangun klausa WHERE dinamis berdasarkan filter ---
        const whereClauses = [`status = 'approved'`]; // Hanya ambil ulasan yang sudah disetujui
        const queryParams = [];
        let paramIndex = 1;

        // Filter berdasarkan hotel
        if (hotel_id && hotel_id !== 'all') {
            whereClauses.push(`hotel_id = $${paramIndex++}`);
            queryParams.push(hotel_id);
        }

        // Filter berdasarkan periode waktu
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
                // Tidak ada filter tanggal
                break;
        }
        if (dateFilterClause) {
            whereClauses.push(dateFilterClause);
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // --- Menjalankan semua query secara paralel untuk efisiensi ---

        // 1. Query untuk kartu statistik utama
        const statsQuery = `
            SELECT
                COUNT(*) AS total_reviews,
                AVG(rating) AS average_rating,
                COUNT(*) FILTER (WHERE reply_text IS NULL) AS unreplied_count,
                (COUNT(*) FILTER (WHERE reply_text IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0)) AS response_rate
            FROM guest_reviews
            ${whereString};
        `;

        // 2. Query untuk grafik distribusi rating
        const ratingDistributionQuery = `
            SELECT
                rating,
                COUNT(*) as count
            FROM guest_reviews
            ${whereString}
            GROUP BY rating;
        `;

        // 3. Query untuk tren rating bulanan (6 bulan terakhir, tidak terpengaruh filter periode)
        const monthlyTrendQuery = `
            SELECT
                TO_CHAR(month_series.month, 'Mon') AS month,
                COALESCE(AVG(gr.rating), 0) AS average_rating
            FROM (
                SELECT DATE_TRUNC('month', generate_series(
                    NOW() - INTERVAL '5 months',
                    NOW(),
                    '1 month'
                )) AS month
            ) AS month_series
            LEFT JOIN guest_reviews gr ON DATE_TRUNC('month', gr.created_at) = month_series.month
                AND gr.status = 'approved'
                ${hotel_id && hotel_id !== 'all' ? `AND gr.hotel_id = $${paramIndex}` : ''}
            GROUP BY month_series.month
            ORDER BY month_series.month;
        `;
        
        const monthlyTrendParams = (hotel_id && hotel_id !== 'all') ? [hotel_id] : [];

        // Menjalankan semua query
        const [
            statsResult,
            ratingDistributionResult,
            monthlyTrendResult
        ] = await Promise.all([
            pool.query(statsQuery, queryParams),
            pool.query(ratingDistributionQuery, queryParams),
            pool.query(monthlyTrendQuery, monthlyTrendParams)
        ]);

        // --- Memformat hasil untuk response JSON ---

        // Format data statistik
        const stats = statsResult.rows[0] || {
            total_reviews: 0,
            average_rating: null,
            unreplied_count: 0,
            response_rate: 0
        };

        // Format data distribusi rating
        const ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        ratingDistributionResult.rows.forEach(row => {
            if (row.rating) {
                ratingDistribution[row.rating.toString()] = parseInt(row.count, 10);
            }
        });

        // Data tren bulanan sudah dalam format yang benar
        const monthlyTrend = monthlyTrendResult.rows;

        // --- Mengirim response ---
        res.json({
            stats: {
                total_reviews: parseInt(stats.total_reviews, 10),
                average_rating: stats.average_rating ? parseFloat(stats.average_rating).toFixed(1) : null,
                unreplied_count: parseInt(stats.unreplied_count, 10),
                response_rate: stats.response_rate ? parseFloat(stats.response_rate).toFixed(1) : '0.0'
            },
            charts: {
                rating_distribution: ratingDistribution,
                monthly_trend: monthlyTrend
            }
        });

    } catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ message: 'Gagal mengambil statistik ulasan.' });
    }
});

module.exports = router;