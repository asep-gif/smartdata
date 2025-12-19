const express = require('express');
const router = express.Router();
const inspectionController = require('../controllers/inspectionController');
const { authenticateToken, authorizeManagerOrAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Setup Multer untuk upload foto inspeksi
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'inspection-photo-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- Inspection Type & Item Routes ---
router.get('/types', authenticateToken, inspectionController.getAllInspectionTypes);
router.post('/types', authenticateToken, authorizeManagerOrAdmin, inspectionController.createInspectionType);
router.put('/types/:typeId', authenticateToken, authorizeManagerOrAdmin, inspectionController.updateInspectionType);

router.get('/types/:typeId/items', authenticateToken, authorizeManagerOrAdmin, inspectionController.getInspectionItemsByType);
router.post('/types/:typeId/items', authenticateToken, authorizeManagerOrAdmin, inspectionController.createInspectionItem);

router.get('/items/:itemId', authenticateToken, authorizeManagerOrAdmin, inspectionController.getInspectionItemById);
router.put('/items/:itemId', authenticateToken, authorizeManagerOrAdmin, inspectionController.updateInspectionItem);
router.put('/items/reorder', authenticateToken, authorizeManagerOrAdmin, inspectionController.reorderInspectionItems);

// --- Inspection Main Routes ---
router.get('/', authenticateToken, inspectionController.getAllInspections);
router.post('/', authenticateToken, inspectionController.createInspection);

router.get('/prepare', authenticateToken, inspectionController.prepareInspectionForm);

router.post('/draft', authenticateToken, inspectionController.createInspectionDraft);
router.put('/:id/draft', authenticateToken, inspectionController.updateInspectionDraft);

router.put('/:id/complete', authenticateToken, inspectionController.completeInspection);
router.post('/upload-photo', authenticateToken, upload.single('photo'), inspectionController.uploadInspectionPhoto);

// BARU: Rute untuk dashboard inspeksi (dipindahkan ke atas)
router.get('/dashboard', authenticateToken, inspectionController.getInspectionDashboardData);

router.get('/:id', authenticateToken, inspectionController.getInspectionById);
router.delete('/:id', authenticateToken, inspectionController.deleteInspection);

module.exports = router;