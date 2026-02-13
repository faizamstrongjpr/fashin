// ===== Playlists Page =====
// Shows user playlists + Deezer curated playlists

import { player } from '../player.js';
import { getPlaylists, getPlaylist, createPlaylist, deletePlaylist } from '../storage.js';
import { trackListItem, setupTrackListListeners } from './home.js';
import { showToast, navigateTo } from '../app.js';
import { fetchDeezerData } from '../spotify.js';

let viewingPlaylistId = null;
let selectedPlaylistType = 'my'; // 'my' or 'curated'

export async function render(container, playlistId = null) {
  if (playlistId) {
    // Check if it's a number (Deezer) or UUID (Local)
    // Simple heuristic: Deezer IDs are numeric strings. Local are UUIDs with dashes.
    if (playlistId.includes('-')) {
      renderPlaylistDetail(container, playlistId);
    } else {
      renderDeezerPlaylistDetail(container, playlistId);
    }
  } else {
    renderPlaylistsOverview(container);
  }
}

async function renderPlaylistsOverview(container) {
  viewingPlaylistId = null; // Reset viewingPlaylistId when on overview
  container.innerHTML = `
        <div class="page-header">
            <h1>Koleksi Playlist</h1>
        </div>
        
        <div class="playlist-tabs">
            <button class="playlist-tab active" data-type="my">Pribadi</button>
            <button class="playlist-tab" data-type="curated">Rekomendasi</button>
        </div>
        
        <div id="playlist-content"></div>
    `;

  const tabs = container.querySelectorAll('.playlist-tab');
  const content = container.querySelector('#playlist-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedPlaylistType = tab.dataset.type;

      if (selectedPlaylistType === 'my') {
        renderMyPlaylists(content);
      } else {
        renderCuratedPlaylists(content);
      }
    });
  });

  // Initial render based on selectedPlaylistType
  if (selectedPlaylistType === 'my') {
    renderMyPlaylists(content);
  } else {
    // Activate curated tab if it was previously selected
    container.querySelector('.playlist-tab[data-type="curated"]')?.classList.add('active');
    container.querySelector('.playlist-tab[data-type="my"]')?.classList.remove('active');
    renderCuratedPlaylists(content);
  }
}

function renderMyPlaylists(content) {
  const playlists = getPlaylists();

  content.innerHTML = `
    <div class="playlists-page animate-fade-in">
      <button class="create-playlist-btn" id="create-pl-btn">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        Buat Playlist Baru
      </button>

      <div class="batik-divider"></div>

      <div id="playlists-grid" class="cards-grid" style="grid-template-columns:1fr;">
        ${playlists.length ? playlists.map(pl => `
          <div class="playlist-card" data-playlist-id="${pl.id}">
            <div class="playlist-card-header">
              <div class="playlist-card-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
              </div>
              <div>
                <div class="playlist-card-title">${pl.name}</div>
                <div class="playlist-card-count">${pl.tracks.length} lagu</div>
              </div>
            </div>
            <div class="playlist-card-actions">
              <button class="track-item-btn pl-play-btn" data-id="${pl.id}" title="Play" style="opacity:1">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button class="track-item-btn pl-delete-btn" data-id="${pl.id}" title="Delete" style="opacity:1">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
            <h3>Belum ada playlist</h3>
            <p>Buat playlist pertamamu!</p>
          </div>
        `}
      </div>
    </div>
  `;

  // Create playlist
  content.querySelector('#create-pl-btn')?.addEventListener('click', () => {
    showCreatePlaylistModal();
  });

  // Playlist card click
  content.querySelectorAll('.playlist-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.pl-play-btn') || e.target.closest('.pl-delete-btn')) return;
      navigateTo(`playlists/${card.dataset.playlistId}`);
    });
  });

  // Play playlist
  content.querySelectorAll('.pl-play-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pl = getPlaylist(btn.dataset.id);
      if (pl && pl.tracks.length) player.play(pl.tracks[0], pl.tracks, 0);
      else showToast('Playlist kosong');
    });
  });

  // Delete playlist
  content.querySelectorAll('.pl-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Hapus playlist ini?')) {
        deletePlaylist(btn.dataset.id);
        renderMyPlaylists(content); // Re-render
        showToast('Playlist dihapus');
      }
    });
  });
}

function renderPlaylistDetail(container, playlistId) {
  viewingPlaylistId = playlistId;
  const pl = getPlaylist(playlistId);

  if (!pl) {
    container.innerHTML = `<div class="empty-state"><h3>Playlist tidak ditemukan</h3></div>`;
    return;
  }

  container.innerHTML = `
    <div class="playlist-detail-page animate-fade-in">
      <button class="section-link" id="back-to-playlists" style="margin-bottom:16px;display:inline-flex;align-items:center;gap:4px;">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style="width:16px;height:16px"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        Kembali
      </button>

      <h1 style="margin-bottom:4px;">${pl.name}</h1>
      <p style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:16px;">${pl.tracks.length} lagu</p>

      ${pl.tracks.length ? `
        <div style="display:flex;gap:10px;margin-bottom:16px;">
          <button class="modal-btn modal-btn-confirm" id="pl-play-all" style="padding:10px 20px;font-size:0.85rem;">
            ▶ Putar Semua
          </button>
        </div>
        <div class="batik-divider"></div>
        <div id="pl-track-list">
          ${pl.tracks.map((t, i) => trackListItem(t, i)).join('')}
        </div>
      ` : `
        <div class="empty-state">
          <h3>Playlist kosong</h3>
          <p>Cari lagu dan tambahkan ke playlist ini</p>
        </div>
      `}
    </div>
  `;

  document.getElementById('back-to-playlists')?.addEventListener('click', () => {
    navigateTo('playlists');
  });

  document.getElementById('pl-play-all')?.addEventListener('click', () => {
    if (pl.tracks.length) player.play(pl.tracks[0], pl.tracks, 0);
  });

  const listEl = document.getElementById('pl-track-list');
  if (listEl) setupTrackListListeners(listEl, pl.tracks);
}

function showCreatePlaylistModal() {
  const modal = document.getElementById('playlist-modal');
  const input = document.getElementById('playlist-name-input');
  const confirmBtn = document.getElementById('playlist-confirm');
  const cancelBtn = document.getElementById('playlist-cancel');

  modal.classList.remove('hidden');
  input.value = '';
  input.focus();

  const confirm = () => {
    const name = input.value.trim();
    if (!name) return;
    createPlaylist(name);
    modal.classList.add('hidden');
    showToast(`Playlist "${name}" dibuat!`);

    const container = document.getElementById('page-container');
    const content = container.querySelector('#playlist-content');
    if (content && selectedPlaylistType === 'my') renderMyPlaylists(content);

    cleanup();
  };

  const cancel = () => {
    modal.classList.add('hidden');
    cleanup();
  };

  const cleanup = () => {
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    const newConfirm = document.getElementById('playlist-confirm');
    const newCancel = document.getElementById('playlist-cancel');

    newConfirm.addEventListener('click', confirm);
    newCancel.addEventListener('click', cancel);
  };

  confirmBtn.replaceWith(confirmBtn.cloneNode(true));
  cancelBtn.replaceWith(cancelBtn.cloneNode(true));
  const newConfirm = document.getElementById('playlist-confirm');
  const newCancel = document.getElementById('playlist-cancel');

  newConfirm.addEventListener('click', confirm);
  newCancel.addEventListener('click', cancel);
  input.onkeydown = (e) => { if (e.key === 'Enter') confirm(); };
}

// ===== Curated Playlists =====

const PLAYLIST_CATEGORIES = [
  { title: '🔥 Indonesia Hype & Viral', queries: ['Indonesia Top', 'Viral Indonesia', 'Top Hits Indonesia'] },
  { title: '😢 Galau & Sedih', queries: ['Galau Indonesia', 'Lagu Sedih Indonesia', 'Patah Hati'] },
  { title: '⚡ Semangat Pagi', queries: ['Mood Booster Indonesia', 'Semangat Pagi', 'Ceria Indonesia'] },
  { title: '🕰️ Throwback 2000an', queries: ['Hits Indonesia 2000', 'Nostalgia Indonesia', 'Band Indonesia 2000'] },
  { title: '🎵 TikTok Viral', queries: ['TikTok Indonesia', 'Lagu TikTok Viral', 'Jedag Jedug'] }
];

async function renderCuratedPlaylists(content) {
  content.innerHTML = `
    <div class="loading-state" style="padding:40px;text-align:center;">
        <div class="spinner-ring" style="margin:0 auto 16px;"></div>
        <p>Memuat playlist Hype...</p>
    </div>
  `;

  try {
    const categoryPromises = PLAYLIST_CATEGORIES.map(async (cat) => {
      const queryPromises = cat.queries.map(q => fetchDeezerData(`/search/playlist?q=${encodeURIComponent(q)}&limit=4`));
      const results = await Promise.all(queryPromises);

      let playlists = [];
      results.forEach(r => { if (r.data) playlists.push(...r.data); });

      playlists = Array.from(new Map(playlists.map(p => [p.id, p])).values()).slice(0, 6);

      if (playlists.length === 0) return '';

      return `
            <div class="playlist-category" style="margin-bottom: 32px;">
                <h3 style="margin: 0 0 16px; font-size: 1.1rem; color: var(--text-primary);">${cat.title}</h3>
                <div class="cards-grid">
                    ${playlists.map(pl => `
                        <div class="playlist-card curated" data-playlist-id="${pl.id}">
                            <div class="playlist-card-cover" style="background:url('${pl.picture_big || pl.picture_medium}') center/cover;aspect-ratio:1;border-radius:var(--radius-md);position:relative;overflow:hidden;">
                                <div class="playlist-play-overlay">
                                    <svg viewBox="0 0 24 24" fill="white" style="width:48px;height:48px;"><path d="M12 4.5C7.86 4.5 4.5 7.86 4.5 12s3.36 7.5 7.5 7.5 7.5-3.36 7.5-7.5-3.36-7.5-7.5-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-1-8v6l5-3-5-3z"/></svg>
                                    <span style="color:white;font-weight:600;margin-top:8px;">Lihat</span>
                                </div>
                            </div>
                            <div style="padding:12px 0;">
                                <div class="playlist-card-title" style="font-weight:600;margin-bottom:4px;">${pl.title}</div>
                                <div class="playlist-card-count" style="font-size:0.85rem;color:var(--text-secondary);">${pl.nb_tracks} lagu</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    const sections = await Promise.all(categoryPromises);

    content.innerHTML = sections.join('') + `
        <style>
            .playlist-play-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: 0.3s;
                backdrop-filter: blur(2px);
            }
            .playlist-card-cover:hover .playlist-play-overlay {
                opacity: 1 !important;
            }
        </style>
    `;

    // Click handlers
    content.querySelectorAll('.playlist-card.curated').forEach(card => {
      card.addEventListener('click', () => {
        // We can use navigateTo if we support routing, or just render directly.
        // Using renderDeezerPlaylistDetail directly
        renderDeezerPlaylistDetail(document.getElementById('page-container'), card.dataset.playlistId);
      });
    });

  } catch (e) {
    console.error('Failed to load curated playlists:', e);
    content.innerHTML = `<div class="empty-state"><p>Gagal memuat playlist rekomendasi. Periksa koneksi.</p></div>`;
  }
}

async function renderDeezerPlaylistDetail(container, playlistId) {
  viewingPlaylistId = playlistId;
  container.innerHTML = `
        <div class="playlist-detail-page animate-fade-in">
            <button class="section-link" id="back-to-curated" style="margin-bottom:16px;display:inline-flex;align-items:center;gap:4px;">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                Kembali
            </button>
            
            <div class="loading-state" style="padding:40px;text-align:center;">
                <div class="spinner-ring" style="margin:0 auto 16px;"></div>
                <p>Memuat daftar lagu...</p>
            </div>
        </div>
    `;

  document.getElementById('back-to-curated')?.addEventListener('click', () => {
    render(container);
    setTimeout(() => {
      const curatedTab = container.querySelector('.playlist-tab[data-type="curated"]');
      if (curatedTab) curatedTab.click();
    }, 50);
  });

  try {
    const pl = await fetchDeezerData(`/playlist/${playlistId}`);
    const tracksRaw = pl.tracks?.data || [];

    const tracks = tracksRaw.map(t => ({
      id: String(t.id),
      title: t.title_short || t.title,
      artist: t.artist?.name || 'Unknown',
      album: t.album?.title || '',
      albumArt: t.album?.cover_big || t.album?.cover_medium || pl.picture_big,
      duration: (t.duration || 0) * 1000
    }));

    container.innerHTML = `
            <div class="playlist-detail-page animate-fade-in">
                <button class="section-link" id="back-to-curated-2" style="margin-bottom:16px;display:inline-flex;align-items:center;gap:4px;">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                    Kembali
                </button>

                <div class="playlist-header" style="display:flex;gap:24px;align-items:end;margin-bottom:24px;flex-wrap:wrap;">
                    <img src="${pl.picture_medium || pl.picture_big}" style="width:180px;height:180px;border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);object-fit:cover;">
                    <div style="flex:1;">
                         <h2 style="margin-bottom:8px;font-size:2rem;line-height:1.2;">${pl.title}</h2>
                         <p style="color:var(--text-secondary);margin-bottom:16px;">${pl.nb_tracks} lagu • ${Math.floor(pl.duration / 60)} menit</p>
                         <p style="color:var(--text-secondary);font-size:0.9rem;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${pl.description || ''}</p>
                         
                         <button class="modal-btn modal-btn-confirm" id="pl-play-all" style="padding:12px 24px;font-size:1rem;">
                            ▶ Putar Playlist
                         </button>
                    </div>
                </div>

                <div class="batik-divider"></div>
                <div id="pl-track-list">
                  ${tracks.map((t, i) => trackListItem(t, i)).join('')}
                </div>
            </div>
        `;

    document.getElementById('back-to-curated-2')?.addEventListener('click', () => {
      render(container);
      setTimeout(() => {
        const curatedTab = container.querySelector('.playlist-tab[data-type="curated"]');
        if (curatedTab) curatedTab.click();
      }, 50);
    });

    document.getElementById('pl-play-all')?.addEventListener('click', () => {
      if (tracks.length) {
        player.play(tracks[0], tracks, 0);
        showToast(`Memutar playlist...`);
      }
    });

    const listEl = document.getElementById('pl-track-list');
    if (listEl) setupTrackListListeners(listEl, tracks);

  } catch (e) {
    console.error(e);
    showToast('Gagal memuat detail playlist');
    container.innerHTML += `<div class="empty-state"><p>Gagal memuat detail.</p></div>`;
  }
}
