/**
 * audit-calendar.js
 * Mengelola fungsionalitas untuk halaman kalender agenda audit.
 * Menggunakan FullCalendar.js untuk menampilkan jadwal.
 */

let auditCalendar = null; // Variabel untuk menyimpan instance kalender
let allAuditEvents = []; // BARU: Menyimpan semua event yang diambil dari API
let currentFilterStatus = 'all'; // BARU: Menyimpan status filter saat ini

/**
 * Mengonversi data agenda dari API menjadi format event FullCalendar.
 * @param {Array<Object>} agendas - Array objek agenda dari API.
 * @returns {Array<Object>} Array objek event untuk FullCalendar.
 */
function mapAgendasToEvents(agendas) {
    const statusColors = {
        planned: { bg: '#3b82f6', border: '#2563eb' },       // blue-500, blue-600
        on_progress: { bg: '#f97316', border: '#ea580c' }, // orange-500, orange-600
        completed: { bg: '#10b981', border: '#059669' },   // emerald-500, emerald-600
        cancelled: { bg: '#64748b', border: '#475569' },   // slate-500, slate-600
    };

    return agendas.map(agenda => {
        const colors = statusColors[agenda.status] || statusColors.cancelled;
        return {
            id: agenda.id,
            title: `Audit: ${agenda.hotel_name}`,
            start: agenda.date, // FullCalendar can parse ISO 8601 date strings
            allDay: true, // Asumsikan semua agenda adalah event seharian
            backgroundColor: colors.bg,
            borderColor: colors.border,
            extendedProps: {
                auditor: agenda.auditor,
                status: agenda.status,
                notes: agenda.notes || '-',
                hotelName: agenda.hotel_name,
                hotelId: agenda.hotel_id
            }
        };
    });
}

/**
 * BARU: Mengisi dropdown filter hotel di halaman kalender.
 */
async function populateCalendarHotelFilter() {
    const hotelFilter = document.getElementById('audit-calendar-hotel-filter');
    // Jangan isi ulang jika sudah ada isinya (selain opsi "Semua Hotel")
    if (!hotelFilter || hotelFilter.options.length > 1) return;

    try {
        const hotels = await fetchAPI('/api/hotels');
        hotels.forEach(hotel => {
            hotelFilter.add(new Option(hotel.name, hotel.id));
        });
    } catch (error) {
        console.error("Gagal memuat filter hotel untuk kalender:", error);
    }
}

/**
 * BARU: Memfilter dan merender event di kalender berdasarkan status.
 */
function filterAndRenderCalendarEvents() {
    if (!auditCalendar) return;

    // BARU: Baca nilai dari kedua filter
    const selectedStatus = currentFilterStatus;
    const selectedHotelId = document.getElementById('audit-calendar-hotel-filter')?.value || 'all';

    let filteredEvents = allAuditEvents;

    // Terapkan filter status
    if (selectedStatus !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.extendedProps.status === selectedStatus);
    }
    // Terapkan filter hotel
    if (selectedHotelId !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.extendedProps.hotelId?.toString() === selectedHotelId);
    }

    // Update event source di kalender
    auditCalendar.getEventSources().forEach(source => source.remove());
    auditCalendar.addEventSource(filteredEvents);
}
/**
 * Menginisialisasi atau me-render ulang kalender audit.
 * Fungsi ini dirancang untuk dipanggil ketika halaman kalender ditampilkan.
 */
async function initializeAuditCalendar() {
    const calendarEl = document.getElementById('calendar');

    // Jika elemen kalender tidak ditemukan, hentikan eksekusi.
    if (!calendarEl) {
        console.error("Elemen dengan ID 'calendar' tidak ditemukan.");
        return;
    }

    // BARU: Panggil fungsi untuk mengisi filter hotel
    await populateCalendarHotelFilter();

    // BARU: Setup event listener untuk filter (HANYA SEKALI)
    const statusFilterContainer = document.getElementById('audit-calendar-status-filter');
    if (statusFilterContainer && !statusFilterContainer.dataset.listenerAttached) {
        statusFilterContainer.addEventListener('click', (event) => {
            const button = event.target.closest('.audit-status-filter-btn');
            if (button) {
                currentFilterStatus = button.dataset.status;
                // Update UI tombol
                document.querySelectorAll('.audit-status-filter-btn').forEach(btn => btn.classList.remove('active-filter-btn'));
                button.classList.add('active-filter-btn');
                // Terapkan semua filter
                filterAndRenderCalendarEvents();
            }
        });
        statusFilterContainer.dataset.listenerAttached = 'true';
    }
    const hotelFilter = document.getElementById('audit-calendar-hotel-filter');
    if (hotelFilter && !hotelFilter.dataset.listenerAttached) {
        hotelFilter.addEventListener('change', filterAndRenderCalendarEvents);
        hotelFilter.dataset.listenerAttached = 'true';
    }

    // --- Ambil data dari API ---
    try {
        const agendas = await fetchAPI('/api/audit-agendas');
        // Simpan data yang sudah dipetakan ke variabel global
        allAuditEvents = mapAgendasToEvents(agendas);
    } catch (error) {
        console.error("Gagal memuat data agenda untuk kalender:", error);
        showToast("Gagal memuat data agenda.", "error");
        // Tampilkan pesan error di kalender jika gagal
        calendarEl.innerHTML = `<div class="text-center p-8 text-red-500">Gagal memuat data agenda: ${error.message}</div>`;
        return;
    }

    // Jika kalender sudah diinisialisasi, cukup panggil fungsi filter dan render ulang.
    if (auditCalendar) {
        filterAndRenderCalendarEvents(); // Terapkan filter yang aktif
        auditCalendar.render();
        return;
    }

    // Inisialisasi instance FullCalendar
    auditCalendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'id', // Mengatur bahasa ke Indonesia
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        events: [], // Mulai dengan array kosong, data akan di-load oleh filterAndRenderCalendarEvents
        editable: true,      // Mengizinkan event di-drag dan di-resize
        selectable: true,    // Mengizinkan pemilihan tanggal

        eventClick: function(info) {
            info.jsEvent.preventDefault(); // Mencegah browser mengikuti link (jika ada)
            const agendaId = info.event.id;
            if (agendaId && typeof openAddEditAgendaModal === 'function') {
                openAddEditAgendaModal(agendaId);
            } else {
                // Fallback ke alert jika fungsi tidak ditemukan
                const props = info.event.extendedProps;
                const eventDetails = `Agenda: ${info.event.title}\nAuditor: ${props.auditor || 'N/A'}\nStatus: ${props.status || 'N/A'}\nMulai: ${info.event.start ? formatDate(info.event.start) + ' ' + formatTime(info.event.start) : 'N/A'}`;
                alert(eventDetails.trim());
            }
        },

        dateClick: function(info) {
            // Panggil modal untuk membuat agenda baru dengan tanggal yang diklik
            if (typeof openAddEditAgendaModal === 'function') {
                openAddEditAgendaModal(null, info.dateStr); // Kirim null untuk ID, dan tanggal yang diklik
            } else {
                console.error('Fungsi openAddEditAgendaModal tidak ditemukan.');
                alert('Tidak dapat membuka modal tambah agenda.');
            }
        },
        
        // BARU: Menambahkan tooltip saat mouse diarahkan ke event
        eventMouseEnter: function(info) {
            // Hapus tooltip lama jika ada (untuk kasus mouse bergerak cepat antar event)
            document.getElementById('fc-tooltip-custom')?.remove();

            const props = info.event.extendedProps;
            const tooltip = document.createElement('div');
            tooltip.id = 'fc-tooltip-custom'; // ID unik untuk menghapusnya
            tooltip.className = 'fc-tooltip fade-in-fast'; // Tambahkan class fade-in
            tooltip.innerHTML = `
                <div class="fc-tooltip-title">${info.event.title}</div>
                <p class="mb-1"><strong>Auditor:</strong> ${props.auditor || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="font-medium capitalize">${(props.status || 'N/A').replace('_', ' ')}</span></p>
            `;
            document.body.appendChild(tooltip);

            // Posisikan tooltip di atas event
            const eventRect = info.el.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            let top = eventRect.top + window.scrollY - tooltipRect.height - 8; // 8px offset
            let left = eventRect.left + window.scrollX + (eventRect.width / 2) - (tooltipRect.width / 2);

            // Pastikan tooltip tidak keluar dari viewport
            if (left < 5) left = 5;
            if ((left + tooltipRect.width) > window.innerWidth) left = window.innerWidth - tooltipRect.width - 5;
            if (top < (window.scrollY + 5)) top = eventRect.bottom + window.scrollY + 8;

            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        },

        eventMouseLeave: function(info) {
            document.getElementById('fc-tooltip-custom')?.remove();
        },

        // BARU: Menangani event drop (memindahkan agenda)
        eventDrop: async function(info) {
            const { event } = info;
            const newDate = event.start.toISOString().split('T')[0]; // Format YYYY-MM-DD

            if (!confirm(`Anda yakin ingin memindahkan agenda "${event.title}" ke tanggal ${newDate}?`)) {
                info.revert(); // Kembalikan event ke posisi semula
                return;
            }

            try {
                // Ambil data asli agenda untuk mendapatkan semua properti
                const originalAgenda = await fetchAPI(`/api/audit-agendas/${event.id}`);
                
                // Siapkan payload untuk update
                const payload = {
                    ...originalAgenda,
                    date: newDate // Update tanggalnya saja
                };

                // Kirim update ke API
                await fetchAPI(`/api/audit-agendas/${event.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });

                // BARU: Update data di array global agar konsisten tanpa perlu fetch ulang
                const eventIndex = allAuditEvents.findIndex(e => e.id.toString() === event.id.toString());
                if (eventIndex > -1) {
                    // Cukup update tanggalnya di data master
                    allAuditEvents[eventIndex].start = newDate;
                }

                showToast('Tanggal agenda berhasil diperbarui.', 'success');
                // Refresh tabel di halaman Agenda Audit jika sedang ditampilkan
                if (document.getElementById('page-agenda-audit').classList.contains('block')) {
                    loadAuditAgendas();
                }

                // Tidak perlu render ulang kalender, FullCalendar sudah menanganinya.

            } catch (error) {
                showToast(`Gagal memperbarui tanggal: ${error.message}`, 'error');
                info.revert(); // Kembalikan jika gagal
            }
        }
    });

    auditCalendar.render();
    // Panggil fungsi filter untuk pertama kali memuat event
    filterAndRenderCalendarEvents();
}

document.addEventListener('DOMContentLoaded', () => {
    // Hapus listener ini karena pemanggilan sudah ditangani oleh router di ui.js
});