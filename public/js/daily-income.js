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

    // Tambahkan event listener ke filter standar
    document.getElementById('daily-income-year-filter')?.addEventListener('change', loadDailyIncomeDashboardData);
    document.getElementById('daily-income-month-filter')?.addEventListener('change', loadDailyIncomeDashboardData);
    document.getElementById('daily-income-start-date')?.addEventListener('change', loadDailyIncomeDashboardData);
    document.getElementById('daily-income-end-date')?.addEventListener('change', loadDailyIncomeDashboardData);

    // Event listener khusus untuk filter periode
    const periodFilter = document.getElementById('daily-income-period-filter');
    if (periodFilter) {
        periodFilter.addEventListener('change', () => {
            handlePeriodFilterChange(); // Selalu panggil ini untuk menyesuaikan UI
            loadDailyIncomeDashboardData(); // Kemudian muat data
        });
    }

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

    // Panggil untuk mengatur visibilitas filter saat pertama kali dimuat
    handlePeriodFilterChange();

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
        const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

        if (arrCardTitle) arrCardTitle.innerHTML = `ARR ${periodLabelSpan}`;
        if (revparCardTitle) revparCardTitle.innerHTML = `RevPAR ${periodLabelSpan}`;
        if (totalRevCardTitle) totalRevCardTitle.innerHTML = `Total Revenue ${periodLabelSpan}`;
        if (occupancyCardTitle) occupancyCardTitle.innerHTML = `Avg. Occupancy ${periodLabelSpan}`;
        if (summaryTableTitle) summaryTableTitle.innerHTML = `Ringkasan Performa Hotel ${periodLabelSpanTitle}`;

        if (data.summary && data.summary.actual) {
            arrEl.textContent = formatCurrency(data.summary.actual.arr);
            revparEl.textContent = formatCurrency(data.summary.actual.revpar);
            totalRevEl.textContent = formatCurrency(data.summary.actual.total_revenue);

            const { actual, budget, actualLastYear } = data.summary;

            const renderVariance = (actualValue, budgetValue, lastYearValue, cardPrefix) => {
                const budgetVarEl = document.getElementById(`${cardPrefix}-vs-budget`);
                const lastYearVarEl = document.getElementById(`${cardPrefix}-vs-ly`);

                if (budgetVarEl) {
                    if (budgetValue > 0) {
                        const variance = ((actualValue - budgetValue) / budgetValue) * 100;
                        budgetVarEl.innerHTML = `
                            <span class="${variance >= 0 ? 'text-green-500' : 'text-red-500'}">${variance >= 0 ? '▲' : '▼'} ${Math.abs(variance).toFixed(1)}%</span>
                            <span class="text-slate-500 text-xs ml-1">vs Budget</span>
                        `;
                    } else {
                        budgetVarEl.innerHTML = '';
                    }
                }

                if (lastYearVarEl) {
                    if (lastYearValue > 0) {
                        const variance = ((actualValue - lastYearValue) / lastYearValue) * 100;
                        lastYearVarEl.innerHTML = `
                            <span class="${variance >= 0 ? 'text-green-500' : 'text-red-500'}">${variance >= 0 ? '▲' : '▼'} ${Math.abs(variance).toFixed(1)}%</span>
                            <span class="text-slate-500 text-xs ml-1">vs LY</span>
                        `;
                    } else {
                        lastYearVarEl.innerHTML = '';
                    }
                }
            };

            renderVariance(actual.arr, budget.arr, actualLastYear?.arr, 'daily-stats-arr');
            renderVariance(actual.revpar, budget.revpar, actualLastYear?.revpar, 'daily-stats-revpar');
            renderVariance(actual.total_revenue, budget.total_revenue, actualLastYear?.total_revenue, 'daily-stats-total-revenue');
            
            initDailyOccupancyGaugeChart(
                actual.average_occupancy,
                budget.average_occupancy
            );
        } else {
            arrEl.textContent = 'N/A';
            revparEl.textContent = 'N/A';
            totalRevEl.textContent = 'N/A';
            initDailyOccupancyGaugeChart(0, 0); 

            const prefixes = ['daily-stats-arr', 'daily-stats-revpar', 'daily-stats-total-revenue'];
            prefixes.forEach(prefix => {
                const budgetEl = document.getElementById(`${prefix}-vs-budget`);
                const lyEl = document.getElementById(`${prefix}-vs-ly`);
                if (budgetEl) budgetEl.innerHTML = '';
                if (lyEl) lyEl.innerHTML = '';
            });
        }

        const chartTitleEl = document.getElementById('daily-income-chart-title');
        if (chartTitleEl) {
            chartTitleEl.textContent = data.daily.isMonthly 
                ? 'Tren Pendapatan Bulanan (Actual vs Budget)' 
                : 'Tren Pendapatan Harian (Actual vs Budget)';
        }
        
        initDailyIncomeChart(data.daily.budget, data.daily.actual, data.daily.actualLastYear, data.daily.labels, data.daily.isMonthly || false);

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
    const formatCurrency = (val) => formatNumber(val || 0, { decimalPlaces: 0 });
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
 * @param {number[]} actualLastYearData - Array data actual revenue harian tahun lalu.
 * @param {string[]} labels - Array label tanggal untuk sumbu-X.
 */
function initDailyIncomeChart(budgetData = [], actualData = [], actualLastYearData = [], labels = [], isMonthly = false) {
    const ctx = document.getElementById('dailyIncomeChart');
    if (!ctx) return;

    if (dailyIncomeChartInstance) {
        dailyIncomeChartInstance.destroy();
    }

    let formattedLabels = labels;
    let budgetLabel = 'Budget Harian';
    let actualLabel = 'Actual Harian';
    let actualLastYearLabel = 'Actual Tahun Lalu';

    if (isMonthly) {
        budgetLabel = 'Budget Bulanan';
        actualLabel = 'Actual Bulanan';
        actualLastYearLabel = 'Actual Tahun Lalu';
    } else {
         formattedLabels = labels;
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
                },
                {
                    label: actualLastYearLabel,
                    data: actualLastYearData,
                    borderColor: '#9ca3af', // Gray color
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    fill: true,
                    tension: 0.3,
                    borderDash: [5, 5], // Dashed line
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
 * Inisialisasi atau update chart speedometer untuk okupansi dengan penanda budget.
 * @param {number} actualOccupancy - Nilai okupansi aktual (0-100).
 * @param {number} budgetOccupancy - Nilai okupansi budget (0-100).
 */
function initDailyOccupancyGaugeChart(actualOccupancy = 0, budgetOccupancy = 0) {
    const ctx = document.getElementById('dailyOccupancyGaugeChart');
    if (!ctx) return;

    if (dailyOccupancyGaugeChartInstance) {
        dailyOccupancyGaugeChartInstance.destroy();
    }
    
    const card = ctx.closest('.flex-col');
    if (card) {
        let titleEl = card.querySelector('.font-bold');
        if (titleEl) {
            titleEl.textContent = 'Avg. Occupancy (Actual vs Budget)';
        }
    }

    const safeActual = Math.max(0, Math.min(100, actualOccupancy));
    const safeBudget = Math.max(0, Math.min(100, budgetOccupancy));

    const gaugeData = {
        datasets: [{
            data: [safeActual, 100 - safeActual],
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
            const yCenter = height / 2 + 30; 
    
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
    
            ctx.font = 'bold 2rem sans-serif';
            ctx.fillStyle = '#1e293b';
            ctx.fillText(`${safeActual.toFixed(2)}%`, xCenter, yCenter - 15);
            ctx.font = '0.75rem sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.fillText('Actual', xCenter, yCenter + 10);
            
            ctx.font = '0.85rem sans-serif';
            ctx.fillStyle = '#4b5563';
            ctx.fillText(`Budget: ${safeBudget.toFixed(2)}%`, xCenter, yCenter + 35);
            
            ctx.restore();
        }
    };
    
    const gaugeBudgetLine = {
        id: 'gaugeBudgetLine',
        afterDatasetsDraw(chart) {
            const { ctx, chartArea } = chart;
            const { bottom } = chartArea;
            const radius = chart.getDatasetMeta(0).data[0].outerRadius;
            const xCenter = chart.chartArea.width / 2;
            const yCenter = bottom; 
    
            const angle = Math.PI + (safeBudget / 100) * Math.PI;
    
            const x = xCenter + Math.cos(angle) * (radius + 5);
            const y = yCenter + Math.sin(angle) * (radius + 5);
            const xOuter = xCenter + Math.cos(angle) * (radius - 5);
            const yOuter = yCenter + Math.sin(angle) * (radius - 5);
    
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.moveTo(x, y);
            ctx.lineTo(xOuter, yOuter);
            ctx.stroke();
            ctx.restore();
        }
    };

    dailyOccupancyGaugeChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: gaugeData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                legend: { display: false },
                tooltip: { 
                    enabled: true,
                    callbacks: {
                        label: function() {
                            return `Actual: ${safeActual.toFixed(2)}%`;
                        },
                        afterLabel: function() {
                            return `Budget: ${safeBudget.toFixed(2)}%`;
                        }
                    }
                }
            }
        },
        plugins: [gaugeText, gaugeBudgetLine]
    });
}
