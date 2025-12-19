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

        const dsrData = await fetchAPI(`/api/dsr/${type}?hotel_id=${hotelId}&year=${year}&month=${month}`);

        let recordsToPopulate = [];
        let openingBalance = 0;

        if (type === 'actual') {
            recordsToPopulate = dsrData.dsrData || [];
            openingBalance = dsrData.openingBalance || 0;
            currentDsrOpeningBalance = openingBalance;
        } else {
            recordsToPopulate = dsrData || [];
        }

        if (recordsToPopulate.length > 0) {
            populateDsrTable(tableBody, recordsToPopulate);
        }

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
        const date = new Date(year, month - 1, day);
        const dateString = date.toISOString().split('T')[0]; 
        const formattedDate = `${String(day).padStart(2, '0')}-${date.toLocaleString('id-ID', { month: 'short' })}-${year}`;

        const row = tableBody.insertRow();
        row.dataset.date = dateString;

        const dateCell = row.insertCell();
        dateCell.className = 'px-4 py-2 sticky left-0 bg-white z-10 font-medium';
        dateCell.textContent = formattedDate;

        for (let i = 1; i < columnCount; i++) {
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
    const headers = Array.from(tableBody.previousElementSibling.rows[0].cells).map(th => {
        return th.textContent.trim().toLowerCase()
            .replace(/&/g, '')
            .replace(/%/g, 'percent')
            .replace(/\./g, '')
            .replace(/\//g, '')
            .replace(/\s+/g, '_');
    });

    data.forEach(record => {
        const date = record.date.split('T')[0]; 
        const row = tableBody.querySelector(`tr[data-date="${date}"]`);
        if (row) {
            headers.forEach((headerKey, index) => {
                if (index > 0 && record[headerKey] !== undefined) { 
                    const cell = row.cells[index];
                    const value = headerKey === 'balance' ? parseFloat(record[headerKey]) : (parseFloat(record[headerKey]) || 0);
                    cell.textContent = value.toLocaleString('en-US');
                }
            });

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
    const newValue = parseFloat(input.value) || 0;
    cell.textContent = newValue.toLocaleString('en-US'); 
    updateDsrRowCalculations(cell.parentElement);
}

/**
 * Menghitung ulang nilai-nilai formula dalam satu baris tabel DSR.
 * @param {HTMLTableRowElement} row - Baris (tr) yang sedang diedit.
 */
function updateDsrRowCalculations(row) {
    if (!row) return;

    const getCellValue = (headerName, targetRow = row) => {
        const headers = Array.from(targetRow.closest('table').querySelector('thead tr').cells);
        const index = headers.findIndex(th => th.textContent.trim() === headerName);
        if (index === -1) return 0;
        const cellText = targetRow.cells[index].textContent.replace(/,/g, '').replace('%', '');
        return parseFloat(cellText) || 0;
    };

    const setCellValue = (headerName, value, format = 'number') => {
        const headers = Array.from(row.closest('table').querySelector('thead tr').cells);
        const index = headers.findIndex(th => th.textContent.trim() === headerName);
        if (index === -1) return;
        const cell = row.cells[index];
        if (format === 'percent') {
            cell.textContent = value.toFixed(0) + '%';
        } else {
            cell.textContent = Math.round(value).toLocaleString('en-US');
        }
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
    const headers = Array.from(document.querySelectorAll(`#${type}-dsr-table thead th`));

    if (!tableBody || !tableFoot || headers.length === 0) return;

    const totals = new Array(headers.length).fill(0);
    const rows = tableBody.rows;

    for (const row of rows) {
        for (let i = 1; i < headers.length; i++) {
            const cellText = row.cells[i].textContent.replace(/,/g, '').replace('%', '');
            totals[i] += parseFloat(cellText) || 0;
        }
    }

    if (tableFoot.innerHTML === '') {
        const tr = document.createElement('tr');
        tr.innerHTML = `<th class="px-4 py-3 sticky left-0 bg-slate-100 z-10">MTD TOTAL</th>` + 
                       `<td class="px-4 py-3 text-right" colspan="${headers.length - 1}"></td>`;
        tableFoot.appendChild(tr);
    }

    const footerRow = tableFoot.rows[0];
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
                    const lastBalanceText = lastRow.cells[i].textContent.replace(/,/g, '');
                    value = parseFloat(lastBalanceText) || 0;
                } else {
                    value = 0;
                }
                break;
        }

        if (format === 'percent') {
            td.textContent = value.toFixed(0) + '%';
        } else {
            const shouldRound = ['ARR', 'RevPAR'].includes(headerText);
            td.textContent = (shouldRound ? Math.round(value) : value).toLocaleString('en-US');
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

    const headers = Array.from(tableBody.closest('table').querySelectorAll('thead th')).map(th => {
        return th.textContent.trim().toLowerCase()
            .replace(/\s*&\s*/g, '_and_')
            .replace(/%/g, 'percent')
            .replace(/\./g, '')
            .replace(/\//g, '_')
            .replace(/\s+/g, '_');
    });

    const dailyData = [];

    allRows.forEach(row => {
        const rowData = {};
        const cells = row.cells;

        headers.forEach((headerKey, index) => {
            if (headerKey === 'date') {
                rowData[headerKey] = row.dataset.date;
            } else {
                const cellText = cells[index].textContent.replace(/,/g, '').replace('%', '');
                rowData[headerKey] = parseFloat(cellText) || 0;
            }
        });
        dailyData.push(rowData);
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
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);

            if (json.length === 0) {
                throw new Error("File Excel kosong atau formatnya tidak sesuai.");
            }

            const parseExcelDate = (dateInput) => {
                if (dateInput instanceof Date) return dateInput;
                if (typeof dateInput === 'number') {
                    const excelEpoch = new Date(1899, 11, 30);
                    const millisecondsPerDay = 24 * 60 * 60 * 1000;
                    return new Date(excelEpoch.getTime() + dateInput * millisecondsPerDay);
                }
                if (typeof dateInput === 'string') {
                    const parsedDate = new Date(dateInput);
                    if (!isNaN(parsedDate)) return parsedDate;
                }
                return null;
            };

            const htmlHeaders = Array.from(tableBody.closest('table').querySelectorAll('thead th'));
            const headerMap = htmlHeaders.reduce((map, th, index) => {
                map[th.textContent.trim()] = index;
                return map;
            }, {});
            
            json.forEach(excelRow => {
                const excelDate = parseExcelDate(excelRow.DATE);
                if (!excelDate) return;

                const year = excelDate.getUTCFullYear();
                const month = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
                const day = String(excelDate.getUTCDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;

                const tableRow = tableBody.querySelector(`tr[data-date="${dateString}"]`);
                if (tableRow) {
                    for (const excelHeader in excelRow) {
                        const columnIndex = headerMap[excelHeader];
                        if (columnIndex !== undefined && columnIndex > 0) {
                            const cell = tableRow.cells[columnIndex];
                            const value = parseFloat(excelRow[excelHeader]) || 0;
                            cell.textContent = value.toLocaleString('en-US');
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
