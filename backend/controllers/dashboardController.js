const pool = require('../config/db');

/**
 * Builds a hotel filter clause and parameters for a SQL query.
 * @param {string} hotels - Comma-separated string of hotel IDs.
 * @param {string} brand - Brand name.
 * @param {number} startingParamIndex - The starting index for query parameters.
 * @returns {{filterClause: string, queryParams: Array<any>}}
 */
const buildHotelFilter = (hotels, brand, startingParamIndex = 1) => {
    if (hotels) {
        const hotelIds = hotels.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
        if (hotelIds.length > 0) {
            return { filterClause: `h.id = ANY($${startingParamIndex}::int[])`, queryParams: [hotelIds] };
        }
    }
    if (brand && brand !== 'all') {
        return { filterClause: `h.brand = $${startingParamIndex}`, queryParams: [brand] };
    }
    return { filterClause: '', queryParams: [] };
};

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
    const { brand, hotels, year, month } = req.query;

    try {
        const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
        const monthIndex = month && month !== 'all' ? parseInt(month, 10) - 1 : -1;

        let hotelFilterClause = '';
        let queryParams = [];
        if (hotels) {
            const hotelIds = hotels.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            if (hotelIds.length > 0) {
                hotelFilterClause = `WHERE id = ANY($1::int[])`;
                queryParams.push(hotelIds);
            }
        }

        let hotelCount;
        if (!hotelFilterClause) {
            const countResult = await pool.query('SELECT COUNT(DISTINCT hotel_id) FROM (SELECT hotel_id FROM budgets WHERE year = $1 UNION SELECT hotel_id FROM actuals WHERE year = $1) as hotels_with_data', [targetYear]);
            hotelCount = parseInt(countResult.rows[0].count, 10);
        } else {
            const hotelCountQuery = `SELECT COUNT(*) AS total FROM hotels ${hotelFilterClause}`;
            const hotelCountResult = await pool.query(hotelCountQuery, queryParams);
            hotelCount = parseInt(hotelCountResult.rows[0].total, 10);
        }

        let dataFilterClause = '';
        let dataQueryParams = [targetYear];
        
        const { filterClause: hotelDataFilter, queryParams: hotelDataParams } = buildHotelFilter(hotels, brand, 2);
        if (hotelDataFilter) {
            dataFilterClause = `AND ${hotelDataFilter}`;
            dataQueryParams.push(...hotelDataParams);
        }

        const relevantAccountCodes = [
            'rev_room', 'rev_fnb', 'rev_others', 'osaw_room', 'ooe_room', 'cos_fnb', 'osaw_fnb', 'ooe_fnb', 'cos_others',
            'usaw_ag', 'usaw_sm', 'usaw_pomec', 'uoe_ag', 'uoe_sm', 'uoe_pomec', 'uoe_energy', 'mgt_fee',
            'stat_room_available', 'stat_occupied_rooms',
            'total_osaw', 'total_usaw' // BARU: Tambahkan kode total untuk perhitungan rasio
        ];

        // Query dinamis untuk budget dan actual
        const buildQuery = (tableAlias, baseTable) => {
            const queryParams = [relevantAccountCodes, targetYear];
            const whereConditions = [
                `${tableAlias}.account_code = ANY($1::text[])`,
                `${tableAlias}.year = $2`
            ];
            let joinClause = '';

            if (hotelDataFilter) {
                joinClause = ` JOIN hotels h ON ${tableAlias}.hotel_id = h.id`;
                whereConditions.push(`h.id = ANY($${queryParams.length + 1}::int[])`);
                queryParams.push(...hotelDataParams);
            }
            return { query: `SELECT ${tableAlias}.account_code, ${tableAlias}.values FROM ${baseTable} ${tableAlias}${joinClause} WHERE ${whereConditions.join(' AND ')}`, params: queryParams };
        };

        const budgetQuery = buildQuery('b', 'budgets');
        const actualsQuery = buildQuery('a', 'actuals');

        const [budgetResult, actualResult] = await Promise.all([
            pool.query(budgetQuery.query, budgetQuery.params),
            pool.query(actualsQuery.query, actualsQuery.params)
        ]);

        const aggregateMonthlyDataPerCode = (rows) => {
            const aggregated = {};
            rows.forEach(row => {
                if (!aggregated[row.account_code]) aggregated[row.account_code] = Array(12).fill(0);
                if (Array.isArray(row.values)) {
                    for (let i = 0; i < 12; i++) {
                        aggregated[row.account_code][i] += parseFloat(row.values[i]) || 0;
                    }
                }
            });
            return aggregated;
        };

        const calculateMonthlyGop = (data) => {
            const monthlyTotals = Array(12).fill(0);
            const getValue = (code, month) => (data[code] ? data[code][month] : 0) || 0;
            for (let i = 0; i < 12; i++) {
                const totalRevenue = getValue('rev_room', i) + getValue('rev_fnb', i) + getValue('rev_others', i);
                const totalDeptExpenses = getValue('osaw_room', i) + getValue('ooe_room', i) + getValue('cos_fnb', i) + getValue('osaw_fnb', i) + getValue('ooe_fnb', i) + getValue('cos_others', i);
                const totalUndistributed = getValue('usaw_ag', i) + getValue('usaw_sm', i) + getValue('usaw_pomec', i) + getValue('uoe_ag', i) + getValue('uoe_sm', i) + getValue('uoe_pomec', i) + getValue('uoe_energy', i);
                const mgtFee = getValue('mgt_fee', i);
                monthlyTotals[i] = totalRevenue - totalDeptExpenses - totalUndistributed - mgtFee;
            }
            return monthlyTotals;
        };

        const budgetData = aggregateMonthlyDataPerCode(budgetResult.rows);
        const actualData = aggregateMonthlyDataPerCode(actualResult.rows);

        let monthlyBudgetRevenue = Array(12).fill(0).map((_, i) => (budgetData['rev_room']?.[i] || 0) + (budgetData['rev_fnb']?.[i] || 0) + (budgetData['rev_others']?.[i] || 0));
        let monthlyActualRevenue = Array(12).fill(0).map((_, i) => (actualData['rev_room']?.[i] || 0) + (actualData['rev_fnb']?.[i] || 0) + (actualData['rev_others']?.[i] || 0));
        
        const monthlyBudgetGop = calculateMonthlyGop(budgetData);
        const monthlyActualGop = calculateMonthlyGop(actualData);

        const calculateMonthlyOccArr = (data) => {
            const occ = Array(12).fill(0);
            const arr = Array(12).fill(0);
            const roomSold = data['stat_occupied_rooms'] || [];
            const roomAvailable = data['stat_room_available'] || [];
            const roomRevenue = data['rev_room'] || [];

            for (let i = 0; i < 12; i++) {
                const sold = parseFloat(roomSold[i]) || 0;
                const available = parseFloat(roomAvailable[i]) || 0;
                const revenue = parseFloat(roomRevenue[i]) || 0;

                occ[i] = available > 0 ? (sold / available) * 100 : 0;
                arr[i] = sold > 0 ? revenue / sold : 0;
            }
            return { occ, arr };
        };

        const budgetOccArr = calculateMonthlyOccArr(budgetData);
        const actualOccArr = calculateMonthlyOccArr(actualData);

        let totalBudgetRevenue;
        let totalActualRevenue;        

        if (monthIndex >= 0 && monthIndex < 12) {
            totalBudgetRevenue = monthlyBudgetRevenue[monthIndex];
            totalActualRevenue = monthlyActualRevenue[monthIndex];
            
            const filterMonth = (data) => {
                const filtered = Array(12).fill(0);
                filtered[monthIndex] = data[monthIndex];
                return filtered;
            };
            monthlyBudgetRevenue = filterMonth(monthlyBudgetRevenue);
            monthlyActualRevenue = filterMonth(monthlyActualRevenue);
            monthlyBudgetGop = filterMonth(monthlyBudgetGop);
            monthlyActualGop = filterMonth(monthlyActualGop);
        } else {
            totalBudgetRevenue = monthlyBudgetRevenue.reduce((sum, value) => sum + value, 0);
            totalActualRevenue = monthlyActualRevenue.reduce((sum, value) => sum + value, 0);
        }

        const sumPeriodValues = (data, code, monthIdx) => {
            const values = data[code] || [];
            if (monthIdx > -1) return parseFloat(values[monthIdx]) || 0;
            return values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        };

        const totalBudgetRoomSold = sumPeriodValues(budgetData, 'stat_occupied_rooms', monthIndex);
        const totalBudgetRoomAvailable = sumPeriodValues(budgetData, 'stat_room_available', monthIndex);
        const totalBudgetRoomRevenue = sumPeriodValues(budgetData, 'rev_room', monthIndex);
        const totalActualRoomSold = sumPeriodValues(actualData, 'stat_occupied_rooms', monthIndex);
        const totalActualRoomAvailable = sumPeriodValues(actualData, 'stat_room_available', monthIndex);
        const totalActualRoomRevenue = sumPeriodValues(actualData, 'rev_room', monthIndex);

        const budgetOccupancy = totalBudgetRoomAvailable > 0 ? (totalBudgetRoomSold / totalBudgetRoomAvailable) * 100 : 0;
        const actualOccupancy = totalActualRoomAvailable > 0 ? (totalActualRoomSold / totalActualRoomAvailable) * 100 : 0;
        const budgetArr = totalBudgetRoomSold > 0 ? totalBudgetRoomRevenue / totalBudgetRoomSold : 0;
        const actualArr = totalActualRoomSold > 0 ? totalActualRoomRevenue / totalActualRoomSold : 0;

        const calculateTotalExpenses = (data, monthIdx = -1) => {
            const expenseCodes = [
                'cos_fnb', 'cos_others', 'osaw_room', 'osaw_fnb', 'ooe_room', 'ooe_fnb',
                'usaw_ag', 'usaw_sm', 'usaw_pomec', 'uoe_ag', 'uoe_sm', 'uoe_pomec', 'uoe_energy', 'mgt_fee'
            ];
            return expenseCodes.reduce((total, code) => total + sumPeriodValues(data, code, monthIdx), 0);
        };

        const totalBudgetExpenses = calculateTotalExpenses(budgetData, monthIndex);
        const totalActualExpenses = calculateTotalExpenses(actualData, monthIndex);

        const totalBudgetGop = totalBudgetRevenue - totalBudgetExpenses;
        const totalActualGop = totalActualRevenue - totalActualExpenses;

        let roomProductionQuery = `SELECT segment, SUM(room) as total_rooms FROM room_production rp`;
        const roomProductionParams = [];
        let roomProductionWhereClauses = [];

        roomProductionWhereClauses.push(`EXTRACT(YEAR FROM rp.date) = $${roomProductionParams.length + 1}`);
        roomProductionParams.push(targetYear);

        if (monthIndex > -1) {
            roomProductionWhereClauses.push(`EXTRACT(MONTH FROM rp.date) = $${roomProductionParams.length + 1}`);
            roomProductionParams.push(monthIndex + 1);
        }

        if (dataFilterClause) {
            roomProductionQuery += ` JOIN hotels h ON rp.hotel_id = h.id `;
            roomProductionWhereClauses.push(`h.id = ANY($${roomProductionParams.length + 1}::int[])`);
            roomProductionParams.push(hotelDataParams[0]); // hotelDataParams is [[1,2,3]], we need [1,2,3]
        }

        if (roomProductionWhereClauses.length > 0) {
            roomProductionQuery += ` WHERE ${roomProductionWhereClauses.join(' AND ')}`;
        }
        roomProductionQuery += ` GROUP BY segment ORDER BY total_rooms DESC`;
        
        const roomProductionResult = await pool.query(roomProductionQuery, roomProductionParams);

        res.json({
            hotelCount,
            totalBudgetRevenue,
            totalActualRevenue,
            totalBudgetExpenses,
            totalActualExpenses,
            totalBudgetGop,
            totalActualGop,
            monthlyBudgetRevenue,
            monthlyActualRevenue,
            monthlyBudgetGop,
            monthlyActualGop,
            occupancy: {
                budget: budgetOccupancy,
                actual: actualOccupancy,
            },
            arr: {
                budget: budgetArr,
                actual: actualArr,
            },
            monthlyOccArr: {
                budgetOcc: budgetOccArr.occ,
                actualOcc: actualOccArr.occ,
                budgetArr: budgetOccArr.arr,
                actualArr: actualOccArr.arr,
            },
            roomProductionBySegment: {
                labels: roomProductionResult.rows.map(row => row.segment || 'N/A'),
                data: roomProductionResult.rows.map(row => parseInt(row.total_rooms, 10))
            },
            // BARU: Tambahkan data yang hilang untuk P&L Table dan Ratio Chart
            totalBudgetRoomSold,
            totalBudgetRoomAvailable,
            totalBudgetRoomRevenue,
            totalActualRoomSold,
            totalActualRoomAvailable,
            totalActualRoomRevenue,
            ratios: {
                budget: {
                    salaryWages: (totalBudgetRevenue > 0) ? (sumPeriodValues(budgetData, 'total_osaw', monthIndex) + sumPeriodValues(budgetData, 'total_usaw', monthIndex)) / totalBudgetRevenue * 100 : 0,
                    energyCost: (totalBudgetRevenue > 0) ? sumPeriodValues(budgetData, 'uoe_energy', monthIndex) / totalBudgetRevenue * 100 : 0,
                    roomGoi: (totalBudgetRoomRevenue > 0) ? (totalBudgetRoomRevenue - sumPeriodValues(budgetData, 'osaw_room', monthIndex) - sumPeriodValues(budgetData, 'ooe_room', monthIndex)) / totalBudgetRoomRevenue * 100 : 0,
                    fnbGoi: (sumPeriodValues(budgetData, 'rev_fnb', monthIndex) > 0) ? (sumPeriodValues(budgetData, 'rev_fnb', monthIndex) - sumPeriodValues(budgetData, 'cos_fnb', monthIndex) - sumPeriodValues(budgetData, 'osaw_fnb', monthIndex) - sumPeriodValues(budgetData, 'ooe_fnb', monthIndex)) / sumPeriodValues(budgetData, 'rev_fnb', monthIndex) * 100 : 0,
                    smExpenses: (totalBudgetRevenue > 0) ? (sumPeriodValues(budgetData, 'usaw_sm', monthIndex) + sumPeriodValues(budgetData, 'uoe_sm', monthIndex)) / totalBudgetRevenue * 100 : 0,
                    agExpenses: (totalBudgetRevenue > 0) ? (sumPeriodValues(budgetData, 'usaw_ag', monthIndex) + sumPeriodValues(budgetData, 'uoe_ag', monthIndex)) / totalBudgetRevenue * 100 : 0,
                },
                actual: {
                    salaryWages: (totalActualRevenue > 0) ? (sumPeriodValues(actualData, 'total_osaw', monthIndex) + sumPeriodValues(actualData, 'total_usaw', monthIndex)) / totalActualRevenue * 100 : 0,
                    energyCost: (totalActualRevenue > 0) ? sumPeriodValues(actualData, 'uoe_energy', monthIndex) / totalActualRevenue * 100 : 0,
                    roomGoi: (totalActualRoomRevenue > 0) ? (totalActualRoomRevenue - sumPeriodValues(actualData, 'osaw_room', monthIndex) - sumPeriodValues(actualData, 'ooe_room', monthIndex)) / totalActualRoomRevenue * 100 : 0,
                    fnbGoi: (sumPeriodValues(actualData, 'rev_fnb', monthIndex) > 0) ? (sumPeriodValues(actualData, 'rev_fnb', monthIndex) - sumPeriodValues(actualData, 'cos_fnb', monthIndex) - sumPeriodValues(actualData, 'osaw_fnb', monthIndex) - sumPeriodValues(actualData, 'ooe_fnb', monthIndex)) / sumPeriodValues(actualData, 'rev_fnb', monthIndex) * 100 : 0,
                    smExpenses: (totalActualRevenue > 0) ? (sumPeriodValues(actualData, 'usaw_sm', monthIndex) + sumPeriodValues(actualData, 'uoe_sm', monthIndex)) / totalActualRevenue * 100 : 0,
                    agExpenses: (totalActualRevenue > 0) ? (sumPeriodValues(actualData, 'usaw_ag', monthIndex) + sumPeriodValues(actualData, 'uoe_ag', monthIndex)) / totalActualRevenue * 100 : 0,
                }
            },
        });

    } catch (err) {
        console.error('Error in getDashboardStats:', err);
        next(err);
    }
};

// GET /api/dashboard/pl-summary
exports.getPlSummary = async (req, res, next) => {
    const { year, month, brand, hotels } = req.query;

    if (!year) {
        return res.status(400).json({ error: 'Parameter tahun diperlukan.' });
    }
    
    const monthIndex = month && month !== 'all' ? parseInt(month, 10) - 1 : -1;

    try {
        let hotelFilterClause = '';
        const queryParams = [year];

        const { filterClause: hotelDataFilter, queryParams: hotelDataParams } = buildHotelFilter(hotels, brand, 2);
        if (hotelDataFilter) {
            hotelFilterClause = `AND ${hotelDataFilter}`;
            queryParams.push(...hotelDataParams);
        }

        const getHotelData = async (tableName) => {
            const query = `
                SELECT 
                    t.hotel_id, 
                    h.name as hotel_name,
                    t.account_code, 
                    t.values
                FROM ${tableName} t
                JOIN hotels h ON t.hotel_id = h.id
                WHERE t.year = $1 ${hotelFilterClause}
            `;
            const result = await pool.query(query, queryParams);
            return result.rows;
        };

        const [budgetRows, actualRows] = await Promise.all([
            getHotelData('budgets'),
            getHotelData('actuals')
        ]);

        const processData = (rows) => {
            const dataByHotel = {};
            rows.forEach(row => {
                const { hotel_id, hotel_name, account_code, values } = row;
                if (!dataByHotel[hotel_id]) {
                    dataByHotel[hotel_id] = { hotel_name, accounts: {} };
                }
                dataByHotel[hotel_id].accounts[account_code] = values;
            });

            return Object.entries(dataByHotel).map(([hotel_id, hotelData]) => {
                const sum = (code) => {
                    const values = hotelData.accounts[code] || [];
                    if (monthIndex > -1) return parseFloat(values[monthIndex]) || 0;
                    return values.reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
                };

                const total_revenue = sum('rev_room') + sum('rev_fnb') + sum('rev_others');
                const totalDeptExpenses = sum('osaw_room') + sum('ooe_room') + sum('cos_fnb') + sum('osaw_fnb') + sum('ooe_fnb') + sum('cos_others');
                const totalUndistributed = sum('usaw_ag') + sum('usaw_sm') + sum('usaw_pomec') + sum('uoe_ag') + sum('uoe_sm') + sum('uoe_pomec') + sum('uoe_energy');
                const mgtFee = sum('mgt_fee');
                const total_expenses = totalDeptExpenses + totalUndistributed + mgtFee;
                const gop = total_revenue - total_expenses;
                const room_available = sum('stat_room_available');
                const room_sold = sum('stat_occupied_rooms');
                const room_revenue = sum('rev_room');

                return {
                    hotel_id,
                    hotel_name: hotelData.hotel_name,
                    occupancy: room_available > 0 ? (room_sold / room_available) * 100 : 0,
                    arr: room_sold > 0 ? room_revenue / room_sold : 0,
                    total_revenue,
                    total_expenses,
                    gop,
                    gop_percent: total_revenue > 0 ? (gop / total_revenue) * 100 : 0,
                };
            });
        };

        const budgetSummary = processData(budgetRows);
        const actualSummary = processData(actualRows);

        const summaryMap = {};
        budgetSummary.forEach(item => {
            summaryMap[item.hotel_id] = {
                hotel_id: item.hotel_id,
                hotel_name: item.hotel_name,
                budget: item,
                actual: {}
            };
        });
        actualSummary.forEach(item => {
            if (!summaryMap[item.hotel_id]) {
                summaryMap[item.hotel_id] = {
                    hotel_id: item.hotel_id,
                    hotel_name: item.hotel_name,
                    budget: {},
                    actual: item
                };
            } else {
                summaryMap[item.hotel_id].actual = item;
            }
        });

        res.json(Object.values(summaryMap));
    } catch (err) {
        next(err);
    }
};

// GET /api/dashboard/daily-income-summary
exports.getDailyIncomeSummary = async (req, res, next) => {
    const { year, month, brand, hotels, period, startDate, endDate } = req.query;
    if (!year || !period) return res.status(400).json({ error: 'Parameter tahun dan periode diperlukan.' });
    if (period === 'mtd' && !month) return res.status(400).json({ error: 'Parameter bulan diperlukan untuk periode MTD.' });
    if (period === 'custom' && (!startDate || !endDate)) return res.status(400).json({ error: 'Parameter startDate dan endDate diperlukan untuk periode Custom.' });

    try {
        const queryParams = [];
        const whereClauses = [];

        if (period === 'mtd') {
            whereClauses.push(`EXTRACT(YEAR FROM t.date) = $${queryParams.length + 1}`);
            queryParams.push(year);
            whereClauses.push(`EXTRACT(MONTH FROM t.date) = $${queryParams.length + 1}`);
            queryParams.push(month);
        } else if (period === 'ytd') {
            whereClauses.push(`EXTRACT(YEAR FROM t.date) = $${queryParams.length + 1}`);
            queryParams.push(year);
        } else if (period === 'lastday') {
            whereClauses.push(`t.date = (CURRENT_DATE - INTERVAL '1 day')`);
        } else if (period === 'custom') {
            whereClauses.push(`t.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
            queryParams.push(startDate, endDate);
        }

        const { filterClause: hotelFilter, queryParams: hotelParams } = buildHotelFilter(hotels, brand, queryParams.length + 1);
        if (hotelFilter) {
            whereClauses.push(hotelFilter);
            queryParams.push(...hotelParams);
        }

        const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const getDailyAggregatedData = async (tableName) => {
            const query = `
                SELECT t.date::text AS date, SUM(t.total_revenue) as total_revenue
                FROM ${tableName} t JOIN hotels h ON t.hotel_id = h.id
                ${whereClause}
                GROUP BY t.date ORDER BY t.date ASC;`;
            return await pool.query(query, queryParams);
        };

        const getHotelSummaryData = async (tableName) => {
            const query = `
                SELECT h.name as hotel_name, SUM(t.total_revenue) as total_revenue, 
                       SUM(t.room_revenue) as room_revenue, SUM(t.room_sold) as room_sold, SUM(t.room_available) as room_available
                FROM ${tableName} t JOIN hotels h ON t.hotel_id = h.id
                ${whereClause}
                GROUP BY h.name ORDER BY h.name ASC;`;
            return await pool.query(query, queryParams);
        };

        const [dailyBudget, dailyActual, hotelBudgetSummary, hotelActualSummary] = await Promise.all([
            getDailyAggregatedData('budget_dsr'),
            getDailyAggregatedData('actual_dsr'),
            getHotelSummaryData('budget_dsr'),
            getHotelSummaryData('actual_dsr')
        ]);

        let chartData;
        if (period === 'ytd') {
            const monthlyBudgetData = Array(12).fill(0);
            const monthlyActualData = Array(12).fill(0);
            dailyBudget.rows.forEach(r => { monthlyBudgetData[new Date(r.date).getMonth()] += parseFloat(r.total_revenue) || 0; });
            dailyActual.rows.forEach(r => { monthlyActualData[new Date(r.date).getMonth()] += parseFloat(r.total_revenue) || 0; });
            chartData = { budget: monthlyBudgetData, actual: monthlyActualData, labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], isMonthly: true };
        } else {
            const budgetMap = new Map(dailyBudget.rows.map(r => [r.date, parseFloat(r.total_revenue) || 0]));
            const actualMap = new Map(dailyActual.rows.map(r => [r.date, parseFloat(r.total_revenue) || 0]));
            const allDates = [...new Set([...budgetMap.keys(), ...actualMap.keys()])].sort();
            chartData = {
                budget: allDates.map(d => budgetMap.get(d) || 0),
                actual: allDates.map(d => actualMap.get(d) || 0),
                labels: allDates,
                isMonthly: false
            };
        }

        const hotelSummaries = hotelActualSummary.rows.map(actualRow => {
            const budgetRow = hotelBudgetSummary.rows.find(b => b.hotel_name === actualRow.hotel_name) || {};
            const calcStats = (row) => {
                const roomAvailable = parseFloat(row.room_available) || 0;
                const roomSold = parseFloat(row.room_sold) || 0;
                const roomRevenue = parseFloat(row.room_revenue) || 0;
                const totalRevenue = parseFloat(row.total_revenue) || 0;
                return {
                    total_revenue: totalRevenue,
                    room_available: roomAvailable,
                    room_sold: roomSold,
                    room_revenue: roomRevenue,
                    occupancy: roomAvailable > 0 ? (roomSold / roomAvailable) * 100 : 0,
                    arr: roomSold > 0 ? roomRevenue / roomSold : 0,
                    revpar: roomAvailable > 0 ? totalRevenue / roomAvailable : 0
                };
            };
            return { hotel_name: actualRow.hotel_name, actual: calcStats(actualRow), budget: calcStats(budgetRow) };
        });

        const calculateOverallSummary = (summaries, type) => {
            const totals = summaries.reduce((acc, curr) => {
                acc.total_revenue += curr[type].total_revenue || 0;
                acc.room_revenue += curr[type].room_revenue || 0;
                acc.room_sold += curr[type].room_sold || 0;
                acc.room_available += curr[type].room_available || 0;
                return acc;
            }, { total_revenue: 0, room_revenue: 0, room_sold: 0, room_available: 0 });

            return {
                total_revenue: totals.total_revenue,
                total_room_sold: totals.room_sold,
                total_room_available: totals.room_available,
                average_occupancy: totals.room_available > 0 ? (totals.room_sold / totals.room_available) * 100 : 0,
                arr: totals.room_sold > 0 ? totals.room_revenue / totals.room_sold : 0,
                revpar: totals.room_available > 0 ? totals.total_revenue / totals.room_available : 0,
            };
        };
        
        const summary = {
            actual: calculateOverallSummary(hotelSummaries, 'actual'),
            budget: calculateOverallSummary(hotelSummaries, 'budget'),
        };

        res.json({
            daily: chartData,
            hotel_summaries: hotelSummaries,
            summary: summary,
        });
    } catch (err) {
        next(err);
    }
};
