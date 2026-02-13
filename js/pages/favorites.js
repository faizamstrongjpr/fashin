// ===== Favorites Page =====
import { player } from '../player.js';
import { getFavorites, toggleFavorite } from '../storage.js';
import { trackListItem, setupTrackListListeners } from './home.js';
import { showToast } from '../app.js';

export async function render(container) {
  const favorites = getFavorites();

  container.innerHTML = `
    <div class="favorites-page animate-fade-in">
      <div class="favorites-header" style="margin-bottom:24px;">
        <h1>❤️ Lagu Favorit</h1>
        <p style="color:var(--text-secondary);font-size:0.85rem;margin-top:4px;">
          ${favorites.length} lagu
        </p>
      </div>

      ${favorites.length > 0 ? `
        <div style="display:flex;gap:10px;margin-bottom:20px;">
          <button class="modal-btn modal-btn-confirm" id="fav-play-all" style="padding:10px 20px;font-size:0.85rem;">
            ▶ Putar Semua
          </button>
          <button class="modal-btn modal-btn-cancel" id="fav-shuffle" style="padding:10px 20px;font-size:0.85rem;">
            🔀 Acak
          </button>
        </div>
        <div class="batik-divider"></div>
        <div id="favorites-list">
          ${favorites.map((t, i) => trackListItem(t, i)).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg>
          <h3>Belum ada favorit</h3>
          <p>Klik ❤️ pada lagu untuk menambahkan ke favorit</p>
        </div>
      `}
    </div>
  `;

  if (!favorites.length) return;

  // Play all
  document.getElementById('fav-play-all')?.addEventListener('click', () => {
    if (favorites.length) player.play(favorites[0], favorites, 0);
  });

  // Shuffle play
  document.getElementById('fav-shuffle')?.addEventListener('click', () => {
    const shuffled = [...favorites].sort(() => Math.random() - 0.5);
    player.play(shuffled[0], shuffled, 0);
  });

  // Track list listeners
  const listEl = document.getElementById('favorites-list');
  if (listEl) {
    setupTrackListListeners(listEl, favorites);
  }
}
