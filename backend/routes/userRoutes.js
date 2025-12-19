const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan otentikasi
router.use(authenticateToken);

// Rute ini bisa diakses oleh pengguna terotentikasi untuk mendapatkan daftar PIC
router.get('/assignable', userController.getAssignableUsers);

// Rute di bawah ini hanya dapat diakses oleh admin
router.get('/', authorizeAdmin, userController.getAllUsers);
router.post('/', authorizeAdmin, userController.createUser);
router.get('/:id', authorizeAdmin, userController.getUserById);
router.put('/:id', authorizeAdmin, userController.updateUser);
router.delete('/:id', authorizeAdmin, userController.deleteUser);

module.exports = router;