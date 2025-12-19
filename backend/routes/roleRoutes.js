const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticateToken, authorizeAdmin, authorizeManagerOrAdmin } = require('../middleware/auth');

// Rute untuk mendapatkan semua data setting (roles, permissions, etc.)
router.get('/settings', authenticateToken, authorizeAdmin, roleController.getRoleSettings);

// Rute untuk CRUD pada roles
router.get('/', authenticateToken, authorizeManagerOrAdmin, roleController.getAllRoleNames);
router.post('/', authenticateToken, authorizeAdmin, roleController.createRole);
router.put('/:id/permissions', authenticateToken, authorizeAdmin, roleController.updateRolePermissions);
router.delete('/:id', authenticateToken, authorizeAdmin, roleController.deleteRole);

module.exports = router;