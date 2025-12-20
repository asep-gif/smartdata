let marketShareChartInstance = null;
let mpiChartInstance = null;
let lastCompetitorMetricsData = null; // Untuk menyimpan { allProperties, subjectData, competitors }
let currentIndexChartType = 'mpi'; // 'mpi', 'ari', 'rgi', 'all'

function initHotelCompetitorPage() {
    const startDateInput = document.getElementById('hotel-competitor-start-date');
    const endDateInput = document.getElementById('hotel-competitor-end-date');
    if (startDateInput && endDateInput) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.value = today;
        endDateInput.value = today;
    }
    populateHotelDropdown('hotel-competitor-hotel-select');
 
    document.getElementById('hotel-competitor-hotel-select').addEventListener('change', (event) => {
        const hotelId = event.target.value;
        if (hotelId) {
            loadConfiguredCompetitors(hotelId);
        } else {
            document.getElementById('hotel-competitor-editor-container').classList.add('hidden');
            document.getElementById('hotel-competitor-table-body').innerHTML = '';
            updateHotelCompetitorTotals();
            clearCompetitorCharts();
        }
    });

    // BARU: Event listener untuk tombol toggle grafik indeks
    document.getElementById('competitor-index-chart-toggles')?.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (button && !button.classList.contains('active-stat-toggle-btn')) {
            // Update active state
            document.querySelectorAll('#competitor-index-chart-toggles button').forEach(btn => btn.classList.remove('active-stat-toggle-btn'));
            button.classList.add('active-stat-toggle-btn');
            
            // Update state dan render ulang grafik
            currentIndexChartType = button.dataset.type;
            updateIndexChart();
        }
    });
 
    document.getElementById('load-hotel-competitor-btn').addEventListener('click', loadHotelCompetitorData);
    document.getElementById('save-hotel-competitor-btn').addEventListener('click', saveHotelCompetitorData);
 
    // Sembunyikan tombol "Tambah Baris" karena baris sekarang dikelola dari halaman Settings
    const addRowBtn = document.getElementById('add-hotel-competitor-row-btn');
    if (addRowBtn) {
        addRowBtn.style.display = 'none';
    }
}

async function loadConfiguredCompetitors(hotelId) { // This function is now only for pre-populating, not for loading data
    document.getElementById('hotel-competitor-editor-container').classList.remove('hidden');
    const tableBody = document.getElementById('hotel-competitor-table-body');
    tableBody.innerHTML = '<tr><td colspan="13" class="text-center p-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat daftar kompetitor...</td></tr>';

    try {
        const competitors = await fetchAPI(`/api/competitor/config/${hotelId}`);
        tableBody.innerHTML = '';
        if (competitors.length > 0) {
            competitors.forEach(comp => {
                addHotelCompetitorRow({ 
                    competitor_name: comp.competitor_name, 
                    number_of_rooms: comp.number_of_rooms 
                });
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="13" class="text-center p-4">Tidak ada kompetitor yang dikonfigurasi untuk hotel ini.</td></tr>';
        }
    } catch (error) {
        console.error('Error loading configured competitors:', error);
        tableBody.innerHTML = '<tr><td colspan="13" class="text-center p-4 text-red-500">Gagal memuat daftar kompetitor.</td></tr>';
    }
}

async function loadHotelCompetitorData() {
    const hotelId = document.getElementById('hotel-competitor-hotel-select').value;
    const startDate = document.getElementById('hotel-competitor-start-date').value;
    const endDate = document.getElementById('hotel-competitor-end-date').value;
    const loadBtn = document.getElementById('load-hotel-competitor-btn');

    if (!hotelId || !startDate || !endDate) {
        alert('Silakan pilih hotel dan rentang tanggal terlebih dahulu.');
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        alert('Tanggal mulai tidak boleh lebih besar dari tanggal selesai.');
        return;
    }

    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memuat Data...';
    document.getElementById('hotel-competitor-editor-container').classList.remove('hidden');
    const tableBody = document.getElementById('hotel-competitor-table-body');
    tableBody.innerHTML = '<tr><td colspan="13" class="text-center p-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Memuat data...</td></tr>';
 
    try {
        // 1. Fetch both config (for order) and saved data (for values)
        const isSingleDate = startDate === endDate;
        const [configuredCompetitors, savedData] = await Promise.all([
            fetchAPI(`/api/competitor/config/${hotelId}`),
            fetchAPI(`/api/competitor?hotel_id=${hotelId}&startDate=${startDate}&endDate=${endDate}`)
        ]);

        tableBody.innerHTML = ''; // Clear loading message

        // 2. Create a map for quick lookup of saved data
        const savedDataMap = new Map(savedData.map(item => [item.competitor_name, item]));

        if (isSingleDate) {
            // 3a. For single-day (input mode), render all configured competitors, filling with saved data if available.
            if (configuredCompetitors.length > 0) {
                configuredCompetitors.forEach(config => {
                    const existingData = savedDataMap.get(config.competitor_name);
                    const rowData = existingData || {
                        competitor_name: config.competitor_name,
                        number_of_rooms: config.number_of_rooms
                    };
                    addHotelCompetitorRow(rowData, isSingleDate);
                    if (existingData) {
                        savedDataMap.delete(config.competitor_name);
                    }
                });
            }
            // Render any extra competitors that were saved but are no longer in the config
            savedDataMap.forEach(extraData => {
                addHotelCompetitorRow(extraData, isSingleDate);
            });
        } else {
            // 3b. For date range (view mode), only render competitors that have aggregated data.
            // Render competitors that have aggregated data, but maintain the configured order.
            if (configuredCompetitors.length > 0) {
                configuredCompetitors.forEach(config => {
                    const aggregatedData = savedDataMap.get(config.competitor_name);
                    // Only add a row if there is aggregated data for this competitor in the selected range
                    if (aggregatedData) {
                        addHotelCompetitorRow(aggregatedData, isSingleDate);
                        // Remove from map so we can find extras later
                        savedDataMap.delete(config.competitor_name);
                    }
                });
            }
            // Render any extra competitors that had data but are no longer in the config
            savedDataMap.forEach(extraData => {
                addHotelCompetitorRow(extraData, isSingleDate);
            });
        }

        // 5. Handle empty state and update totals
        if (tableBody.rows.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="13" class="text-center p-4">Tidak ada data kompetitor untuk hotel dan periode yang dipilih.</td></tr>';
            updateHotelCompetitorTotals(); // Pastikan total di-reset
            clearCompetitorCharts();
        } else {
            // Recalculate all indices to ensure they are up-to-date with the latest formula
            // On initial load, calculate indices but base totals on the visible UI.
            await calculateAllCompetitorMetrics(); // This will update the index columns in the UI.
            updateHotelCompetitorTotals(); // This will calculate totals from the UI, which is all zeros.
        }

        // Hide save button if it's a date range view
        const saveBtn = document.getElementById('save-hotel-competitor-btn');
        if (saveBtn) {
            saveBtn.style.display = isSingleDate ? '' : 'none';
        }
    } catch (error) {
        console.error('Error loading hotel competitor data:', error);
        showToast('Gagal memuat data hotel competitor.', 'error');
        tableBody.innerHTML = `<tr><td colspan="13" class="text-center p-4 text-red-500">Gagal memuat data: ${error.message}</td></tr>`;
    } finally {
        loadBtn.disabled = false;
        loadBtn.innerHTML = '<i class="fa-solid fa-sync-alt mr-1"></i> Muat Data';
    }
}

function addHotelCompetitorRow(data = {}, isEditable = true) {
    const tableBody = document.getElementById('hotel-competitor-table-body');
    const tr = document.createElement('tr');
    const readonlyAttr = isEditable ? '' : 'readonly';
    const inputBg = isEditable ? '' : 'bg-slate-100';
 
    // Handle different property names from different sources (view vs. config)
    const competitorName = data.competitor_name || '';
    const rankMpi = data.rank_mpi || data.mpi_rank || '';
    const occupancyPercent = data.occupancy_percent ? `${parseFloat(data.occupancy_percent).toFixed(2)}%` : '';

    const marketSharePercent = data.market_share ? `${parseFloat(data.market_share).toFixed(2)}%` : '';
    // Format indices to 2 decimal places on load for consistent display
    const ariValue = data.ari ? parseFloat(data.ari).toFixed(2) : '';
    const rgiValue = data.rgi ? parseFloat(data.rgi).toFixed(2) : '';
    const mpiValue = data.mpi ? parseFloat(data.mpi).toFixed(2) : '';

    tr.innerHTML = `
        <td class="border px-4 py-2"><input type="text" class="form-input w-full bg-slate-100" data-field="competitor_name" value="${competitorName}" readonly></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full text-center bg-slate-100" data-field="number_of_rooms" value="${formatNumber(data.number_of_rooms || 0)}" readonly></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full text-center ${inputBg}" data-field="room_available" value="${formatNumber(data.room_available || 0)}" oninput="handleCompetitorNumberInput(this)" ${readonlyAttr}></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full text-center ${inputBg}" data-field="room_sold" value="${formatNumber(data.room_sold || 0)}" oninput="handleCompetitorNumberInput(this)" ${readonlyAttr}></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full bg-slate-100 text-center" data-field="occupancy_percent" value="${occupancyPercent}" readonly></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full text-center ${inputBg}" data-field="arr" value="${formatNumber(data.arr || 0)}" oninput="handleCompetitorNumberInput(this)" ${readonlyAttr}></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full bg-slate-100 text-center" data-field="revpar" value="${formatNumber(data.revpar || 0)}" readonly></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full bg-slate-100 text-center" data-field="revenue" value="${formatNumber(data.revenue || 0)}" readonly></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full bg-slate-100 text-center" data-field="market_share" value="${marketSharePercent}" readonly></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full bg-slate-100 text-center" data-field="ari" value="${ariValue}" readonly></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full bg-slate-100 text-center" data-field="rgi" value="${rgiValue}" readonly></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full bg-slate-100 text-center" data-field="mpi" value="${mpiValue}" readonly></td>
        <td class="border px-4 py-2"><input type="text" class="form-input w-full bg-slate-100 text-center" data-field="rank_mpi" value="${rankMpi}" readonly></td>
    `;
    tableBody.appendChild(tr);
    
    // Initial calculation if data is provided
    calculateRowMetrics(tr);
}

function handleCompetitorNumberInput(input) {
    const val = parseFormattedNumber(input.value);
    input.value = formatNumber(val);
    const row = input.closest('tr');
    calculateRowMetrics(row);
    
    // Recalculate everything including indices
    calculateAllCompetitorMetrics().then(({ marketTotals }) => {
        updateHotelCompetitorTotals(marketTotals);
    });
}

function calculateRowMetrics(row) {
    const getVal = (field) => parseFormattedNumber(row.querySelector(`[data-field="${field}"]`).value);
    const setVal = (field, value) => {
        const input = row.querySelector(`[data-field="${field}"]`);
        if (input) {
            if (isNaN(value) || !isFinite(value)) {
                input.value = '';
            } else {
                if (field === 'occupancy_percent') {
                    input.value = value.toFixed(2) + '%';
                } else if (['revenue', 'revpar', 'room_available', 'room_sold', 'arr', 'number_of_rooms'].includes(field)) {
                    input.value = formatNumber(value);
                } else {
                    input.value = Number.isInteger(value) ? value : value.toFixed(2);
                }
            }
        }
    };

    const roomAvailable = getVal('room_available');
    const roomSold = getVal('room_sold');
    const arr = getVal('arr');

    let occupancy = 0;
    if (roomAvailable > 0) {
        occupancy = (roomSold / roomAvailable) * 100;
    }

    const revenue = roomSold * arr;

    let revpar = 0;
    if (roomAvailable > 0) {
        revpar = revenue / roomAvailable;
    }

    setVal('occupancy_percent', occupancy);
    setVal('revenue', revenue);
    setVal('revpar', revpar);
}

/**
 * Fungsi utama yang melakukan semua perhitungan metrik kompetitor.
 * Ini dipanggil sebelum menyimpan data.
 * @returns {Promise<Array|null>} Array objek data yang siap disimpan, atau null jika gagal.
 */
async function calculateAllCompetitorMetrics() {
    const hotelId = document.getElementById('hotel-competitor-hotel-select').value;
    const startDate = document.getElementById('hotel-competitor-start-date').value;
    const endDate = document.getElementById('hotel-competitor-end-date').value;
    const isSingleDate = startDate === endDate;
    const tableRows = document.querySelectorAll('#hotel-competitor-table-body tr');

    // 1. Fetch Subject Hotel data (DSR Actual) for the same date
    let subjectData = { room_sold: 0, room_available: 0, room_revenue: 0, arr: 0, revpar: 0, number_of_rooms: 0 };
    try {
        if (isSingleDate) { // Single day view
            const year = startDate.substring(0, 4);
            const month = startDate.substring(5, 7);
            const subjectDsrResponse = await fetchAPI(`/api/financials/dsr/actual?hotel_id=${hotelId}&year=${year}&month=${month}`);
            const foundData = subjectDsrResponse.dsrData.find(d => d.date.startsWith(startDate));
            if (foundData) {
                subjectData = foundData;
            } else {
                showToast('Data DSR Actual untuk hotel ini pada tanggal tersebut tidak ditemukan. Perhitungan indeks tidak akan menyertakan hotel subjek.', 'warning');
            }
        } else { // Date range view
            const aggregatedSubjectData = await fetchAPI(`/api/financials/dsr/actual/range?hotel_id=${hotelId}&startDate=${startDate}&endDate=${endDate}`);
            if (aggregatedSubjectData) {
                subjectData = {
                    room_sold: parseFloat(aggregatedSubjectData.room_sold) || 0,
                    room_available: parseFloat(aggregatedSubjectData.room_available) || 0,
                    room_revenue: parseFloat(aggregatedSubjectData.room_revenue) || 0,
                    number_of_rooms: parseFloat(aggregatedSubjectData.number_of_rooms) || 0,
                };
            } else {
                 showToast('Data DSR Actual untuk hotel ini pada rentang tanggal tersebut tidak ditemukan. Perhitungan indeks tidak akan menyertakan hotel subjek.', 'warning');
            }
        }
    } catch (error) {
        showToast('Gagal mengambil data DSR Actual hotel. Perhitungan indeks tidak dapat dilanjutkan.', 'error');
        console.error("Failed to fetch subject DSR data:", error);
        return { dataToSave: [], marketTotals: {} }; // Return empty to avoid breaking the flow
    }

    // 2. Gather competitor data from UI and perform row-level calculations
    const competitors = [];
    tableRows.forEach(row => {
        if (!row.querySelector('[data-field="competitor_name"]')) return; // Skip non-data rows
        calculateRowMetrics(row); // Ensure row-level calcs are up to date
        const getVal = (field) => parseFormattedNumber(row.querySelector(`[data-field="${field}"]`).value);
        const competitor = {
            rowElement: row,
            name: row.querySelector('[data-field="competitor_name"]').value,
            room_sold: getVal('room_sold'),
            room_available: getVal('room_available'),
            revenue: getVal('revenue'),
            arr: getVal('arr'),
            occupancy: getVal('room_available') > 0 ? (getVal('room_sold') / getVal('room_available')) : 0,
            revpar: getVal('revpar')
        };
        competitors.push(competitor);
    });

    // 3. Calculate Market Totals
    const market = {
        room_sold: (parseFloat(subjectData.room_sold) || 0) + competitors.reduce((sum, c) => sum + c.room_sold, 0),
        room_available: (parseFloat(subjectData.room_available) || 0) + competitors.reduce((sum, c) => sum + c.room_available, 0),
        revenue: (parseFloat(subjectData.room_revenue) || 0) + competitors.reduce((sum, c) => sum + c.revenue, 0),
        number_of_rooms: (parseFloat(subjectData.number_of_rooms) || 0) + competitors.reduce((sum, c) => {
            const numRoomsInput = c.rowElement.querySelector('[data-field="number_of_rooms"]');
            return sum + (numRoomsInput ? parseFormattedNumber(numRoomsInput.value) : 0);
        }, 0),
    };

    // BARU: Hitung total room sold HANYA untuk kompetitor, untuk kalkulasi market share di tabel.
    const totalCompetitorRoomSold = competitors.reduce((sum, c) => sum + c.room_sold, 0);

    // 4. Calculate Market Averages
    const market_occ_ratio = market.room_available > 0 ? (market.room_sold / market.room_available) : 0;
    const market_revpar = market.room_available > 0 ? (market.revenue / market.room_available) : 0;
    const market_arr = market.room_sold > 0 ? (market.revenue / market.room_sold) : 0;

    // 5. Calculate Indices for each property and build a list for ranking
    const allProperties = [];
    const subjectRoomAvailable = parseFloat(subjectData.room_available) || 0;
    const subjectRoomSold = parseFloat(subjectData.room_sold) || 0;
    const subjectOcc = subjectRoomAvailable > 0 ? (subjectRoomSold / subjectRoomAvailable) : 0;
    const subjectArr = subjectData.room_sold > 0 ? (subjectData.room_revenue / subjectData.room_sold) : 0;
    const subjectRevpar = subjectData.room_available > 0 ? (subjectData.room_revenue / subjectData.room_available) : 0;

    allProperties.push({
        name: 'Subject Hotel',
        mpi: market_occ_ratio > 0 ? (subjectOcc / market_occ_ratio) : 0,
        ari: market_arr > 0 && subjectArr > 0 ? (subjectArr / market_arr) : 0,
        rgi: market_revpar > 0 && subjectRevpar > 0 ? (subjectRevpar / market_revpar) : 0,
    });

    competitors.forEach(comp => {
        // PERUBAHAN: Kalkulasi market share di tabel sekarang berdasarkan total room sold kompetitor saja,
        // agar konsisten dengan logika pada grafik.
        comp.market_share = totalCompetitorRoomSold > 0 ? (comp.room_sold / totalCompetitorRoomSold) * 100 : 0;
        comp.mpi = market_occ_ratio > 0 ? (comp.occupancy / market_occ_ratio) : 0;
        comp.ari = market_arr > 0 && comp.arr > 0 ? (comp.arr / market_arr) : 0;
        comp.rgi = market_revpar > 0 && comp.revpar > 0 ? (comp.revpar / market_revpar) : 0;
        
        allProperties.push({
            name: comp.name,
            mpi: comp.mpi,
            ari: comp.ari,
            rgi: comp.rgi
        });
    });

    // 6. Rank properties by MPI
    const rankedByMpi = [...allProperties].sort((a, b) => b.mpi - a.mpi);

    // Simpan data untuk pembaruan grafik
    lastCompetitorMetricsData = { allProperties, subjectData, competitors };

    // Panggil fungsi untuk merender grafik
    renderCompetitorCharts();

    // 7. Update UI and prepare data for saving
    const dataToSave = [];
    competitors.forEach(comp => {
        const rank = rankedByMpi.findIndex(p => p.name === comp.name) + 1;
        comp.rank_mpi = rank > 0 ? rank : '';

        // Update UI fields directly for clarity and robustness
        const marketShareInput = comp.rowElement.querySelector('[data-field="market_share"]');
        if (marketShareInput) marketShareInput.value = (isNaN(comp.market_share) || !isFinite(comp.market_share)) ? '' : `${comp.market_share.toFixed(2)}%`;

        const mpiInput = comp.rowElement.querySelector('[data-field="mpi"]');
        if (mpiInput) mpiInput.value = (!isNaN(comp.mpi) && isFinite(comp.mpi)) ? comp.mpi.toFixed(2) : '';

        const ariInput = comp.rowElement.querySelector('[data-field="ari"]');
        if (ariInput) ariInput.value = (!isNaN(comp.ari) && isFinite(comp.ari)) ? comp.ari.toFixed(2) : '';

        const rgiInput = comp.rowElement.querySelector('[data-field="rgi"]');
        if (rgiInput) rgiInput.value = (!isNaN(comp.rgi) && isFinite(comp.rgi)) ? comp.rgi.toFixed(2) : '';
        
        const rankInput = comp.rowElement.querySelector('[data-field="rank_mpi"]');
        if (rankInput) rankInput.value = comp.rank_mpi || '';

        // Prepare data for saving
        dataToSave.push({
            competitor_name: comp.name,
            number_of_rooms: parseFormattedNumber(comp.rowElement.querySelector('[data-field="number_of_rooms"]').value),
            room_available: comp.room_available,
            room_sold: comp.room_sold,
            arr: comp.arr,
            occupancy_percent: comp.occupancy * 100,
            revenue: comp.revenue,
            revpar: comp.revpar,
            market_share: comp.market_share,
            mpi: comp.mpi,
            ari: comp.ari,
            rgi: comp.rgi,
            rank_mpi: comp.rank_mpi
        });
    });

    return { dataToSave, marketTotals: market };
}

async function saveHotelCompetitorData() {
    const hotelId = document.getElementById('hotel-competitor-hotel-select').value;
    const date = document.getElementById('hotel-competitor-start-date').value;
    const saveBtn = document.getElementById('save-hotel-competitor-btn');

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Menghitung & Menyimpan...';

    try {
        // 1. Perform all calculations and get the data ready for saving
        const { dataToSave, marketTotals } = await calculateAllCompetitorMetrics();

        if (!dataToSave) { // Calculation failed
            throw new Error("Perhitungan metrik gagal. Data tidak disimpan.");
        }

        // 2. Update the totals row with the definitive market data used for calculation
        updateHotelCompetitorTotals(marketTotals);

        // 3. Save the fully calculated data
        await fetchAPI('/api/competitor', {
            method: 'POST',
            body: JSON.stringify({ hotel_id: hotelId, date, data: dataToSave })
        });

        showToast('Data hotel competitor berhasil dihitung dan disimpan!', 'success');

    } catch (error) {
        console.error('Error saving or reloading hotel competitor data:', error);
        showToast(error.message || 'Gagal menyimpan atau memuat ulang data.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-save mr-1"></i> Simpan Data';
    }
}

function updateHotelCompetitorTotals(marketData = null) {
    let totalNumRooms, totalAvailable, totalSold, totalRevenue;
    let hasData = false;

    if (marketData && Object.keys(marketData).length > 0) {
        // Use the definitive market data passed from the calculation function
        totalNumRooms = marketData.number_of_rooms || 0;
        totalAvailable = marketData.room_available || 0;
        totalSold = marketData.room_sold || 0;
        totalRevenue = marketData.revenue || 0;
        hasData = true;
    } else {
        // Fallback for reset or initial empty state: sum the visible rows
        const tableBody = document.getElementById('hotel-competitor-table-body');
        const rows = tableBody.querySelectorAll('tr');
        totalNumRooms = 0;
        totalAvailable = 0;
        totalSold = 0;
        totalRevenue = 0;

        rows.forEach(row => {
            // Check if it's a data row before trying to parse
            if (row.querySelector('[data-field="competitor_name"]')?.value) {
                hasData = true;
                const getVal = (field) => parseFormattedNumber(row.querySelector(`[data-field="${field}"]`)?.value);
                totalNumRooms += getVal('number_of_rooms');
                totalAvailable += getVal('room_available');
                totalSold += getVal('room_sold');
                totalRevenue += getVal('revenue');
            }
        });
    }
    
    const totalOcc = totalAvailable > 0 ? (totalSold / totalAvailable) * 100 : 0;
    const totalArr = totalSold > 0 ? totalRevenue / totalSold : 0;
    const totalRevpar = totalAvailable > 0 ? totalRevenue / totalAvailable : 0;

    let tfoot = document.getElementById('hotel-competitor-table-foot');
    if (!tfoot) {
        const table = document.getElementById('hotel-competitor-table');
        if (table) {
            tfoot = document.createElement('tfoot');
            tfoot.id = 'hotel-competitor-table-foot';
            table.appendChild(tfoot);
        }
    }
    if (tfoot) {
        if (!hasData) {
            tfoot.innerHTML = `
                <tr class="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td class="border px-4 py-2">TOTAL</td>
                    <td class="border px-4 py-2 text-center" colspan="12">-</td>
                </tr>
            `;
        } else {
            tfoot.innerHTML = `
                <tr class="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <td class="border px-4 py-2">TOTAL</td>
                    <td class="border px-4 py-2 text-center">${formatNumber(totalNumRooms)}</td>
                    <td class="border px-4 py-2 text-center">${formatNumber(totalAvailable)}</td>
                    <td class="border px-4 py-2 text-center">${formatNumber(totalSold)}</td>
                    <td class="border px-4 py-2 text-center">${totalOcc.toFixed(2)}%</td>
                    <td class="border px-4 py-2 text-center">${formatNumber(totalArr)}</td>
                    <td class="border px-4 py-2 text-center">${formatNumber(totalRevpar)}</td>
                    <td class="border px-4 py-2 text-center">${formatNumber(totalRevenue)}</td>
                    <td class="border px-4 py-2 text-center">100.00%</td>
                    <td class="border px-4 py-2 text-center">1.00</td>
                    <td class="border px-4 py-2 text-center">1.00</td>
                    <td class="border px-4 py-2 text-center">1.00</td>
                    <td class="border px-4 py-2 text-center">-</td>
                </tr>
            `;
        }
    }
}

/**
 * Menghapus dan membersihkan instance grafik.
 */
function clearCompetitorCharts() {
    if (marketShareChartInstance) {
        marketShareChartInstance.destroy();
        marketShareChartInstance = null;
    }
    if (mpiChartInstance) {
        mpiChartInstance.destroy();
        mpiChartInstance = null;
    }
    const chartsContainer = document.getElementById('hotel-competitor-charts-container');
    if (chartsContainer) {
        chartsContainer.classList.add('hidden');
    }
}

/**
 * Fungsi utama untuk merender kedua grafik kompetitor.
 * @param {Array} competitors - Data kompetitor yang sudah dihitung.
 * @param {Array} rankedProperties - Properti yang sudah diurutkan berdasarkan MPI.
 * @param {Object} subjectData - Data DSR dari hotel subjek.
 */
function renderCompetitorCharts() {
    const chartsContainer = document.getElementById('hotel-competitor-charts-container');
    if (!chartsContainer || !lastCompetitorMetricsData) return;

    const { competitors, subjectData } = lastCompetitorMetricsData;

    if (competitors.length === 0) {
        clearCompetitorCharts();
        return;
    }

    chartsContainer.classList.remove('hidden');

    // --- Market Share Chart ---
    // PERBAIKAN: Hitung ulang market share hanya untuk kompetitor agar total chart 100%.
    const totalCompetitorRoomSold = competitors.reduce((sum, c) => sum + (c.room_sold || 0), 0);
    const marketShareLabels = [];
    const marketShareData = [];

    if (totalCompetitorRoomSold > 0) {
        competitors.forEach(c => {
            marketShareLabels.push(c.name);
            marketShareData.push(((c.room_sold || 0) / totalCompetitorRoomSold) * 100);
        });
    }
    
    initMarketShareChart(marketShareLabels, marketShareData);

    // --- Index Chart (MPI/ARI/RGI/All) ---
    updateIndexChart();
}

/**
 * Menginisialisasi atau memperbarui grafik Market Share (Doughnut).
 * @param {Array<string>} labels - Nama-nama hotel.
 * @param {Array<number>} data - Nilai market share.
 */
function initMarketShareChart(labels, data) {
    const ctx = document.getElementById('competitor-market-share-chart')?.getContext('2d');
    if (!ctx) return;

    if (marketShareChartInstance) marketShareChartInstance.destroy();

    marketShareChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Market Share',
                data: data,
                backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b', '#a7f3d0', '#fca5a5'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                tooltip: { callbacks: { label: (c) => `${c.label}: ${c.raw.toFixed(2)}%` } }
            }
        }
    });
}

/**
 * Menginisialisasi atau memperbarui grafik MPI (Horizontal Bar).
 * @param {Array<string>} labels - Nama-nama hotel.
 * @param {Array<number>} data - Nilai MPI.
 */
function initIndexChart(labels, datasets, isStacked = false) {
    const ctx = document.getElementById('competitor-mpi-chart')?.getContext('2d');
    if (!ctx) return;

    if (mpiChartInstance) mpiChartInstance.destroy();

    mpiChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets.map(ds => ({ ...ds, borderWidth: 1, borderRadius: 4 }))
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: isStacked,
                    beginAtZero: true,
                    title: { display: true, text: 'Nilai Indeks' }
                },
                y: {
                    stacked: isStacked,
                }
            },
            plugins: {
                legend: {
                    display: isStacked, // Hanya tampilkan legenda untuk grafik tumpuk
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: (c) => ` ${c.dataset.label}: ${c.raw}`
                    }
                }
            }
        }
    });
}

/**
 * BARU: Memperbarui grafik indeks (MPI/ARI/RGI/All) berdasarkan state saat ini.
 */
function updateIndexChart() {
    if (!lastCompetitorMetricsData) return;

    const { allProperties } = lastCompetitorMetricsData;
    if (!allProperties || allProperties.length === 0) {
        if (mpiChartInstance) {
            mpiChartInstance.destroy();
            mpiChartInstance = null;
        }
        return;
    }

    const isStacked = currentIndexChartType === 'all';
    let datasets = [];
    let sortedProperties = [];

    const colors = { mpi: '#3b82f6', ari: '#10b981', rgi: '#f97316' };

    if (isStacked) {
        sortedProperties = [...allProperties].sort((a, b) => b.mpi - a.mpi); // Urutkan berdasarkan MPI untuk tampilan tumpuk
        datasets = [
            { label: 'MPI', data: sortedProperties.map(p => p.mpi.toFixed(2)), backgroundColor: colors.mpi },
            { label: 'ARI', data: sortedProperties.map(p => p.ari.toFixed(2)), backgroundColor: colors.ari },
            { label: 'RGI', data: sortedProperties.map(p => p.rgi.toFixed(2)), backgroundColor: colors.rgi },
        ];
    } else {
        const sortKey = currentIndexChartType;
        sortedProperties = [...allProperties].sort((a, b) => b[sortKey] - a[sortKey]);
        datasets = [{
            label: sortKey.toUpperCase(),
            data: sortedProperties.map(p => p[sortKey].toFixed(2)),
            backgroundColor: colors[sortKey],
        }];
    }

    const labels = sortedProperties.map(p => p.name);
    initIndexChart(labels, datasets, isStacked);
}
