// ===== Equalizer Module =====
import { player } from './player.js';
import { getEQSettings, saveEQSettings } from './storage.js';

const PRESETS = {
    flat: [0, 0, 0, 0, 0],
    bass: [6, 4, 0, 0, 0],
    rock: [4, 2, -1, 3, 5],
    pop: [-1, 2, 4, 2, -1],
    jazz: [3, 1, -2, 1, 4],
    classical: [4, 2, -1, 2, 3]
};

let currentPreset = 'flat';
let currentBands = [0, 0, 0, 0, 0];

// Initialize EQ from saved settings
export function initEqualizer() {
    const saved = getEQSettings();
    currentPreset = saved.preset || 'flat';
    currentBands = saved.bands || [0, 0, 0, 0, 0];
    applyBands(currentBands);
    updateUI();
}

// Apply band values to player filters
function applyBands(bands) {
    bands.forEach((gain, i) => {
        player.setEQBand(i, gain);
    });
}

// Set preset
export function setPreset(name) {
    if (!PRESETS[name]) return;
    currentPreset = name;
    currentBands = [...PRESETS[name]];
    applyBands(currentBands);
    saveEQSettings({ preset: currentPreset, bands: currentBands });
    updateUI();
}

// Set individual band
export function setBand(index, gain) {
    currentBands[index] = gain;
    player.setEQBand(index, gain);
    currentPreset = 'custom';
    saveEQSettings({ preset: currentPreset, bands: currentBands });
    updatePresetUI();
}

// Get current state
export function getState() {
    return { preset: currentPreset, bands: [...currentBands] };
}

// Update UI
function updateUI() {
    updatePresetUI();
    updateSliderUI();
}

function updatePresetUI() {
    document.querySelectorAll('.eq-preset').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === currentPreset);
    });
}

function updateSliderUI() {
    document.querySelectorAll('.eq-slider').forEach(slider => {
        const band = parseInt(slider.dataset.band);
        slider.value = currentBands[band];
    });
}

// Setup event listeners
export function setupEQListeners() {
    // Preset buttons
    document.querySelectorAll('.eq-preset').forEach(btn => {
        btn.addEventListener('click', () => setPreset(btn.dataset.preset));
    });

    // Sliders
    document.querySelectorAll('.eq-slider').forEach(slider => {
        slider.addEventListener('input', () => {
            const band = parseInt(slider.dataset.band);
            const gain = parseFloat(slider.value);
            setBand(band, gain);
        });
    });

    // Open/close modal
    const eqModal = document.getElementById('eq-modal');
    document.getElementById('btn-eq')?.addEventListener('click', () => {
        eqModal.classList.remove('hidden');
        updateUI();
    });
    document.getElementById('np-eq-btn')?.addEventListener('click', () => {
        eqModal.classList.remove('hidden');
        updateUI();
    });
    document.getElementById('eq-close')?.addEventListener('click', () => {
        eqModal.classList.add('hidden');
    });
    eqModal?.addEventListener('click', (e) => {
        if (e.target === eqModal) eqModal.classList.add('hidden');
    });
}
