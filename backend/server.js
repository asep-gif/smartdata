require('dotenv').config();
const express = require('express');
const pool = require('./config/db'); // Impor pool database
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken, authorizeAdmin, authorizeManagerOrAdmin } = require('./middleware/authMiddleware');

// BARU: Impor rute yang sudah ada dan perbaiki nama yang salah
const userRoutes = require('./routes/userRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const bookRoutes = require('./routes/bookRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const inspectionRoutes = require('./routes/inspectionRoutes');
const slideRoutes = require('./routes/slideRoutes');
const taskRoutes = require('./routes/taskRoutes');
const roleRoutes = require('./routes/roleRoutes');
const reportRoutes = require('./routes/reportRoutes');
const financialsRoutes = require('./routes/financialsRoutes');
const authRoutes = require('./routes/authRoutes');
const dsrRoutes = require('./routes/dsrRoutes');
const arAgingRoutes = require('./routes/arAgingRoutes');
const trialBalanceRoutes = require('./routes/trialBalance'); // BARU
const reviewRoutes = require('./routes/reviewRoutes'); // Untuk form publik & settings
const reviewsAdminRoutes = require('./routes/reviews'); // BARU: Untuk dasbor admin (balas ulasan)
const auditAgendaRoutes = require('./routes/auditAgendaRoutes'); // BARU: Untuk Agenda Audit
const auditChecklistRoutes = require('./routes/auditChecklistRoutes'); // BARU: Untuk Kelola Checklist Audit
const auditResultRoutes = require('./routes/auditResultRoutes'); // BARU: Untuk Hasil Checklist Audit
const competitorRoutes = require('./routes/competitorRoutes');

const app = express();
const port = process.env.PORT || 3000;

// --- MIDDLEWARE ---
app.use(cors()); // CORS harus di atas

// Middleware untuk menyajikan file statis dari direktori 'uploads'
// PERBAIKAN: Sajikan seluruh folder 'public' agar path '/uploads/reviews' dapat diakses
app.use(express.static(path.join(__dirname, '../public')));

// BARU: Tambahkan middleware untuk menyajikan folder 'uploads' di direktori backend
// Ini akan membuat file seperti thumbnail ebook dapat diakses melalui URL /uploads/...
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware body-parser should be placed before route handlers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- GUNAKAN ROUTER ---
// Rute-rute lain yang menggunakan JSON bisa diletakkan di sini
app.use('/api', reviewRoutes); // Mengandung /submit-review dan /reviews/settings (menggunakan multer)
app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/dashboard', dashboardRoutes); // Handles all routes starting with /api/dashboard/*
app.use('/api/inspections', inspectionRoutes); // For /api/inspections, /api/inspections/:id, etc.
app.use('/api/slides', slideRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/reports', reportRoutes); // BARU
app.use('/api/financials', financialsRoutes);
app.use('/api/dsr', dsrRoutes);
app.use('/api/ar-aging', arAgingRoutes);
app.use('/api/trial-balances', trialBalanceRoutes);
app.use('/api/reviews', reviewsAdminRoutes); // BARU: Daftarkan rute admin untuk ulasan
app.use('/api/audit-agendas', auditAgendaRoutes); // BARU: Untuk Agenda Audit
app.use('/api/audit-checklists', auditChecklistRoutes); // BARU: Untuk Kelola Checklist Audit
app.use('/api/audit-results', auditResultRoutes); // BARU: Untuk Hasil Checklist Audit
app.use('/api/competitor', competitorRoutes);
app.use('/api', authRoutes); // e.g., /api/login

// =================================================================
// --- ERROR HANDLING MIDDLEWARE ---
// Middleware ini harus menjadi yang terakhir dipanggil
// =================================================================
app.use(errorHandler);


// --- SERVER START ---
app.listen(port, () => {
    console.log(`🚀 Server berjalan di http://localhost:${port}`);
});
