const pool = require('../config/db');

exports.getIncomeStatement = async (req, res, next) => {
    const { year, brand, hotels } = req.query;

    if (!year) {
        return res.status(400).json({ error: 'Parameter tahun diperlukan.' });
    }

    try {
        let filterClause = '';
        let queryParams = [year];
        let paramIndex = 2;

        if (hotels) {
            const hotelIds = hotels.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            if (hotelIds.length > 0) {
                filterClause = `AND h.id = ANY($${paramIndex++}::int[])`;
                queryParams.push(hotelIds);
            }
        } else if (brand && brand !== 'all') {
            filterClause = `AND h.brand = $${paramIndex++}`;
            queryParams.push(brand);
        }

        const getAggregatedData = async (tableName) => {
            const query = `
                SELECT t.account_code, t.values
                FROM ${tableName} t
                JOIN hotels h ON t.hotel_id = h.id
                WHERE t.year = $1 ${filterClause}
            `;

            const result = await pool.query(query, queryParams);

            const aggregated = {};
            result.rows.forEach(row => {
                if (!aggregated[row.account_code]) {
                    aggregated[row.account_code] = Array(12).fill(0);
                }
                if (Array.isArray(row.values)) {
                    for (let i = 0; i < 12; i++) {
                        aggregated[row.account_code][i] += parseFloat(row.values[i]) || 0;
                    }
                }
            });
            return aggregated;
        };

        const [budgetData, actualData] = await Promise.all([
            getAggregatedData('budgets'),
            getAggregatedData('actuals')
        ]);

        res.json({
            budget: budgetData,
            actual: actualData
        });

    } catch (error) {
        next(error);
    }
};

exports.getHotelAchievement = async (req, res, next) => {
    const { year, brand, hotels, month } = req.query;
    if (!year) {
        return res.status(400).json({ error: 'Parameter tahun diperlukan.' });
    }

    try {
        const getAggregatedDataPerHotel = async (tableName) => {
            const queryParams = [year];
            let filterClause = '';
            let paramIndex = 2;

            if (hotels) {
                const hotelIds = hotels.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
                if (hotelIds.length > 0) {
                    filterClause = `AND h.id = ANY($${paramIndex++}::int[])`;
                    queryParams.push(hotelIds);
                }
            } else if (brand && brand !== 'all') {
                filterClause = `AND h.brand = $${paramIndex++}`;
                queryParams.push(brand);
            }

            const query = `
                SELECT
                    t.hotel_id,
                    jsonb_agg(
                        jsonb_build_object('account_code', t.account_code, 'values', t.values)
                    ) as accounts
                FROM ${tableName} t
                JOIN hotels h ON t.hotel_id = h.id
                WHERE 
                    t.year = $1 
                    AND t.account_code IN ('rev_room', 'rev_fnb', 'rev_others') 
                    ${filterClause}
                GROUP BY t.hotel_id
            `;

            const result = await pool.query(query, queryParams);
            
            const aggregated = {};
            const monthIndex = month && month !== 'all' ? parseInt(month, 10) - 1 : -1;

            result.rows.forEach(row => {
                const hotelId = row.hotel_id;
                let totalRevenue = 0;

                if (row.accounts && Array.isArray(row.accounts)) {
                    row.accounts.forEach(account => {
                        if (account.values && Array.isArray(account.values)) {
                            if (monthIndex > -1) {
                                if (account.values[monthIndex]) {
                                    totalRevenue += parseFloat(account.values[monthIndex]) || 0;
                                }
                            } else {
                                totalRevenue += account.values.reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                            }
                        }
                    });
                }

                aggregated[hotelId] = { 'total_revenue': totalRevenue };
            });
            return aggregated;
        };

        const [budgetData, actualData] = await Promise.all([
            getAggregatedDataPerHotel('budgets'),
            getAggregatedDataPerHotel('actuals')
        ]);

        res.json({ budget: budgetData, actual: actualData });

    } catch (error) {
        next(error);
    }
};

exports.getRoomDivision = async (req, res, next) => {
    const { year, brand, hotels } = req.query;

    if (!year) {
        return res.status(400).json({ error: 'Parameter tahun diperlukan.' });
    }

    try {
        let filterClause = '';
        let queryParams = [year];
        let paramIndex = 2;

        if (req.user.role === 'staff') {
            filterClause = `AND h.id = $${paramIndex++}`;
            queryParams.push(req.user.hotel_id);
        }

        if (hotels) {
            const hotelIds = hotels.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            if (hotelIds.length > 0) {
                filterClause = `AND h.id = ANY($${paramIndex++}::int[])`;
                queryParams.push(hotelIds);
            }
        } else if (brand && brand !== 'all') {
            filterClause = `AND h.brand = $${paramIndex++}`;
            queryParams.push(brand);
        }

        const getAggregatedData = async (tableName) => {
            const query = `
                SELECT t.account_code, t.values
                FROM ${tableName} t
                JOIN hotels h ON t.hotel_id = h.id
                WHERE t.year = $1 ${filterClause}
            `;

            const result = await pool.query(query, queryParams);

            const aggregated = {};
            result.rows.forEach(row => {
                if (!aggregated[row.account_code]) {
                    aggregated[row.account_code] = Array(12).fill(0);
                }
                if (Array.isArray(row.values)) {
                    for (let i = 0; i < 12; i++) {
                        aggregated[row.account_code][i] += parseFloat(row.values[i]) || 0;
                    }
                }
            });
            return aggregated;
        };

        const [budgetData, actualData] = await Promise.all([getAggregatedData('budgets'), getAggregatedData('actuals')]);
        res.json({ budget: budgetData, actual: actualData });
    } catch (error) {
        next(error);
    }
};

exports.getFnbDivision = async (req, res, next) => {
    const { year, brand, hotels } = req.query;

    if (!year) {
        return res.status(400).json({ error: 'Parameter tahun diperlukan.' });
    }

    try {
        let filterClause = '';
        let queryParams = [year];
        let paramIndex = 2;

        if (req.user.role === 'staff') {
            filterClause = `AND h.id = $${paramIndex++}`;
            queryParams.push(req.user.hotel_id);
        }

        if (hotels) {
            const hotelIds = hotels.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            if (hotelIds.length > 0) {
                filterClause = `AND h.id = ANY($${paramIndex++}::int[])`;
                queryParams.push(hotelIds);
            }
        } else if (brand && brand !== 'all') {
            filterClause = `AND h.brand = $${paramIndex++}`;
            queryParams.push(brand);
        }

        const getAggregatedData = async (tableName) => {
            const query = `
                SELECT t.account_code, t.values
                FROM ${tableName} t
                JOIN hotels h ON t.hotel_id = h.id
                WHERE t.year = $1 ${filterClause}
            `;

            const result = await pool.query(query, queryParams);

            const aggregated = {};
            result.rows.forEach(row => {
                if (!aggregated[row.account_code]) {
                    aggregated[row.account_code] = Array(12).fill(0);
                }
                if (Array.isArray(row.values)) {
                    for (let i = 0; i < 12; i++) {
                        aggregated[row.account_code][i] += parseFloat(row.values[i]) || 0;
                    }
                }
            });
            return aggregated;
        };

        const [budgetData, actualData] = await Promise.all([getAggregatedData('budgets'), getAggregatedData('actuals')]);
        res.json({ budget: budgetData, actual: actualData });
    } catch (error) {
        next(error);
    }
};

exports.getMonthlyHotelSummary = async (req, res, next) => {
    const { year, month, brand, hotels } = req.query;

    if (!year || !month) {
        return res.status(400).json({ error: 'Parameter tahun dan bulan diperlukan.' });
    }

    try {
        let filterClause = '';
        let queryParams = [year, month];
        let paramIndex = 3;

        if (req.user.role === 'staff') {
            filterClause = `AND h.id = $${paramIndex++}`;
            queryParams.push(req.user.hotel_id);
        }

        if (hotels) {
            const hotelIds = hotels.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            if (hotelIds.length > 0) {
                filterClause = `AND h.id = ANY($${paramIndex++}::int[])`;
                queryParams.push(hotelIds);
            }
        } else if (brand && brand !== 'all') {
            filterClause = `AND h.brand = $${paramIndex++}`;
            queryParams.push(brand);
        }

        const getMonthlyAggregatedData = async (tableName) => {
            const query = `
                SELECT
                    t.hotel_id,
                    h.name as hotel_name,
                    SUM(t.total_revenue) as total_revenue,
                    SUM(t.room_revenue) as room_revenue,
                    SUM(t.room_sold) as room_sold,
                    SUM(t.room_available) as room_available
                FROM ${tableName} t
                JOIN hotels h ON t.hotel_id = h.id
                WHERE EXTRACT(YEAR FROM t.date) = $1
                  AND EXTRACT(MONTH FROM t.date) = $2
                  ${filterClause}
                GROUP BY t.hotel_id, h.name
                ORDER BY h.name ASC;
            `;
            const result = await pool.query(query, queryParams);
            return result.rows;
        };

        const [budgetData, actualData] = await Promise.all([
            getMonthlyAggregatedData('budget_dsr'),
            getMonthlyAggregatedData('actual_dsr')
        ]);

        const summaryMap = {};

        const processData = (data, type) => {
            data.forEach(row => {
                const hotelId = row.hotel_id;
                if (!summaryMap[hotelId]) {
                    summaryMap[hotelId] = { hotel_id: hotelId, hotel_name: row.hotel_name, budget: {}, actual: {} };
                }

                const totalRoomAvailable = parseFloat(row.room_available) || 0;
                const totalRoomSold = parseFloat(row.room_sold) || 0;
                const totalRoomRevenue = parseFloat(row.room_revenue) || 0;

                summaryMap[hotelId][type] = {
                    total_revenue: parseFloat(row.total_revenue) || 0,
                    occupancy: totalRoomAvailable > 0 ? (totalRoomSold / totalRoomAvailable) * 100 : 0,
                    arr: totalRoomSold > 0 ? totalRoomRevenue / totalRoomSold : 0,
                    revpar: totalRoomAvailable > 0 ? totalRoomRevenue / totalRoomAvailable : 0
                };
            });
        };

        processData(budgetData, 'budget');
        processData(actualData, 'actual');

        res.json(Object.values(summaryMap));
    } catch (error) {
        next(error);
    }
};

exports.getArrByCompany = async (req, res, next) => {
    const { year, month, brand, hotels, segment } = req.query;

    if (!year || !segment) {
        return res.status(400).json({ error: 'Parameter tahun dan segmen diperlukan.' });
    }

    try {
        const targetYear = parseInt(year, 10);
        const monthIndex = month && month !== 'all' ? parseInt(month, 10) - 1 : -1;

        const queryParams = [];
        let whereClauses = [];

        whereClauses.push(`EXTRACT(YEAR FROM rp.date) = $${queryParams.length + 1}`);
        queryParams.push(targetYear);

        whereClauses.push(`rp.segment = $${queryParams.length + 1}`);
        queryParams.push(segment);

        if (monthIndex > -1) {
            whereClauses.push(`EXTRACT(MONTH FROM rp.date) = $${queryParams.length + 1}`);
            queryParams.push(monthIndex + 1);
        }

        let joinClause = '';
        if (hotels) {
            const hotelIds = hotels.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            if (hotelIds.length > 0) {
                joinClause = 'JOIN hotels h ON rp.hotel_id = h.id';
                whereClauses.push(`h.id = ANY($${queryParams.length + 1}::int[])`);
                queryParams.push(hotelIds);
            }
        } else if (brand && brand !== 'all') {
            joinClause = 'JOIN hotels h ON rp.hotel_id = h.id';
            whereClauses.push(`h.brand = $${queryParams.length + 1}`);
            queryParams.push(brand);
        }

        const query = `
            SELECT
                company,
                SUM(lodging_revenue) / NULLIF(SUM(room), 0) AS average_arr
            FROM room_production rp
            ${joinClause}
            WHERE ${whereClauses.join(' AND ')} AND company IS NOT NULL AND company != ''
            GROUP BY company
            HAVING SUM(room) > 0
            ORDER BY average_arr DESC
            LIMIT 15;
        `;

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};