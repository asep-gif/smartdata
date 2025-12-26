// --- FINANCIAL REPORTS FUNCTIONS ---

/**
 * Inisialisasi semua listener untuk tombol generate laporan.
 */
function initReportListeners() {
    document.getElementById('generate-is-report-btn')?.addEventListener('click', generateIncomeStatementReport);
    document.getElementById('generate-rd-report-btn')?.addEventListener('click', generateRoomDivisionReport);
    document.getElementById('generate-fnb-report-btn')?.addEventListener('click', generateFnbDivisionReport);
    document.getElementById('generate-ms-report-btn')?.addEventListener('click', generateMonthlySummaryReport);
}

/**
 * Inisialisasi halaman laporan Income Statement dengan mengisi filter.
 */
function initIncomeStatementReport() {
    initializeReportFilters('is');
}

/**
 * Inisialisasi halaman laporan Monthly Summary dengan mengisi filter.
 */
async function initMonthlySummaryReport() {
    await initializeReportFilters('ms');
    generateMonthlySummaryReport();
}

/**
 * Fungsi generik untuk inisialisasi filter pada halaman laporan.
 * @param {string} prefix - Prefix untuk ID elemen (misal: 'is' atau 'rd').
 */
async function initializeReportFilters(prefix) {
    populateYearDropdown(`${prefix}-year-select`);
    await populateBrandFilterDropdown(`${prefix}-brand-select`);
    
    if (prefix === 'rd' || prefix === 'fnb') {
        populateMonthDropdowns(prefix); 
    } else if (prefix === 'ms') {
        populateMonthDropdown(`${prefix}-month-select`); 
    }

    await populateHotelChecklist(`${prefix}-hotel-checklist-container`, `${prefix}-hotel-filter-select-all`);
    initHotelFilterDropdown(`${prefix}-hotel-filter-btn`, `${prefix}-hotel-filter-dropdown`, `${prefix}-hotel-filter-search`, `${prefix}-hotel-filter-select-all`, `${prefix}-hotel-checklist-container`, `${prefix}-hotel-filter-apply`, `${prefix}-hotel-filter-label`);

    const brandSelect = document.getElementById(`${prefix}-brand-select`);
    if (brandSelect) {
        brandSelect.addEventListener('change', () => {
            const hotelCheckboxes = document.querySelectorAll(`#${prefix}-hotel-checklist-container input[type="checkbox"]`);
            hotelCheckboxes.forEach(cb => cb.checked = false);
            updateHotelFilterLabel(`${prefix}-hotel-filter-label`, `${prefix}-hotel-checklist-container`);
        });
    }
}

/**
 * Mengisi dropdown bulan mulai dan selesai untuk filter laporan.
 * @param {string} prefix - Prefix untuk ID elemen (misal: 'rd').
 */
function populateMonthDropdowns(prefix) {
    const startMonthSelect = document.getElementById(`${prefix}-start-month-select`);
    const endMonthSelect = document.getElementById(`${prefix}-end-month-select`);

    if (!startMonthSelect || !endMonthSelect) return;

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const currentMonth = new Date().getMonth(); 

    startMonthSelect.innerHTML = '';
    endMonthSelect.innerHTML = '';

    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index; 
        option.textContent = month;
        startMonthSelect.appendChild(option.cloneNode(true));
        endMonthSelect.appendChild(option.cloneNode(true));
    });

    startMonthSelect.value = 0; 
    endMonthSelect.value = currentMonth; 
}

/**
 * Mengambil data, memproses, dan menampilkan laporan Income Statement.
 */
async function generateIncomeStatementReport() {
    const year = document.getElementById('is-year-select').value;    
    const reportContainer = document.getElementById('is-report-container');
    const tableBody = document.getElementById('is-report-table-body');
    const generateBtn = document.getElementById('generate-is-report-btn');

    reportContainer.classList.remove('hidden');
    tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500"></i><p class="mt-2">Memuat data laporan...</p></td></tr>`;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating...';

    try {
        const params = new URLSearchParams({ year });        
        const brandSelect = document.getElementById('is-brand-select');
        const selectedHotels = getSelectedHotels('is');

        if (selectedHotels.length > 0) {
            params.append('hotels', selectedHotels.join(','));
        } else if (brandSelect && brandSelect.value !== 'all') {
            params.append('brand', brandSelect.value);
        }

        const response = await fetch(`${API_BASE_URL}/api/reports/income-statement?${params.toString()}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal mengambil data laporan dari server.');
        }

        const reportData = await response.json();

        if (Object.keys(reportData.budget).length === 0 && Object.keys(reportData.actual).length === 0) {
             tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Tidak ada data ditemukan untuk filter yang dipilih.</td></tr>`;
        } else {
            renderIncomeStatementTable(reportData.budget, reportData.actual);
        }
    } catch (error) {
        console.error('Error generating income statement report:', error);
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fa-solid fa-cogs mr-1"></i> Generate Laporan';
    }
}

/**
 * Merender tabel Income Statement dari data budget dan actual.
 * @param {object} budgetData - Data budget dari API.
 * @param {object} actualData - Data actual dari API.
 */
function renderIncomeStatementTable(budgetData, actualData) {
    const tableBody = document.getElementById('is-report-table-body');
    const templateTable = document.getElementById('budget-table-body'); 
    if (!tableBody || !templateTable) return;

    tableBody.innerHTML = ''; 
    const templateRows = templateTable.querySelectorAll('tr');

    const ytdValues = { budget: {}, actual: {} };

    templateRows.forEach(templateRow => {
        const accountCode = templateRow.dataset.id;
        if (accountCode && !templateRow.dataset.formula) {
            ytdValues.budget[accountCode] = (budgetData[accountCode] || []).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
            ytdValues.actual[accountCode] = (actualData[accountCode] || []).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        }
    });

    const calculateFormulas = (data) => {
        const getValue = (code) => data[code] || 0;

        data['total_revenue'] = getValue('rev_room') + getValue('rev_fnb') + getValue('rev_others');
        data['total_cos'] = getValue('cos_fnb') + getValue('cos_others');
        data['total_osaw'] = getValue('osaw_room') + getValue('osaw_fnb');
        data['total_ooe'] = getValue('ooe_room') + getValue('ooe_fnb');
        data['odp_room_goi'] = getValue('rev_room') - getValue('osaw_room') - getValue('ooe_room');
        data['odp_fnb_goi'] = getValue('rev_fnb') - getValue('cos_fnb') - getValue('osaw_fnb') - getValue('ooe_fnb');
        data['odp_others_goi'] = getValue('rev_others') - getValue('cos_others');
        data['total_odp'] = getValue('odp_room_goi') + getValue('odp_fnb_goi') + getValue('odp_others_goi');
        data['total_usaw'] = getValue('usaw_ag') + getValue('usaw_sm') + getValue('usaw_pomec');
        data['total_uoe'] = getValue('uoe_ag') + getValue('uoe_sm') + getValue('uoe_pomec') + getValue('uoe_energy');
        data['total_undistributed_exp'] = getValue('total_usaw') + getValue('total_uoe');
        data['gop'] = getValue('total_odp') - getValue('total_undistributed_exp') - getValue('mgt_fee');

        const totalRevenue = getValue('total_revenue');
        const occupiedRooms = getValue('stat_occupied_rooms');
        const roomAvailable = getValue('stat_room_available');
        const roomRev = getValue('rev_room');
        const fnbRev = getValue('rev_fnb');

        data['stat_occupancy_percent'] = roomAvailable > 0 ? (occupiedRooms / roomAvailable) * 100 : 0;
        data['stat_arr'] = occupiedRooms > 0 ? roomRev / occupiedRooms : 0;
        data['stat_revpar'] = roomAvailable > 0 ? roomRev / roomAvailable : 0;
        data['gop_ratio'] = totalRevenue > 0 ? (getValue('gop') / totalRevenue) * 100 : 0;
        data['ratio_salary_wages'] = totalRevenue > 0 ? ((getValue('total_osaw') + getValue('total_usaw')) / totalRevenue) * 100 : 0;
        data['ratio_energy'] = totalRevenue > 0 ? (getValue('uoe_energy') / totalRevenue) * 100 : 0;
        data['ratio_room_goi'] = roomRev > 0 ? (getValue('odp_room_goi') / roomRev) * 100 : 0;
        data['ratio_fnb_goi'] = fnbRev > 0 ? (getValue('odp_fnb_goi') / fnbRev) * 100 : 0;
        data['ratio_sm_exp'] = totalRevenue > 0 ? ((getValue('usaw_sm') + getValue('uoe_sm')) / totalRevenue) * 100 : 0;
        data['ratio_mfee'] = totalRevenue > 0 ? (getValue('mgt_fee') / totalRevenue) * 100 : 0;
    };

    calculateFormulas(ytdValues.budget);
    calculateFormulas(ytdValues.actual);

    templateRows.forEach(templateRow => {
        const newRow = document.createElement('tr');
        const accountCode = templateRow.dataset.id;
        const description = templateRow.cells[0].textContent;

        if (templateRow.classList.contains('bg-slate-100')) {
            newRow.className = 'bg-slate-100 font-bold';
            newRow.innerHTML = `<td class="px-6 py-2" colspan="5">${description}</td>`;
            tableBody.appendChild(newRow);
            return;
        }

        if (!accountCode) return;

        const budgetYtd = ytdValues.budget[accountCode] || 0;
        const actualYtd = ytdValues.actual[accountCode] || 0;
        const varianceAmount = actualYtd - budgetYtd;
        const isRatio = templateRow.dataset.formula === 'percent' || templateRow.dataset.formula === 'occupancy' || templateRow.dataset.formula === 'gop_ratio';
        const variancePercent = !isRatio && budgetYtd !== 0 ? (varianceAmount / budgetYtd) * 100 : 0;

        let varianceColor = 'text-slate-500';
        const isExpense = accountCode.startsWith('cos_') || accountCode.startsWith('osaw_') || accountCode.startsWith('ooe_') || accountCode.startsWith('usaw_') || accountCode.startsWith('uoe_') || accountCode === 'mgt_fee';
        const isRevenue = accountCode.startsWith('rev_');

        if (varianceAmount !== 0) {
            if (isExpense) {
                varianceColor = varianceAmount < 0 ? 'text-green-600' : 'text-red-600';
            } else {
                varianceColor = varianceAmount > 0 ? 'text-green-600' : 'text-red-600';
            }
        }

        const formatNumber = (num) => num.toLocaleString('en-US');
        const formatPercent = (num) => num.toFixed(0) + '%';
        const formatValue = (value, isRatioRow) => isRatioRow ? formatPercent(value) : formatNumber(Math.round(value));

        newRow.className = templateRow.className.replace('sticky', '').replace('left-0', '').replace('bg-slate-50', 'bg-slate-50 font-semibold');
        newRow.innerHTML = `
            <td class="px-6 py-3 ${templateRow.cells[0].className.includes('pl-8') ? 'pl-10' : ''}">${description}</td>
            <td class="px-6 py-3 text-right font-mono">${formatValue(budgetYtd, isRatio)}</td>
            <td class="px-6 py-3 text-right font-mono">${formatValue(actualYtd, isRatio)}</td>
            <td class="px-6 py-3 text-right font-mono ${varianceColor}">${isRatio ? formatPercent(varianceAmount) : formatNumber(varianceAmount)}</td>
            <td class="px-6 py-3 text-right font-mono ${varianceColor}">${isRatio ? '' : formatPercent(variancePercent)}</td>
        `;

        if (accountCode === 'gop' || accountCode === 'gop_ratio') {
            newRow.classList.add('bg-blue-50', 'font-bold', 'text-blue-800');
        }

        tableBody.appendChild(newRow);
    });
}

/**
 * Fungsi generik untuk membuat baris-baris HTML untuk tabel laporan.
 * @param {Array} reportStructure - Array objek yang mendefinisikan struktur laporan.
 * @param {object} budgetYtd - Objek data YTD budget.
 * @param {object} actualYtd - Objek data YTD actual.
 * @returns {string} - String HTML berisi baris-baris tabel (<tr>).
 */
function generateReportRows(reportStructure, budgetYtd, actualYtd) {
    let html = '';

    const formatValue = (value, format) => {
        if (isNaN(value) || value === null) return '-';
        if (format === 'percent') return `${value.toFixed(0)}%`;
        if (format === 'currency') return Math.round(value).toLocaleString('en-US');
        return Math.round(value).toLocaleString('en-US');
    };

    const calculatedValues = { budget: { ...budgetYtd }, actual: { ...actualYtd } };

    reportStructure.forEach(item => {
        if (item.isCalculated && typeof item.formula === 'function') {
            const { budget, actual } = item.formula(calculatedValues.budget, calculatedValues.actual);
            calculatedValues.budget[item.id] = budget;
            calculatedValues.actual[item.id] = actual;
        }
    });

    reportStructure.forEach(item => {
        if (item.type === 'header') {
            html += `<tr class="bg-slate-100 ${item.isBold ? 'font-bold' : 'font-semibold'}"><td class="px-6 py-2" colspan="5">${item.label}</td></tr>`;
            return;
        }

        const budgetValue = calculatedValues.budget[item.id] || 0;
        const actualValue = calculatedValues.actual[item.id] || 0;
        let varianceAmount = actualValue - budgetValue;
        let variancePercent = 0;

        if (item.format !== 'percent') {
            variancePercent = budgetValue !== 0 ? (varianceAmount / budgetValue) * 100 : (actualValue !== 0 ? 100 : 0);
        }

        let amountColor = varianceAmount > 0 ? 'text-green-600' : (varianceAmount < 0 ? 'text-red-600' : 'text-slate-500');
        const rowClass = item.isBold ? 'font-bold bg-blue-50 text-blue-800' : '';
        const indentClass = item.indent ? 'pl-10' : 'pl-6';

        html += `
            <tr class="${rowClass}">
                <td class="px-6 py-3 ${indentClass}">${item.label}</td>
                <td class="px-6 py-3 text-right font-mono">${formatValue(budgetValue, item.format)}</td>
                <td class="px-6 py-3 text-right font-mono">${formatValue(actualValue, item.format)}</td>
                <td class="px-6 py-3 text-right font-mono ${amountColor}">${formatValue(varianceAmount, item.format === 'percent' ? 'percent' : 'currency')}</td>
                <td class="px-6 py-3 text-right font-mono ${amountColor}">${item.format !== 'percent' ? formatValue(variancePercent, 'percent') : ''}</td>
            </tr>
        `;
    });

    return html || '<tr><td colspan="5" class="p-4 text-center text-slate-500">Tidak ada data ditemukan.</td></tr>';
}

/**
 * Mengambil data, memproses, dan menampilkan laporan Room Division.
 */
async function generateRoomDivisionReport() {
    const tableBody = document.getElementById('rd-report-table-body');
    const button = document.getElementById('generate-rd-report-btn');
    const year = document.getElementById('rd-year-select').value;
    const startMonth = parseInt(document.getElementById('rd-start-month-select').value, 10);
    const endMonth = parseInt(document.getElementById('rd-end-month-select').value, 10);
    const brand = document.getElementById('rd-brand-select').value;
    const selectedHotels = getSelectedHotels('rd');

    if (!year || startMonth > endMonth) {
        alert('Tahun harus dipilih dan Bulan Mulai tidak boleh lebih besar dari Bulan Selesai.');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Generating...';
    tableBody.innerHTML = '<tr><td colspan="5" class="p-8 text-center"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></td></tr>';
    document.getElementById('rd-report-container').classList.remove('hidden');

    try {
        const queryParams = new URLSearchParams({ year });
        if (brand && brand !== 'all') queryParams.append('brand', brand);
        if (selectedHotels.length > 0) queryParams.append('hotels', selectedHotels.join(','));

        const response = await fetch(`${API_BASE_URL}/api/reports/room-division?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Gagal mengambil data.');

        const { budget, actual } = await response.json();

        const reportStructure = [
            { label: 'STATISTICS', type: 'header' },
            { label: 'Occupied Rooms', id: 'stat_occupied_rooms', format: 'number', indent: true },
            { label: '% Of Occupancy', id: 'stat_occupancy_percent', format: 'percent', indent: true, isCalculated: true, formula: (b, a) => ({ budget: (b.stat_room_available > 0 ? b.stat_occupied_rooms / b.stat_room_available : 0) * 100, actual: (a.stat_room_available > 0 ? a.stat_occupied_rooms / a.stat_room_available : 0) * 100 }) },
            { label: 'Average Room Rate', id: 'stat_arr', format: 'currency', indent: true, isCalculated: true, formula: (b, a) => ({ budget: b.stat_occupied_rooms > 0 ? b.rev_room / b.stat_occupied_rooms : 0, actual: a.stat_occupied_rooms > 0 ? a.rev_room / a.stat_occupied_rooms : 0 }) },
            { label: 'REVENUE', type: 'header' },
            { label: 'Room Revenue', id: 'rev_room', format: 'currency', indent: true },
            { label: 'DEPARTMENTAL EXPENSES', type: 'header' },
            { label: 'Room - Salary & Wages', id: 'osaw_room', format: 'currency', indent: true },
            { label: 'Room - Other Expenses', id: 'ooe_room', format: 'currency', indent: true },
            { label: 'Total Departmental Expenses', id: 'total_room_exp', format: 'currency', isBold: true, isCalculated: true, formula: (b, a) => ({ budget: (b.osaw_room || 0) + (b.ooe_room || 0), actual: (a.osaw_room || 0) + (a.ooe_room || 0) }) },
            { label: 'ROOM GROSS OPERATING PROFIT', type: 'header', isBold: true },
            { label: 'Room GOP', id: 'room_gop', format: 'currency', isBold: true, isCalculated: true, formula: (b, a) => ({ budget: (b.rev_room || 0) - ((b.osaw_room || 0) + (b.ooe_room || 0)), actual: (a.rev_room || 0) - ((a.osaw_room || 0) + (a.ooe_room || 0)) }) },
            { label: '% Room GOP', id: 'percent_room_gop', format: 'percent', isBold: true, isCalculated: true, formula: (b, a) => ({ budget: (b.rev_room > 0 ? ((b.rev_room || 0) - ((b.osaw_room || 0) + (b.ooe_room || 0))) / b.rev_room : 0) * 100, actual: (a.rev_room > 0 ? ((a.rev_room || 0) - ((a.osaw_room || 0) + (a.ooe_room || 0))) / a.rev_room : 0) * 100 }) },
        ];

        const sumPeriod = (data, code, start, end) => (data[code] || []).slice(start, end + 1).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        const budgetPeriod = Object.keys(budget).reduce((acc, code) => ({ ...acc, [code]: sumPeriod(budget, code, startMonth, endMonth) }), {});
        const actualPeriod = Object.keys(actual).reduce((acc, code) => ({ ...acc, [code]: sumPeriod(actual, code, startMonth, endMonth) }), {});

        tableBody.innerHTML = generateReportRows(reportStructure, budgetPeriod, actualPeriod);

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">${error.message}</td></tr>`;
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-cogs mr-1"></i> Generate Laporan';
    }
}

/**
 * Mengambil data, memproses, dan menampilkan laporan F&B Division.
 */
async function generateFnbDivisionReport() {
    const tableBody = document.getElementById('fnb-report-table-body');
    const button = document.getElementById('generate-fnb-report-btn');
    const year = document.getElementById('fnb-year-select').value;
    const startMonth = parseInt(document.getElementById('fnb-start-month-select').value, 10);
    const endMonth = parseInt(document.getElementById('fnb-end-month-select').value, 10);
    const brand = document.getElementById('fnb-brand-select').value;
    const selectedHotels = getSelectedHotels('fnb');

    if (!year || startMonth > endMonth) {
        alert('Tahun harus dipilih dan Bulan Mulai tidak boleh lebih besar dari Bulan Selesai.');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Generating...';
    tableBody.innerHTML = '<tr><td colspan="5" class="p-8 text-center"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></td></tr>';
    document.getElementById('fnb-report-container').classList.remove('hidden');

    try {
        const queryParams = new URLSearchParams({ year });
        if (brand && brand !== 'all') queryParams.append('brand', brand);
        if (selectedHotels.length > 0) queryParams.append('hotels', selectedHotels.join(','));

        const response = await fetch(`${API_BASE_URL}/api/reports/fnb-division?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Gagal mengambil data.');

        const { budget, actual } = await response.json();

        const reportStructure = [
            { label: 'REVENUE', type: 'header' },
            { label: 'F&B Revenue', id: 'rev_fnb', format: 'currency', indent: true },
            { label: 'COST OF SALES', type: 'header' },
            { label: 'F&B Cost', id: 'cos_fnb', format: 'currency', indent: true },
            { label: '% F&B Cost', id: 'percent_fnb_cost', format: 'percent', isCalculated: true, formula: (b, a) => ({ budget: (b.rev_fnb > 0 ? b.cos_fnb / b.rev_fnb : 0) * 100, actual: (a.rev_fnb > 0 ? a.cos_fnb / a.rev_fnb : 0) * 100 }) },
            { label: 'DEPARTMENTAL EXPENSES', type: 'header' },
            { label: 'F&B - Salary & Wages', id: 'osaw_fnb', format: 'currency', indent: true },
            { label: 'F&B - Other Expenses', id: 'ooe_fnb', format: 'currency', indent: true },
            { label: 'F&B GROSS OPERATING PROFIT', type: 'header', isBold: true },
            { label: 'F&B GOI', id: 'fnb_goi', format: 'currency', isBold: true, isCalculated: true, formula: (b, a) => ({ budget: (b.rev_fnb || 0) - (b.cos_fnb || 0) - (b.osaw_fnb || 0) - (b.ooe_fnb || 0), actual: (a.rev_fnb || 0) - (a.cos_fnb || 0) - (a.osaw_fnb || 0) - (a.ooe_fnb || 0) }) },
            { label: '% F&B GOI', id: 'percent_fnb_goi', format: 'percent', isBold: true, isCalculated: true, formula: (b, a) => ({ budget: (b.rev_fnb > 0 ? ((b.rev_fnb || 0) - (b.cos_fnb || 0) - (b.osaw_fnb || 0) - (b.ooe_fnb || 0)) / b.rev_fnb : 0) * 100, actual: (a.rev_fnb > 0 ? ((a.rev_fnb || 0) - (a.cos_fnb || 0) - (a.osaw_fnb || 0) - (a.ooe_fnb || 0)) / a.rev_fnb : 0) * 100 }) },
        ];

        const sumPeriod = (data, code, start, end) => (data[code] || []).slice(start, end + 1).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
        const budgetPeriod = Object.keys(budget).reduce((acc, code) => ({ ...acc, [code]: sumPeriod(budget, code, startMonth, endMonth) }), {});
        const actualPeriod = Object.keys(actual).reduce((acc, code) => ({ ...acc, [code]: sumPeriod(actual, code, startMonth, endMonth) }), {});

        tableBody.innerHTML = generateReportRows(reportStructure, budgetPeriod, actualPeriod);

    } catch (error) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">${error.message}</td></tr>`;
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-cogs mr-1"></i> Generate Laporan';
    }
}

/**
 * Mengambil data, memproses, dan menampilkan laporan Monthly Hotel Summary.
 */
async function generateMonthlySummaryReport() {
    const tableContainer = document.getElementById('ms-report-table-container');
    const button = document.getElementById('generate-ms-report-btn');
    const year = document.getElementById('ms-year-select').value;
    const month = document.getElementById('ms-month-select').value;
    const brand = document.getElementById('ms-brand-select').value;
    const selectedHotels = getSelectedHotels('ms');

    if (!year || !month) {
        alert('Silakan pilih tahun dan bulan terlebih dahulu.');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Generating...';
    tableContainer.innerHTML = '<div class="p-8 text-center"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>';
    document.getElementById('ms-report-container').classList.remove('hidden');

    try {
        const queryParams = new URLSearchParams({ year, month });
        if (brand && brand !== 'all') queryParams.append('brand', brand);
        if (selectedHotels.length > 0) queryParams.append('hotels', selectedHotels.join(','));

        const response = await fetch(`${API_BASE_URL}/api/reports/monthly-hotel-summary?${queryParams.toString()}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Gagal mengambil data.');

        const data = await response.json();
        renderMonthlySummaryTable(data);

    } catch (error) {
        tableContainer.innerHTML = `<div class="p-8 text-center text-red-500">${error.message}</div>`;
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-cogs mr-1"></i> Generate Laporan';
    }
}

/**
 * Merender tabel Monthly Hotel Summary dari data yang diterima.
 * @param {Array<Object>} data - Data ringkasan dari API.
 */
function renderMonthlySummaryTable(data) {
    const tableContainer = document.getElementById('ms-report-table-container');

    if (data.length === 0) {
        tableContainer.innerHTML = '<p class="p-4 text-center text-slate-500">Tidak ada data ditemukan.</p>';
        return;
    }

    const formatCurrency = (val) => Math.round(val).toLocaleString('en-US');
    const formatPercent = (val) => `${val.toFixed(2)}%`;
    const getVarianceColor = (variance) => variance > 0 ? 'text-green-600' : (variance < 0 ? 'text-red-600' : 'text-slate-500');

    let tableHTML = `
        <table class="w-full text-sm text-left text-slate-500">
            <thead class="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0 z-10">
                <tr>
                    <th rowspan="2" class="px-6 py-3 align-middle">Hotel Name</th>
                    <th colspan="4" class="px-6 py-3 text-center border-b border-l">Budget</th>
                    <th colspan="4" class="px-6 py-3 text-center border-b border-l">Actual</th>
                    <th colspan="4" class="px-6 py-3 text-center border-b border-l">Variance</th>
                </tr>
                <tr>
                    <th class="px-4 py-2 text-right border-l">Occ %</th><th class="px-4 py-2 text-right">ARR</th><th class="px-4 py-2 text-right">RevPAR</th><th class="px-4 py-2 text-right">Total Revenue</th>
                    <th class="px-4 py-2 text-right border-l">Occ %</th><th class="px-4 py-2 text-right">ARR</th><th class="px-4 py-2 text-right">RevPAR</th><th class="px-4 py-2 text-right">Total Revenue</th>
                    <th class="px-4 py-2 text-right border-l">Occ %</th><th class="px-4 py-2 text-right">ARR</th><th class="px-4 py-2 text-right">RevPAR</th><th class="px-4 py-2 text-right">Total Revenue</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(hotel => {
        const budget = hotel.budget || {};
        const actual = hotel.actual || {};

        const varOcc = (actual.occupancy || 0) - (budget.occupancy || 0);
        const varArr = (actual.arr || 0) - (budget.arr || 0);
        const varRevpar = (actual.revpar || 0) - (budget.revpar || 0);
        const varRevenue = (actual.total_revenue || 0) - (budget.total_revenue || 0);

        tableHTML += `
            <tr class="bg-white border-b hover:bg-slate-50">
                <td class="px-6 py-4 font-medium text-slate-900">${hotel.hotel_name}</td>
                <td class="px-4 py-4 text-right font-mono border-l">${formatPercent(budget.occupancy || 0)}</td>
                <td class="px-4 py-4 text-right font-mono">${formatCurrency(budget.arr || 0)}</td>
                <td class="px-4 py-4 text-right font-mono">${formatCurrency(budget.revpar || 0)}</td>
                <td class="px-4 py-4 text-right font-mono">${formatCurrency(budget.total_revenue || 0)}</td>
                <td class="px-4 py-4 text-right font-mono border-l">${formatPercent(actual.occupancy || 0)}</td>
                <td class="px-4 py-4 text-right font-mono">${formatCurrency(actual.arr || 0)}</td>
                <td class="px-4 py-4 text-right font-mono">${formatCurrency(actual.revpar || 0)}</td>
                <td class="px-4 py-4 text-right font-mono">${formatCurrency(actual.total_revenue || 0)}</td>
                <td class="px-4 py-4 text-right font-mono border-l ${getVarianceColor(varOcc)}">${formatPercent(varOcc)}</td>
                <td class="px-4 py-4 text-right font-mono ${getVarianceColor(varArr)}">${formatCurrency(varArr)}</td>
                <td class="px-4 py-4 text-right font-mono ${getVarianceColor(varRevpar)}">${formatCurrency(varRevpar)}</td>
                <td class="px-4 py-4 text-right font-mono ${getVarianceColor(varRevenue)}">${formatCurrency(varRevenue)}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    tableContainer.innerHTML = tableHTML;
}
