// ===== Search Page =====
import * as spotify from '../spotify.js';
import { player } from '../player.js';
import { trackCard, trackListItem, setupTrackCardListeners, setupTrackListListeners } from './home.js';
import { getSearchHistory, addToSearchHistory, removeFromSearchHistory, clearSearchHistory } from '../storage.js';

let searchTimeout = null;

export async function render(container) {
  container.innerHTML = `
    <div class="search-page animate-fade-in">
      <h1 style="margin-bottom:20px;">Cari Musik</h1>

      <div class="search-container">
        <div class="search-input-wrapper">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input type="search" class="search-input" id="search-input"
            placeholder="Cari lagu, artis, atau album..." autocomplete="off">
          <button class="search-clear hidden" id="search-clear">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>

      <div id="search-results"></div>
    </div>
  `;

  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear');

  // Show history initially
  showHistory();

  input.addEventListener('input', () => {
    const query = input.value.trim();
    clearBtn.classList.toggle('hidden', !query);

    if (searchTimeout) clearTimeout(searchTimeout);

    if (!query) {
      showHistory();
      return;
    }

    searchTimeout = setTimeout(() => performSearch(query), 400);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.classList.add('hidden');
    showHistory();
    input.focus();
  });

  setTimeout(() => input.focus(), 100);
}

function showHistory() {
  const results = document.getElementById('search-results');
  const history = getSearchHistory();

  if (!history.length) {
    results.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        <h3>Temukan musikmu</h3>
        <p>Ketik nama lagu, artis, atau album untuk memulai</p>
      </div>
    `;
    return;
  }

  results.innerHTML = `
    <div class="search-history" style="margin-top:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="color:var(--text-secondary);font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;">
          🕒 Riwayat Pencarian
        </h3>
        <button id="clear-all-history" style="
          background:none;border:none;color:var(--primary-400);
          font-size:0.75rem;cursor:pointer;padding:4px 8px;
          border-radius:4px;transition:all 0.2s;
        ">Hapus Semua</button>
      </div>
      <div id="history-list">
        ${history.map(q => `
          <div class="history-item" style="
            display:flex;align-items:center;gap:12px;padding:10px 12px;
            border-radius:8px;cursor:pointer;transition:background 0.2s;
            margin-bottom:2px;
          " data-query="${q.replace(/"/g, '&quot;')}">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;opacity:0.4;flex-shrink:0;">
              <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
            </svg>
            <span style="flex:1;color:var(--text-primary);font-size:0.9rem;">${q}</span>
            <button class="remove-history-btn" data-query="${q.replace(/"/g, '&quot;')}" title="Hapus" style="
              background:none;border:none;color:var(--text-secondary);
              cursor:pointer;padding:4px;border-radius:4px;opacity:0.5;
              transition:opacity 0.2s;display:flex;
            ">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px;">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Click on history item → search
  results.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.remove-history-btn')) return;
      const query = item.dataset.query;
      const input = document.getElementById('search-input');
      input.value = query;
      document.getElementById('search-clear').classList.remove('hidden');
      performSearch(query);
    });

    item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-elevated)');
    item.addEventListener('mouseleave', () => item.style.background = '');
  });

  // Remove individual history
  results.querySelectorAll('.remove-history-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromSearchHistory(btn.dataset.query);
      showHistory(); // Refresh
    });
  });

  // Clear all
  document.getElementById('clear-all-history')?.addEventListener('click', () => {
    clearSearchHistory();
    showHistory();
  });
}

async function performSearch(query) {
  const results = document.getElementById('search-results');
  results.innerHTML = `
    <div style="padding:20px 0">
      ${Array(5).fill('<div class="skeleton skeleton-item"></div>').join('')}
    </div>
  `;

  // Save to history
  addToSearchHistory(query);

  try {
    const tracks = await spotify.searchTracks(query, 20);

    if (!tracks.length) {
      results.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <h3>Tidak ditemukan</h3>
          <p>Coba kata kunci lain</p>
        </div>
      `;
      return;
    }

    results.innerHTML = `
      <div class="search-results-header" style="margin:16px 0 12px;">
        <h3 style="color:var(--text-secondary);font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;">
          Hasil untuk "${query}"
        </h3>
      </div>
      <div class="search-track-list">
        ${tracks.map((t, i) => trackListItem(t, i)).join('')}
      </div>
    `;

    setupTrackListListeners(results.querySelector('.search-track-list'), tracks);
  } catch (err) {
    console.error('Search error:', err);
    results.innerHTML = `
      <div class="empty-state">
        <h3>Error</h3>
        <p>Gagal mencari. Periksa koneksi internet dan coba lagi.</p>
      </div>
    `;
  }
}
