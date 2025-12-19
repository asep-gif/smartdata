// --- AUTHENTICATION & PROFILE FUNCTIONS ---

function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

/**
 * Membuka modal profil dan mengisi data pengguna.
 */
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Data pengguna tidak ditemukan. Silakan login kembali.');
        return;
    }

    // Isi informasi dasar
    document.getElementById('profile-modal-name').textContent = user.full_name || user.username;
    document.getElementById('profile-modal-email').textContent = user.email;
    document.getElementById('profile-modal-role').textContent = user.role;

    // Tampilkan hak akses hotel jika role adalah 'staff'
    const hotelSection = document.getElementById('profile-hotel-access-section');
    const hotelList = document.getElementById('profile-hotel-list');
    if (user.role === 'staff' && Array.isArray(user.hotels) && user.hotels.length > 0) {
        hotelList.innerHTML = ''; // Kosongkan daftar
        user.hotels.forEach(hotel => {
            const li = document.createElement('li');
            li.textContent = hotel.name;
            hotelList.appendChild(li);
        });
        hotelSection.classList.remove('hidden');
    } else {
        hotelSection.classList.add('hidden');
    }

    // Reset form dan tampilkan modal
    document.getElementById('change-password-form').reset();
    document.getElementById('change-password-error').classList.add('hidden');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

/**
 * Menutup modal profil.
 */
function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Menangani pengiriman form untuk mengubah password.
 */
async function handleChangePasswordSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = document.getElementById('change-password-submit-btn');
    const errorDiv = document.getElementById('change-password-error');

    const currentPassword = form.current_password.value;
    const newPassword = form.new_password.value;
    const confirmPassword = form.confirm_password.value;

    if (newPassword !== confirmPassword) {
        errorDiv.textContent = 'Password baru dan konfirmasi tidak cocok.';
        errorDiv.classList.remove('hidden');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Mengubah...';
    errorDiv.classList.add('hidden');

    try {
        await fetchAPI('/api/users/change-password', {
            method: 'PUT',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        alert('Password berhasil diubah!');
        closeProfileModal();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-key mr-2"></i> Ubah Password';
    }
}