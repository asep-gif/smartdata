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

// Helper function to generate a range of dates
const generateDateRange = (year, month = null, startDate = null, endDate = null) => {
    const dates = [];
    if (startDate && endDate) {
        const [startY, startM, startD] = startDate.split('-').map(Number);
        let currentDate = new Date(Date.UTC(startY, startM - 1, startD));

        const [endY, endM, endD] = endDate.split('-').map(Number);
        let end = new Date(Date.UTC(endY, endM - 1, endD));

        while (currentDate <= end) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Use UTC date methods
        }
    } else if (month !== null) { // This is the MTD case
        const numDays = new Date(year, month, 0).getDate(); // Get number of days in the month
        for (let i = 1; i <= numDays; i++) {
            const date = new Date(Date.UTC(year, month - 1, i)); // Month is 0-indexed here for Date constructor
            dates.push(date.toISOString().split('T')[0]);
        }
    }
    return dates;
};

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res, next) => {
    const { brand, hotels, year, month } = req.query;

    try {
        const targetYear = year ? parseInt(year, 10) : new Date().getFullYear();
        const monthIndex = month && month !== 'all' ? parseInt(month, 10) - 1 : -1;

        let dataFilterClause = '';
        let dataQueryParams = [targetYear];

        const { filterClause: hotelDataFilter, queryParams: hotelDataParams } = buildHotelFilter(hotels, brand, 2);
        if (hotelDataFilter) {
            dataFilterClause = `AND ${hotelDataFilter}`;
            dataQueryParams.push(...hotelDataParams);
        }

        let hotelCount;
        let hotelCountQuery = 'SELECT COUNT(DISTINCT hotel_id) FROM (SELECT hotel_id FROM budgets WHERE year = $1';
        let hotelCountParams = [targetYear];
        if (hotelDataFilter) {
            hotelCountQuery += ' AND hotel_id IN (SELECT id FROM hotels WHERE ' + hotelDataFilter.replace(/h\./g, '') + ')';
            hotelCountParams.push(hotelDataParams[0]);
        }
        hotelCountQuery += ' UNION SELECT hotel_id FROM actuals WHERE year = $1';
        if (hotelDataFilter) {
            hotelCountQuery += ' AND hotel_id IN (SELECT id FROM hotels WHERE ' + hotelDataFilter.replace(/h\./g, '') + ')';
        }
        hotelCountQuery += ') as hotels_with_data';
        const countResult = await pool.query(hotelCountQuery, hotelCountParams);
        hotelCount = parseInt(countResult.rows[0].count, 10);

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

            const { filterClause: hotelFilter, queryParams: hotelParams } = buildHotelFilter(hotels, brand, queryParams.length + 1);

            if (hotelFilter) {
                joinClause = ` JOIN hotels h ON ${tableAlias}.hotel_id = h.id`;
                whereConditions.push(hotelFilter);
                queryParams.push(...hotelParams);
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
        
        let monthlyBudgetGop = calculateMonthlyGop(budgetData);
        let monthlyActualGop = calculateMonthlyGop(actualData);

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

            // Filter monthlyOccArr for the selected month
            budgetOccArr.occ = filterMonth(budgetOccArr.occ);
            budgetOccArr.arr = filterMonth(budgetOccArr.arr);
            actualOccArr.occ = filterMonth(actualOccArr.occ);
            actualOccArr.arr = filterMonth(actualOccArr.arr);
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
            const adjustedHotelFilter = hotelDataFilter.replace(/\$(\d+)/g, (match, n) => `$${parseInt(n) + roomProductionParams.length - 1}`);
            roomProductionWhereClauses.push(adjustedHotelFilter.replace(/h\./g, 'h.'));
            roomProductionParams.push(...hotelDataParams);
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
        const currentYear = parseInt(year, 10);
        const lastYear = currentYear - 1;

        const createWhereClause = (targetYear, p_startDate, p_endDate, p_month) => {
            const where = { clauses: [], params: [] };
            
            const addClause = (clause, ...p) => {
                const paramIndexes = Array.from(clause.matchAll(/(\$\d+)/g)).map(m => parseInt(m[1].substring(1)));
                const maxIndex = paramIndexes.length > 0 ? Math.max(...paramIndexes) : 0;
                const newClause = clause.replace(/\$(\d+)/g, (_, n) => `$${where.params.length + parseInt(n)}`);
                where.clauses.push(newClause);
                where.params.push(...p);
            };

            if (period === 'mtd') {
                addClause(`EXTRACT(YEAR FROM t.date) = $1 AND EXTRACT(MONTH FROM t.date) = $2`, targetYear, p_month);
            } else if (period === 'ytd') {
                addClause(`EXTRACT(YEAR FROM t.date) = $1`, targetYear);
            } else if (period === 'lastday') {
                addClause(`t.date = (CURRENT_DATE - INTERVAL '1 day' - INTERVAL '${currentYear - targetYear} year')`);
            } else if (period === 'custom' && p_startDate && p_endDate) {
                addClause(`t.date BETWEEN $1 AND $2`, p_startDate, p_endDate);
            }

            return where;
        };

        const hotelFilterClause = buildHotelFilter(hotels, brand, 1);
        
        const buildFinalWhere = (periodWhere) => {
            const finalWhere = {
                clauses: [...periodWhere.clauses],
                params: [...periodWhere.params]
            };
            if (hotelFilterClause.filterClause) {
                const updatedHotelClause = hotelFilterClause.filterClause.replace(/\$(\d+)/g, (_, n) => `$${finalWhere.params.length + parseInt(n)}`);
                finalWhere.clauses.push(updatedHotelClause);
                finalWhere.params.push(...hotelFilterClause.queryParams);
            }
            return finalWhere;
        };
        
        const currentPeriodWhere = createWhereClause(currentYear, startDate, endDate, month);

        let lastYearStartDate, lastYearEndDate;
        if(period === 'custom' && startDate && endDate){
            const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
            const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
            
            const tempLastYearStartDate = new Date(Date.UTC(lastYear, startMonth - 1, startDay));
            const tempLastYearEndDate = new Date(Date.UTC(lastYear, endMonth - 1, endDay));

            lastYearStartDate = tempLastYearStartDate.toISOString().split('T')[0];
            lastYearEndDate = tempLastYearEndDate.toISOString().split('T')[0];
        }

        const lastYearPeriodWhere = createWhereClause(lastYear, lastYearStartDate, lastYearEndDate, month);

        const currentWhere = buildFinalWhere(currentPeriodWhere);
        const lastYearWhere = buildFinalWhere(lastYearPeriodWhere);

        const getDailyAggregatedData = async (tableName, where) => {
            const query = `
                SELECT t.date::text AS date, SUM(t.total_revenue) as total_revenue
                FROM ${tableName} t JOIN hotels h ON t.hotel_id = h.id
                ${where.clauses.length > 0 ? 'WHERE ' + where.clauses.join(' AND ') : ''}
                GROUP BY t.date ORDER BY t.date ASC;`;
            return await pool.query(query, where.params);
        };
        
        const getHotelSummaryData = async (tableName, where) => {
            const query = `
                SELECT h.name as hotel_name, SUM(t.total_revenue) as total_revenue, 
                       SUM(t.room_revenue) as room_revenue, SUM(t.room_sold) as room_sold, SUM(t.room_available) as room_available
                FROM ${tableName} t JOIN hotels h ON t.hotel_id = h.id
                ${where.clauses.length > 0 ? 'WHERE ' + where.clauses.join(' AND ') : ''}
                GROUP BY h.name ORDER BY h.name ASC;`;
            return await pool.query(query, where.params);
        };

        const [dailyBudget, dailyActual, dailyActualLastYear, hotelBudgetSummary, hotelActualSummary, hotelActualLastYearSummary] = await Promise.all([
            getDailyAggregatedData('budget_dsr', currentWhere),
            getDailyAggregatedData('actual_dsr', currentWhere),
            getDailyAggregatedData('actual_dsr', lastYearWhere),
            getHotelSummaryData('budget_dsr', currentWhere),
            getHotelSummaryData('actual_dsr', currentWhere),
            getHotelSummaryData('actual_dsr', lastYearWhere)
        ]);

        let chartData;
        if (period === 'ytd') {
            const monthlyBudgetData = Array(12).fill(0);
            const monthlyActualData = Array(12).fill(0);
            const monthlyActualLastYearData = Array(12).fill(0);
            dailyBudget.rows.forEach(r => { monthlyBudgetData[new Date(r.date).getMonth()] += parseFloat(r.total_revenue) || 0; });
            dailyActual.rows.forEach(r => { monthlyActualData[new Date(r.date).getMonth()] += parseFloat(r.total_revenue) || 0; });
            dailyActualLastYear.rows.forEach(r => { monthlyActualLastYearData[new Date(r.date).getMonth()] += parseFloat(r.total_revenue) || 0; });
            chartData = { budget: monthlyBudgetData, actual: monthlyActualData, actualLastYear: monthlyActualLastYearData, labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], isMonthly: true };
        } else {
            const budgetMap = new Map(dailyBudget.rows.map(r => [r.date, parseFloat(r.total_revenue) || 0]));
            const actualMap = new Map(dailyActual.rows.map(r => [r.date, parseFloat(r.total_revenue) || 0]));
            const actualLastYearMap = new Map(dailyActualLastYear.rows.map(r => [r.date, parseFloat(r.total_revenue) || 0]));
            
            let allDatesInPeriod = [];
            if (period === 'mtd') {
                allDatesInPeriod = generateDateRange(currentYear, parseInt(month, 10));
            } else if (period === 'custom') {
                allDatesInPeriod = generateDateRange(currentYear, null, startDate, endDate);
            } else if (period === 'lastday') {
                // For 'lastday', the query already fetches data for a single day.
                // We'll generate a single-day range based on the fetched date or current date-1
                if (dailyActual.rows.length > 0) {
                    allDatesInPeriod = [dailyActual.rows[0].date];
                } else {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    allDatesInPeriod = [yesterday.toISOString().split('T')[0]];
                }
            } else {
                 allDatesInPeriod = [...new Set([...budgetMap.keys(), ...actualMap.keys(), ...actualLastYearMap.keys()])].sort();
            }

            chartData = {
                budget: allDatesInPeriod.map(d => budgetMap.get(d) || 0),
                actual: allDatesInPeriod.map(d => actualMap.get(d) || 0),
                actualLastYear: allDatesInPeriod.map(d => {
                    const currentDay = new Date(Date.UTC(parseInt(d.substring(0,4)), parseInt(d.substring(5,7)) - 1, parseInt(d.substring(8,10))));
                    const lastYearDay = new Date(Date.UTC(currentDay.getUTCFullYear() - 1, currentDay.getUTCMonth(), currentDay.getUTCDate()));
                    return actualLastYearMap.get(lastYearDay.toISOString().split('T')[0]) || 0;
                }),
                labels: allDatesInPeriod.map(d => {
                    const tempDate = new Date(d);
                    return tempDate.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
                }),
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
                revpar: roomAvailable > 0 ? roomRevenue / roomAvailable : 0
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
                revpar: totals.room_available > 0 ? totals.room_revenue / totals.room_available : 0,
            };
        };
        
        const lastYearSummariesForCalc = hotelActualLastYearSummary.rows.map(row => {
            return {
                actual: {
                    total_revenue: parseFloat(row.total_revenue) || 0,
                    room_revenue: parseFloat(row.room_revenue) || 0,
                    room_sold: parseFloat(row.room_sold) || 0,
                    room_available: parseFloat(row.room_available) || 0,
                }
            };
        });

        const summary = {
            actual: calculateOverallSummary(hotelSummaries, 'actual'),
            budget: calculateOverallSummary(hotelSummaries, 'budget'),
            actualLastYear: calculateOverallSummary(lastYearSummariesForCalc, 'actual'),
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
