const pool = require('../config/db');

const DSR_COLUMNS = ['room_available', 'room_ooo', 'room_com_and_hu', 'room_sold', 'number_of_guest', 'occp_r_sold_percent', 'arr', 'revpar', 'lodging_revenue', 'others_room_revenue', 'room_revenue', 'breakfast_revenue', 'restaurant_revenue', 'room_service', 'banquet_revenue', 'fnb_others_revenue', 'fnb_revenue', 'others_revenue', 'total_revenue', 'service', 'tax', 'gross_revenue', 'shared_payable', 'deposit_reservation', 'cash_fo', 'cash_outlet', 'bank_transfer', 'qris', 'credit_debit_card', 'city_ledger', 'total_settlement', 'gab', 'balance'];

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
    const insertCols = ['hotel_id', 'date', ...DSR_COLUMNS, 'updated_at'].join(', ');
    const valuePlaceholders = Array.from({ length: DSR_COLUMNS.length + 2 }, (_, i) => `$${i + 1}`).join(', ');
    const updateSet = DSR_COLUMNS.map(col => `${col} = EXCLUDED.${col}`).join(', ') + ', updated_at = NOW()';
    return `INSERT INTO ${tableName} (${insertCols}) VALUES (${valuePlaceholders}, NOW()) ON CONFLICT (hotel_id, date) DO UPDATE SET ${updateSet};`;
}

const INTEGER_DSR_COLUMNS = [
    'room_available', 'room_ooo', 'room_com_and_hu', 'room_sold', 'number_of_guest', 
    'occp_r_sold_percent', 'arr', 'revpar'
];

const saveDsrData = (tableName) => async (req, res, next) => {
    const { hotel_id, year, month, data } = req.body;
    if (!hotel_id || !Array.isArray(data)) return res.status(400).json({ error: 'Data tidak lengkap.' });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const query = createDsrUpsertQuery(tableName);
        for (const record of data) {
            // --- NEW VALIDATION ---
            if (!record.date || typeof record.date !== 'string' || isNaN(new Date(record.date).getTime())) {
                throw new Error(`Invalid or missing date for one of the records: ${record.date}`);
            }
            for (const col of DSR_COLUMNS) {
                const value = record[col];
                if (typeof value !== 'number' || !isFinite(value)) {
                    // Allow null, but throw error for other invalid types or non-finite numbers
                    if (value !== null) {
                         throw new Error(`Invalid non-numeric or non-finite value for column ${col}: ${value}`);
                    }
                }
            }
            // --- END VALIDATION ---

            // Parse date as UTC to avoid timezone shifts
            const dateObj = new Date(record.date);
            const parsedDate = dateObj.getUTCFullYear() + '-' +
                              String(dateObj.getUTCMonth() + 1).padStart(2, '0') + '-' +
                              String(dateObj.getUTCDate()).padStart(2, '0');
            const values = [
                hotel_id,
                parsedDate,
                ...DSR_COLUMNS.map(col => {
                    let value = record[col];
                    if (value !== null && value !== undefined) {
                        if (INTEGER_DSR_COLUMNS.includes(col)) {
                            value = Math.round(parseFloat(value));
                        }
                    }
                    return value === undefined ? null : value;
                })
            ];
            // console.log('Executing DSR upsert with values:', values); // Keep this commented unless actively debugging
            await client.query(query, values);
        }
        await client.query('COMMIT');
        res.status(201).json({ message: `DSR ${tableName.split('_')[0]} berhasil disimpan.` });
    } catch (error) {
        await client.query('ROLLBACK');
        
        // --- NEW ERROR HANDLING ---
        if (error.message.startsWith('Invalid')) {
            return res.status(400).json({ message: error.message });
        }
        // --- END NEW ERROR HANDLING ---

        console.error('Error during DSR upsert:', error); // Keep the log for other errors
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
        
        let isLocked = false;
        try {
            const lockResult = await pool.query(`SELECT is_locked FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3 LIMIT 1`, [hotel_id, year, month]);
            if (lockResult.rows.length > 0 && lockResult.rows[0].is_locked) {
                isLocked = true;
            }
        } catch (lockError) {
            // Abaikan error jika kolom 'is_locked' tidak ada
            console.warn(`Could not check lock status for ${tableName} (hotel: ${hotel_id}, period: ${year}-${month}). Column 'is_locked' might be missing. Error: ${lockError.message}`);
        }

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

exports.getDsrBudget = getDsrData('budget_dsr');
exports.getDsrActual = getDsrData('actual_dsr');

exports.getDsrActualRange = async (req, res, next) => {
    const { hotel_id, startDate, endDate } = req.query;
    if (!hotel_id || !startDate || !endDate) {
        return res.status(400).json({ message: 'Hotel ID and date range are required.' });
    }
    try {
        const query = `
            SELECT
                SUM(room_available) as room_available,
                SUM(room_sold) as room_sold,
                SUM(room_revenue) as room_revenue
            FROM actual_dsr
            WHERE hotel_id = $1 AND date BETWEEN $2 AND $3;
        `;
        const { rows } = await pool.query(query, [hotel_id, startDate, endDate]);
        
        const aggregatedData = rows[0] || { room_available: 0, room_sold: 0, room_revenue: 0 };

        const hotelInfo = await pool.query('SELECT number_of_rooms FROM hotels WHERE id = $1', [hotel_id]);
        aggregatedData.number_of_rooms = hotelInfo.rows.length > 0 ? (hotelInfo.rows[0].number_of_rooms || 0) : 0;

        // Convert potential BigInts from SUM to numbers
        for (const key in aggregatedData) {
            aggregatedData[key] = aggregatedData[key] !== null ? Number(aggregatedData[key]) : 0;
        }

        res.json(aggregatedData);
    } catch (error) {
        next(error);
    }
};

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
        await client.query(`DELETE FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3;`, [hotel_id, year, month]);

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

const clearDsrData = (tableName) => async (req, res, next) => {
    const { hotel_id, year, month } = req.query;
    if (!hotel_id || !year || !month) return res.status(400).json({ error: 'Parameter hotel_id, year, dan month diperlukan.' });
    try {
        const query = `DELETE FROM ${tableName} WHERE hotel_id = $1 AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3;`;
        const result = await pool.query(query, [hotel_id, year, month]);
        res.status(200).json({ message: `Data DSR ${tableName.split('_')[0]} berhasil dihapus. ${result.rowCount} baris terpengaruh.` });
    } catch (error) {
        next(error);
    }
};

exports.clearDsrBudget = clearDsrData('budget_dsr');
exports.clearDsrActual = clearDsrData('actual_dsr');

/**
 * BARU: Mengunci atau membuka data DSR untuk periode tertentu.
 * Dipindahkan dari dsrController.js untuk sentralisasi logika.
 */
exports.lockDsrData = async (req, res, next) => {
    const { hotel_id, year, month, is_locked, type } = req.body;
    if (!hotel_id || !year || !month || typeof is_locked === 'undefined' || !type) {
        return res.status(400).json({ error: 'Parameter hotel_id, year, month, is_locked, dan type diperlukan.' });
    }

    const tableName = `${type}_dsr`;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // First, try to update existing rows for the entire month
        const updateResult = await client.query(
            `UPDATE ${tableName} SET is_locked = $1 WHERE hotel_id = $2 AND EXTRACT(YEAR FROM date) = $3 AND EXTRACT(MONTH FROM date) = $4`,
            [is_locked, hotel_id, year, month]
        );

        // If no rows existed for that month and we are trying to lock it,
        // we must create a record to hold the lock state. We'll use the first day of the month.
        if (updateResult.rowCount === 0 && is_locked) {
            const firstDayOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
            // This will either insert a new record for the 1st of the month with the lock,
            // or update the lock status if a record for the 1st already exists.
            await client.query(
                `INSERT INTO ${tableName} (hotel_id, date, is_locked)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (hotel_id, date) DO UPDATE SET is_locked = EXCLUDED.is_locked`,
                [hotel_id, firstDayOfMonth, true]
            );
        }
        
        await client.query('COMMIT');

        const action = is_locked ? 'dikunci' : 'dibuka kuncinya';
        res.status(200).json({ message: `DSR untuk bulan ${month}/${year} di hotel ${hotel_id} berhasil ${action}.` });

    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '42703') { // Postgres error code for undefined column
            const action = is_locked ? 'mengunci' : 'membuka kunci';
            console.warn(`Failed to ${action} DSR data for ${tableName}. Column 'is_locked' may be missing. Silently continuing.`);
            res.status(200).json({ message: `Tindakan berhasil, tetapi fitur kunci/buka kunci tidak sepenuhnya aktif karena konfigurasi database.` });
        } else {
            next(error);
        }
    } finally {
        client.release();
    }
};
