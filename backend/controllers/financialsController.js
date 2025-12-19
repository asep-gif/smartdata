const pool = require('../config/db');

/**
 * Factory function untuk membuat handler yang melakukan upsert data bulanan (P&L).
 * @param {string} tableName - Nama tabel ('budgets' atau 'actuals').
 * @returns {Function} Express request handler.
 */
const createMonthlyDataHandler = (tableName) => async (req, res, next) => {
    const { hotel_id, year, data } = req.body;
    if (!hotel_id || !year || !Array.isArray(data)) {
        return res.status(400).json({ error: 'Data tidak lengkap: hotel_id, year, dan data (array) diperlukan.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const query = `
            INSERT INTO ${tableName} (hotel_id, year, account_code, values)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (hotel_id, year, account_code) 
            DO UPDATE SET values = EXCLUDED.values;
        `;
        for (const item of data) {
            const { account_code, values } = item;
            if (account_code && Array.isArray(values) && values.length === 12) {
                await client.query(query, [hotel_id, year, account_code, JSON.stringify(values)]);
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ message: `${tableName.charAt(0).toUpperCase() + tableName.slice(1)} berhasil disimpan.` });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

/**
 * Factory function untuk membuat handler yang mengambil data bulanan (P&L).
 * @param {string} tableName - Nama tabel ('budgets' atau 'actuals').
 * @returns {Function} Express request handler.
 */
const getMonthlyDataHandler = (tableName) => async (req, res, next) => {
    const { hotel_id, year } = req.query;
    if (!hotel_id || !year) {
        return res.status(400).json({ error: 'Parameter hotel_id dan year diperlukan.' });
    }
    try {
        const result = await pool.query(`SELECT account_code, values FROM ${tableName} WHERE hotel_id = $1 AND year = $2`, [hotel_id, year]);
        const formattedData = result.rows.reduce((acc, row) => {
            acc[row.account_code] = row.values;
            return acc;
        }, {});
        res.json(formattedData);
    } catch (error) {
        next(error);
    }
};

exports.createOrUpdateBudget = createMonthlyDataHandler('budgets');
exports.getBudget = getMonthlyDataHandler('budgets');
exports.createOrUpdateActual = createMonthlyDataHandler('actuals');
exports.getActual = getMonthlyDataHandler('actuals');

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

exports.createOrUpdateDsrBudget = saveDsrData('budget_dsr');
exports.createOrUpdateDsrActual = saveDsrData('actual_dsr');

const getDsrData = (tableName) => async (req, res, next) => {
    const { hotel_id, year, month } = req.query;
    if (!hotel_id || !year || !month) return res.status(400).json({ error: 'Parameter hotel_id, year, dan month diperlukan.' });
    try {
        const dsrResult = await pool.query(`SELECT * FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3 ORDER BY date ASC`, [hotel_id, year, month]);

        if (tableName === 'actual_dsr') {
            const openingBalanceResult = await pool.query(`SELECT balance_value FROM dsr_opening_balances WHERE hotel_id = $1 AND effective_date <= $2 ORDER BY effective_date DESC LIMIT 1`, [hotel_id, `${year}-${month}-01`]);
            const openingBalance = openingBalanceResult.rows.length > 0 ? openingBalanceResult.rows[0].balance_value : 0;
            res.json({ dsrData: dsrResult.rows, openingBalance: parseFloat(openingBalance) });
        } else {
            res.json(dsrResult.rows);
        }
    } catch (error) {
        next(error);
    }
};

exports.getDsrBudget = getDsrData('budget_dsr');
exports.getDsrActual = getDsrData('actual_dsr');

exports.getOpeningBalances = async (req, res, next) => {
    try {
        const query = `SELECT h.id as hotel_id, h.name as hotel_name, ob.effective_date, ob.balance_value FROM hotels h LEFT JOIN dsr_opening_balances ob ON h.id = ob.hotel_id ORDER BY h.name ASC;`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

exports.saveOpeningBalance = async (req, res, next) => {
    const { hotel_id, effective_date, balance_value } = req.body;
    if (!hotel_id || !effective_date || balance_value === undefined) return res.status(400).json({ error: 'Data tidak lengkap.' });
    try {
        const query = `INSERT INTO dsr_opening_balances (hotel_id, effective_date, balance_value, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (hotel_id) DO UPDATE SET effective_date = EXCLUDED.effective_date, balance_value = EXCLUDED.balance_value, updated_at = NOW() RETURNING *;`;
        const result = await pool.query(query, [hotel_id, effective_date, balance_value]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
};

/**
 * Factory function untuk membuat handler yang mengambil data periodik (Room Prod & AR Aging).
 * @param {string} tableName - Nama tabel.
 * @param {string[]} columns - Kolom yang akan dipilih.
 * @returns {Function} Express request handler.
 */
const getPeriodicDataHandler = (tableName, columns, dateColumn) => async (req, res, next) => {
    const { hotel_id, year, month } = req.query;
    if (!hotel_id || !year || !month) return res.status(400).json({ error: 'Parameter hotel_id, year, dan month diperlukan.' });
    try {
        let query;
        if (dateColumn) {
            query = `SELECT ${columns.join(', ')} FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM ${dateColumn}) = $2 AND EXTRACT(MONTH FROM ${dateColumn}) = $3 ORDER BY id ASC;`;
        } else {
            query = `SELECT ${columns.join(', ')} FROM ${tableName} WHERE hotel_id = $1 AND year = $2 AND month = $3 ORDER BY id ASC;`;
        }
        const result = await pool.query(query, [hotel_id, year, month]);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

/**
 * Factory function untuk membuat handler yang menyimpan data periodik (Room Prod & AR Aging).
 * Menggunakan strategi "hapus-lalu-sisipkan".
 * @param {object} config - Konfigurasi { tableName, columns, insertCheckColumn, successMessage }.
 * @returns {Function} Express request handler.
 */
const createPeriodicDataHandler = ({ tableName, columns, insertCheckColumn, successMessage }) => async (req, res, next) => {
    const { hotel_id, year, month, data } = req.body;
    if (!hotel_id || !year || !month || !Array.isArray(data)) return res.status(400).json({ error: 'Data tidak lengkap.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`DELETE FROM room_production WHERE hotel_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3;`, [hotel_id, year, month]);

        if (data.length > 0) {
            const valuePlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const insertQuery = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${valuePlaceholders});`;

            for (const record of data) {
                if (record[insertCheckColumn]) {
                    const values = columns.map(col => record[col]);
                    await client.query(insertQuery, values);
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: successMessage });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
};

exports.getRoomProduction = getPeriodicDataHandler('room_production', ['id', 'date', 'segment', 'company', 'room', 'guest', 'arr', 'lodging_revenue', 'pic_name'], 'date');
exports.saveRoomProduction = createPeriodicDataHandler({
    tableName: 'room_production',
    columns: ['hotel_id', 'date', 'segment', 'company', 'room', 'guest', 'arr', 'lodging_revenue', 'pic_name'],
    insertCheckColumn: 'segment', // Insert jika kolom 'segment' ada isinya
    successMessage: 'Data Room Production berhasil disimpan.'
});

exports.getArAging = getPeriodicDataHandler('ar_aging', ['id', 'company_name', 'invoice_number', 'invoice_date', 'total_bill', 'current', 'days_1_30', 'days_31_60', 'days_61_90', 'days_over_90', 'remarks']);
exports.saveArAging = createPeriodicDataHandler({
    tableName: 'ar_aging',
    columns: ['hotel_id', 'year', 'month', 'company_name', 'invoice_number', 'invoice_date', 'total_bill', 'current', 'days_1_30', 'days_31_60', 'days_61_90', 'days_over_90', 'remarks'],
    insertCheckColumn: 'company_name', // Insert jika kolom 'company_name' ada isinya
    successMessage: 'Data AR Aging berhasil disimpan.'
});

/**
 * BARU: Menangani permintaan untuk ringkasan AR Aging per hotel.
 * GET /api/financials/ar-aging/summary
 */
exports.getArAgingSummary = async (req, res, next) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ error: 'Parameter year dan month diperlukan.' });
    }

    try {
        const query = `
            SELECT 
                h.name AS hotel_name,
                SUM(ar.current) AS current,
                SUM(ar.days_1_30) AS days_1_30,
                SUM(ar.days_31_60) AS days_31_60,
                SUM(ar.days_61_90) AS days_61_90,
                SUM(ar.days_over_90) AS days_over_90
            FROM ar_aging ar
            JOIN hotels h ON ar.hotel_id = h.id
            WHERE ar.year = $1 AND ar.month = $2
            GROUP BY h.id, h.name
            ORDER BY h.name;
        `;
        const result = await pool.query(query, [year, month]);
        
        const summary = result.rows.map(row => {
            for (const key in row) {
                if (typeof row[key] === 'bigint') {
                    row[key] = Number(row[key]);
                }
            }
            return row;
        });

        res.json(summary);
    } catch (error) {
        console.error('Error fetching AR Aging summary:', error);
        next(error);
    }
};