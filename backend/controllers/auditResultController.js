const pool = require('../config/db');
const path = require('path');

/**
 * @desc    Get audit results for a specific agenda
 * @route   GET /api/audit-results?agendaId=:id
 * @access  Private
 */
const getResultsByAgenda = async (req, res) => {
    const { agendaId } = req.query;
    if (!agendaId) {
        return res.status(400).json({ message: 'Agenda ID is required.' });
    }
    try {
        const { rows } = await pool.query('SELECT * FROM audit_results WHERE agenda_id = $1', [agendaId]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching audit results:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * @desc    Save or update audit results and complete the agenda
 * @route   POST /api/audit-results
 * @access  Private
 */
const saveAuditResults = async (req, res) => {
    const { agendaId, results } = req.body;

    if (!agendaId || !Array.isArray(results)) {
        return res.status(400).json({ message: 'Invalid payload.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Upsert (Insert or Update) all results
        for (const result of results) {
            const { itemId, result: resultStatus, notes } = result;
            const query = `
                INSERT INTO audit_results (agenda_id, item_id, result, notes)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (agenda_id, item_id)
                DO UPDATE SET result = EXCLUDED.result, notes = EXCLUDED.notes, updated_at = NOW();
            `;
            await client.query(query, [agendaId, itemId, resultStatus, notes]);
        }

        // 2. Update the agenda status to 'completed'
        await client.query(
            "UPDATE audit_agendas SET status = 'completed' WHERE id = $1",
            [agendaId]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Audit checklist saved and agenda completed successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error saving audit results:', err.message);
        res.status(500).json({ message: 'Server error while saving results.' });
    } finally {
        client.release();
    }
};

/**
 * @desc    Upload a photo for a specific checklist item
 * @route   POST /api/audit-results/upload-photo
 * @access  Private
 */
const uploadResultPhoto = async (req, res) => {
    const { agendaId, itemId } = req.body;
    if (!req.file) {
        return res.status(400).json({ message: 'No photo file uploaded.' });
    }
    if (!agendaId || !itemId) {
        return res.status(400).json({ message: 'Agenda ID and Item ID are required.' });
    }

    const imageUrl = path.join('uploads', 'audit_photos', req.file.filename).replace(/\\/g, '/');

    try {
        const query = `
            INSERT INTO audit_results (agenda_id, item_id, image_url, result)
            VALUES ($1, $2, $3, 'fail')
            ON CONFLICT (agenda_id, item_id)
            DO UPDATE SET image_url = EXCLUDED.image_url, updated_at = NOW();
        `;
        await pool.query(query, [agendaId, itemId, imageUrl]);
        res.status(201).json({ message: 'Photo uploaded successfully.', imageUrl });
    } catch (err) {
        console.error('Error uploading audit photo:', err.message);
        res.status(500).json({ message: 'Server error while uploading photo.' });
    }
};

module.exports = {
    getResultsByAgenda,
    saveAuditResults,
    uploadResultPhoto,
};
