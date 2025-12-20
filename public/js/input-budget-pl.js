// --- INPUT BUDGET P&L FUNCTIONS ---

/**
 * Inisialisasi halaman Input Budget P&L.
 */
function initBudgetPage() {
    populateYearDropdown('budget-year-select');
    populateHotelDropdown('budget-hotel-select');

    // Event listener untuk tombol load
    const loadBtn = document.getElementById('load-budget-btn');
    if (loadBtn) {
        loadBtn.addEventListener('click', handleLoadBudget);
    }

    // Event listener untuk tombol save
    const saveBtn = document.getElementById('save-budget-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveBudget);
    }

    // Event listener untuk klik sel tabel
    const tableBody = document.getElementById('budget-table-body');
    if (tableBody) {
        tableBody.addEventListener('click', handleBudgetCellClick);
    }

    // Event listener untuk import/export
    const importBtn = document.getElementById('import-budget-btn');
    const importInput = document.getElementById('import-budget-input');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => importInput.click());
        importInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                processExcelFile(file, 'budget');
            }
            event.target.value = ''; // Reset input
        });
    }

    const exportBtn = document.getElementById('export-budget-template-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => handleExportTemplate('budget'));
    }
}

/**
 * Menangani klik tombol "Mulai Input / Muat Data".
 * Akan memuat data budget yang ada dari server jika ditemukan.
 */
async function handleLoadBudget() {
    const hotelId = document.getElementById('budget-hotel-select').value;
    const year = document.getElementById('budget-year-select').value;
    const loadBtn = document.getElementById('load-budget-btn');

    if (!hotelId) {
        alert('Silakan pilih hotel terlebih dahulu.');
        return;
    }

    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memuat Data...';

    clearTable('budget');

    try {
        const budgetData = await fetchAPI(`/api/financials/budgets?hotel_id=${hotelId}&year=${year}`);

        if (Object.keys(budgetData).length > 0) {
            populateTable(budgetData, 'budget');
        }

        updateCalculations('budget');

    } catch (error) {
        console.error('Error loading budget:', error);
        alert(`Gagal memuat data: ${error.message}`);
    } finally {
        document.getElementById('budget-editor-container').classList.remove('hidden');
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="fa-solid fa-sync-alt mr-1"></i> Muat Data';
    }
}

/**
 * Mengumpulkan semua data dari tabel budget dan mengirimkannya ke backend.
 */
async function handleSaveBudget() {
    const hotelId = document.getElementById('budget-hotel-select').value;
    const year = document.getElementById('budget-year-select').value;

    if (!hotelId) {
        alert('Silakan pilih hotel terlebih dahulu.');
        return;
    }

    const tableBody = document.getElementById('budget-table-body');
    const allRows = tableBody.querySelectorAll('tr[data-id]');
    const budgetData = [];

    allRows.forEach(row => {
        const accountCode = row.dataset.id;
        if (row.dataset.formula) return;

        const monthlyValues = [];
        for (let i = 1; i <= 12; i++) {
            const cell = row.cells[i];
            const cellValue = parseFloat(cell.textContent.replace(/,/g, '')) || 0;
            monthlyValues.push(cellValue);
        }

        budgetData.push({
            account_code: accountCode,
            values: monthlyValues
        });
    });

    const payload = {
        hotel_id: parseInt(hotelId, 10),
        year: parseInt(year, 10),
        data: budgetData
    };

    const saveBtn = document.getElementById('save-budget-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...';

    try {
        await fetchAPI('/api/financials/budgets', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        alert('Budget berhasil disimpan!');
    } catch (error) {
        console.error('Error saving budget:', error);
        alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-save mr-1"></i> Simpan Budget';
    }
}


/**
 * Menangani klik pada sel tabel budget.
 * @param {MouseEvent} event - Objek event klik.
 */
function handleBudgetCellClick(event) {
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

    input.addEventListener('blur', () => saveBudgetValue(cell, input));
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveBudgetValue(cell, input);
        else if (e.key === 'Escape') cancelEdit(cell);
    });

    cell.appendChild(input);
    input.focus();
    input.select();
}


/**
 * Menyimpan nilai dari input kembali ke sel tabel.
 * @param {HTMLTableCellElement} cell - Sel yang sedang diedit.
 * @param {HTMLInputElement} input - Elemen input di dalam sel.
 */
function saveBudgetValue(cell, input) {
    const newValue = parseFloat(input.value) || 0;
    cell.textContent = newValue.toLocaleString('en-US'); 
    updateCalculations('budget');
}
