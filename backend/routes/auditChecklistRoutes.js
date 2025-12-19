const express = require('express');
const router = express.Router();
const {
    getChecklist,
    createCategory,
    createItem,
    getItemById,
    updateItem,
    deleteItem,
    updateCategoryOrder,
    updateItemOrder,
} = require('../controllers/auditChecklistController');
const { authenticateToken, authorizeManagerOrAdmin } = require('../middleware/auth');

// Semua rute di bawah ini memerlukan otentikasi
router.use(authenticateToken);

// Mendapatkan semua item checklist, dikelompokkan berdasarkan kategori
router.get('/', getChecklist);

// Rute untuk Kategori
router.post('/categories', authorizeManagerOrAdmin, createCategory);
router.put('/categories/reorder', authorizeManagerOrAdmin, updateCategoryOrder);

// Rute untuk Item
router.post('/items', authorizeManagerOrAdmin, createItem);
router.get('/items/:id', getItemById);
router.put('/items/reorder', authorizeManagerOrAdmin, updateItemOrder);
router.put('/items/:id', authorizeManagerOrAdmin, updateItem);
router.delete('/items/:id', authorizeManagerOrAdmin, deleteItem);

module.exports = router;
