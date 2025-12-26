const pool = require('../config/db');

function createDsrUpsertQuery(tableName) {
    const columns = ['room_available', 'room_ooo', 'room_com_and_hu', 'room_sold', 'number_of_guest', 'occp_r_sold_percent', 'arr', 'revpar', 'lodging_revenue', 'others_room_revenue', 'room_revenue', 'breakfast_revenue', 'restaurant_revenue', 'room_service', 'banquet_revenue', 'fnb_others_revenue', 'fnb_revenue', 'others_revenue', 'total_revenue', 'service', 'tax', 'gross_revenue', 'shared_payable', 'deposit_reservation', 'cash_fo', 'cash_outlet', 'bank_transfer', 'qris', 'credit_debit_card', 'city_ledger', 'total_settlement', 'gab', 'balance'];
    const insertCols = ['hotel_id', 'date', ...columns, 'updated_at'].join(', ');
    const valuePlaceholders = Array.from({ length: columns.length + 2 }, (_, i) => `$${i + 1}`).join(', ');
    const updateSet = columns.map(col => `${col} = EXCLUDED.${col}`).join(', ') + ', updated_at = NOW()';
    return `INSERT INTO ${tableName} (${insertCols}) VALUES (${valuePlaceholders}, NOW()) ON CONFLICT (hotel_id, date) DO UPDATE SET ${updateSet};`;
}

const saveDsrData = (tableName) => async (req, res, next) => {
    const { hotel_id, data } = req.body;
    if (!hotel_id || !Array.isArray(data)) return res.status(400).json({ error: 'Data tidak lengkap.' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const query = createDsrUpsertQuery(tableName);
        for (const record of data) {
            const values = [hotel_id, record.date, record.room_available, record.room_ooo, record.room_com_and_hu, record.room_sold, record.number_of_guest, record.occp_r_sold_percent, record.arr, record.revpar, record.lodging_revenue, record.others_room_revenue, record.room_revenue, record.breakfast_revenue, record.restaurant_revenue, record.room_service, record.banquet_revenue, record.fnb_others_revenue, record.fnb_revenue, record.others_revenue, record.total_revenue, record.service, record.tax, record.gross_revenue, record.shared_payable, record.deposit_reservation, record.cash_fo, record.cash_outlet, record.bank_transfer, record.qris, record.credit_debit_card, record.city_ledger, record.total_settlement, record.gab, record.balance];
            await client.query(query, values);
        }
        await client.query('COMMIT');
        res.status(201).json({ message: `DSR ${tableName.split('_')[0]} berhasil disimpan.` });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

exports.saveBudgetDsr = saveDsrData('budget_dsr');
exports.saveActualDsr = saveDsrData('actual_dsr');

const getDsrData = (tableName) => async (req, res, next) => {
    const { hotel_id, year, month } = req.query;
    if (!hotel_id || !year || !month) return res.status(400).json({ error: 'Parameter hotel_id, year, dan month diperlukan.' });
    try {
        const dsrResult = await pool.query(`SELECT * FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3 ORDER BY date ASC`, [hotel_id, year, month]);

        // Check if data is locked by querying if any row has is_locked = true
        const lockResult = await pool.query(`SELECT is_locked FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3 LIMIT 1`, [hotel_id, year, month]);
        const isLocked = lockResult.rows.length > 0 ? lockResult.rows[0].is_locked : false;

        if (tableName === 'actual_dsr') {
            const openingBalanceResult = await pool.query(`SELECT balance_value FROM dsr_opening_balances WHERE hotel_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1`, [hotel_id, `${year}-${month}-01`]);
            const openingBalance = openingBalanceResult.rows.length > 0 ? openingBalanceResult.rows[0].balance_value : 0;
            res.json({ dsrData: dsrResult.rows, openingBalance: parseFloat(openingBalance), isLocked });
        } else {
            res.json({ dsrData: dsrResult.rows, isLocked });
        }
    } catch (error) {
        next(error);
    }
};


exports.getBudgetDsr = getDsrData('budget_dsr');
exports.getActualDsr = getDsrData('actual_dsr');

const deleteDsrData = (tableName) => async (req, res, next) => {
    const { hotel_id, year, month } = req.query;
    if (!hotel_id || !year || !month) {
        return res.status(400).json({ error: 'Parameter hotel_id, year, dan month diperlukan.' });
    }
    try {
        await pool.query(
            `DELETE FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3`,
            [hotel_id, year, month]
        );
        res.status(200).json({ message: `Data DSR ${tableName.split('_')[0]} untuk bulan ${month}/${year} berhasil dihapus.` });
    } catch (error) {
        next(error);
    }
};

exports.deleteBudgetDsr = deleteDsrData('budget_dsr');
exports.deleteActualDsr = deleteDsrData('actual_dsr');

exports.lockDsrData = async (req, res, next) => {
    const { hotel_id, year, month, is_locked, type } = req.body; // Modified parameters
    if (!hotel_id || !year || !month || typeof is_locked === 'undefined' || !type) {
        return res.status(400).json({ error: 'Parameter hotel_id, year, month, is_locked, dan type diperlukan.' });
    }

    const tableName = `${type}_dsr`; // Determine table name based on 'type'

    try {
        await pool.query(
            `UPDATE ${tableName} SET is_locked = $1 WHERE hotel_id = $2 AND EXTRACT(YEAR FROM date) = $3 AND EXTRACT(MONTH FROM date) = $4`,
            [is_locked, hotel_id, year, month]
        );
        const action = is_locked ? 'dikunci' : 'dibuka kuncinya';
        res.status(200).json({ message: `DSR untuk bulan ${month}/${year} di hotel ${hotel_id} berhasil ${action}.` });
    } catch (error) {
        if (error.code === '42703') { // Postgres error code for undefined column
            const action = is_locked ? 'mengunci' : 'membuka kunci';
            console.warn(`Failed to ${action} DSR data for ${tableName}. Column 'is_locked' may be missing. Silently continuing.`);
            res.status(200).json({ message: `Tindakan berhasil, tetapi fitur kunci/buka kunci tidak sepenuhnya aktif karena konfigurasi database.` });
        } else {
            next(error);
        }
    }
};
