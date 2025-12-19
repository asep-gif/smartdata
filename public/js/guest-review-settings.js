function initGuestReviewSettingsPage() {
    const hotelSelect = document.getElementById('review-settings-hotel-select');
    const settingsForm = document.getElementById('review-settings-form');
    const promoEnabledCheckbox = document.getElementById('review-settings-promo-enabled');
    const promoFieldsContainer = document.getElementById('review-settings-promo-fields');
    const logoInput = document.getElementById('review-settings-logo-input');
    const logoPreview = document.getElementById('review-settings-logo-preview');
    const promoInput = document.getElementById('review-settings-promo-input');
    const promoPreview = document.getElementById('review-settings-promo-preview');

    // BARU: Elemen untuk link yang bisa dibagikan
    const linkContainer = document.getElementById('review-link-container');
    const linkInput = document.getElementById('review-form-link');
    const copyLinkBtn = document.getElementById('copy-review-link-btn');

    async function loadHotelsForSettings() {
        try {
            const hotels = await fetchAPI('/api/reviews/hotels');
            hotelSelect.innerHTML = '<option value="">-- Pilih Hotel --</option>';
            hotels.forEach(hotel => {
                const option = document.createElement('option');
                option.value = hotel.id;
                option.textContent = hotel.name;
                hotelSelect.appendChild(option);
            });
        } catch (error) {
            hotelSelect.innerHTML = '<option value="">Gagal memuat hotel</option>';
            console.error('Failed to load hotels for settings:', error);
        }
    }

    async function loadSettingsForHotel(hotelId) {
        if (!hotelId) {
            settingsForm.classList.add('hidden');
            linkContainer.classList.add('hidden'); // Sembunyikan link jika tidak ada hotel
            return;
        }

        // Tampilkan form dan link container
        settingsForm.classList.remove('hidden');
        linkContainer.classList.remove('hidden');
        
        // Buat dan tampilkan link unik
        const formUrl = `${window.location.origin}/public/guest-review-form.html?hotel_id=${hotelId}`;
        linkInput.value = formUrl;

        try {
            const settings = await fetchAPI(`/api/reviews/settings/${hotelId}`);
            
            document.getElementById('review-settings-hotel-id').value = hotelId;
            document.getElementById('review-settings-header').value = settings.header_text || '';
            document.getElementById('review-settings-subheader').value = settings.subheader_text || '';
            
            logoPreview.src = settings.logo_url ? `${API_BASE_URL}${settings.logo_url}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzljYTNhZiIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MTUweDE1MDwvdGV4dD48L3N2Zz4=';
            document.getElementById('review-settings-existing-logo-url').value = settings.logo_url || '';

            promoEnabledCheckbox.checked = settings.promo_enabled || false;
            document.getElementById('review-settings-promo-title').value = settings.promo_title || '';
            document.getElementById('review-settings-promo-desc').value = settings.promo_description || '';
            promoPreview.src = settings.promo_image_url ? `${API_BASE_URL}${settings.promo_image_url}` : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzljYTNhZiIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+MzAweDIwMDwvdGV4dD48L3N2Zz4=';
            document.getElementById('review-settings-existing-promo-image-url').value = settings.promo_image_url || '';

            togglePromoFields();

        } catch (error) {
            showToast(`Gagal memuat pengaturan: ${error.message}`, 'error');
            settingsForm.classList.add('hidden');
            linkContainer.classList.add('hidden');
        }
    }

    async function handleSaveSettings(event) {
        event.preventDefault();
        const saveBtn = document.getElementById('review-settings-save-btn');
        const originalBtnText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Menyimpan...`;

        const formData = new FormData(settingsForm);

        try {
            await fetchAPI('/api/reviews/settings', {
                method: 'POST',
                body: formData,
            });

            showToast('Pengaturan berhasil disimpan!', 'success');
            loadSettingsForHotel(formData.get('hotel_id'));

        } catch (error) {
            showToast(error.message || 'Gagal menyimpan pengaturan.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnText;
        }
    }

    function togglePromoFields() {
        if (promoEnabledCheckbox.checked) {
            promoFieldsContainer.classList.remove('hidden');
        } else {
            promoFieldsContainer.classList.add('hidden');
        }
    }

    function setupImagePreview(input, preview) {
        input.addEventListener('change', () => {
            const file = input.files[0];
            if (file) {
                preview.src = URL.createObjectURL(file);
            }
        });
    }

    // BARU: Fungsi untuk menyalin link ke clipboard
    function copyLinkToClipboard() {
        linkInput.select();
        document.execCommand('copy');
        showToast('Link disalin!', 'success');
    }

    // Event Listeners
    hotelSelect.addEventListener('change', () => loadSettingsForHotel(hotelSelect.value));
    promoEnabledCheckbox.addEventListener('change', togglePromoFields);
    settingsForm.addEventListener('submit', handleSaveSettings);
    setupImagePreview(logoInput, logoPreview);
    setupImagePreview(promoInput, promoPreview);
    copyLinkBtn.addEventListener('click', copyLinkToClipboard); // BARU

    // Initial call
    loadHotelsForSettings();
}