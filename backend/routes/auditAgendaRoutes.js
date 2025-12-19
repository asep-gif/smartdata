const express = require('express');
const router = express.Router();
const {
    getAgendas,
    getAgendaById,
    createAgenda,
    updateAgenda,
    deleteAgenda,
    getAgendaReport
} = require('../controllers/auditController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan otentikasi
router.use(authenticateToken);

/**
 * @route   /api/audit/agendas
 * @desc    Routes untuk Agenda Audit
 * @access  Private (diasumsikan)
 */
router.route('/')
    .get(getAgendas)
    .post(authorize(['audit_agendas:manage']), createAgenda);

router.route('/:id/report')
    .get(getAgendaReport);

router.route('/:id')
    .get(getAgendaById)
    .put(authorize(['audit_agendas:manage']), updateAgenda)
    .delete(authorize(['audit_agendas:manage']), deleteAgenda);

module.exports = router;