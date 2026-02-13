// ===== FASHIN Play - Main App =====
// Router, player UI binding, and app initialization

import { player } from './player.js';
import { isFavorite, toggleFavorite, getPlaylists, addToPlaylist, getVolume } from './storage.js';
import { initEqualizer, setupEQListeners } from './equalizer.js';
import { fetchLyrics, renderLyrics, updateActiveLine, resetLyrics } from './lyrics.js';
import { formatDuration, isConfigured } from './spotify.js';

// ===== Router =====
const pages = {};

async function loadPage(name) {
    if (!pages[name]) {
        switch (name) {
            case 'home': pages[name] = await import('./pages/home.js'); break;
            case 'search': pages[name] = await import('./pages/search.js'); break;
            case 'favorites': pages[name] = await import('./pages/favorites.js'); break;
            case 'playlists': pages[name] = await import('./pages/playlists.js'); break;
            case 'settings': pages[name] = await import('./pages/settings.js'); break;
            default: pages[name] = await import('./pages/home.js');
        }
    }
    return pages[name];
}

let currentPage = '';

export async function navigateTo(path) {
    const parts = path.split('/');
    const pageName = parts[0] || 'home';
    const param = parts[1] || null;

    window.location.hash = `/${path}`;
    currentPage = pageName;

    // Update nav active state
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageName);
    });

    const container = document.getElementById('page-container');
    const page = await loadPage(pageName);
    await page.render(container, param);
}

function handleHashChange() {
    const hash = window.location.hash.slice(2) || 'home'; // Remove #/
    navigateTo(hash);
}

// ===== Toast =====
let toastTimer = null;
export function showToast(message) {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-msg');
    msg.textContent = message;
    toast.classList.remove('hidden');

    // Force reflow
    toast.offsetHeight;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 2500);
}

// ===== Add to Playlist Modal =====
export function showAddToPlaylistModal(track) {
    const modal = document.getElementById('add-to-playlist-modal');
    const list = document.getElementById('playlist-select-list');
    const cancelBtn = document.getElementById('atp-cancel');

    const playlists = getPlaylists();

    list.innerHTML = playlists.length ? playlists.map(pl => `
    <div class="playlist-select-item" data-id="${pl.id}">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg>
      <span>${pl.name} (${pl.tracks.length} lagu)</span>
    </div>
  `).join('') : '<p style="color:var(--text-secondary);padding:16px;text-align:center;">Belum ada playlist. Buat dulu di halaman Playlists.</p>';

    modal.classList.remove('hidden');

    list.querySelectorAll('.playlist-select-item').forEach(item => {
        item.addEventListener('click', () => {
            const added = addToPlaylist(item.dataset.id, track);
            if (added) {
                showToast(`Ditambahkan ke playlist!`);
            } else {
                showToast('Lagu sudah ada di playlist ini');
            }
            modal.classList.add('hidden');
        });
    });

    cancelBtn.addEventListener('click', () => modal.classList.add('hidden'), { once: true });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    }, { once: true });
}

// ===== Player UI Binding =====
function setupPlayerUI() {
    const playerBar = document.getElementById('player-bar');
    const albumArt = document.getElementById('player-album-art');
    const trackTitle = document.getElementById('player-track-title');
    const trackArtist = document.getElementById('player-track-artist');
    const progressFill = document.getElementById('progress-fill');
    const progressInput = document.getElementById('progress-input');
    const playBtn = document.getElementById('btn-play');
    const playIcon = document.getElementById('play-icon');
    const likeBtn = document.getElementById('player-like-btn');
    const shuffleBtn = document.getElementById('btn-shuffle');
    const repeatBtn = document.getElementById('btn-repeat');
    const volumeSlider = document.getElementById('volume-slider');

    // Now playing elements
    const npView = document.getElementById('now-playing-view');
    const npAlbumArt = document.getElementById('np-album-art');
    const npBackdrop = document.getElementById('np-backdrop');
    const npTitle = document.getElementById('np-track-title');
    const npArtist = document.getElementById('np-track-artist');
    const npProgressInput = document.getElementById('np-progress-input');
    const npCurrentTime = document.getElementById('np-current-time');
    const npTotalTime = document.getElementById('np-total-time');
    const npPlayBtn = document.getElementById('np-play');
    const npPlayIcon = document.getElementById('np-play-icon');
    const npLikeBtn = document.getElementById('np-like');
    const npShuffleBtn = document.getElementById('np-shuffle');
    const npRepeatBtn = document.getElementById('np-repeat');

    const pauseIconPath = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z';
    const playIconPath = 'M8 5v14l11-7z';

    // Track change
    player.onTrackChange = async (track) => {
        playerBar.classList.remove('hidden');

        albumArt.src = track.albumArt || track.albumArtSmall || '';
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;

        // Update like state
        const liked = isFavorite(track.id);
        likeBtn.classList.toggle('liked', liked);
        npLikeBtn?.classList.toggle('liked', liked);

        // Now playing
        npAlbumArt.src = track.albumArt || '';
        npBackdrop.style.backgroundImage = `url(${track.albumArt || ''})`;
        npTitle.textContent = track.title;
        npArtist.textContent = track.artist;

        // Reset progress
        progressFill.style.width = '0%';
        progressInput.value = 0;
        npProgressInput.value = 0;
        npCurrentTime.textContent = '0:00';
        npTotalTime.textContent = formatDuration(track.duration);

        // Update playing state in track lists
        document.querySelectorAll('.track-item').forEach(el => {
            el.classList.toggle('playing', el.dataset.trackId === track.id);
        });

        // Auto-fetch lyrics
        resetLyrics();
        const lyricsContent = document.getElementById('np-lyrics-content');
        if (lyricsContent && !document.getElementById('np-lyrics-panel').classList.contains('hidden')) {
            lyricsContent.innerHTML = '<p class="lyrics-placeholder">Mencari lirik...</p>';
            const lyrics = await fetchLyrics(track.artist, track.title);
            renderLyrics(lyrics, lyricsContent);
        }
    };

    // Play state change
    player.onPlayStateChange = (playing) => {
        const path = playing ? pauseIconPath : playIconPath;
        playIcon.innerHTML = `<path d="${path}"/>`;
        npPlayIcon.innerHTML = `<path d="${path}"/>`;
    };

    // Time update
    player.onTimeUpdate = (time) => {
        progressFill.style.width = `${time.progress}%`;
        progressInput.value = time.progress;
        npProgressInput.value = time.progress;
        npCurrentTime.textContent = player.formatTime(time.current);
        if (time.duration) {
            npTotalTime.textContent = player.formatTime(time.duration);
        }

        // Update synced lyrics
        const lyricsContent = document.getElementById('np-lyrics-content');
        if (lyricsContent && !document.getElementById('np-lyrics-panel').classList.contains('hidden')) {
            updateActiveLine(time.current, lyricsContent);
        }
    };

    // Loading state
    player.onLoading = (loading) => {
        playBtn.style.opacity = loading ? '0.6' : '1';
        npPlayBtn.style.opacity = loading ? '0.6' : '1';
    };

    // Error
    player.onError = (msg) => showToast(msg);

    // Controls
    playBtn.addEventListener('click', () => player.togglePlay());
    npPlayBtn.addEventListener('click', () => player.togglePlay());

    document.getElementById('btn-next').addEventListener('click', () => player.next());
    document.getElementById('np-next').addEventListener('click', () => player.next());

    document.getElementById('btn-prev').addEventListener('click', () => player.prev());
    document.getElementById('np-prev').addEventListener('click', () => player.prev());

    // Seek
    progressInput.addEventListener('input', (e) => player.seek(e.target.value));
    npProgressInput.addEventListener('input', (e) => player.seek(e.target.value));

    // Like
    likeBtn.addEventListener('click', () => {
        if (!player.currentTrack) return;
        const added = toggleFavorite(player.currentTrack);
        likeBtn.classList.toggle('liked', added);
        npLikeBtn?.classList.toggle('liked', added);
        showToast(added ? '❤️ Ditambahkan ke Favorit' : 'Dihapus dari Favorit');
    });

    npLikeBtn?.addEventListener('click', () => {
        if (!player.currentTrack) return;
        const added = toggleFavorite(player.currentTrack);
        likeBtn.classList.toggle('liked', added);
        npLikeBtn.classList.toggle('liked', added);
        showToast(added ? '❤️ Ditambahkan ke Favorit' : 'Dihapus dari Favorit');
    });

    // Shuffle
    shuffleBtn.addEventListener('click', () => {
        const on = player.toggleShuffle();
        shuffleBtn.classList.toggle('active', on);
        npShuffleBtn?.classList.toggle('active', on);
        showToast(on ? 'Acak: Aktif' : 'Acak: Nonaktif');
    });
    npShuffleBtn?.addEventListener('click', () => {
        const on = player.toggleShuffle();
        shuffleBtn.classList.toggle('active', on);
        npShuffleBtn.classList.toggle('active', on);
        showToast(on ? 'Acak: Aktif' : 'Acak: Nonaktif');
    });

    // Repeat
    repeatBtn.addEventListener('click', () => {
        const mode = player.toggleRepeat();
        updateRepeatUI(mode, repeatBtn, npRepeatBtn);
    });
    npRepeatBtn?.addEventListener('click', () => {
        const mode = player.toggleRepeat();
        updateRepeatUI(mode, repeatBtn, npRepeatBtn);
    });

    // Volume
    volumeSlider.value = getVolume();
    volumeSlider.addEventListener('input', (e) => player.setVolume(parseInt(e.target.value)));

    // Now Playing view toggle
    document.getElementById('btn-nowplaying')?.addEventListener('click', () => {
        npView.classList.remove('hidden');
    });

    // Click on album art to open now playing
    document.getElementById('player-track-info')?.addEventListener('click', () => {
        if (player.currentTrack) npView.classList.remove('hidden');
    });

    document.getElementById('np-close')?.addEventListener('click', () => {
        npView.classList.add('hidden');
    });

    // Lyrics
    document.getElementById('btn-lyrics')?.addEventListener('click', () => {
        npView.classList.remove('hidden');
        toggleLyricsPanel();
    });

    document.getElementById('np-lyrics-btn')?.addEventListener('click', () => {
        toggleLyricsPanel();
    });
}

function updateRepeatUI(mode, ...btns) {
    const labels = ['Ulangi: Mati', 'Ulangi: Semua', 'Ulangi: Satu'];
    showToast(labels[mode]);
    btns.forEach(btn => {
        if (!btn) return;
        btn.classList.toggle('active', mode > 0);
        if (mode === 2) btn.style.opacity = '1';
        else btn.style.opacity = '';
    });
}

// Lyrics toggle
async function toggleLyricsPanel() {
    const panel = document.getElementById('np-lyrics-panel');
    const content = document.getElementById('np-lyrics-content');

    panel.classList.toggle('hidden');

    if (!panel.classList.contains('hidden') && player.currentTrack) {
        content.innerHTML = '<p class="lyrics-placeholder">Mencari lirik...</p>';

        const lyrics = await fetchLyrics(player.currentTrack.artist, player.currentTrack.title);
        renderLyrics(lyrics, content);
    }
}

// ===== Dark Mode Toggle =====
function setupThemeToggle() {
    const toggleCheckbox = document.getElementById('theme-toggle-checkbox');
    const toggleLabel = document.getElementById('theme-toggle-label');

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.theme = savedTheme;
    toggleCheckbox.checked = savedTheme === 'dark';
    updateThemeLabel(savedTheme);

    // Toggle event
    toggleCheckbox.addEventListener('change', () => {
        const newTheme = toggleCheckbox.checked ? 'dark' : 'light';
        document.body.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        updateThemeLabel(newTheme);
    });

    function updateThemeLabel(theme) {
        toggleLabel.textContent = theme === 'dark' ? 'Mode Gelap' : 'Mode Terang';
    }
}

// ===== Initialization =====
async function init() {
    // Check Spotify config
    if (!isConfigured()) {
        console.warn('⚠️ Spotify credentials not configured. Edit js/spotify.js to add your Client ID & Secret.');
    }

    // Setup navigation
    document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    // Setup player UI
    setupPlayerUI();

    // Setup theme toggle
    setupThemeToggle();

    // Setup EQ
    setupEQListeners();

    // Route
    window.addEventListener('hashchange', handleHashChange);

    // Initial route
    handleHashChange();
}

// Start app
document.addEventListener('DOMContentLoaded', init);
