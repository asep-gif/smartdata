// --- FORMATTING SETTINGS ---

const aplicationFormats = {
    number: {
        decimalSeparator: '.',
        thousandsSeparator: ',',
    },
    date: 'dd-mm-yyyy',
    time: '24h',
};

/**
 * Loads format settings from localStorage into the global settings object.
 */
function loadFormatSettings() {
    const savedFormats = localStorage.getItem('aplicationFormats');
    if (savedFormats) {
        try {
            const parsedFormats = JSON.parse(savedFormats);
            // Basic validation to ensure loaded settings are not malformed
            if (parsedFormats.number && parsedFormats.date && parsedFormats.time) {
                Object.assign(aplicationFormats, parsedFormats);
            }
        } catch (error) {
            console.error('Error parsing saved format settings:', error);
            // Fallback to default formats
            initializeDefaultFormats();
        }
    }
}

/**
 * Saves the current format settings to localStorage.
 * @param {object} newFormats - The new formats object to save.
 */
function saveFormatSettings(newFormats) {
    try {
        localStorage.setItem('aplicationFormats', JSON.stringify(newFormats));
        Object.assign(aplicationFormats, newFormats);
        // Optional: Notify other parts of the application about the change
        window.dispatchEvent(new Event('formatsChanged'));
        alert('Pengaturan format berhasil disimpan!');
    } catch (error) {
        console.error('Error saving format settings:', error);
        alert('Gagal menyimpan pengaturan format.');
    }
}

/**
 * Initializes the format settings form with current or saved values.
 */
function initFormatSettingsForm() {
    // Load saved settings first
    loadFormatSettings();

    const form = document.getElementById('format-settings-form');
    if (!form) return;

    // Populate form fields with current settings
    document.getElementById('setting-number-decimal-separator').value = aplicationFormats.number.decimalSeparator;
    document.getElementById('setting-number-thousands-separator').value = aplicationFormats.number.thousandsSeparator;
    document.getElementById('setting-date-format').value = aplicationFormats.date;
    document.getElementById('setting-time-format').value = aplicationFormats.time;

    // Add submit event listener
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const newFormats = {
            number: {
                decimalSeparator: document.getElementById('setting-number-decimal-separator').value,
                thousandsSeparator: document.getElementById('setting-number-thousands-separator').value,
            },
            date: document.getElementById('setting-date-format').value,
            time: document.getElementById('setting-time-format').value,
        };

        if (newFormats.number.decimalSeparator === newFormats.number.thousandsSeparator) {
            alert('Pemisah Desimal dan Pemisah Ribuan tidak boleh sama.');
            return;
        }

        saveFormatSettings(newFormats);
    });
}


// --- FORMATTING UTILITY FUNCTIONS ---

/**
 * Formats a number according to the saved user settings.
 * @param {number} num - The number to format.
 * @param {object} [options] - Formatting options.
 * @param {number} [options.decimalPlaces=2] - Number of decimal places.
 * @returns {string} The formatted number as a string.
 */
function formatNumber(num, options = {}) {
    const { decimalPlaces = 2 } = options;
    if (typeof num !== 'number' || !isFinite(num)) {
        return '0'; // Return a default value for invalid input
    }

    const { decimalSeparator, thousandsSeparator } = aplicationFormats.number;
    
    // Use Intl.NumberFormat for robust, locale-aware formatting if possible,
    // but since we allow custom separators, a manual approach is more direct.
    
    const fixedNum = num.toFixed(decimalPlaces);
    let [integerPart, decimalPart] = fixedNum.split('.');

    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    if (decimalPart) {
        return `${integerPart}${decimalSeparator}${decimalPart}`;
    }
    return integerPart;
}

/**
 * Formats a date object or date string according to the saved user settings.
 * @param {Date|string} dateInput - The date to format.
 * @returns {string} The formatted date as a string.
 */
function formatDate(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return ''; // Invalid date

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch (aplicationFormats.date) {
        case 'dd-mm-yyyy':
            return `${day}-${month}-${year}`;
        case 'mm-dd-yyyy':
            return `${month}-${day}-${year}`;
        case 'd MMMM yyyy':
            return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        case 'yyyy-mm-dd':
        default:
            return `${year}-${month}-${day}`;
    }
}

/**
 * Formats a date object or date string to show the time according to user settings.
 * @param {Date|string} dateInput - The date object with time info.
 * @returns {string} The formatted time as a string.
 */
function formatTime(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return ''; // Invalid date

    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (aplicationFormats.time === '12h') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = String(hours % 12 || 12).padStart(2, '0');
        return `${formattedHours}:${minutes} ${ampm}`;
    }

    // Default to 24h format
    return `${String(hours).padStart(2, '0')}:${minutes}`;
}


// Initialize form on settings page
// This assumes the script is loaded on the main page and can access the form when the hash changes.
// A more robust solution might involve calling this from the main router/script.
if (window.location.hash.includes('settings/formats')) {
    initFormatSettingsForm();
}
// Also load settings on initial page load so utility functions have the correct values.
loadFormatSettings();
