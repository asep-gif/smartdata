// --- DSR (DAILY SUMMARY REPORT) FUNCTIONS ---

/**
 * Inisialisasi halaman Input DSR (Budget atau Actual).
 * @param {string} type - 'budget' atau 'actual'.
 */
function initDsrPage(type) {
    const prefix = `${type}-dsr`;
    populateYearDropdown(`${prefix}-year-select`);
    populateMonthDropdown(`${prefix}-month-select`);
    populateHotelDropdown(`${prefix}-hotel-select`);

    const loadBtn = document.getElementById(`load-${prefix}-btn`);
    if (loadBtn) {
        loadBtn.addEventListener('click', () => handleLoadDsrData(type));
    }

    const saveBtn = document.getElementById(`save-${prefix}-btn`);
    if (saveBtn) {
        saveBtn.addEventListener('click', () => handleSaveDsrData(type));
    }

    const clearBtn = document.getElementById(`clear-${prefix}-btn`);
    if (clearBtn) {
        clearBtn.addEventListener('click', () => handleClearDsrData(type));
    }

    // BARU: Event listener untuk tombol Kunci dan Buka Kunci
    const lockBtn = document.getElementById(`lock-${prefix}-btn`);
    if (lockBtn) {
        lockBtn.addEventListener('click', () => handleLockDsrData(type));
    }
    const unlockBtn = document.getElementById(`unlock-${prefix}-btn`);
    if (unlockBtn) {
        unlockBtn.addEventListener('click', () => handleUnlockDsrData(type));
    }

    const tableBody = document.getElementById(`${prefix}-table-body`);
    if (tableBody) {
        tableBody.addEventListener('click', (event) => handleDsrCellClick(event, type));
    }

    const importBtn = document.getElementById(`import-${prefix}-btn`);
    const importInput = document.getElementById(`import-${prefix}-input`);
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            if (document.getElementById(`${prefix}-editor-container`).classList.contains('hidden')) {
                alert('Silakan muat data terlebih dahulu sebelum mengimpor file.');
            } else {
                importInput.click();
            }
        });
        importInput.addEventListener('change', (event) => handleDsrExcelUpload(event, type));
    }

    const exportBtn = document.getElementById(`export-${prefix}-template-btn`);
    if (exportBtn) {
        exportBtn.addEventListener('click', () => handleExportDsrTemplate(type));
    }
}

const getDecimalPlacesForHeader = (headerName) => {
    // PERUBAHAN: Semua kolom sekarang akan ditampilkan sebagai bilangan bulat (tanpa desimal)
    // untuk menyederhanakan tampilan dan menghilangkan angka .000 yang tidak perlu.
    // Pengecualian dapat ditambahkan di sini jika kolom tertentu memerlukan desimal.
    // Contoh: if (headerName === 'Nama Kolom') return 2;
    return 0; 
};

/**
 * BARU: Memberikan style warna merah pada sel jika nilainya negatif.
 * @param {HTMLElement} cell - Elemen sel (td) yang akan di-style.
 * @param {number} value - Nilai numerik dari sel.
 */
function styleDsrCell(cell, value) {
    if (value < 0) {
        cell.classList.add('text-red-500');
    } else {
        cell.classList.remove('text-red-500');
    }
}
/**
 * Menangani klik tombol "Muat Data" pada halaman DSR.
 * @param {string} type - 'budget' atau 'actual'.
 */
async function handleLoadDsrData(type) {
    const prefix = `${type}-dsr`;
    const hotelId = document.getElementById(`${prefix}-hotel-select`).value;
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;
    const loadBtn = document.getElementById(`load-${prefix}-btn`);
    const editorContainer = document.getElementById(`${prefix}-editor-container`);
    const tableBody = document.getElementById(`${prefix}-table-body`);

    if (!hotelId) {
        alert('Silakan pilih hotel terlebih dahulu.');
        return;
    }

    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memuat...';

    try {
        generateDsrTableRows(tableBody, year, month);

        // DIUBAH: Asumsikan API sekarang mengembalikan objek dengan data dan status kunci
        const response = await fetchAPI(`/api/financials/dsr/${type}?hotel_id=${hotelId}&year=${year}&month=${month}`);
        const { dsrData: recordsToPopulate, openingBalance, isLocked } = response;

        if (type === 'actual' && openingBalance !== undefined) {
            currentDsrOpeningBalance = openingBalance;
        }

        if (recordsToPopulate && recordsToPopulate.length > 0) {
            populateDsrTable(tableBody, recordsToPopulate);
        }

        recalculateFullDsrTable(type);
        updateDsrUiLockState(type, isLocked); // BARU: Panggil fungsi untuk mengatur UI berdasarkan status kunci

        // Ini akan menghitung semua kolom formula seperti %Occp, ARR, RevPAR, dll.
        recalculateFullDsrTable(type);

        editorContainer.classList.remove('hidden');

    } catch (error) {
        console.error(`Error loading ${type} DSR data:`, error);
        alert(`Gagal memuat data: ${error.message}`);
        editorContainer.classList.add('hidden');
    } finally {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="fa-solid fa-sync-alt mr-1"></i> Muat Data';
    }
}

/**
 * Membuat baris tabel DSR secara dinamis untuk setiap hari dalam sebulan.
 * @param {HTMLElement} tableBody - Elemen tbody dari tabel.
 * @param {number|string} year - Tahun yang dipilih.
 * @param {number|string} month - Bulan yang dipilih (1-12).
 */
function generateDsrTableRows(tableBody, year, month) {
    tableBody.innerHTML = ''; 
    const daysInMonth = new Date(year, month, 0).getDate();
    const columnCount = tableBody.previousElementSibling.rows[0].cells.length;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month -1, day)); // Use UTC date
        const dateString = date.toISOString().split('T')[0]; 

        // PERBAIKAN: Format tanggal secara manual menggunakan komponen UTC
        // untuk menghindari pergeseran tanggal akibat zona waktu lokal browser.
        // Ini akan memastikan tanggal yang ditampilkan di kolom pertama selalu benar.
        const dayFormatted = String(date.getUTCDate()).padStart(2, '0');
        const monthFormatted = String(date.getUTCMonth() + 1).padStart(2, '0');
        const yearFormatted = date.getUTCFullYear();
        const formattedDate = `${dayFormatted}-${monthFormatted}-${yearFormatted}`;

        const row = tableBody.insertRow();
        row.dataset.date = dateString;

        const dateCell = row.insertCell();
        dateCell.className = 'px-4 py-2 sticky left-0 bg-white z-20 font-medium whitespace-nowrap';
        dateCell.textContent = formattedDate;

        for (let i = 1; i < columnCount; i++) { // Loop up to the new columnCount
            const cell = row.insertCell();
            cell.className = 'px-4 py-2 text-right';
            cell.textContent = '0';
        }

    }
}

/**
 * Mengisi tabel DSR yang sudah digenerate dengan data dari API.
 * @param {HTMLElement} tableBody - Elemen tbody dari tabel.
 * @param {Array<Object>} data - Array data DSR dari API.
 */
function populateDsrTable(tableBody, data) {
    const headerCells = Array.from(tableBody.previousElementSibling.rows[0].cells);
    const headerKeys = headerCells.map(th => {
        return th.textContent.trim().toLowerCase()
            .replace(/&/g, '')
            .replace(/%/g, 'percent')
            .replace(/\./g, '')
            .replace(/\//g, '')
            .replace(/\s+/g, '_');
    });
    const originalHeaders = headerCells.map(th => th.textContent.trim());

    const editorContainer = tableBody.closest('[id$="-editor-container"]');
    const isTableLocked = editorContainer ? editorContainer.dataset.locked === 'true' : false;
    const type = editorContainer ? editorContainer.id.split('-')[0] : ''; // 'actual' or 'budget'

    data.forEach(record => {
        // PERBAIKAN: Atasi masalah pergeseran tanggal akibat zona waktu (timezone).
        // Tanggal dari API (misal: "2024-11-30T17:00:00.000Z") akan di-parse oleh browser
        // menjadi objek Date yang benar sesuai zona waktu lokal pengguna (menjadi 1 Desember).
        const dateObj = new Date(record.date);

        // Ambil komponen tanggal dari objek Date yang sudah benar tersebut.
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        
        // Buat string YYYY-MM-DD yang benar untuk dicocokkan dengan atribut `data-date` di tabel.
        const dateString = `${year}-${month}-${day}`;

        const row = tableBody.querySelector(`tr[data-date="${dateString}"]`);
        if (row && row.cells && row.cells.length > 0) {
            // Populate data cells
            for (let i = 1; i < row.cells.length; i++) {
                const headerKey = headerKeys[i];
                if (headerKey && record[headerKey] !== undefined) {
                    const cell = row.cells[i];
                    if (cell) {
                        const value = headerKey === 'balance' ? parseFloat(record[headerKey]) : (parseFloat(record[headerKey]) || 0);
                        const decimalPlaces = isTableLocked ? 0 : getDecimalPlacesForHeader(originalHeaders[i]);
                        cell.textContent = formatNumber(value, { decimalPlaces });
                        styleDsrCell(cell, value);
                    }
                }
            }
        }
    });
}

/**
 * Menangani klik pada sel tabel DSR untuk membuatnya dapat diedit.
 * @param {MouseEvent} event - Objek event klik.
 * @param {string} type - 'budget' atau 'actual'.
 */
function handleDsrCellClick(event, type) {
    const cell = event.target.closest('td');
    const editorContainer = cell.closest(`#${type}-dsr-editor-container`);

    // Jangan izinkan edit jika data terkunci
    if (editorContainer && editorContainer.dataset.locked === 'true') {
        showToast('Data terkunci dan tidak dapat diubah.', 'info');
        return;
    }

    if (!cell || cell.querySelector('input') || cell.cellIndex === 0) {
        return;
    }
    
    const headerCell = cell.closest('table').querySelector(`thead th:nth-child(${cell.cellIndex + 1})`);
    if (headerCell && headerCell.dataset.formula) {
        return;
    }

    const originalValue = cell.textContent.trim();
    const numericValue = parseInt(originalValue.replace(/,/g, ''), 10) || 0;

    cell.dataset.originalContent = cell.innerHTML;
    
    cell.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'w-full text-right bg-blue-50 border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400';
    input.value = numericValue;

    input.addEventListener('blur', () => saveDsrValue(cell, input, type));
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            saveDsrValue(cell, input, type);
        } else if (e.key === 'Escape') { 
            cancelEdit(cell);
        }
    });

    cell.appendChild(input);
    input.focus();
    input.select();
}

/**
 * Menyimpan nilai dari input kembali ke sel tabel DSR.
 * @param {HTMLTableCellElement} cell - Sel yang sedang diedit.
 * @param {HTMLInputElement} input - Elemen input di dalam sel.
 * @param {string} type - 'budget' atau 'actual'.
 */
function saveDsrValue(cell, input, type) {
    let newValue = parseFloat(input.value) || 0;
    if (!isFinite(newValue)) {
        newValue = 0;
    }
    const table = cell.closest('table');
    const headerText = table.querySelector(`thead th:nth-child(${cell.cellIndex + 1})`).textContent.trim();
    const editorContainer = table.closest('[id$="-editor-container"]');
    const decimalPlaces = editorContainer.dataset.locked === 'true' ? 0 : getDecimalPlacesForHeader(headerText);
    cell.textContent = formatNumber(newValue, { decimalPlaces: decimalPlaces }); 
    styleDsrCell(cell, newValue);
    updateDsrRowCalculations(cell.parentElement);
}

/**
 * Menghitung ulang nilai-nilai formula dalam satu baris tabel DSR.
 * @param {HTMLTableRowElement} row - Baris (tr) yang sedang diedit.
 */
function updateDsrRowCalculations(row) {
    if (!row || !row.cells) return;

    const editorContainer = row.closest('[id$="-editor-container"]');
    const isLocked = editorContainer ? editorContainer.dataset.locked === 'true' : false;

    const getCellValue = (headerName, targetRow = row) => {
        const table = targetRow.closest('table');
        if (!table) return 0;
        const theadRow = table.querySelector('thead tr');
        if (!theadRow) return 0;
        const headers = Array.from(theadRow.cells);
        const index = headers.findIndex(th => th.textContent.trim() === headerName);
        if (index === -1 || !targetRow.cells || index >= targetRow.cells.length) return 0;
        const cell = targetRow.cells[index];
        if (!cell) return 0;
        const cellText = cell.textContent.replace(/,/g, '').replace('%', '');
        return parseFloat(cellText) || 0;
    };

    const setCellValue = (headerName, value, format = 'number') => {
        const table = row.closest('table');
        if (!table) return;
        const theadRow = table.querySelector('thead tr');
        if (!theadRow) return;
        const headers = Array.from(theadRow.cells);
        const index = headers.findIndex(th => th.textContent.trim() === headerName);
        if (index === -1 || !row.cells || index >= row.cells.length) return;
        const cell = row.cells[index];
        if (!cell) return; 
        const decimalPlaces = isLocked ? 0 : getDecimalPlacesForHeader(headerName);
        if (format === 'percent') {
            cell.textContent = value.toFixed(decimalPlaces) + '%';
        } else {
            cell.textContent = formatNumber(value, { decimalPlaces: decimalPlaces });
        }
        styleDsrCell(cell, value);
    };

    const roomSold = getCellValue('Room Sold');
    const roomAvailable = getCellValue('Room Available');
    const lodgingRevenue = getCellValue('Lodging Revenue');
    const othersRoomRevenue = getCellValue('Others Room Revenue');
    const breakfastRevenue = getCellValue('Breakfast Revenue');
    const restaurantRevenue = getCellValue('Restaurant Revenue');
    const roomServiceRevenue = getCellValue('Room Service');
    const banquetRevenue = getCellValue('Banquet Revenue');
    const fnbOthersRevenue = getCellValue('F&B Others');
    const othersRevenue = getCellValue('Others Revenue');
    const service = getCellValue('Service');
    const tax = getCellValue('Tax');
    const depositReservation = getCellValue('Deposit Reservation');
    const cashFo = getCellValue('Cash FO');
    const cashOutlet = getCellValue('Cash Outlet');
    const bankTransfer = getCellValue('Bank Transfer');
    const qris = getCellValue('QRIS');
    const creditDebitCard = getCellValue('Credit Debit Card');
    const cityLedger = getCellValue('City Ledger');
    const sharedPayable = getCellValue('Shared Payable');

    const roomRevenue = lodgingRevenue + othersRoomRevenue;
    const fnbRevenue = breakfastRevenue + restaurantRevenue + roomServiceRevenue + banquetRevenue + fnbOthersRevenue;
    const totalRevenue = roomRevenue + fnbRevenue + othersRevenue;
    const grossRevenue = totalRevenue + service + tax;
    const totalSettlement = depositReservation + cashFo + cashOutlet + bankTransfer + qris + creditDebitCard + cityLedger;
    const gab = grossRevenue + sharedPayable - totalSettlement;

    const previousRow = row.previousElementSibling;
    const previousBalance = previousRow ? getCellValue('BALANCE', previousRow) : currentDsrOpeningBalance;
    const balance = previousBalance + gab;

    const occp = roomAvailable > 0 ? (roomSold / roomAvailable) * 100 : 0;
    const arr = roomSold > 0 ? roomRevenue / roomSold : 0;
    const revpar = roomAvailable > 0 ? roomRevenue / roomAvailable : 0;

    setCellValue('Room Revenue', roomRevenue, 'number');
    setCellValue('F&B Revenue', fnbRevenue, 'number');
    setCellValue('Total Revenue', totalRevenue, 'number');
    setCellValue('Gross Revenue', grossRevenue, 'number');
    setCellValue('Total Settlement', totalSettlement, 'number');
    setCellValue('GAB', gab, 'number');
    setCellValue('%Occp R.Sold', occp, 'percent');
    setCellValue('ARR', arr, 'number');
    setCellValue('RevPAR', revpar, 'number');
    setCellValue('BALANCE', balance, 'number');

    const nextRow = row.nextElementSibling;
    if (nextRow) {
        updateDsrRowCalculations(nextRow);
    } else {
        updateDsrMtdTotals(row.closest('table').id.startsWith('actual') ? 'actual' : 'budget');
    }
}

/**
 * Memulai kalkulasi ulang berantai untuk seluruh tabel DSR.
 * @param {string} type - 'budget' atau 'actual'.
 */
function recalculateFullDsrTable(type) {
    const tableBody = document.getElementById(`${type}-dsr-table-body`);
    if (!tableBody) return;

    const firstRow = tableBody.querySelector('tr');
    if (firstRow) {
        updateDsrRowCalculations(firstRow);
    }
}

/**
 * Menghitung dan memperbarui baris total MTD di footer tabel DSR.
 * @param {string} type - 'budget' atau 'actual'.
 */
function updateDsrMtdTotals(type) {
    const tableBody = document.getElementById(`${type}-dsr-table-body`);
    const tableFoot = document.getElementById(`${type}-dsr-table-foot`);
    const table = document.getElementById(`${type}-dsr-table`);
    const editorContainer = document.getElementById(`${type}-dsr-editor-container`);
    const isLocked = editorContainer ? editorContainer.dataset.locked === 'true' : false;

    if (!table || !tableBody || !tableFoot) return;
    const headers = Array.from(table.querySelectorAll('thead th'));

    if (headers.length === 0) return;

    const totals = new Array(headers.length).fill(0);
    const rows = tableBody.rows;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row.cells) continue;

        for (let j = 1; j < headers.length; j++) {
            if (!row.cells[j]) continue;
            const cellText = row.cells[j].textContent.replace(/,/g, '').replace('%', '');
            totals[j] += parseFloat(cellText) || 0;
        }
    }

    if (tableFoot.rows.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<th class="px-4 py-3 sticky left-0 bg-slate-100 z-10">MTD TOTAL</th>` +
                       `<td class="px-4 py-3 text-right" colspan="${headers.length - 1}"></td>`;
        tableFoot.appendChild(tr);
    }

    const footerRow = tableFoot.rows[0];
    if (!footerRow) return;
    while (footerRow.cells.length > 1) {
        footerRow.deleteCell(1);
    }

    for (let i = 1; i < headers.length; i++) {
        const td = footerRow.insertCell();
        td.className = 'px-4 py-3 text-right';
        
        const headerText = headers[i].textContent.trim();
        let value = totals[i];
        let format = 'number';

        const totalRoomSold = totals[headers.findIndex(h => h.textContent.trim() === 'Room Sold')];
        const totalRoomAvailable = totals[headers.findIndex(h => h.textContent.trim() === 'Room Available')];
        const totalRoomRevenue = totals[headers.findIndex(h => h.textContent.trim() === 'Room Revenue')];

        switch (headerText) {
            case '%Occp R.Sold':
                value = totalRoomAvailable > 0 ? (totalRoomSold / totalRoomAvailable) * 100 : 0;
                format = 'percent';
                break;
            case 'ARR':
                value = totalRoomSold > 0 ? totalRoomRevenue / totalRoomSold : 0;
                break;
            case 'RevPAR':
                value = totalRoomAvailable > 0 ? totalRoomRevenue / totalRoomAvailable : 0;
                break;
            case 'BALANCE':
                if (rows.length > 0) {
                    const lastRow = rows[rows.length - 1];
                    if (lastRow.cells[i]) {
                        const lastBalanceText = lastRow.cells[i].textContent.replace(/,/g, '');
                        value = parseFloat(lastBalanceText) || 0;
                    } else {
                        value = 0;
                    }
                } else {
                    value = 0;
                }
                break;
        }

        if (format === 'percent') {
            const decimalPlaces = isLocked ? 0 : getDecimalPlacesForHeader(headerText);
            td.textContent = value.toFixed(decimalPlaces) + '%';
        } else {
            const decimalPlaces = isLocked ? 0 : getDecimalPlacesForHeader(headerText);
            td.textContent = formatNumber(value, { decimalPlaces: decimalPlaces });
            styleDsrCell(td, value);
        }
    }
}

/**
 * Mengumpulkan dan menyimpan data DSR (Budget atau Actual) ke backend.
 * @param {string} type - 'budget' atau 'actual'.
 */
async function handleSaveDsrData(type) {
    const prefix = `${type}-dsr`;
    const hotelId = document.getElementById(`${prefix}-hotel-select`).value;
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;
    const saveBtn = document.getElementById(`save-${prefix}-btn`);

    if (!hotelId) {
        alert('Silakan pilih hotel terlebih dahulu.');
        return;
    }

    const tableBody = document.getElementById(`${prefix}-table-body`);
    const allRows = tableBody.querySelectorAll('tr[data-date]');

    if (allRows.length === 0) {
        alert('Tidak ada data untuk disimpan.');
        return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Menyimpan...';

    const headerToKeyMap = {
        'Date': 'date',
        'Room Sold': 'room_sold',
        'Room Available': 'room_available',
        'Room OOO': 'room_ooo',
        'Room Com & Hu': 'room_com_and_hu',
        'Number of Guest': 'number_of_guest',
        '%Occp R.Sold': 'occp_r_sold_percent',
        'ARR': 'arr',
        'RevPAR': 'revpar',
        'Lodging Revenue': 'lodging_revenue',
        'Others Room Revenue': 'others_room_revenue',
        'Room Revenue': 'room_revenue',
        'Breakfast Revenue': 'breakfast_revenue',
        'Restaurant Revenue': 'restaurant_revenue',
        'Room Service': 'room_service',
        'Banquet Revenue': 'banquet_revenue',
        'F&B Others': 'fnb_others_revenue',
        'F&B Revenue': 'fnb_revenue',
        'Others Revenue': 'others_revenue',
        'Total Revenue': 'total_revenue',
        'Service': 'service',
        'Tax': 'tax',
        'Gross Revenue': 'gross_revenue',
        'Shared Payable': 'shared_payable',
        'Deposit Reservation': 'deposit_reservation',
        'Cash FO': 'cash_fo',
        'Cash Outlet': 'cash_outlet',
        'Bank Transfer': 'bank_transfer',
        'QRIS': 'qris',
        'Credit Debit Card': 'credit_debit_card',
        'City Ledger': 'city_ledger',
        'Total Settlement': 'total_settlement',
        'GAB': 'gab',
        'BALANCE': 'balance'
    };

    const headers = Array.from(tableBody.closest('table').querySelectorAll('thead th')).map(th => th.textContent.trim());

    const dailyData = [];

    allRows.forEach(row => {
        const rowData = {
            date: row.dataset.date + 'T00:00:00.000Z',
            room_available: 0,
            room_ooo: 0,
            room_com_and_hu: 0,
            room_sold: 0,
            number_of_guest: 0,
            occp_r_sold_percent: 0,
            arr: 0,
            revpar: 0,
            lodging_revenue: 0,
            others_room_revenue: 0,
            room_revenue: 0,
            breakfast_revenue: 0,
            restaurant_revenue: 0,
            room_service: 0,
            banquet_revenue: 0,
            fnb_others_revenue: 0,
            fnb_revenue: 0,
            others_revenue: 0,
            total_revenue: 0,
            service: 0,
            tax: 0,
            gross_revenue: 0,
            shared_payable: 0,
            deposit_reservation: 0,
            cash_fo: 0,
            cash_outlet: 0,
            bank_transfer: 0,
            qris: 0,
            credit_debit_card: 0,
            city_ledger: 0,
            total_settlement: 0,
            gab: 0,
            balance: 0
        };

        headers.forEach((headerText, index) => {
            const key = headerToKeyMap[headerText];
            if (key && key !== 'date' && row.cells && index < row.cells.length && row.cells[index]) {
                const cellText = row.cells[index].textContent.replace(/,/g, '').replace('%', '');
                let value = parseFloat(cellText) || 0;
                if (!isFinite(value)) {
                    value = 0;
                }
                rowData[key] = value;
            }
        });

        // Only include rows with valid dates
        if (rowData.date && rowData.date !== 'Invalid Date') {
            dailyData.push(rowData);
        }
    });

    const payload = {
        hotel_id: parseInt(hotelId, 10),
        year: parseInt(year, 10),
        month: parseInt(month, 10),
        data: dailyData
    };

    try {
        const response = await fetchAPI(`/api/financials/dsr/${type}`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        alert(`Data ${type} DSR untuk bulan ini berhasil disimpan! Data akan dimuat ulang.`);
        await handleLoadDsrData(type);

    } catch (error) {
        console.error(`Error saving ${type} DSR:`, error);
        alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fa-solid fa-save mr-1"></i> Simpan ${type.charAt(0).toUpperCase() + type.slice(1)} DSR`;
    }
}

/**
 * Menangani upload file Excel DSR.
 * @param {Event} event - Objek event dari input file.
 * @param {string} type - 'budget' atau 'actual'.
 */
function handleDsrExcelUpload(event, type) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        const validTypes = [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel.sheet.macroEnabled.12'
        ];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|xlsm)$/i)) {
            alert('File yang dipilih bukan file Excel yang valid. Silakan pilih file dengan ekstensi .xlsx, .xls, atau .xlsm.');
            event.target.value = '';
            return;
        }
        processDsrExcelFile(file, type);
    }
    event.target.value = '';
}

/**
 * Memproses file Excel DSR dan mengisi data ke tabel.
 * @param {File} file - File Excel yang akan diproses.
 * @param {string} type - 'budget' atau 'actual'.
 */
function processDsrExcelFile(file, type) {
    const tableBody = document.getElementById(`${type}-dsr-table-body`);
    if (!tableBody) {
        alert('Tabel DSR tidak ditemukan. Pastikan halaman telah dimuat dengan benar.');
        return;
    }

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        alert('Library XLSX tidak ditemukan. Pastikan file xlsx.full.min.js telah dimuat.');
        return;
    }

    const reader = new FileReader();

    reader.onerror = function(event) {
        console.error("File could not be read! Error code: " + event.target.error.code);
        alert("Gagal membaca file. Pastikan file tidak rusak dan Anda memiliki izin untuk membacanya.");
    };

    reader.onload = function(e) {
        try {
            if (!e.target.result) {
                throw new Error("Gagal membaca file. File mungkin kosong atau rusak.");
            }

            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            if (!worksheet) {
                throw new Error("Gagal membaca sheet pertama dari file Excel. Pastikan file tidak rusak dan memiliki setidaknya satu sheet yang valid.");
            }

            const json = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });

            if (json.length === 0) {
                throw new Error("File Excel kosong atau formatnya tidak sesuai.");
            }

            // PERBAIKAN: Mengganti fungsi parsing tanggal dengan versi yang lebih robust
            // untuk menghindari masalah timezone.
            const parseAndFormatExcelDate = (dateInput) => {
                let y, m, d;

                if (dateInput instanceof Date) {
                    // Path 1: Date object dari cellDates:true. Gunakan bagian tanggal lokal untuk menghindari pergeseran zona waktu.
                    y = dateInput.getFullYear();
                    m = dateInput.getMonth() + 1;
                    d = dateInput.getDate();
                } else if (typeof dateInput === 'number') {
                    // Path 2: Nomor seri Excel. Konversi ke tanggal UTC dan ambil bagian-bagiannya.
                    const utc_days = Math.floor(dateInput - 25569);
                    const utc_value = utc_days * 86400;
                    const dateObj = new Date(utc_value * 1000);
                    
                    y = dateObj.getUTCFullYear();
                    m = dateObj.getUTCMonth() + 1;
                    d = dateObj.getUTCDate();
                } else if (typeof dateInput === 'string') {
                    // Path 3: String. Parsing manual untuk menghindari ambiguitas `new Date()`.
                    const parts = dateInput.split('T')[0].split(/\/|-/);
                    if (parts.length === 3) {
                        // Case 3a: DD/MM/YYYY (Format Indonesia)
                        if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
                            d = parseInt(parts[0], 10);
                            m = parseInt(parts[1], 10);
                            y = parseInt(parts[2], 10);
                        } 
                        // Case 3b: YYYY-MM-DD
                        else if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
                            y = parseInt(parts[0], 10);
                            m = parseInt(parts[1], 10);
                            d = parseInt(parts[2], 10);
                        }
                    }
                }

                // Jika tanggal berhasil di-parse, format ke YYYY-MM-DD.
                if (y && m && d && !isNaN(y) && !isNaN(m) && !isNaN(d)) {
                    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                }

                // Fallback untuk kasus yang tidak terduga.
                try {
                    const fallbackDate = new Date(dateInput);
                    if (isNaN(fallbackDate.getTime())) return null;
                    return `${fallbackDate.getFullYear()}-${String(fallbackDate.getMonth() + 1).padStart(2, '0')}-${String(fallbackDate.getDate()).padStart(2, '0')}`;
                } catch (err) {
                    return null; // Kembalikan null jika semua parsing gagal.
                }
            };

            const htmlHeaders = Array.from(tableBody.closest('table').querySelectorAll('thead th'));
            const headerMap = htmlHeaders.reduce((map, th, index) => {
                if (index > 0) { // Skip 'Date' column (index 0)
                    map[th.textContent.trim().toUpperCase()] = index;
                }
                return map;
            }, {});
            
            json.forEach(excelRow => {
                const dateKey = Object.keys(excelRow).find(k => k.toLowerCase() === 'date');
                if (!dateKey) {
                    console.warn('Baris diabaikan: Tidak ditemukan kolom tanggal (DATE).', excelRow);
                    return;
                }

                // PERBAIKAN: Gunakan fungsi parsing baru yang mengembalikan string YYYY-MM-DD
                const dateString = parseAndFormatExcelDate(excelRow[dateKey]);

                if (!dateString) {
                    console.warn('Baris diabaikan: Format tanggal tidak valid.', excelRow);
                    return;
                }

                const tableRow = tableBody.querySelector(`tr[data-date="${dateString}"]`);
                if (tableRow && tableRow.cells && tableRow.cells.length > 0) {
                    for (const excelHeader in excelRow) {
                        const columnIndex = headerMap[excelHeader.toUpperCase()];
                        if (columnIndex !== undefined && columnIndex < tableRow.cells.length) {
                            const cell = tableRow.cells[columnIndex];
                            if (cell) {
                                const rawValue = excelRow[excelHeader];
                                let value = 0;
                                if (typeof rawValue === 'string') {
                                    value = parseFloat(rawValue.replace(/,/g, '')) || 0;
                                } else if (typeof rawValue === 'number') {
                                    value = rawValue;
                                }

                                if (!isFinite(value)) {
                                    value = 0;
                                }
                                cell.textContent = formatNumber(value, { decimalPlaces: getDecimalPlacesForHeader(excelHeader) });
                            }
                        }
                    }
                }
            });

            recalculateFullDsrTable(type);
            alert('Data dari file Excel berhasil dimuat. Jangan lupa untuk menyimpan perubahan.');
        } catch (error) {
            console.error("Error processing DSR Excel file:", error);
            alert("Gagal memproses file Excel: " + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Menangani ekspor template DSR ke file Excel.
 * @param {string} type - 'budget' atau 'actual'.
 */
function handleExportDsrTemplate(type) {
    const prefix = `${type}-dsr`;
    const hotelSelect = document.getElementById(`${prefix}-hotel-select`);
    const yearSelect = document.getElementById(`${prefix}-year-select`);
    const monthSelect = document.getElementById(`${prefix}-month-select`);

    const hotelName = hotelSelect.options[hotelSelect.selectedIndex]?.text || 'Hotel';
    const year = yearSelect.value;
    const month = monthSelect.options[monthSelect.selectedIndex]?.text || 'Bulan';

    const table = document.getElementById(`${prefix}-table`);
    if (!table) {
        alert('Tabel tidak ditemukan!');
        return;
    }

    const headers = Array.from(table.querySelectorAll('thead th'));
    
    const data = [];
    
    const excelHeader = headers
        .filter(th => !th.dataset.formula)
        .map(th => th.textContent.trim());

    data.push(excelHeader);

    const exampleRow = new Array(excelHeader.length).fill(0);
    exampleRow[0] = `${year}-${String(monthSelect.value).padStart(2, '0')}-01`;
    data.push(exampleRow);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DSR Input');

    ws['!cols'] = excelHeader.map(header => ({ wch: header.length > 15 ? header.length : 15 }));

    const templateName = type.charAt(0).toUpperCase() + type.slice(1);
    
    const fileName = `DSR_${templateName}_Template_${hotelName.replace(/ /g, '_')}_${year}_${month}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

/**
 * Menangani penghapusan data DSR untuk bulan yang dipilih.
 * @param {string} type - 'budget' atau 'actual'.
 */
async function handleClearDsrData(type) {
    const prefix = `${type}-dsr`;
    const hotelId = document.getElementById(`${prefix}-hotel-select`).value;
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;
    const clearBtn = document.getElementById(`clear-${prefix}-btn`);

    if (!hotelId) {
        alert('Silakan pilih hotel terlebih dahulu.');
        return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus SEMUA data ${type.toUpperCase()} DSR untuk bulan ${month}/${year}? Tindakan ini tidak dapat dibatalkan.`)) {
        return;
    }

    clearBtn.disabled = true;
    clearBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Menghapus...';

    try {
        // Assuming a DELETE endpoint for DSR data by month
        await fetchAPI(`/api/financials/dsr/${type}?hotel_id=${hotelId}&year=${year}&month=${month}`, {
            method: 'DELETE'
        });

        alert(`Data ${type} DSR untuk bulan ${month}/${year} berhasil dihapus.`);
        // Reload data to show empty table or fresh data
        await handleLoadDsrData(type);

    } catch (error) {
        console.error(`Error clearing ${type} DSR data:`, error);
        alert(`Gagal menghapus data: ${error.message}`);
    } finally {
        clearBtn.disabled = false;
        clearBtn.innerHTML = `<i class="fa-solid fa-trash-alt mr-1"></i> Bersihkan Data Bulan Ini`;
    }
}

/**
 * BARU: Mengatur tampilan UI (tombol, edit) berdasarkan status data terkunci.
 * @param {string} type - 'budget' atau 'actual'.
 * @param {boolean} isLocked - Status apakah data terkunci.
 */
function updateDsrUiLockState(type, isLocked) {
    const prefix = `${type}-dsr`;
    const user = JSON.parse(localStorage.getItem('user'));
    const isAdmin = user && user.role === 'admin';

    const saveBtn = document.getElementById(`save-${prefix}-btn`);
    const clearBtn = document.getElementById(`clear-${prefix}-btn`);
    const importBtn = document.getElementById(`import-${prefix}-btn`);
    const lockBtn = document.getElementById(`lock-${prefix}-btn`);
    const unlockBtn = document.getElementById(`unlock-${prefix}-btn`);
    const editorContainer = document.getElementById(`${prefix}-editor-container`);

    if (editorContainer) {
        editorContainer.dataset.locked = isLocked ? 'true' : 'false';
    }

    const canEdit = !isLocked;
    const canUnlock = isLocked && isAdmin;

    if (saveBtn) saveBtn.classList.toggle('hidden', !canEdit);
    if (clearBtn) clearBtn.classList.toggle('hidden', !canEdit);
    if (importBtn) importBtn.classList.toggle('hidden', !canEdit);
    if (lockBtn) lockBtn.classList.toggle('hidden', !canEdit);
    if (unlockBtn) unlockBtn.classList.toggle('hidden', !canUnlock);
}

/**
 * BARU: Menangani permintaan untuk mengunci data DSR.
 * @param {string} type - 'budget' atau 'actual'.
 */
async function handleLockDsrData(type) {
    const prefix = `${type}-dsr`;
    const hotelId = document.getElementById(`${prefix}-hotel-select`).value;
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;

    const payload = { hotel_id: parseInt(hotelId), year: parseInt(year), month: parseInt(month), type, is_locked: true };
    const lockBtn = document.getElementById(`lock-${prefix}-btn`);
    lockBtn.disabled = true;
    lockBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Mengunci...';

    try {
        await fetchAPI('/api/financials/dsr/lock', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast('Data berhasil dikunci.', 'success');
        await handleLoadDsrData(type); // Muat ulang data untuk memperbarui status UI
    } catch (error) {
        showToast(`Gagal mengunci data: ${error.message}`, 'error');
    } finally {
        lockBtn.disabled = false;
        lockBtn.innerHTML = '<i class="fa-solid fa-lock mr-2"></i>Kunci Data';
    }
}

/**
 * BARU: Menangani permintaan untuk membuka kunci data DSR (hanya admin).
 * @param {string} type - 'budget' atau 'actual'.
 */
async function handleUnlockDsrData(type) {
    const prefix = `${type}-dsr`;
    const hotelId = document.getElementById(`${prefix}-hotel-select`).value;
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;

    if (!confirm(`Anda yakin ingin membuka kunci data DSR ${type} untuk periode ini?`)) {
        return;
    }

    const payload = { hotel_id: parseInt(hotelId), year: parseInt(year), month: parseInt(month), type, is_locked: false };
    const unlockBtn = document.getElementById(`unlock-${prefix}-btn`);
    unlockBtn.disabled = true;
    unlockBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Membuka...';

    try {
        // Menggunakan metode POST ke endpoint yang sama dengan is_locked: false
        await fetchAPI('/api/financials/dsr/lock', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast('Kunci data berhasil dibuka.', 'success');
        await handleLoadDsrData(type); // Muat ulang data untuk memperbarui status UI
    } catch (error) {
        showToast(`Gagal membuka kunci: ${error.message}`, 'error');
    } finally {
        unlockBtn.disabled = false;
        unlockBtn.innerHTML = '<i class="fa-solid fa-lock-open mr-2"></i>Buka Kunci';
    }
}