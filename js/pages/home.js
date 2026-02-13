// ===== Home Page =====
import * as spotify from '../spotify.js';
import { player } from '../player.js';
import { getRecentlyPlayed, isFavorite, toggleFavorite } from '../storage.js';
import { showToast, showAddToPlaylistModal } from '../app.js';
import { formatDuration } from '../spotify.js';

const GENRES = [
  { id: 'pop', name: 'Pop' },
  { id: 'rock', name: 'Rock' },
  { id: 'hip-hop', name: 'Hip Hop' },
  { id: 'electronic', name: 'Elektronik' },
  { id: 'r-n-b', name: 'R&B' },
  { id: 'jazz', name: 'Jazz' },
  { id: 'classical', name: 'Klasik' },
  { id: 'indie', name: 'Indie' },
  { id: 'reggae', name: 'Reggae' }
];

export async function render(container) {
  const hour = new Date().getHours();
  // Greeting logic
  let timeGreeting = 'Selamat Malam';
  if (hour < 12) timeGreeting = 'Selamat Pagi';
  else if (hour < 15) timeGreeting = 'Selamat Siang';
  else if (hour < 18) timeGreeting = 'Selamat Sore';

  const greeting = `${timeGreeting} bbyy... 👋`;

  container.innerHTML = `
    <div class="home-page animate-fade-in">
      <!-- Hero Banner -->
      <div class="hero-banner hero-batik-bg batik-highlight">
        <div class="hero-content">
          <p class="hero-greeting">${greeting}</p>
          <h1 class="hero-title">FASHIN Play<br><span style="font-size:0.6em;font-weight:600;color:var(--text-primary)">FAIZ <span style="color:red">❤️</span> SHINTA</span></h1>
          <p class="hero-subtitle">Dengarkan musik favoritmu tanpa batas</p>
        </div>
      </div>

      <!-- Recently Played -->
      <div id="recent-section" class="section" style="display:none">
        <div class="section-header">
          <h2 class="section-title"><span class="batik-dot"></span> Baru Diputar</h2>
        </div>
        <div class="cards-scroll" id="recent-cards"></div>
      </div>

      <!-- Genres -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title"><span class="batik-dot"></span> Jelajahi Genre</h2>
        </div>
        <div class="cards-scroll" id="genre-cards">
          ${GENRES.map(g => `
            <div class="genre-card genre-card-batik" data-genre="${g.id}">
              ${g.name}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recommendations -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title"><span class="batik-dot"></span> Rekomendasi Untukmu</h2>
        </div>
        <div class="cards-scroll" id="recommend-cards">
          ${skeletonCards(6)}
        </div>
      </div>

      <!-- Genre Tracks (shown when genre clicked) -->
      <div id="genre-tracks-section" class="section" style="display:none">
        <div class="section-header">
          <h2 class="section-title" id="genre-tracks-title"></h2>
        </div>
        <div id="genre-tracks-list"></div>
      </div>
    </div>
  `;

  // Load recent
  loadRecent();

  // Load recommendations
  loadRecommendations();

  // Genre click
  container.querySelectorAll('.genre-card').forEach(card => {
    card.addEventListener('click', () => loadGenreTracks(card.dataset.genre, card.textContent.trim()));
  });
}

function skeletonCards(count) {
  return Array(count).fill('<div class="skeleton skeleton-card"></div>').join('');
}

function loadRecent() {
  const recent = getRecentlyPlayed();
  if (!recent.length) return;

  document.getElementById('recent-section').style.display = '';
  document.getElementById('recent-cards').innerHTML = recent.slice(0, 10).map(track => trackCard(track)).join('');
  setupTrackCardListeners(document.getElementById('recent-cards'), recent.slice(0, 10));
}

async function loadRecommendations() {
  try {
    const container = document.getElementById('recommend-cards');
    if (!container) return;

    // Smart Recommendations Algo
    // 1. Check recently played
    const recent = getRecentlyPlayed();
    let tracks = [];
    let sourceLabel = 'Rekomendasi Untukmu'; // Default label

    if (recent.length > 0) {
      const lastTrack = recent[0];
      // Try to get top tracks of the last artist
      if (lastTrack.artistId) {
        try {
          const artistTracks = await spotify.getArtistTopTracks(lastTrack.artistId);
          if (artistTracks.length > 0) {
            tracks = artistTracks;
            sourceLabel = `Karena kamu mendengar ${lastTrack.artist}`;
          }
        } catch (e) { console.warn('Artist recs failed', e); }
      }

      // If failed or empty, try search
      if (tracks.length === 0) {
        const searchRes = await spotify.searchTracks(lastTrack.artist, 10);
        if (searchRes.length > 0) {
          tracks = searchRes;
          sourceLabel = `Mirip dengan ${lastTrack.artist}`;
        }
      }
    }

    // 2. If still empty, use Charts/Trending
    if (tracks.length < 5) {
      const chart = await spotify.getChart();
      // Mix them if we have some
      tracks = [...tracks, ...chart];
      if (tracks.length === chart.length) sourceLabel = 'Lagu Trending Saat Ini';
    }

    // Deduplicate by ID
    const uniqueTracks = Array.from(new Map(tracks.map(t => [t.id, t])).values()).slice(0, 15);

    // Update Section Title
    const titleEl = container.parentElement.querySelector('.section-title');
    if (titleEl) titleEl.innerHTML = `<span class="batik-dot"></span> ${sourceLabel}`;

    container.innerHTML = uniqueTracks.map(track => trackCard(track)).join('');
    setupTrackCardListeners(container, uniqueTracks);

  } catch (err) {
    console.error('Failed to load recommendations:', err);
    const container = document.getElementById('recommend-cards');
    if (container) {
      container.innerHTML = `<p style="color:var(--text-secondary);font-size:0.85rem;padding:20px;">Gagal memuat rekomendasi. Periksa koneksi internet.</p>`;
    }
  }
}

const GENRE_MAP = {
  'pop': 132,
  'rock': 152,
  'hip-hop': 116,
  'electronic': 113,
  'r-n-b': 165,
  'jazz': 129,
  'classical': 98,
  'reggae': 144,
  'indie': null // Search fallback
};

async function loadGenreTracks(genreId, genreName) {
  const section = document.getElementById('genre-tracks-section');
  const titleEl = document.getElementById('genre-tracks-title');
  const listEl = document.getElementById('genre-tracks-list');

  section.style.display = '';
  titleEl.innerHTML = `<span class="batik-dot"></span> ${genreName}`;
  listEl.innerHTML = Array(5).fill('<div class="skeleton skeleton-item"></div>').join('');

  section.scrollIntoView({ behavior: 'smooth' });

  try {
    let tracks = [];
    const deezerId = GENRE_MAP[genreId];

    if (deezerId) {
      tracks = await spotify.getGenreChart(deezerId, 20);
    } else {
      // Fallback search for genres not in standard chart IDs (like Indie)
      tracks = await spotify.searchTracks(`genre:"${genreName}"`, 20);
      if (tracks.length === 0) tracks = await spotify.searchTracks(genreName, 20);
    }

    if (tracks.length === 0) throw new Error('No tracks found');

    listEl.innerHTML = tracks.map((t, i) => trackListItem(t, i)).join('');
    setupTrackListListeners(listEl, tracks);
  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<p style="color:var(--text-secondary);padding:20px;">Gagal memuat lagu genre ini</p>`;
  }
}

export function trackCard(track) {
  return `
    <div class="track-card" data-track-id="${track.id}">
      <div class="track-card-img">
        <img src="${track.albumArt || track.albumArtSmall || ''}" alt="${track.title}" loading="lazy"
          onerror="this.parentElement.style.background='var(--gradient-primary)'">
        <button class="track-card-play">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
      <div class="track-card-title" title="${track.title}">${track.title}</div>
      <div class="track-card-artist">${track.artist}</div>
    </div>
  `;
}

export function trackListItem(track, index) {
  const liked = isFavorite(track.id);
  return `
    <div class="track-item" data-track-id="${track.id}" data-index="${index}">
      <span class="track-item-num">${index + 1}</span>
      <div class="track-item-img">
        <img src="${track.albumArtSmall || track.albumArt || ''}" alt="" loading="lazy"
          onerror="this.parentElement.style.background='var(--gradient-primary)'">
      </div>
      <div class="track-item-info">
        <div class="track-item-title">${track.title}</div>
        <div class="track-item-artist">${track.artist}</div>
      </div>
      <span class="track-item-duration">${formatDuration(track.duration)}</span>
      <div class="track-item-actions">
        <button class="track-item-btn like-btn ${liked ? 'liked' : ''}" data-track-id="${track.id}" title="Like">
          <svg viewBox="0 0 24 24"><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3z"/></svg>
        </button>
        <button class="track-item-btn add-to-pl-btn" data-track-id="${track.id}" title="Add to Playlist">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>
        </button>
      </div>
    </div>
  `;
}

export function setupTrackCardListeners(container, tracks) {
  container.querySelectorAll('.track-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.trackId;
      const track = tracks.find(t => t.id === id);
      if (track) player.play(track, tracks);
    });
  });
}

export function setupTrackListListeners(container, tracks) {
  container.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.track-item-btn')) return;
      const idx = parseInt(item.dataset.index);
      player.play(tracks[idx], tracks, idx);
    });
  });

  container.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.trackId;
      const track = tracks.find(t => t.id === id);
      if (track) {
        const added = toggleFavorite(track);
        btn.classList.toggle('liked', added);
        showToast(added ? '❤️ Ditambahkan ke Favorites' : 'Dihapus dari Favorites');
      }
    });
  });

  container.querySelectorAll('.add-to-pl-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.trackId;
      const track = tracks.find(t => t.id === id);
      if (track) showAddToPlaylistModal(track);
    });
  });
}
