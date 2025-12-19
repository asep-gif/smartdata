// --- INPUT P&L COMMON FUNCTIONS ---
// Berisi fungsi-fungsi helper yang digunakan oleh Input Budget P&L dan Input Actual P&L.

/**
 * Mengisi tabel P&L dengan data dari server.
 * @param {object} data - Objek data P&L, misal: { 'rev_room': [100, 200, ...], ... }
 * @param {string} type - 'budget' atau 'actual'.
 */
function populateTable(data, type) {
    const tableBodyId = type === 'budget' ? 'budget-table-body' : 'actual-table-body';
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    for (const accountCode in data) {
        const row = tableBody.querySelector(`tr[data-id="${accountCode}"]`);
        if (row) {
            const monthlyValues = data[accountCode];
            for (let i = 0; i < monthlyValues.length; i++) {
                // Kolom bulan dimulai dari index 1
                const cell = row.cells[i + 1];
                if (cell) {
                    cell.textContent = (monthlyValues[i] || 0).toLocaleString('en-US');
                }
            }
        }
    }
}

/**
 * Mengosongkan semua nilai di dalam sel-sel tabel P&L.
 * @param {string} type - 'budget' atau 'actual'.
 */
function clearTable(type) {
    const tableBodyId = type === 'budget' ? 'budget-table-body' : 'actual-table-body';
    const editorContainerId = type === 'budget' ? 'budget-editor-container' : 'actual-editor-container';
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    const allCells = tableBody.querySelectorAll('td');
    allCells.forEach(cell => {
        // Jangan kosongkan sel deskripsi (kolom pertama) atau header kategori
        if (cell.cellIndex > 0 && cell.colSpan !== 14) {
            cell.textContent = '';
        }
    });
    document.getElementById(editorContainerId).classList.remove('hidden');
}

/**
 * Membatalkan proses edit dan mengembalikan konten asli sel.
 * @param {HTMLTableCellElement} cell - Sel yang sedang diedit.
 */
function cancelEdit(cell) {
    cell.innerHTML = cell.dataset.originalContent || '';
}

/**
 * Fungsi utama untuk menghitung ulang semua formula di tabel P&L.
 * @param {string} type - 'budget' atau 'actual'.
 */
function updateCalculations(type) {
    const tableBodyId = type === 'budget' ? 'budget-table-body' : 'actual-table-body';
    const tableBody = document.getElementById(tableBodyId);
    if (!tableBody) return;

    // Helper function untuk mengambil nilai numerik dari sel
    const getCellValue = (rowId, cellIndex) => {
        const row = tableBody.querySelector(`tr[data-id="${rowId}"]`);
        if (!row) return 0;
        const cell = row.cells[cellIndex];
        if (!cell) return 0;
        return parseFloat(cell.textContent.replace(/,/g, '')) || 0;
    };

    // Helper function untuk mengatur nilai sel yang diformat
    const setCellValue = (rowId, cellIndex, value) => {
        const row = tableBody.querySelector(`tr[data-id="${rowId}"]`);
        if (!row) return;
        const cell = row.cells[cellIndex];
        if (!cell) return;
        // Untuk persentase, format dengan 2 desimal. Untuk lainnya, format biasa.
        if (row.dataset.formula === 'occupancy' || row.dataset.formula === 'percent') {
             cell.textContent = value.toFixed(0) + '%';
        } else if (rowId === 'stat_arr' || rowId === 'stat_revpar') {
            // Bulatkan nilai untuk ARR dan RevPAR sebelum menampilkannya
            cell.textContent = Math.round(value).toLocaleString('en-US');
        } else {
            cell.textContent = value.toLocaleString('en-US');
        }
    };

    // 1. Hitung Total per Bulan (Kolom)
    // Loop untuk setiap bulan (kolom 1 sampai 12)
    for (let monthIndex = 1; monthIndex <= 12; monthIndex++) {
        // --- Ambil Nilai Dasar ---
        const roomAvailable = getCellValue('stat_room_available', monthIndex);
        const occupiedRooms = getCellValue('stat_occupied_rooms', monthIndex);
        const roomRev = getCellValue('rev_room', monthIndex);
        const fnbRev = getCellValue('rev_fnb', monthIndex);
        const othersRev = getCellValue('rev_others', monthIndex);
        const cosFnb = getCellValue('cos_fnb', monthIndex);
        const cosOthers = getCellValue('cos_others', monthIndex);
        const osawRoom = getCellValue('osaw_room', monthIndex);
        const osawFnb = getCellValue('osaw_fnb', monthIndex);
        const ooeRoom = getCellValue('ooe_room', monthIndex);
        const ooeFnb = getCellValue('ooe_fnb', monthIndex);
        const usawAg = getCellValue('usaw_ag', monthIndex);
        const usawSm = getCellValue('usaw_sm', monthIndex);
        const usawPomec = getCellValue('usaw_pomec', monthIndex);
        const uoeAg = getCellValue('uoe_ag', monthIndex);
        const uoeSm = getCellValue('uoe_sm', monthIndex);
        const uoePomec = getCellValue('uoe_pomec', monthIndex);
        const uoeEnergy = getCellValue('uoe_energy', monthIndex);
        const mgtFee = getCellValue('mgt_fee', monthIndex);

        // --- Lakukan Kalkulasi ---

        // 1. % Of Occupancy = (Occupied Rooms / Room Available) * 100
        const occupancy = roomAvailable > 0 ? (occupiedRooms / roomAvailable) * 100 : 0;
        setCellValue('stat_occupancy_percent', monthIndex, occupancy);

        // 2. Average Room Rate (ARR) = Room Revenue / Occupied Rooms
        const arr = occupiedRooms > 0 ? roomRev / occupiedRooms : 0;
        setCellValue('stat_arr', monthIndex, arr);

        // 3. RevPAR = Room Revenue / Room Available
        const revpar = roomAvailable > 0 ? roomRev / roomAvailable : 0;
        setCellValue('stat_revpar', monthIndex, revpar);

        // 4. TOTAL REVENUE = Room Rev + F&B Rev + Others Rev
        const totalRevenue = roomRev + fnbRev + othersRev;
        setCellValue('total_revenue', monthIndex, totalRevenue);

        // 5. TOTAL COST OF SALES = Cost of F&B + Cost of Others
        const totalCos = cosFnb + cosOthers;
        setCellValue('total_cos', monthIndex, totalCos);

        // 6. TOTAL OPERATING SALARY & WAGES = Room S&W + F&B S&W
        const totalOsaw = osawRoom + osawFnb;
        setCellValue('total_osaw', monthIndex, totalOsaw);

        // 7. TOTAL OTHER EXPENSES = Room Other Exp + F&B Other Exp
        const totalOoe = ooeRoom + ooeFnb;
        setCellValue('total_ooe', monthIndex, totalOoe);

        // 8. Room GOI = Room Revenue - Room S&W - Room Other Exp
        const roomGoi = roomRev - osawRoom - ooeRoom;
        setCellValue('odp_room_goi', monthIndex, roomGoi);

        // 9. F&B GOI = F&B Revenue - Cost of F&B - F&B S&W - F&B Other Exp
        const fnbGoi = fnbRev - cosFnb - osawFnb - ooeFnb;
        setCellValue('odp_fnb_goi', monthIndex, fnbGoi);

        // 10. Others GOI = Others Revenue - Cost of Others
        const othersGoi = othersRev - cosOthers;
        setCellValue('odp_others_goi', monthIndex, othersGoi);

        // 11. TOTAL ODP = Room GOI + F&B GOI + Others GOI
        const totalOdp = roomGoi + fnbGoi + othersGoi;
        setCellValue('total_odp', monthIndex, totalOdp);

        // 12. TOTAL USAW = A&G S&W + S&M S&W + POMEC S&W
        const totalUsaw = usawAg + usawSm + usawPomec;
        setCellValue('total_usaw', monthIndex, totalUsaw);

        // 13. TOTAL UOE = A&G Exp + S&M Exp + POMEC Exp + Energy
        const totalUoe = uoeAg + uoeSm + uoePomec + uoeEnergy;
        setCellValue('total_uoe', monthIndex, totalUoe);

        // 14. TOTAL UNDISTRIBUTED EXP = TOTAL USAW + TOTAL UOE
        const totalUndistributedExp = totalUsaw + totalUoe;
        setCellValue('total_undistributed_exp', monthIndex, totalUndistributedExp);

        // 15. GOP = TOTAL ODP - TOTAL UNDISTRIBUTED EXP - MGT FEE
        const gop = totalOdp - totalUndistributedExp - mgtFee;
        setCellValue('gop', monthIndex, gop);

        // 16. % GOP Ratio = (GOP / TOTAL REVENUE) * 100
        const gopRatio = totalRevenue > 0 ? (gop / totalRevenue) * 100 : 0;
        setCellValue('gop_ratio', monthIndex, gopRatio);

        // --- RATIOS ---
        // 17. % Salary & Wages = (Total Op S&W + Total Undist. S&W) / Total Revenue
        const totalSalaryWages = totalOsaw + totalUsaw;
        const ratioSalaryWages = totalRevenue > 0 ? (totalSalaryWages / totalRevenue) * 100 : 0;
        setCellValue('ratio_salary_wages', monthIndex, ratioSalaryWages);

        // 18. % Energy Cost = Energy Cost / Total Revenue
        const ratioEnergy = totalRevenue > 0 ? (uoeEnergy / totalRevenue) * 100 : 0;
        setCellValue('ratio_energy', monthIndex, ratioEnergy);

        // 19. % Room GoI = Room GOI / Room Revenue
        const ratioRoomGoi = roomRev > 0 ? (roomGoi / roomRev) * 100 : 0;
        setCellValue('ratio_room_goi', monthIndex, ratioRoomGoi);

        // 20. % F&B GoI = F&B GOI / F&B Revenue
        const ratioFnbGoi = fnbRev > 0 ? (fnbGoi / fnbRev) * 100 : 0;
        setCellValue('ratio_fnb_goi', monthIndex, ratioFnbGoi);

        // 21. % S&M Expenses = (S&M S&W + S&M Exp) / Total Revenue
        const totalSmExp = usawSm + uoeSm;
        const ratioSmExp = totalRevenue > 0 ? (totalSmExp / totalRevenue) * 100 : 0;
        setCellValue('ratio_sm_exp', monthIndex, ratioSmExp);

        // 22. % MFee = Management Fee / Total Revenue
        const ratioMfee = totalRevenue > 0 ? (mgtFee / totalRevenue) * 100 : 0;
        setCellValue('ratio_mfee', monthIndex, ratioMfee);
    }

    // 2. Hitung Total Year To Date (YTD) per Baris
    const allRows = tableBody.querySelectorAll('tr[data-id]');
    allRows.forEach(row => {
        // Hanya hitung YTD untuk baris yang bukan persentase/rasio pada tahap ini
        if (row.dataset.formula !== 'occupancy' && row.dataset.formula !== 'percent' && row.dataset.formula !== 'arr' && row.dataset.formula !== 'revpar') {
            let ytdTotal = 0;
            // Loop dari kolom Januari (1) hingga Desember (12)
            for (let i = 1; i <= 12; i++) {
                const cellValue = parseFloat(row.cells[i].textContent.replace(/,/g, '')) || 0;
                ytdTotal += cellValue;
            }
            // Update sel YTD (kolom terakhir, index 13)
            const ytdCell = row.cells[13];
            ytdCell.textContent = ytdTotal.toLocaleString('en-US');
        }
    });

    // 3. Hitung ulang YTD untuk baris rasio/persentase setelah semua total YTD dihitung
    const ytdTotalOccupiedRooms = getCellValue('stat_occupied_rooms', 13);
    const ytdTotalRoomAvailable = getCellValue('stat_room_available', 13);
    const ytdTotalRoomRev = getCellValue('rev_room', 13);
    const ytdTotalRevenue = getCellValue('total_revenue', 13);
    const ytdGop = getCellValue('gop', 13);
    const ytdTotalSalaryWages = getCellValue('total_osaw', 13) + getCellValue('total_usaw', 13);
    const ytdEnergyCost = getCellValue('uoe_energy', 13);
    const ytdRoomGoi = getCellValue('odp_room_goi', 13);
    const ytdFnbRev = getCellValue('rev_fnb', 13);
    const ytdFnbGoi = getCellValue('odp_fnb_goi', 13);
    const ytdTotalSmExp = getCellValue('usaw_sm', 13) + getCellValue('uoe_sm', 13);
    const ytdMgtFee = getCellValue('mgt_fee', 13);

    // Kalkulasi YTD khusus
    const ytdOccupancy = ytdTotalRoomAvailable > 0 ? (ytdTotalOccupiedRooms / ytdTotalRoomAvailable) * 100 : 0;
    const ytdArr = ytdTotalOccupiedRooms > 0 ? ytdTotalRoomRev / ytdTotalOccupiedRooms : 0;
    const ytdRevpar = ytdTotalRoomAvailable > 0 ? ytdTotalRoomRev / ytdTotalRoomAvailable : 0;
    const ytdGopRatio = ytdTotalRevenue > 0 ? (ytdGop / ytdTotalRevenue) * 100 : 0;
    const ytdRatioSalaryWages = ytdTotalRevenue > 0 ? (ytdTotalSalaryWages / ytdTotalRevenue) * 100 : 0;
    const ytdRatioEnergy = ytdTotalRevenue > 0 ? (ytdEnergyCost / ytdTotalRevenue) * 100 : 0;
    const ytdRatioRoomGoi = ytdTotalRoomRev > 0 ? (ytdRoomGoi / ytdTotalRoomRev) * 100 : 0;
    const ytdRatioFnbGoi = ytdFnbRev > 0 ? (ytdFnbGoi / ytdFnbRev) * 100 : 0;
    const ytdRatioSmExp = ytdTotalRevenue > 0 ? (ytdTotalSmExp / ytdTotalRevenue) * 100 : 0;
    const ytdRatioMfee = ytdTotalRevenue > 0 ? (ytdMgtFee / ytdTotalRevenue) * 100 : 0;

    // Set nilai YTD khusus ke tabel
    setCellValue('stat_occupancy_percent', 13, ytdOccupancy);
    setCellValue('stat_arr', 13, ytdArr);
    setCellValue('stat_revpar', 13, ytdRevpar);
    setCellValue('gop_ratio', 13, ytdGopRatio);
    setCellValue('ratio_salary_wages', 13, ytdRatioSalaryWages);
    setCellValue('ratio_energy', 13, ytdRatioEnergy);
    setCellValue('ratio_room_goi', 13, ytdRatioRoomGoi);
    setCellValue('ratio_fnb_goi', 13, ytdRatioFnbGoi);
    setCellValue('ratio_sm_exp', 13, ytdRatioSmExp);
    setCellValue('ratio_mfee', 13, ytdRatioMfee);
}

/**
 * Menangani ekspor template P&L ke file Excel.
 * @param {string} type - 'budget' atau 'actual'.
 */
function handleExportTemplate(type) {
    const hotelSelectId = type === 'budget' ? 'budget-hotel-select' : 'actual-hotel-select';
    const yearSelectId = type === 'budget' ? 'budget-year-select' : 'actual-year-select';
    const tableBodyId = type === 'budget' ? 'budget-table-body' : 'actual-table-body';
    const hotelSelect = document.getElementById(hotelSelectId);
    const yearSelect = document.getElementById(yearSelectId);
    const hotelName = hotelSelect.options[hotelSelect.selectedIndex]?.text || 'Hotel';
    const year = yearSelect.value;

    const table = document.getElementById(tableBodyId);
    const rows = table.querySelectorAll('tr[data-id]');
    
    const data = [];
    // Header
    const header = ['account_code', 'description', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    data.push(header);

    // Data rows
    rows.forEach(row => {
        // Hanya ekspor baris yang bisa di-input (tidak memiliki atribut 'data-formula')
        if (!row.hasAttribute('data-formula')) {
            const accountCode = row.dataset.id;
            const description = row.cells[0].textContent;
            const rowData = [accountCode, description];
            // Isi dengan 0 untuk 12 bulan
            for (let i = 0; i < 12; i++) {
                rowData.push(0);
            }
            data.push(rowData);
        }
    });

    // Buat worksheet dan workbook menggunakan SheetJS
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'P&L Input');

    const templateName = type === 'budget' ? 'Budget' : 'Actual';
    // Trigger download
    const fileName = `${templateName}_Template_${hotelName.replace(/ /g, '_')}_${year}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

/**
 * Membaca dan memproses file Excel, lalu mengisi data ke tabel.
 * @param {File} file - File Excel yang akan diproses.
 * @param {string} type - 'budget' atau 'actual'.
 */
function processExcelFile(file, type) {
    const tableBodyId = type === 'budget' ? 'budget-table-body' : 'actual-table-body';
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Konversi sheet ke format JSON
            const json = XLSX.utils.sheet_to_json(worksheet);

            if (json.length === 0) {
                throw new Error("File Excel kosong atau formatnya tidak sesuai.");
            }

            // Iterasi melalui data JSON dan isi tabel
            json.forEach(row => {
                const accountCode = row.account_code;
                const tableRow = document.querySelector(`#${tableBodyId} tr[data-id="${accountCode}"]`);
                
                if (tableRow && !tableRow.hasAttribute('data-formula')) {
                    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                    months.forEach((month, index) => {
                        const cell = tableRow.cells[index + 1]; // +1 karena kolom 0 adalah deskripsi
                        const value = parseFloat(row[month]) || 0;
                        cell.textContent = value.toLocaleString('en-US');
                    });
                }
            });

            // Hitung ulang semua formula setelah data diimpor
            updateCalculations(type);
            alert('Data dari file Excel berhasil dimuat ke dalam tabel. Jangan lupa untuk menyimpan perubahan.');
        } catch (error) {
            console.error("Error processing Excel file:", error);
            alert("Gagal memproses file Excel: " + error.message);
        }
    };
    reader.readAsArrayBuffer(file);
}