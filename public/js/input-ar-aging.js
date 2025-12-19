// --- AR AGING FUNCTIONS ---

/**
 * Inisialisasi halaman Input AR Aging dengan mengisi dropdown filter.
 */
function initArAgingPage() {
    const prefix = 'ar-aging';
    populateYearDropdown(`${prefix}-year-select`);
    populateMonthDropdown(`${prefix}-month-select`);
    populateHotelDropdown(`${prefix}-hotel-select`);    

    // Fungsi untuk menyembunyikan editor saat filter berubah
    const hideEditorOnChange = () => {
        const editorContainer = document.getElementById(`${prefix}-editor-container`);
        if (editorContainer) {
            editorContainer.classList.add('hidden');
        }
    };

    // Tambahkan event listener ke filter untuk menyembunyikan editor saat nilainya berubah
    document.getElementById(`${prefix}-year-select`).addEventListener('change', hideEditorOnChange);
    document.getElementById(`${prefix}-month-select`).addEventListener('change', hideEditorOnChange);
    document.getElementById(`${prefix}-hotel-select`).addEventListener('change', hideEditorOnChange);

    // Event listener untuk tombol-tombol di halaman AR Aging
    document.getElementById(`load-${prefix}-btn`).addEventListener('click', handleLoadArAgingData);
    document.getElementById(`save-${prefix}-btn`).addEventListener('click', handleSaveArAgingData);
    document.getElementById(`add-${prefix}-row-btn`).addEventListener('click', () => addArAgingTableRow());

    // Tambahkan event listener untuk tombol "Export Template"
    const exportTemplateBtn = document.getElementById(`export-${prefix}-template-btn`);
    if (exportTemplateBtn) {
        exportTemplateBtn.addEventListener('click', () => handleExportArAgingTemplate());
    }

    // Event listener untuk tombol import Excel
    const importBtn = document.getElementById(`import-${prefix}-excel-btn`);
    const importInput = document.getElementById(`import-${prefix}-excel-input`);
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            // Hanya izinkan import jika tabel sudah dimuat
            if (document.getElementById('ar-aging-editor-container').classList.contains('hidden')) {
                alert('Silakan muat data terlebih dahulu sebelum mengimpor file.');
            } else {
                importInput.click();
            }
        });
        importInput.addEventListener('change', (event) => handleArAgingExcelUpload(event));
    }
}

/**
 * Inisialisasi halaman AR Aging Summary.
 */
function initArSummaryPage() {
    const prefix = 'ar-summary';
    populateYearDropdown(`${prefix}-year-select`);
    populateMonthDropdown(`${prefix}-month-select`);

    document.getElementById(`load-${prefix}-btn`).addEventListener('click', handleLoadArSummaryData);
}

/**
 * Menangani pemuatan data untuk AR Aging Summary.
 */
async function handleLoadArSummaryData() {
    const prefix = 'ar-summary';
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;
    const loadBtn = document.getElementById(`load-${prefix}-btn`);
    const tableBody = document.getElementById(`${prefix}-table-body`);
    const tableFoot = document.getElementById(`${prefix}-table-foot`);

    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memuat...';
    tableBody.innerHTML = `<tr><td colspan="7" class="p-4 text-center">Memuat ringkasan...</td></tr>`;
    tableFoot.innerHTML = '';

    try {
        const data = await fetchAPI(`/api/ar-aging/summary?year=${year}&month=${month}`);

        tableBody.innerHTML = '';
        if (data.length > 0) {
            const grandTotals = {
                current: 0,
                days_1_30: 0,
                days_31_60: 0,
                days_61_90: 0,
                days_over_90: 0,
                total_ar: 0,
            };

            data.forEach(hotelData => {
                const totalAr = (hotelData.current || 0) + (hotelData.days_1_30 || 0) + (hotelData.days_31_60 || 0) + (hotelData.days_61_90 || 0) + (hotelData.days_over_90 || 0);
                
                grandTotals.current += (hotelData.current || 0);
                grandTotals.days_1_30 += (hotelData.days_1_30 || 0);
                grandTotals.days_31_60 += (hotelData.days_31_60 || 0);
                grandTotals.days_61_90 += (hotelData.days_61_90 || 0);
                grandTotals.days_over_90 += (hotelData.days_over_90 || 0);
                grandTotals.total_ar += totalAr;

                const row = tableBody.insertRow();
                row.className = 'bg-white border-b';
                row.innerHTML = `
                    <td class="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white">${hotelData.hotel_name}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(hotelData.current || 0)}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(hotelData.days_1_30 || 0)}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(hotelData.days_31_60 || 0)}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(hotelData.days_61_90 || 0)}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(hotelData.days_over_90 || 0)}</td>
                    <td class="px-4 py-3 text-right font-mono font-bold">${formatNumber(totalAr)}</td>
                `;
            });

            // Render Grand Total row in tfoot
            tableFoot.innerHTML = `
                <tr class="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                    <td class="px-4 py-3 sticky left-0 bg-slate-100">GRAND TOTAL</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.current)}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.days_1_30)}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.days_31_60)}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.days_61_90)}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.days_over_90)}</td>
                    <td class="px-4 py-3 text-right font-mono">${formatNumber(grandTotals.total_ar)}</td>
                </tr>
            `;

        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-500">Tidak ada data ditemukan untuk periode yang dipilih.</td></tr>`;
        }
    } catch (error) {
        console.error('Error loading AR Aging Summary data:', error);
        tableBody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
    } finally {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="fa-solid fa-sync-alt mr-1"></i> Muat Ringkasan';
    }
}

/**
 * Menambahkan style warna merah untuk angka negatif pada input.
 * @param {HTMLInputElement} input - Elemen input.
 */
function styleNumericInput(input) {
    const value = parseFormattedNumber(input.value);
    if (value < 0) {
        input.classList.add('text-red-500');
    } else {
        input.classList.remove('text-red-500');
    }
}


/**
 * Menangani input angka pada tabel AR Aging, memformatnya, dan menghitung ulang total.
 * @param {HTMLInputElement} input - Elemen input yang diubah.
 */
function handleArAgingNumberInput(input) {
    const unformattedValue = parseFormattedNumber(input.value);
    input.value = formatNumber(unformattedValue);
    styleNumericInput(input); // Terapkan style
    updateArAgingTotals();
}

/**
 * Menangani klik tombol "Muat Data" pada halaman AR Aging.
 */
async function handleLoadArAgingData() {
    const prefix = 'ar-aging';
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
    tableBody.innerHTML = `<tr><td colspan="11" class="p-4 text-center">Memuat data...</td></tr>`;

    try {
        const data = await fetchAPI(`/api/financials/ar-aging?hotel_id=${hotelId}&year=${year}&month=${month}`);

        tableBody.innerHTML = ''; // Kosongkan tabel
        if (data.length > 0) {
            data.forEach(rowData => addArAgingTableRow(rowData, false));
        } else {
            // Jika tidak ada data, tambahkan satu baris kosong
            addArAgingTableRow({}, false);
        }

        updateArAgingTotals();
        editorContainer.classList.remove('hidden');
    } catch (error) {
        console.error('Error loading AR Aging data:', error);
        alert(`Gagal memuat data: ${error.message}`);
        editorContainer.classList.add('hidden');
        tableBody.innerHTML = `<tr><td colspan="11" class="p-4 text-center text-red-500">${error.message}</td></tr>`;
    } finally {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="fa-solid fa-sync-alt mr-1"></i> Muat Data';
    }
}

/**
 * Menambahkan baris baru ke tabel AR Aging.
 * @param {object} [data={}] - Data opsional untuk mengisi baris baru.
 * @param {boolean} [updateTotals=true] - Apakah akan memanggil updateArAgingTotals setelah menambahkan baris.
 */
function addArAgingTableRow(data = {}, updateTotals = true) {
    const tableBody = document.getElementById('ar-aging-table-body');
    const newRow = tableBody.insertRow();
    newRow.className = 'bg-white border-b';

    const invoiceDate = data.invoice_date ? new Date(data.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    newRow.innerHTML = `
        <td class="px-2 py-2"><input type="text" class="form-input-table" value="${data.company_name || ''}" placeholder="Nama Perusahaan/Tamu"></td>
        <td class="px-2 py-2"><input type="text" class="form-input-table" value="${data.invoice_number || ''}" placeholder="No. Invoice"></td>
        <td class="px-2 py-2"><input type="date" class="form-input-table" value="${invoiceDate}"></td>
        <td class="px-2 py-2"><input type="text" inputmode="numeric" class="form-input-table text-right" value="${formatNumber(data.total_bill || 0)}" oninput="handleArAgingNumberInput(this)"></td>
        <td class="px-2 py-2"><input type="text" inputmode="numeric" class="form-input-table text-right" value="${formatNumber(data.current || 0)}" oninput="handleArAgingNumberInput(this)"></td>
        <td class="px-2 py-2"><input type="text" inputmode="numeric" class="form-input-table text-right" value="${formatNumber(data.days_1_30 || 0)}" oninput="handleArAgingNumberInput(this)"></td>
        <td class="px-2 py-2"><input type="text" inputmode="numeric" class="form-input-table text-right" value="${formatNumber(data.days_31_60 || 0)}" oninput="handleArAgingNumberInput(this)"></td>
        <td class="px-2 py-2"><input type="text" inputmode="numeric" class="form-input-table text-right" value="${formatNumber(data.days_61_90 || 0)}" oninput="handleArAgingNumberInput(this)"></td>
        <td class="px-2 py-2"><input type="text" inputmode="numeric" class="form-input-table text-right" value="${formatNumber(data.days_over_90 || 0)}" oninput="handleArAgingNumberInput(this)"></td>
        <td class="px-2 py-2"><input type="text" class="form-input-table" value="${data.remarks || ''}" placeholder="Keterangan"></td>
        <td class="px-2 py-2 text-center">
            <button class="text-red-500 hover:text-red-700" onclick="removeArAgingRow(this)" title="Hapus Baris">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </td>
    `;
    
    // Terapkan style untuk semua input numerik di baris baru
    newRow.querySelectorAll('input[inputmode="numeric"]').forEach(styleNumericInput);


    if (updateTotals) {
        updateArAgingTotals();
    }
}

/**
 * Menghapus baris dari tabel AR Aging dan memperbarui total.
 * @param {HTMLButtonElement} buttonEl - Tombol hapus yang diklik.
 */
function removeArAgingRow(buttonEl) {
    buttonEl.closest('tr').remove();
    updateArAgingTotals();
}

/**
 * Mengupdate baris total (tfoot) pada tabel AR Aging.
 */
function updateArAgingTotals() {
    const table = document.getElementById('ar-aging-table');
    if (!table) return;

    let tfoot = table.querySelector('tfoot');
    if (!tfoot) {
        tfoot = document.createElement('tfoot');
        table.appendChild(tfoot);
    }

    const rows = table.querySelectorAll('tbody tr');
    const totals = {
        total_bill: 0,
        current: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_over_90: 0,
    };

    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length < 9) return;
        totals.total_bill += parseFormattedNumber(inputs[3].value);
        totals.current += parseFormattedNumber(inputs[4].value);
        totals.days_1_30 += parseFormattedNumber(inputs[5].value);
        totals.days_31_60 += parseFormattedNumber(inputs[6].value);
        totals.days_61_90 += parseFormattedNumber(inputs[7].value);
        totals.days_over_90 += parseFormattedNumber(inputs[8].value);
    });

    tfoot.innerHTML = `
        <tr class="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
            <td class="px-2 py-3 text-right" colspan="3">TOTAL</td>
            <td class="px-2 py-3 text-right font-mono">${formatNumber(totals.total_bill)}</td>
            <td class="px-2 py-3 text-right font-mono">${formatNumber(totals.current)}</td>
            <td class="px-2 py-3 text-right font-mono">${formatNumber(totals.days_1_30)}</td>
            <td class="px-2 py-3 text-right font-mono">${formatNumber(totals.days_31_60)}</td>
            <td class="px-2 py-3 text-right font-mono">${formatNumber(totals.days_61_90)}</td>
            <td class="px-2 py-3 text-right font-mono">${formatNumber(totals.days_over_90)}</td>
            <td class="px-2 py-3" colspan="2"></td>
        </tr>
    `;
}

/**
 * Mengumpulkan dan menyimpan data AR Aging ke API.
 */
async function handleSaveArAgingData() {
    const prefix = 'ar-aging';
    const hotelId = document.getElementById(`${prefix}-hotel-select`).value;
    const year = document.getElementById(`${prefix}-year-select`).value;
    const month = document.getElementById(`${prefix}-month-select`).value;
    const saveBtn = document.getElementById(`save-${prefix}-btn`);
    const rows = document.querySelectorAll(`#${prefix}-table-body tr`);

    if (!hotelId) {
        alert('Hotel belum dipilih.');
        return;
    }

    const dataToSave = Array.from(rows).map(row => {
        const inputs = row.querySelectorAll('input');
        // Pastikan ada input di baris tersebut sebelum memproses
        if (inputs.length < 10) return null;

        return {
            company_name: inputs[0].value,
            invoice_number: inputs[1].value,
            invoice_date: inputs[2].value,
            total_bill: parseFormattedNumber(inputs[3].value),
            current: parseFormattedNumber(inputs[4].value),
            days_1_30: parseFormattedNumber(inputs[5].value),
            days_31_60: parseFormattedNumber(inputs[6].value),
            days_61_90: parseFormattedNumber(inputs[7].value),
            days_over_90: parseFormattedNumber(inputs[8].value),
            remarks: inputs[9].value,
        };
    }).filter(item => item !== null && item.company_name); // Filter baris kosong dan baris tanpa nama perusahaan

    const payload = { hotel_id: hotelId, year, month, data: dataToSave };

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';

    try {
        await fetchAPI('/api/financials/ar-aging', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        alert('Data AR Aging berhasil disimpan!');
    } catch (error) {
        console.error('Error saving AR Aging data:', error);
        alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-save mr-1"></i> Simpan Data';
    }
}

/**
 * Menangani ekspor template AR Aging ke file Excel.
 */
function handleExportArAgingTemplate() {
    const prefix = 'ar-aging';
    const hotelSelect = document.getElementById(`${prefix}-hotel-select`);
    const yearSelect = document.getElementById(`${prefix}-year-select`);
    const monthSelect = document.getElementById(`${prefix}-month-select`);

    const hotelName = hotelSelect.options[hotelSelect.selectedIndex]?.text || 'Hotel';
    const year = yearSelect.value;
    const monthName = monthSelect.options[monthSelect.selectedIndex]?.text || 'Bulan';

    // Header untuk template AR Aging
    const header = [
        'company_name', 'invoice_number', 'invoice_date', 'total_bill',
        'current', 'days_1_30', 'days_31_60', 'days_61_90', 'days_over_90', 'remarks'
    ];
    const data = [header];

    // Tambahkan satu baris contoh data kosong
    const exampleRow = [
        'Nama Perusahaan Contoh', 'INV-001', `${year}-${String(monthSelect.value).padStart(2, '0')}-01`, 1000000,
        500000, 200000, 150000, 100000, 50000, 'Keterangan Contoh'
    ];
    data.push(exampleRow);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AR Aging Input');

    // Atur lebar kolom agar lebih mudah dibaca
    ws['!cols'] = header.map(h => ({ wch: h.length > 15 ? h.length + 2 : 15 }));

    const fileName = `AR_Aging_Template_${hotelName.replace(/ /g, '_')}_${year}_${monthName}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

/**
 * Menangani event saat file Excel AR Aging dipilih untuk di-upload.
 * @param {Event} event - Objek event dari input file.
 */
function handleArAgingExcelUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processArAgingExcelFile(file);
    }
    // Reset input file agar bisa upload file yang sama lagi
    event.target.value = '';
}

/**
 * Membaca dan memproses file Excel AR Aging, lalu mengisi data ke tabel.
 * @param {File} file - File Excel yang akan diproses.
 */
function processArAgingExcelFile(file) {
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

            const tableBody = document.getElementById('ar-aging-table-body');
            tableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi data baru

            json.forEach(row => {
                // Hanya tambahkan baris jika ada nama perusahaan
                if (row.company_name) {
                    addArAgingTableRow(row, false);
                }
            });

            updateArAgingTotals(); // Panggil update total setelah semua baris ditambahkan
            alert('Data dari file Excel berhasil diimpor. Jangan lupa untuk menyimpan perubahan.');
        } catch (error) {
            console.error("Error processing AR Aging Excel file:", error);
            alert("Gagal memproses file Excel: " + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}