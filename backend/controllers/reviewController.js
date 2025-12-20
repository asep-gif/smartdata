const pool = require('../config/db');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Mengambil daftar hotel untuk ditampilkan di form review.
 * @route   GET /api/reviews/hotels
 * @access  Public
 */
const getHotelsForReview = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM hotels ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching hotels for review form:', error);
        res.status(500).json({ message: 'Gagal memuat daftar hotel.' });
    }
};

/**
 * @desc    Menyimpan ulasan tamu baru ke database dan mengirim email.
 * @route   POST /api/reviews/submit
 * @access  Public
 */
const submitGuestReview = async (req, res) => {
    const {
        hotel_id,
        guest_name,
        room_number,
        checkin_date,
        rating,
        cleanliness,
        service,
        facilities,
        comment,
        guest_email
    } = req.body;

    if (!hotel_id || !guest_name || !checkin_date || !rating || !guest_email) {
        return res.status(400).json({ message: 'Data wajib diisi tidak lengkap.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const reviewQuery = `
            INSERT INTO guest_reviews 
                (hotel_id, guest_name, room_number, guest_email, checkin_date, rating,
                 cleanliness_rating, service_rating, facilities_rating, comment, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'approved')
            RETURNING id, (SELECT name FROM hotels WHERE id = $1) as hotel_name;
        `;
        const reviewValues = [hotel_id, guest_name, room_number, guest_email, checkin_date, rating, cleanliness, service, facilities, comment];
        const reviewResult = await client.query(reviewQuery, reviewValues);
        const newReviewId = reviewResult.rows[0].id;
        const hotelName = reviewResult.rows[0].hotel_name;

        if (req.files && req.files.length > 0) {
            const mediaQuery = `
                INSERT INTO review_media (review_id, file_path, media_type)
                VALUES ($1, $2, $3);
            `;
            for (const file of req.files) {
                const fileUrl = `/uploads/reviews/${file.filename}`;
                const mediaType = file.mimetype.split('/')[0];
                await client.query(mediaQuery, [newReviewId, fileUrl, mediaType]);
            }
        }

        await client.query('COMMIT');

        // --- BARU: Fetch promo settings and generate voucher ---
        const settingsResult = await client.query(
            'SELECT promo_title, promo_description FROM guest_review_settings WHERE hotel_id = $1 AND promo_enabled = true',
            [hotel_id]
        );
        const promoDetails = settingsResult.rows[0] || { promo_title: 'Diskon Spesial', promo_description: 'Untuk kunjungan Anda berikutnya.' }; // Default promo

        const hotelInitials = hotelName.match(/\b\w/g)?.join('').toUpperCase() || 'VCR';
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const voucherCode = `${hotelInitials}-${newReviewId}${dateStr}`;

        // BARU: Simpan voucher_code ke dalam tabel guest_reviews
        await client.query(
            'UPDATE guest_reviews SET voucher_number = $1 WHERE id = $2',
            [voucherCode, newReviewId]
        );
        // --- AKHIR BARU ---

        // Kirim response ke client terlebih dahulu
        res.status(201).json({
            message: 'Ulasan berhasil dikirim!',
            reviewId: newReviewId,
            hotelName,
            promoDetails,
            voucherCode
        });

        // --- Kirim email di latar belakang ---
        try {
            const subject = `Terima Kasih atas Ulasan Anda di ${hotelName}!`;
            const html = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Halo ${guest_name},</h2>
                    <p>Terima kasih banyak telah meluangkan waktu untuk memberikan ulasan mengenai pengalaman Anda menginap di <strong>${hotelName}</strong>.</p>
                    <p>Kami sangat menghargai masukan Anda dan akan menggunakannya untuk terus meningkatkan layanan kami.</p>
                    <hr>
                    <h3>Detail Ulasan Anda:</h3>
                    <ul>
                        <li><strong>Rating Keseluruhan:</strong> ${rating} dari 5</li>
                        <li><strong>Kebersihan:</strong> ${cleanliness} dari 5</li>
                        <li><strong>Pelayanan:</strong> ${service} dari 5</li>
                        <li><strong>Fasilitas:</strong> ${facilities} dari 5</li>
                        <li><strong>Komentar:</strong> ${comment || '<em>Tidak ada komentar</em>'}</li>
                    </ul>
                    <hr>
                    <p>Sebagai tanda terima kasih, kami telah menyertakan sebuah voucher spesial untuk kunjungan Anda berikutnya. Cukup tunjukkan email ini atau kode voucher di bawah saat melakukan reservasi kembali.</p>
                    <div style="border: 2px dashed #ccc; padding: 15px; text-align: center; margin-top: 20px; background-color: #f9f9f9;">
                        <h3 style="margin: 0; color: #333;">${promoDetails.promo_title}</h3>
                        <p style="margin: 5px 0 15px 0;">${promoDetails.promo_description}</p>
                        <div style="background-color: #e0e0e0; padding: 10px; border-radius: 5px; display: inline-block;">
                            <span style="font-size: 1.2em; font-weight: bold; color: #000; letter-spacing: 2px;">${voucherCode}</span>
                        </div>
                    </div>
                    <p>Kami berharap dapat menyambut Anda kembali di ${hotelName} dalam waktu dekat!</p>
                    <br>
                    <p>Hormat kami,</p>
                    <p><strong>Manajemen ${hotelName}</strong></p>
                </div>
            `;

            await sendEmail({
                to: guest_email,
                subject: subject,
                html: html,
                text: `Halo ${guest_name}, terima kasih atas ulasan Anda di ${hotelName}. Kode voucher Anda adalah ${voucherCode}.`
            });
        } catch (emailError) {
            // Jika pengiriman email gagal, cukup catat log error tanpa mengganggu response utama
            console.error('Gagal mengirim email konfirmasi ulasan:', emailError);
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat menyimpan ulasan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    } finally {
        client.release();
    }
};

/**
 * @desc    Mengambil pengaturan form review untuk hotel tertentu.
 * @route   GET /api/reviews/settings/:hotelId
 * @access  Public (untuk form) / Private (untuk admin)
 */
const getReviewSettings = async (req, res) => {
    const { hotelId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM guest_review_settings WHERE hotel_id = $1', [hotelId]);
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            // Jika belum ada setting, kirim default values
            res.json({
                hotel_id: hotelId,
                logo_url: 'assets/logo/logo.png', // Default logo
                header_text: 'Bagaimana Pengalaman Menginap Anda?',
                subheader_text: 'Kami sangat menghargai masukan Anda untuk menjadi lebih baik.',
                promo_enabled: false,
            });
        }
    } catch (error) {
        console.error('Error fetching review settings:', error);
        res.status(500).json({ message: 'Gagal memuat pengaturan form.' });
    }
};

/**
 * @desc    Menyimpan atau memperbarui pengaturan form review.
 * @route   POST /api/reviews/settings
 * @access  Private (Admin/Manager)
 */
const updateReviewSettings = async (req, res) => {
    // The frontend now sends JSON, so req.files will be undefined.
    // We get all data from req.body.
    const {
        hotel_id,
        header_text,
        subheader_text,
        promo_enabled,
        promo_title,
        promo_description,
        logo_url,
        promo_image_url
    } = req.body;

    // Basic validation
    if (!hotel_id) {
        return res.status(400).json({ message: 'Hotel ID is required.' });
    }

    const query = `
        INSERT INTO guest_review_settings (hotel_id, logo_url, header_text, subheader_text, promo_enabled, promo_title, promo_description, promo_image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (hotel_id) DO UPDATE SET
            logo_url = EXCLUDED.logo_url,
            header_text = EXCLUDED.header_text,
            subheader_text = EXCLUDED.subheader_text,
            promo_enabled = EXCLUDED.promo_enabled,
            promo_title = EXCLUDED.promo_title,
            promo_description = EXCLUDED.promo_description,
            promo_image_url = EXCLUDED.promo_image_url,
            updated_at = NOW()
        RETURNING *;
    `;

    try {
        // Use the URL fields from the body directly. Default to empty string if null/undefined.
        const values = [
            hotel_id,
            logo_url || '',
            header_text || '',
            subheader_text || '',
            promo_enabled === true || promo_enabled === 'true', // Handle boolean and string 'true'
            promo_title || '',
            promo_description || '',
            promo_image_url || ''
        ];
        
        const result = await pool.query(query, values);
        res.status(200).json({ message: 'Pengaturan berhasil disimpan!', settings: result.rows[0] });
    } catch (error) {
        console.error('Error saving review settings:', error);
        res.status(500).json({ message: 'Gagal menyimpan pengaturan.' });
    }
};

/**
 * @desc    Mengambil data statistik untuk dasbor ulasan tamu.
 * @route   GET /api/reviews/dashboard-stats
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
    const { hotel_id, period } = req.query;

    try {
        const queryParams = [];
        let paramIndex = 1;

        // --- Build Filter Clauses and Parameters ---
        let dateFilterClause = 'TRUE';
        // PERBAIKAN: Tambahkan endDate untuk menangani rentang tanggal dengan benar
        let endDate;
        const now = new Date();
        if (period && period !== 'all_time') {
            let startDate;
            switch (period) {
                case 'last7days': startDate = new Date(new Date().setDate(now.getDate() - 7)); break;
                case 'last30days': startDate = new Date(new Date().setDate(now.getDate() - 30)); break;
                case 'last90days': startDate = new Date(new Date().setDate(now.getDate() - 90)); break;
                case 'this_month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
                case 'last_month':
                    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    endDate = new Date(now.getFullYear(), now.getMonth(), 1); // Batas atas adalah awal bulan ini
                    break;
            }
            if (startDate && endDate) { // Kasus untuk rentang (seperti 'last_month')
                dateFilterClause = `gr.created_at >= $${paramIndex++} AND gr.created_at < $${paramIndex++}`;
                queryParams.push(startDate.toISOString(), endDate.toISOString());
            } else if (startDate) { // Kasus untuk tanggal mulai saja
                dateFilterClause = `gr.created_at >= $${paramIndex++}`;
                queryParams.push(startDate.toISOString());
            }
        }

        let hotelFilterClause = 'TRUE';
        if (hotel_id && hotel_id !== 'all') {
            hotelFilterClause = `gr.hotel_id = $${paramIndex++}`;
            queryParams.push(parseInt(hotel_id, 10));
        }
        
        const finalFilter = `${hotelFilterClause} AND ${dateFilterClause}`;
        
        // This is a special clause for the monthly trend which should only be filtered by hotel, not date range
        const trendHotelFilterClause = hotel_id && hotel_id !== 'all' ? `gr.hotel_id = $1` : 'TRUE';
        const trendParams = hotel_id && hotel_id !== 'all' ? [parseInt(hotel_id, 10)] : [];


        // --- Define All Queries ---
        const statsQuery = `
            SELECT
                COUNT(*) AS total_reviews,
                AVG(gr.rating) AS average_rating,
                COUNT(*) FILTER (WHERE gr.reply_text IS NULL OR gr.reply_text = '') AS unreplied
            FROM guest_reviews gr
            WHERE ${finalFilter};
        `;
        const distributionQuery = `
            SELECT rating, COUNT(*) AS count
            FROM guest_reviews gr
            WHERE ${finalFilter}
            GROUP BY rating;
        `;
        const monthlyTrendQuery = `
            SELECT
                TO_CHAR(DATE_TRUNC('month', gr.created_at), 'Mon') AS month,
                EXTRACT(YEAR FROM gr.created_at) AS year,
                EXTRACT(MONTH FROM gr.created_at) AS month_num,
                AVG(gr.rating) AS average_rating
            FROM guest_reviews gr
            WHERE ${trendHotelFilterClause} AND gr.created_at >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
            GROUP BY year, month_num, month
            ORDER BY year, month_num;
        `;
        const recentActivityQuery = `
            SELECT gr.guest_name, h.name as hotel_name, gr.rating, gr.created_at
            FROM guest_reviews gr
            JOIN hotels h ON gr.hotel_id = h.id
            WHERE ${finalFilter}
            ORDER BY gr.created_at DESC
            LIMIT 7;
        `;
        const ratingByHotelQuery = `
            SELECT h.name AS hotel_name, AVG(gr.rating) AS average_rating
            FROM guest_reviews gr
            JOIN hotels h ON gr.hotel_id = h.id
            WHERE ${finalFilter}
            GROUP BY h.name
            ORDER BY average_rating DESC;
        `;

        // Eksekusi semua query secara paralel dengan parameter yang benar
        const [statsResult, distributionResult, monthlyTrendResult, ratingByHotelResult, recentActivityResult] = await Promise.all([
            pool.query(statsQuery, queryParams),
            pool.query(distributionQuery, queryParams),
            pool.query(monthlyTrendQuery, trendParams),
            pool.query(ratingByHotelQuery, queryParams),
            pool.query(recentActivityQuery, queryParams)
        ]);

        // --- Format Hasil ---
        const rawStats = statsResult.rows[0];
        const totalReviews = parseInt(rawStats.total_reviews, 10) || 0;
        const unreplied = parseInt(rawStats.unreplied, 10) || 0;
        const responseRate = totalReviews > 0 ? ((totalReviews - unreplied) / totalReviews) * 100 : 0;
        const stats = {
            totalReviews: totalReviews,
            averageRating: parseFloat(rawStats.average_rating) || 0,
            unreplied: unreplied,
            responseRate: responseRate
        };

        const ratingDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        distributionResult.rows.forEach(row => {
            ratingDistribution[row.rating] = parseInt(row.count, 10);
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trendData = new Map();
        monthlyTrendResult.rows.forEach(row => {
            trendData.set(row.month, parseFloat(row.average_rating));
        });

        const monthlyTrend = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthName = monthNames[d.getMonth()];
            monthlyTrend.push({
                month: monthName,
                rating: trendData.get(monthName) || 0
            });
        }
        
        const hotelRatings = ratingByHotelResult.rows.map(row => ({
            hotel_name: row.hotel_name,
            average_rating: parseFloat(row.average_rating) || 0
        }));

        const recentActivities = recentActivityResult.rows;

        res.status(200).json({
            stats,
            ratingDistribution,
            monthlyTrend,
            hotelRatings,
            recentActivities
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        next(error);
    }
};

/**
 * @desc    Mengambil daftar ulasan yang memiliki voucher untuk verifikasi.
 * @route   GET /api/reviews/vouchers
 * @access  Private (e-commerce)
 */
const getVouchers = async (req, res, next) => {
    const { hotel_id, status, search, page = 1, limit = 15 } = req.query;

    try {
        const offset = (page - 1) * limit;
        let queryParams = [];
        let paramIndex = 1;

        let baseQuery = `
            FROM guest_reviews gr
            JOIN hotels h ON gr.hotel_id = h.id
            WHERE gr.voucher_number IS NOT NULL AND gr.voucher_number != '' AND gr.status = 'approved'
        `;

        // Filters
        if (hotel_id && hotel_id !== 'all') {
            baseQuery += ` AND gr.hotel_id = $${paramIndex++}`;
            queryParams.push(hotel_id);
        }
        if (status === 'used') {
            baseQuery += ` AND gr.voucher_used_at IS NOT NULL`;
        } else if (status === 'available') {
            baseQuery += ` AND gr.voucher_used_at IS NULL`;
        }
        if (search) {
            baseQuery += ` AND (gr.guest_name ILIKE $${paramIndex++} OR gr.voucher_number ILIKE $${paramIndex++})`;
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Count total
        const totalResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, queryParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);

        // Get paginated data
        const dataQuery = `
            SELECT 
                gr.id,
                gr.guest_name,
                h.name as hotel_name,
                gr.voucher_number,
                gr.created_at,
                gr.voucher_used_at,
                gr.voucher_used_by_guest,
                gr.voucher_used_room_number,
                gr.voucher_used_folio_number
            ${baseQuery}
            ORDER BY gr.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        queryParams.push(limit, offset);

        const result = await pool.query(dataQuery, queryParams);

        res.json({
            data: result.rows,
            pagination: {
                totalItems,
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalItems / limit),
                limit: parseInt(limit, 10)
            }
        });

    } catch (error) {
        console.error('Error fetching vouchers:', error);
        next(error);
    }
};

/**
 * @desc    Memverifikasi dan menandai voucher sebagai telah digunakan.
 * @route   POST /api/reviews/vouchers/use
 * @access  Private (e-commerce)
 */
const useVoucher = async (req, res, next) => {
    const { reviewId, use_date, guest_name_used, room_number, folio_number } = req.body;

    if (!reviewId || !use_date || !guest_name_used || !room_number || !folio_number) {
        return res.status(400).json({ message: 'Semua field verifikasi wajib diisi.' });
    }

    try {
        const checkQuery = 'SELECT voucher_used_at FROM guest_reviews WHERE id = $1';
        const checkResult = await pool.query(checkQuery, [reviewId]);

        if (checkResult.rows.length === 0) { return res.status(404).json({ message: 'Ulasan atau voucher tidak ditemukan.' }); }
        if (checkResult.rows[0].voucher_used_at !== null) { return res.status(409).json({ message: 'Voucher ini sudah pernah digunakan.' }); }

        const updateQuery = `UPDATE guest_reviews SET voucher_used_at = $1, voucher_used_by_guest = $2, voucher_used_room_number = $3, voucher_used_folio_number = $4, updated_at = NOW() WHERE id = $5 RETURNING *;`;
        const values = [use_date, guest_name_used, room_number, folio_number, reviewId];
        const result = await pool.query(updateQuery, values);

        res.status(200).json({ message: 'Voucher berhasil diverifikasi dan digunakan.', data: result.rows[0] });
    } catch (error) {
        console.error('Error using voucher:', error);
        next(error);
    }
    useVoucher
};

/**
 * @desc    Membalas ulasan tamu dan mengirim email balasan.
 * @route   POST /api/reviews/reply/:reviewId
 * @access  Private (Admin/Manager/E-commerce)
 */
const replyToGuestReview = async (req, res, next) => {
    const { reviewId } = req.params;
    const { replyText, bccEmail } = req.body; // bccEmail bisa opsional

    if (!replyText) {
        return res.status(400).json({ message: 'Teks balasan wajib diisi.' });
    }

    try {
        // 1. Ambil detail ulasan tamu
        const reviewResult = await pool.query(
            `SELECT gr.guest_email, gr.guest_name, gr.hotel_id, gr.voucher_number, h.name as hotel_name
             FROM guest_reviews gr
             JOIN hotels h ON gr.hotel_id = h.id
             WHERE gr.id = $1`,
            [reviewId]
        );

        if (reviewResult.rows.length === 0) {
            return res.status(404).json({ message: 'Ulasan tidak ditemukan.' });
        }
        const review = reviewResult.rows[0];

        // 2. Update tabel guest_reviews dengan balasan
        await pool.query(
            'UPDATE guest_reviews SET reply_text = $1, replied_at = NOW(), updated_at = NOW() WHERE id = $2',
            [replyText, reviewId]
        );

        // 3. Kirim email balasan ke tamu
        const subject = `Balasan untuk Ulasan Anda di ${review.hotel_name}`;
        const html = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Halo ${review.guest_name},</h2>
                <p>Terima kasih atas ulasan Anda baru-baru ini mengenai pengalaman menginap di <strong>${review.hotel_name}</strong>.</p>
                <p>Kami telah membaca ulasan Anda dan ingin memberikan balasan sebagai berikut:</p>
                <div style="border-left: 3px solid #ccc; padding-left: 10px; margin: 20px 0;">
                    <em>"${replyText}"</em>
                </div>
                <p>Kami sangat menghargai masukan Anda dan berharap dapat menyambut Anda kembali.</p>
                <br>
                ${review.voucher_number ? `<p>Ingat, Anda masih memiliki voucher spesial: <strong>${review.voucher_number}</strong></p>` : ''}
                <br>
                <p>Hormat kami,</p>
                <p><strong>Manajemen ${review.hotel_name}</strong></p>
            </div>
        `;
        const text = `Halo ${review.guest_name},\n\nTerima Kasih atas ulasan Anda di ${review.hotel_name}. Kami telah membalas ulasan Anda:\n"${replyText}"\n\nHormat kami,\nManajemen ${review.hotel_name}`;

        const emailOptions = {
            to: review.guest_email,
            subject: subject,
            html: html,
            text: text
        };

        if (bccEmail) {
            emailOptions.bcc = bccEmail;
        }

        await sendEmail(emailOptions);

        res.status(200).json({ message: 'Balasan berhasil dikirim dan email telah terkirim.' });

    } catch (error) {
        console.error('Error replying to guest review:', error);
        next(error);
    }
};

module.exports = {
    getHotelsForReview,
    submitGuestReview,
    getReviewSettings,
    updateReviewSettings,
    getDashboardStats,
    getVouchers,
    useVoucher,
    replyToGuestReview
};