// --- INPUT ACTUAL P&L FUNCTIONS ---

/**
 * Inisialisasi halaman Input Actual P&L.
 */
function initActualPage() {
    populateYearDropdown('actual-year-select');
    populateHotelDropdown('actual-hotel-select');

    // Event listener untuk tombol load
    const loadBtn = document.getElementById('load-actual-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', handleLoadActual);
    }

    // Event listener untuk tombol save
    const saveBtn = document.getElementById('save-actual-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveActual);
    }

    // Event listener untuk klik sel tabel
    const tableBody = document.getElementById('actual-table-body');
    if (tableBody) {
        tableBody.addEventListener('click', handleActualCellClick);
    }

    // Event listener untuk import/export
    const importBtn = document.getElementById('import-actual-btn');
    const importInput = document.getElementById('import-actual-input');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                processExcelFile(file, 'actual');
            }
            event.target.value = ''; // Reset input
        });
    }

    const exportBtn = document.getElementById('export-actual-template-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => handleExportTemplate('actual'));
    }
}

/**
 * Menangani klik tombol "Mulai Input / Muat Data" untuk Actual.
 */
async function handleLoadActual() {
    const hotelId = document.getElementById('actual-hotel-select').value;
    const year = document.getElementById('actual-year-select').value;
    const loadBtn = document.getElementById('load-actual-btn');

    if (!hotelId) {
        alert('Silakan pilih hotel terlebih dahulu.');
        return;
    }

    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memuat Data...';

    clearTable('actual');

    try {
        const actualData = await fetchAPI(`/api/actuals?hotel_id=${hotelId}&year=${year}`);

        if (Object.keys(actualData).length > 0) {
            populateTable(actualData, 'actual');
        }

        updateCalculations('actual');

    } catch (error) {
        console.error('Error loading actual:', error);
        alert(`Gagal memuat data: ${error.message}`);
    } finally {
        document.getElementById('actual-editor-container').classList.remove('hidden');
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="fa-solid fa-sync-alt mr-1"></i> Muat Data';
    }
}

/**
 * Mengumpulkan semua data dari tabel actual dan mengirimkannya ke backend.
 */
async function handleSaveActual() {
    const hotelId = document.getElementById('actual-hotel-select').value;
    const year = document.getElementById('actual-year-select').value;

    if (!hotelId) {
        alert('Silakan pilih hotel terlebih dahulu.');
        return;
    }

    const tableBody = document.getElementById('actual-table-body');
    const allRows = tableBody.querySelectorAll('tr[data-id]');
    const actualData = [];

    allRows.forEach(row => {
        const accountCode = row.dataset.id;
        if (row.dataset.formula) return;

        const monthlyValues = [];
        for (let i = 1; i <= 12; i++) {
            const cell = row.cells[i];
            const cellValue = parseFloat(cell.textContent.replace(/,/g, '')) || 0;
            monthlyValues.push(cellValue);
        }

        actualData.push({
            account_code: accountCode,
            values: monthlyValues
        });
    });

    const payload = {
        hotel_id: parseInt(hotelId, 10),
        year: parseInt(year, 10),
        data: actualData
    };

    const saveBtn = document.getElementById('save-actual-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';

    try {
        await fetchAPI('/api/actuals', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        alert('Actual berhasil disimpan!');
    } catch (error) {
        console.error('Error saving actual:', error);
        alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-save mr-1"></i> Simpan Actual';
    }
}

/**
 * Menangani klik pada sel tabel actual.
 * @param {MouseEvent} event - Objek event klik.
 */
function handleActualCellClick(event) {
    const cell = event.target.closest('td');

    if (!cell || cell.querySelector('input')) return;

    const cellIndex = cell.cellIndex;
    const totalColumns = cell.parentElement.children.length;
    if (cellIndex === 0 || cellIndex === totalColumns - 1 || cell.closest('tr').dataset.formula) {
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

    input.addEventListener('blur', () => saveActualValue(cell, input));
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveActualValue(cell, input);
        else if (e.key === 'Escape') cancelEdit(cell);
    });

    cell.appendChild(input);
    input.focus();
    input.select();
}

/**
 * Menyimpan nilai dari input kembali ke sel tabel (Actual).
 * @param {HTMLTableCellElement} cell - Sel yang sedang diedit.
 * @param {HTMLInputElement} input - Elemen input di dalam sel.
 */
function saveActualValue(cell, input) {
    const newValue = parseFloat(input.value) || 0;
    cell.textContent = newValue.toLocaleString('en-US'); 
    updateCalculations('actual');
}