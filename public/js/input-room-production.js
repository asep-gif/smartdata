// --- ROOM PRODUCTION (RP) FUNCTIONS ---

/**
 * Inisialisasi halaman Input Room Production.
 */
function initRoomProductionPage() {
    const prefix = 'rp';
    populateYearDropdown(`${prefix}-year-select`);
    populateMonthDropdown(`${prefix}-month-select`);
    populateHotelDropdown(`${prefix}-hotel-select`);

    // Tambahkan event listener untuk tombol baru
    const exportBtn = document.getElementById(`export-${prefix}-template-btn`);
    if (exportBtn) {
        exportBtn.addEventListener('click', () => handleExportRpTemplate());
    }

    document.getElementById(`load-${prefix}-btn`).addEventListener('click', () => handleLoadRpData());
    document.getElementById(`save-room-production-btn`).addEventListener('click', () => handleSaveRpData());
    document.getElementById(`room-production-table-body`).addEventListener('click', handleRpCellClick);
    document.getElementById(`add-room-production-row-btn`).addEventListener('click', () => addRpTableRow());

    // Event listener untuk tombol import Excel
    const importBtn = document.getElementById(`import-${prefix}-excel-btn`);
    const importInput = document.getElementById(`import-${prefix}-excel-input`);
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            if (document.getElementById('room-production-editor-container').classList.contains('hidden')) {
                alert('Silakan muat data terlebih dahulu sebelum mengimpor file.');
            } else {
                importInput.click();
            }
        });
        importInput.addEventListener('change', (event) => handleRpExcelUpload(event));
    }
}

function handleRpNumberInput(input) {
    const unformattedValue = parseFormattedNumber(input.value);
    input.value = formatNumber(unformattedValue);
    calculateRpArr(input.closest('tr'));
}
/**
 * Menangani ekspor template Room Production ke file Excel.
 */
function handleExportRpTemplate() {
    const prefix = 'rp';
    const hotelSelect = document.getElementById(`${prefix}-hotel-select`);
    const yearSelect = document.getElementById(`${prefix}-year-select`);
    const monthSelect = document.getElementById(`${prefix}-month-select`);

    const hotelName = hotelSelect.options[hotelSelect.selectedIndex]?.text || 'Hotel';
    const year = yearSelect.value;
    const monthName = monthSelect.options[monthSelect.selectedIndex]?.text || 'Bulan';

    // Header untuk template. 'arr' dihilangkan karena dihitung otomatis.
    const header = ['date', 'segment', 'company', 'room', 'guest', 'lodging_revenue', 'pic_name'];
    const data = [header];

    // Tambahkan satu baris contoh data kosong
    const exampleRow = [`${year}-${String(monthSelect.value).padStart(2, '0')}-01`, '', '', 0, 0, 0, ''];
    data.push(exampleRow);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Room Production Input');

    // Atur lebar kolom agar lebih mudah dibaca
    ws['!cols'] = header.map(h => ({ wch: h.length > 15 ? h.length + 2 : 15 }));

    const fileName = `Room_Production_Template_${hotelName.replace(/ /g, '_')}_${year}_${monthName}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

/**
 * Menangani event saat file Excel Room Production dipilih untuk di-upload.
 * @param {Event} event - Objek event dari input file.
 */
function handleRpExcelUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processRpExcelFile(file);
    }
    // Reset input file agar bisa upload file yang sama lagi
    event.target.value = '';
}

/**
 * Membaca dan memproses file Excel Room Production, lalu mengisi data ke tabel.
 * @param {File} file - File Excel yang akan diproses.
 */
function processRpExcelFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { dateNF: 'yyyy-mm-dd' });

            if (json.length === 0) {
                throw new Error("File Excel kosong atau formatnya tidak sesuai.");
            }

            const tableBody = document.getElementById('rp-table-body');
            tableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi data baru

            // Helper function to parse various date formats from Excel
            const parseAndFormatExcelDate = (dateInput) => {
                let y, m, d;

                if (dateInput instanceof Date) {
                    // Path 1: Date object from cellDates:true. Use local date parts.
                    y = dateInput.getFullYear();
                    m = dateInput.getMonth() + 1;
                    d = dateInput.getDate();
                } else if (typeof dateInput === 'number') {
                    // Path 2: Excel serial number. Convert to UTC date and get parts.
                    const utc_days = Math.floor(dateInput - 25569);
                    const utc_value = utc_days * 86400;
                    const dateObj = new Date(utc_value * 1000);
                    
                    y = dateObj.getUTCFullYear();
                    m = dateObj.getUTCMonth() + 1;
                    d = dateObj.getUTCDate();
                } else if (typeof dateInput === 'string') {
                    // Path 3: A string. Manually parse to avoid `new Date()` ambiguity.
                    const parts = dateInput.split('T')[0].split(/\/|-/);
                    if (parts.length === 3) {
                        // Case 3a: MM/DD/YYYY
                        if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
                            m = parseInt(parts[0], 10);
                            d = parseInt(parts[1], 10);
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

                // If we successfully parsed the date, format it.
                if (y && m && d && !isNaN(y) && !isNaN(m) && !isNaN(d)) {
                    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                }

                // Ultimate fallback for any unhandled cases.
                try {
                    const fallbackDate = new Date(dateInput);
                    if (isNaN(fallbackDate.getTime())) return '';
                    return `${fallbackDate.getFullYear()}-${String(fallbackDate.getMonth() + 1).padStart(2, '0')}-${String(fallbackDate.getDate()).padStart(2, '0')}`;
                } catch (err) {
                    return ''; // Return empty string if all parsing fails.
                }
            };

            json.forEach(row => {
                const formattedDate = parseAndFormatExcelDate(row.date);

                const rowData = { date: formattedDate, segment: row.segment || '', company: row.company || '', room: row.room || 0, guest: row.guest || 0, lodging_revenue: row.lodging_revenue || 0, pic_name: row.pic_name || '' };
                addRpTableRow(rowData);
            });

            document.querySelectorAll('#rp-table-body tr').forEach(row => calculateRpArr(row));
            alert('Data dari file Excel berhasil dimuat. Jangan lupa untuk menyimpan perubahan.');
        } catch (error) {
            console.error("Error processing Room Production Excel file:", error);
            alert("Gagal memproses file Excel: " + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Menangani klik pada sel tabel RP (tidak melakukan apa-apa karena sudah ada input).
 */
function handleRpCellClick(event) {
    const target = event.target;
    // Cek jika yang diklik adalah input tanggal kustom kita
    if (target.matches('input.custom-date-input')) {
        // Trik untuk memunculkan date picker bawaan browser
        try {
            target.showPicker();
        } catch (error) {
            // Fallback untuk browser lama yang tidak mendukung showPicker()
            console.warn("Browser tidak mendukung showPicker(). Klik manual pada ikon kalender jika ada.");
        }
    }
}

/**
 * Menangani perubahan pada input tanggal kustom.
 * @param {HTMLInputElement} input - Elemen input tanggal.
 */
function handleDateChange(input) {
    if (!input.value) return; // Do nothing if the date is cleared

    const dateObj = new Date(input.value);

    if (isNaN(dateObj)) {
        console.error("Invalid date selected:", input.value);
        return;
    }

    const year = dateObj.getUTCFullYear();
    const month = dateObj.getUTCMonth(); // 0-11
    const day = dateObj.getUTCDate();
    
    input.dataset.value = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const monthShort = new Date(Date.UTC(year, month, day)).toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    input.value = `${String(day).padStart(2, '0')}-${monthShort}-${year}`;
}

async function handleLoadRpData() {
    const prefix = 'rp';
    const hotelId = document.getElementById(`${prefix}-hotel-select`).value;
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;
    const loadBtn = document.getElementById(`load-${prefix}-btn`);
    const editorContainer = document.getElementById('room-production-editor-container');
    const tableBody = document.getElementById('room-production-table-body');

    if (!hotelId) {
        alert('Silakan pilih hotel terlebih dahulu.');
        return;
    }

    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memuat...';
    tableBody.innerHTML = `<tr><td colspan="9" class="p-4 text-center">Memuat data...</td></tr>`;

    try {
        const data = await fetchAPI(`/api/financials/room-production?hotel_id=${hotelId}&year=${year}&month=${month}`);

        tableBody.innerHTML = ''; // Kosongkan tabel
        if (data.length > 0) {
            data.forEach(rowData => addRpTableRow(rowData));
        } else {
            // Jika tidak ada data, tambahkan satu baris kosong
            addRpTableRow();
        }

        editorContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading Room Production data:', error);
        alert(`Gagal memuat data: ${error.message}`);
        editorContainer.classList.add('hidden');
        tableBody.innerHTML = `<tr><td colspan="9" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
    } finally {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="fa-solid fa-sync-alt mr-1"></i> Muat Data';
    }
}

async function handleSaveRpData() {
    const prefix = 'rp';
    const hotelId = document.getElementById(`${prefix}-hotel-select`).value;
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;
    const saveBtn = document.getElementById('save-room-production-btn');
    const rows = document.querySelectorAll('#rp-table-body tr');

    if (!hotelId) {
        alert('Hotel belum dipilih.');
        return;
    }

    const dataToSave = Array.from(rows).map(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length < 7) return null;

        return {
            date: inputs[0].dataset.value,
            segment: inputs[1].value,
            company: inputs[2].value,
            room: parseFormattedNumber(inputs[3].value),
            guest: parseFormattedNumber(inputs[4].value),
            lodging_revenue: parseFormattedNumber(inputs[6].value),
            pic_name: inputs[7].value,
        };
    }).filter(item => item !== null && (item.segment || item.company));

    const payload = { hotel_id: hotelId, year, month, data: dataToSave };

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';

    try {
        await fetchAPI('/api/financials/room-production', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        alert('Data Room Production berhasil disimpan!');
    } catch (error) {
        console.error('Error saving Room Production data:', error);
        alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-save mr-1"></i> Simpan Data';
    }
}

function addRpTableRow(data = {}) {
    const tableBody = document.getElementById('room-production-table-body');
    const newRow = tableBody.insertRow();
    newRow.className = 'bg-white border-b';

    const date = data.date ? new Date(data.date).toISOString().split('T')[0] : '';
    const formattedDate = data.date ? formatDate(data.date) : '';


    newRow.innerHTML = `
        <td class="px-2 py-2"><input type="text" class="form-input-table custom-date-input" value="${formattedDate}" data-value="${date}" onchange="handleDateChange(this)" placeholder="DD-MMM-YYYY"></td>
        <td class="px-2 py-2"><input type="text" class="form-input-table" value="${data.segment || ''}" placeholder="Segment"></td>
        <td class="px-2 py-2"><input type="text" class="form-input-table" value="${data.company || ''}" placeholder="Nama Perusahaan"></td>
        <td class="px-2 py-2"><input type="text" inputmode="numeric" class="form-input-table text-right" value="${formatNumber(data.room || 0)}" oninput="handleRpNumberInput(this)"></td>
        <td class="px-2 py-2"><input type="text" inputmode="numeric" class="form-input-table text-right" value="${formatNumber(data.guest || 0)}" oninput="handleRpNumberInput(this)"></td>
        <td class="px-2 py-2 text-right bg-slate-50 font-mono" data-arr="true"></td>
        <td class="px-2 py-2"><input type="text" inputmode="numeric" class="form-input-table text-right" value="${formatNumber(data.lodging_revenue || 0)}" oninput="handleRpNumberInput(this)"></td>
        <td class="px-2 py-2"><input type="text" class="form-input-table" value="${data.pic_name || ''}" placeholder="Nama PIC"></td>
        <td class="px-2 py-2 text-center">
            <button class="text-red-500 hover:text-red-700" onclick="this.closest('tr').remove()" title="Hapus Baris">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;
    calculateRpArr(newRow);
}

function calculateRpArr(row) {
    if (!row) return;
    const roomInput = row.cells[3].querySelector('input');
    const lodgingInput = row.cells[6].querySelector('input');
    const arrCell = row.cells[5];

    const room = parseFormattedNumber(roomInput.value);
    const lodging = parseFormattedNumber(lodgingInput.value);

    const arr = room > 0 ? lodging / room : 0;
    arrCell.textContent = formatNumber(arr);
}