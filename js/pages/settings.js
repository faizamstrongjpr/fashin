// ===== Settings Page =====
import { getQuality, saveQuality } from '../storage.js';
import { showToast } from '../app.js';
import { clearCache } from '../piped.js';

export async function render(container) {
    const currentQuality = getQuality();

    container.innerHTML = `
    <div class="settings-page animate-fade-in">
        <div class="page-header">
            <h1>⚙️ Pengaturan</h1>
        </div>

        <div class="settings-section">
            <h2 class="settings-title">Kualitas Streaming</h2>
            <div class="settings-card">
                <div class="radio-group">
                    <label class="radio-label">
                        <input type="radio" name="quality" value="standard" ${currentQuality === 'standard' ? 'checked' : ''}>
                        <div class="radio-content">
                            <span class="radio-title">Standar (MP3)</span>
                            <span class="radio-desc">Hemat kuota, kualitas standar.</span>
                        </div>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="quality" value="high" ${currentQuality === 'high' ? 'checked' : ''}>
                        <div class="radio-content">
                            <span class="radio-title">High (M4A)</span>
                            <span class="radio-desc">Kualitas tinggi, seimbang.</span>
                        </div>
                    </label>
                    <label class="radio-label">
                        <input type="radio" name="quality" value="lossless" ${currentQuality === 'lossless' ? 'checked' : ''}>
                        <div class="radio-content">
                            <span class="radio-title">Lossless (Auto)</span>
                            <span class="radio-desc">Kualitas terbaik (Opus), penggunaan data tinggi.</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <div class="settings-section">
            <h2 class="settings-title">Tampilan</h2>
            <div class="settings-card">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span>Mode Gelap</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="settings-theme-toggle">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        </div>

        <div class="settings-section">
             <div class="settings-card" style="text-align:center;color:var(--text-secondary);font-size:0.8rem;">
                <p>FASHIN Play v1.0.0</p>
                <p>Made with ❤️ by FAIZ</p>
             </div>
        </div>
    </div>
    
    <style>
        .settings-section { margin-bottom: 32px; }
        .settings-title { font-size: 1.1rem; margin-bottom: 12px; color: var(--text-primary); }
        .settings-card { 
            background: var(--bg-card); 
            border-radius: var(--radius-lg); 
            padding: 20px; 
            box-shadow: var(--shadow-sm); 
            border: 1px solid var(--border);
        }
        .radio-group { display: flex; flex-direction: column; gap: 16px; }
        .radio-label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; }
        .radio-label input { margin-top: 4px; }
        .radio-content { display: flex; flex-direction: column; }
        .radio-title { font-weight: 500; color: var(--text-primary); }
        .radio-desc { font-size: 0.85rem; color: var(--text-secondary); }
        
        /* Toggle Switch */
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--gray-300); transition: .4s; border-radius: 24px; }
        .toggle-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .toggle-slider { background-color: var(--accent); }
        input:checked + .toggle-slider:before { transform: translateX(20px); }
    </style>
    `;

    // Quality Logic
    container.querySelectorAll('input[name="quality"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            saveQuality(e.target.value);
            clearCache(); // Clear streaming cache so new quality takes effect
            showToast(`Kualitas diubah ke ${e.target.parentElement.querySelector('.radio-title').textContent}`);
        });
    });

    // Theme Logic (Sync with main toggle)
    const themeCheckbox = document.getElementById('settings-theme-toggle');
    const mainCheckbox = document.getElementById('theme-toggle-checkbox');

    if (themeCheckbox && mainCheckbox) {
        themeCheckbox.checked = mainCheckbox.checked;
        themeCheckbox.addEventListener('change', () => {
            mainCheckbox.click(); // Trigger main toggle logic
        });
    }
}
