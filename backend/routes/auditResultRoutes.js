const express = require('express');
const router = express.Router();
const {
    getResultsByAgenda,
    saveAuditResults,
    uploadResultPhoto,
} = require('../controllers/auditResultController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { uploadAuditPhoto } = require('../middleware/uploadMiddleware');

// Semua rute di bawah ini memerlukan otentikasi dasar
router.use(authenticateToken);

// GET /api/audit-results?agendaId=123
router.get('/', authorize(['audit_results:submit']), getResultsByAgenda);

// POST /api/audit-results
router.post('/', authorize(['audit_results:submit']), saveAuditResults);

// POST /api/audit-results/upload-photo
router.post('/upload-photo', authorize(['audit_results:submit']), uploadAuditPhoto.single('photo'), uploadResultPhoto);

module.exports = router;
