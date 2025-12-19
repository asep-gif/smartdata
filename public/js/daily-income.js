// --- DAILY INCOME DASHBOARD FUNCTIONS ---

/**
 * Inisialisasi halaman Daily Income Dashboard dengan mengisi filter dan memuat data awal.
 */
async function initDailyIncomeDashboard() {
    // Inisialisasi filter
    await Promise.all([
        populateYearDropdown('daily-income-year-filter'),
        populateMonthDropdown('daily-income-month-filter'),
        populateBrandFilterDropdown('daily-income-brand-filter'),
        populateHotelChecklist('daily-income-hotel-checklist-container', 'daily-income-hotel-filter-select-all', 'daily-income-hotel-filter-label')
    ]);

    initHotelFilterDropdown(
        'daily-income-hotel-filter-btn', 
        'daily-income-hotel-filter-dropdown', 
        'daily-income-hotel-filter-search', 
        'daily-income-hotel-filter-select-all', 
        'daily-income-hotel-checklist-container', 
        'daily-income-hotel-filter-apply', 
        'daily-income-hotel-filter-label'
    );

    // Tambahkan event listener ke semua filter
    document.getElementById('daily-income-year-filter')?.addEventListener('change', loadDailyIncomeDashboardData);
    document.getElementById('daily-income-month-filter')?.addEventListener('change', loadDailyIncomeDashboardData);
    document.getElementById('daily-income-start-date')?.addEventListener('change', loadDailyIncomeDashboardData);
    document.getElementById('daily-income-end-date')?.addEventListener('change', loadDailyIncomeDashboardData);
    document.getElementById('daily-income-period-filter')?.addEventListener('change', loadDailyIncomeDashboardData);

    const brandFilter = document.getElementById('daily-income-brand-filter');
    if (brandFilter) {
        brandFilter.addEventListener('change', () => {
            // Reset filter hotel jika brand diubah
            const hotelCheckboxes = document.querySelectorAll('#daily-income-hotel-checklist-container input[type="checkbox"]');
            hotelCheckboxes.forEach(cb => cb.checked = false);
            updateHotelFilterLabel('daily-income-hotel-filter-label', 'daily-income-hotel-checklist-container');
            loadDailyIncomeDashboardData();
        });
    }

    const applyHotelFilterBtn = document.getElementById('daily-income-hotel-filter-apply');
    if (applyHotelFilterBtn) {
        applyHotelFilterBtn.addEventListener('click', () => {
            // Reset filter brand jika hotel dipilih
            document.getElementById('daily-income-brand-filter').value = 'all';
            document.getElementById('daily-income-hotel-filter-dropdown').classList.add('hidden');
            loadDailyIncomeDashboardData();
        });
    }

    // Muat data awal
    await loadDailyIncomeDashboardData();
}

/**
 * Memuat semua data untuk Daily Income Dashboard berdasarkan filter yang dipilih.
 */
async function loadDailyIncomeDashboardData() {
    const year = document.getElementById('daily-income-year-filter').value;
    const month = document.getElementById('daily-income-month-filter').value;
    const period = document.getElementById('daily-income-period-filter').value;
    const startDate = document.getElementById('daily-income-start-date').value;
    const endDate = document.getElementById('daily-income-end-date').value;
    const brand = document.getElementById('daily-income-brand-filter').value;
    const selectedHotels = getSelectedHotels('daily-income');

    // Panggil fungsi untuk menyesuaikan UI filter
    handlePeriodFilterChange();

    const periodStyles = {
        mtd: { text: 'MTD', color: 'text-blue-600' },
        lastday: { text: 'Last Day', color: 'text-orange-600' },
        ytd: { text: 'YTD', color: 'text-green-600' },
        custom: { text: 'Custom', color: 'text-purple-600' }
    };
    const currentStyle = periodStyles[period] || { text: '', color: 'text-slate-600' };

    const periodLabelSpan = `<span class="${currentStyle.color} ml-1">(${currentStyle.text})</span>`;
    const periodLabelSpanTitle = `<span class="${currentStyle.color} ml-2">(${currentStyle.text})</span>`;

    const queryParams = { year, period };

    if (period === 'custom') {
        if (startDate && endDate) {
            queryParams.startDate = startDate;
            queryParams.endDate = endDate;
        } else {
            return;
        }
    } else if (period === 'mtd') {
        queryParams.month = month;
    }
    
    const params = new URLSearchParams(queryParams);

    if (selectedHotels.length > 0) {
        params.append('hotels', selectedHotels.join(','));
    } else if (brand && brand !== 'all') {
        params.append('brand', brand);
    }

    const arrEl = document.getElementById('daily-stats-arr');
    const revparEl = document.getElementById('daily-stats-revpar');
    const totalRevEl = document.getElementById('daily-stats-total-revenue');
    const loader = document.getElementById('daily-income-loader');
    const arrCardTitle = document.querySelector('#daily-stats-arr-card p');
    const revparCardTitle = document.querySelector('#daily-stats-revpar-card p');
    const totalRevCardTitle = document.querySelector('#daily-stats-total-revenue-card p');
    const occupancyCardTitle = document.querySelector('#daily-stats-occupancy-card p');
    const summaryTableTitle = document.querySelector('#daily-summary-table-card h4');
    const summaryTableBody = document.getElementById('daily-income-summary-table-body');

    if (!arrEl || !revparEl || !totalRevEl || !loader) return;

    loader.classList.remove('hidden');
    if (summaryTableBody) {
        summaryTableBody.innerHTML = `<tr><td colspan="13" class="p-8 text-center text-slate-500">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i><p class="mt-2">Memuat data ringkasan...</p>
        </td></tr>`;
    }

    try {
        const data = await fetchAPI(`/api/dashboard/daily-income-summary?${params.toString()}`);
        const formatCurrency = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

        if (arrCardTitle) arrCardTitle.innerHTML = `ARR ${periodLabelSpan}`;
        if (revparCardTitle) revparCardTitle.innerHTML = `RevPAR ${periodLabelSpan}`;
        if (totalRevCardTitle) totalRevCardTitle.innerHTML = `Total Revenue ${periodLabelSpan}`;
        if (occupancyCardTitle) occupancyCardTitle.innerHTML = `Avg. Occupancy ${periodLabelSpan}`;
        if (summaryTableTitle) summaryTableTitle.innerHTML = `Ringkasan Performa Hotel ${periodLabelSpanTitle}`;

        if (data.summary && data.summary.actual) {
            arrEl.textContent = formatCurrency(data.summary.actual.arr);
            revparEl.textContent = formatCurrency(data.summary.actual.revpar);
            totalRevEl.textContent = formatCurrency(data.summary.actual.total_revenue);
            
            initDailyOccupancyGaugeChart(
                data.summary.actual.average_occupancy,
                data.summary.actual.total_room_sold,
                data.summary.actual.total_room_available
            );
        } else {
            arrEl.textContent = 'N/A';
            revparEl.textContent = 'N/A';
            totalRevEl.textContent = 'N/A';
            initDailyOccupancyGaugeChart(0, 0, 0); 
        }

        const chartTitleEl = document.getElementById('daily-income-chart-title');
        if (chartTitleEl) {
            chartTitleEl.textContent = data.daily.isMonthly 
                ? 'Tren Pendapatan Bulanan (Actual vs Budget)' 
                : 'Tren Pendapatan Harian (Actual vs Budget)';
        }
        
        initDailyIncomeChart(data.daily.budget, data.daily.actual, data.daily.labels, data.daily.isMonthly || false);

        renderDailyIncomeSummaryTable(data.hotel_summaries);

    } catch (error) {
        console.error(error);
        arrEl.textContent = 'N/A';
        revparEl.textContent = 'N/A';
        totalRevEl.textContent = 'N/A';
        if (arrCardTitle) arrCardTitle.innerHTML = `ARR`;
        if (revparCardTitle) revparCardTitle.innerHTML = `RevPAR`;
        if (totalRevCardTitle) totalRevCardTitle.innerHTML = `Total Revenue`;
        if (occupancyCardTitle) occupancyCardTitle.innerHTML = `Avg. Occupancy`;
        if (summaryTableTitle) summaryTableTitle.innerHTML = `Ringkasan Performa Hotel`;
        if (summaryTableBody) summaryTableBody.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-red-500">Gagal memuat data ringkasan: ${error.message}</td></tr>`;
        
        initDailyIncomeChart();
        initDailyOccupancyGaugeChart();
    } finally {
        loader.classList.add('hidden');
    }
}

/**
 * Merender tabel ringkasan performa hotel di dasbor pendapatan harian.
 * @param {Array<Object>} hotelSummaries - Array data ringkasan per hotel.
 */
function renderDailyIncomeSummaryTable(hotelSummaries) {
    const table = document.getElementById('daily-income-summary-table');
    if (!table) return;

    let tableBody = table.querySelector('tbody');
    if (!tableBody) {
        tableBody = document.createElement('tbody');
        tableBody.id = 'daily-income-summary-table-body';
        table.appendChild(tableBody);
    }
    
    let tableFoot = table.querySelector('tfoot');
    if (!tableFoot) {
        tableFoot = document.createElement('tfoot');
        table.appendChild(tableFoot);
    }

    tableBody.innerHTML = '';
    tableFoot.innerHTML = '';

    if (!hotelSummaries || hotelSummaries.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="13" class="p-4 text-center text-slate-400">Tidak ada data ringkasan untuk ditampilkan.</td></tr>`;
        return;
    }

    const formatPercent = (val) => `${(val || 0).toFixed(0)}%`;
    const formatCurrency = (val) => Math.round(val || 0).toLocaleString('id-ID');
    const getVarianceColor = (variance) => variance > 0 ? 'text-green-600' : (variance < 0 ? 'text-red-600' : 'text-slate-500');

    const totals = {
        budget: { total_revenue: 0, room_sold: 0, room_available: 0, room_revenue: 0 },
        actual: { total_revenue: 0, room_sold: 0, room_available: 0, room_revenue: 0 }
    };

    hotelSummaries.forEach(hotel => {
        const budget = hotel.budget || {};
        const actual = hotel.actual || {};

        totals.budget.total_revenue += budget.total_revenue || 0;
        totals.budget.room_sold += budget.room_sold || 0;
        totals.budget.room_available += budget.room_available || 0;
        totals.budget.room_revenue += budget.room_revenue || 0;

        totals.actual.total_revenue += actual.total_revenue || 0;
        totals.actual.room_sold += actual.room_sold || 0;
        totals.actual.room_available += actual.room_available || 0;
        totals.actual.room_revenue += actual.room_revenue || 0;

        const varOcc = (actual.occupancy || 0) - (budget.occupancy || 0);
        const varArr = (actual.arr || 0) - (budget.arr || 0);
        const varRevpar = (actual.revpar || 0) - (budget.revpar || 0);
        const varRevenue = (actual.total_revenue || 0) - (budget.total_revenue || 0);

        const row = document.createElement('tr');
        row.className = 'bg-white border-b group hover:bg-slate-50';

        row.innerHTML = `
            <td class="px-4 py-3 font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-white group-hover:bg-slate-50">${hotel.hotel_name}</td>
            <td class="px-4 py-3 text-right font-mono">${formatPercent(budget.occupancy)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatCurrency(budget.arr)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatCurrency(budget.revpar)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatCurrency(budget.total_revenue)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatPercent(actual.occupancy)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatCurrency(actual.arr)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatCurrency(actual.revpar)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatCurrency(actual.total_revenue)}</td>
            <td class="px-4 py-3 text-right font-mono ${getVarianceColor(varOcc)}">${formatPercent(varOcc)}</td>
            <td class="px-4 py-3 text-right font-mono ${getVarianceColor(varArr)}">${formatCurrency(varArr)}</td>
            <td class="px-4 py-3 text-right font-mono ${getVarianceColor(varRevpar)}">${formatCurrency(varRevpar)}</td>
            <td class="px-4 py-3 text-right font-mono ${getVarianceColor(varRevenue)}">${formatCurrency(varRevenue)}</td>
        `;

        tableBody.appendChild(row);
    });

    const totalBudgetOcc = totals.budget.room_available > 0 ? (totals.budget.room_sold / totals.budget.room_available) * 100 : 0;
    const totalBudgetArr = totals.budget.room_sold > 0 ? totals.budget.room_revenue / totals.budget.room_sold : 0;
    const totalBudgetRevpar = totals.budget.room_available > 0 ? totals.budget.room_revenue / totals.budget.room_available : 0;

    const totalActualOcc = totals.actual.room_available > 0 ? (totals.actual.room_sold / totals.actual.room_available) * 100 : 0;
    const totalActualArr = totals.actual.room_sold > 0 ? totals.actual.room_revenue / totals.actual.room_sold : 0;
    const totalActualRevpar = totals.actual.room_available > 0 ? totals.actual.room_revenue / totals.actual.room_available : 0;

    const totalVarOcc = totalActualOcc - totalBudgetOcc;
    const totalVarArr = totalActualArr - totalBudgetArr;
    const totalVarRevpar = totalActualRevpar - totalBudgetRevpar;
    const totalVarRevenue = totals.actual.total_revenue - totals.budget.total_revenue;

    const totalRow = document.createElement('tr');
    totalRow.className = 'bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300';
    totalRow.innerHTML = `
        <td class="px-4 py-3 sticky left-0 bg-slate-100">TOTAL</td>
        <td class="px-4 py-3 text-right font-mono">${formatPercent(totalBudgetOcc)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatCurrency(totalBudgetArr)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatCurrency(totalBudgetRevpar)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatCurrency(totals.budget.total_revenue)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatPercent(totalActualOcc)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatCurrency(totalActualArr)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatCurrency(totalActualRevpar)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatCurrency(totals.actual.total_revenue)}</td>
        <td class="px-4 py-3 text-right font-mono ${getVarianceColor(totalVarOcc)}">${formatPercent(totalVarOcc)}</td>
        <td class="px-4 py-3 text-right font-mono ${getVarianceColor(totalVarArr)}">${formatCurrency(totalVarArr)}</td>
        <td class="px-4 py-3 text-right font-mono ${getVarianceColor(totalVarRevpar)}">${formatCurrency(totalVarRevpar)}</td>
        <td class="px-4 py-3 text-right font-mono ${getVarianceColor(totalVarRevenue)}">${formatCurrency(totalVarRevenue)}</td>
    `;
    tableFoot.appendChild(totalRow);
}


/**
 * Menangani perubahan pada filter periode, menyesuaikan visibilitas filter lain.
 */
function handlePeriodFilterChange() {
    const periodFilter = document.getElementById('daily-income-period-filter');
    const monthFilterContainer = document.getElementById('daily-income-month-filter').parentElement;
    const customDateRangeContainer = document.getElementById('daily-income-custom-date-range');
    if (!periodFilter || !monthFilterContainer || !customDateRangeContainer) return;

    const selectedPeriod = periodFilter.value;

    monthFilterContainer.classList.toggle('hidden', selectedPeriod !== 'mtd');
    customDateRangeContainer.classList.toggle('hidden', selectedPeriod !== 'custom');
}


// --- DAILY INCOME CHART FUNCTIONS ---

/**
 * Inisialisasi atau update chart "Pendapatan Harian" dengan data budget vs actual.
 * @param {number[]} budgetData - Array data budget revenue harian.
 * @param {number[]} actualData - Array data actual revenue harian.
 * @param {string[]} labels - Array label tanggal untuk sumbu-X.
 */
function initDailyIncomeChart(budgetData = [], actualData = [], labels = [], isMonthly = false) {
    const ctx = document.getElementById('dailyIncomeChart');
    if (!ctx) return;

    if (dailyIncomeChartInstance) {
        dailyIncomeChartInstance.destroy();
    }

    let formattedLabels = labels;
    let budgetLabel = 'Budget Harian';
    let actualLabel = 'Actual Harian';

    if (isMonthly) {
        formattedLabels = labels;
        budgetLabel = 'Budget Bulanan';
        actualLabel = 'Actual Bulanan';
    } else {
        formattedLabels = labels.map(label => {
            try {
                const date = new Date(label);
                const day = date.toLocaleDateString('id-ID', { weekday: 'short' });
                const dayOfMonth = String(date.getDate()).padStart(2, '0');
                return `${day}-${dayOfMonth}`;
            } catch (e) {
                return label; 
            }
        });
    }

    dailyIncomeChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: formattedLabels,
            datasets: [
                {
                    label: budgetLabel,
                    data: budgetData,
                    borderColor: '#a5b4fc', 
                    backgroundColor: 'rgba(165, 180, 252, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: actualLabel,
                    data: actualData,
                    borderColor: '#4f46e5', 
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, grid: { display: false } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

/**
 * Inisialisasi atau update chart speedometer untuk okupansi.
 * @param {number} occupancy - Nilai okupansi (0-100).
 * @param {number} roomSold - Jumlah kamar terjual.
 * @param {number} roomAvailable - Jumlah kamar tersedia.
 */
function initDailyOccupancyGaugeChart(occupancy = 0, roomSold = 0, roomAvailable = 0) {
    const ctx = document.getElementById('dailyOccupancyGaugeChart');
    if (!ctx) return;

    if (dailyOccupancyGaugeChartInstance) {
        dailyOccupancyGaugeChartInstance.destroy();
    }

    const safeOccupancy = Math.max(0, Math.min(100, occupancy));

    const data = {
        datasets: [{
            data: [safeOccupancy, 100 - safeOccupancy],
            backgroundColor: ['#4f46e5', '#e5e7eb'],
            borderColor: ['#4f46e5', '#e5e7eb'],
            borderWidth: 1,
            circumference: 180,
            rotation: -90,
        }]
    };

    const gaugeText = {
        id: 'gaugeText',
        beforeDatasetsDraw(chart) {
            const { ctx } = chart;
            const { width, height } = chart;
            const xCenter = width / 2;
            const yCenterPercent = height / 2 + 0;
            const yCenterDetail = yCenterPercent + 28;
            const yCenterLabel = yCenterDetail + 16;

            ctx.save();
            ctx.font = 'bold 2rem sans-serif';
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${safeOccupancy.toFixed(0)}%`, xCenter, yCenterPercent);

            ctx.font = '0.75rem sans-serif'; 
            ctx.fillStyle = '#64748b'; 
            const soldFormatted = roomSold.toLocaleString('id-ID');
            const availableFormatted = roomAvailable.toLocaleString('id-ID');
            ctx.fillText(`${soldFormatted} / ${availableFormatted}`, xCenter, yCenterDetail);

            ctx.font = '0.65rem sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Total Room Sold / Total Room Available', xCenter, yCenterLabel);

            ctx.restore();
        }
    };

    dailyOccupancyGaugeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        },
        plugins: [gaugeText]
    });
}
