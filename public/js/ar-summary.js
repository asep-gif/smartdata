// --- AR SUMMARY FUNCTIONS ---

/**
 * Inisialisasi halaman Ringkasan AR dengan mengisi dropdown dan menambahkan event listener.
 */
function initArSummaryPage() {
    const prefix = 'ar-summary';
    populateYearDropdown(`${prefix}-year-select`);
    populateMonthDropdown(`${prefix}-month-select`);

    // Tambahkan event listener untuk tombol "Muat Ringkasan"
    const loadBtn = document.getElementById(`load-${prefix}-btn`);
    if (loadBtn) {
        loadBtn.addEventListener('click', handleLoadArSummaryData);
    }
}

/**
 * Menangani klik tombol "Muat Ringkasan" pada halaman AR Summary.
 */
async function handleLoadArSummaryData() {
    const prefix = 'ar-summary';
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;
    const loadBtn = document.getElementById(`load-${prefix}-btn`);
    const tableBody = document.getElementById(`${prefix}-table-body`);
    const tableFoot = document.getElementById(`${prefix}-table-foot`);

    if (!year || !month) {
        alert('Silakan pilih tahun dan bulan terlebih dahulu.');
        return;
    }

    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memuat...';
    tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center">Memuat data ringkasan...</td></tr>`;
    tableFoot.innerHTML = '';

    try {
        const summaryData = await fetchAPI(`/api/financials/ar-aging/summary?year=${year}&month=${month}`);

        renderArSummaryTable(summaryData);

    } catch (error) {
        console.error('Error loading AR Summary data:', error);
        tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-red-500">${error.message}</td></tr>`;
    } finally {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="fa-solid fa-sync-alt mr-1"></i> Muat Ringkasan';
    }
}

/**
 * Merender tabel ringkasan AR dan footernya.
 * @param {Array<Object>} summaryData - Data ringkasan dari API.
 */
function renderArSummaryTable(summaryData) {
    const tableBody = document.getElementById('ar-summary-table-body');
    const tableFoot = document.getElementById('ar-summary-table-foot');
    
    tableBody.innerHTML = '';
    tableFoot.innerHTML = '';

    if (!summaryData || summaryData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-500">Tidak ada data untuk periode yang dipilih.</td></tr>`;
        return;
    }

    const grandTotals = {
        current: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_over_90: 0,
        total_ar: 0,
    };

    summaryData.forEach(item => {
        const row = tableBody.insertRow();
        row.className = 'bg-white border-b';

        const total_ar = (item.current || 0) + (item.days_1_30 || 0) + (item.days_31_60 || 0) + (item.days_61_90 || 0) + (item.days_over_90 || 0);

        row.innerHTML = `
            <td class="px-4 py-3 font-medium text-slate-900 whitespace-nowrap sticky left-0 bg-white">${item.hotel_name}</td>
            <td class="px-4 py-3 text-right font-mono">${formatNumber(item.current)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatNumber(item.days_1_30)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatNumber(item.days_31_60)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatNumber(item.days_61_90)}</td>
            <td class="px-4 py-3 text-right font-mono">${formatNumber(item.days_over_90)}</td>
            <td class="px-4 py-3 text-right font-mono font-bold">${formatNumber(total_ar)}</td>
        `;

        // Akumulasi grand total
        grandTotals.current += item.current || 0;
        grandTotals.days_1_30 += item.days_1_30 || 0;
        grandTotals.days_31_60 += item.days_31_60 || 0;
        grandTotals.days_61_90 += item.days_61_90 || 0;
        grandTotals.days_over_90 += item.days_over_90 || 0;
        grandTotals.total_ar += total_ar;
    });

    // Render Grand Total di tfoot
    const footerRow = tableFoot.insertRow();
    footerRow.className = 'bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300';
    footerRow.innerHTML = `
        <td class="px-4 py-3 sticky left-0 bg-slate-100">GRAND TOTAL</td>
        <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.current)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.days_1_30)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.days_31_60)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.days_61_90)}</td>
        <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.days_over_90)}</td>
        <td class="px-4 py-3 text-right font-mono font-bold">${formatNumber(grandTotals.total_ar)}</td>
    `;
}

// Panggil init function jika elemen yang relevan ada di DOM
if (document.getElementById('page-ar-summary')) {
    // Fungsi ini akan dipanggil oleh router di script.js saat hash berubah ke #ar-summary
}
