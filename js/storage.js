// ===== localStorage Manager =====
// Manages playlists, favorites, recently played, and settings

const KEYS = {
    FAVORITES: 'fashin_favorites',
    PLAYLISTS: 'fashin_playlists',
    RECENT: 'fashin_recent',
    EQ_SETTINGS: 'fashin_eq',
    VOLUME: 'fashin_volume',
    QUEUE: 'fashin_queue'
};

// ===== Generic helpers =====
function getJSON(key, fallback = null) {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
    } catch {
        return fallback;
    }
}

function setJSON(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ===== Favorites =====
export function getFavorites() {
    return getJSON(KEYS.FAVORITES, []);
}

export function isFavorite(trackId) {
    return getFavorites().some(t => t.id === trackId);
}

export function toggleFavorite(track) {
    const favs = getFavorites();
    const index = favs.findIndex(t => t.id === track.id);

    if (index >= 0) {
        favs.splice(index, 1);
        setJSON(KEYS.FAVORITES, favs);
        return false; // removed
    } else {
        favs.unshift({
            id: track.id,
            title: track.title,
            artist: track.artist,
            artistId: track.artistId,
            album: track.album,
            albumArt: track.albumArt,
            albumArtSmall: track.albumArtSmall,
            duration: track.duration,
            addedAt: Date.now()
        });
        setJSON(KEYS.FAVORITES, favs);
        return true; // added
    }
}

// ===== Playlists =====
export function getPlaylists() {
    return getJSON(KEYS.PLAYLISTS, []);
}

export function getPlaylist(id) {
    return getPlaylists().find(p => p.id === id);
}

export function createPlaylist(name) {
    const playlists = getPlaylists();
    const playlist = {
        id: 'pl_' + Date.now(),
        name: name,
        tracks: [],
        createdAt: Date.now()
    };
    playlists.push(playlist);
    setJSON(KEYS.PLAYLISTS, playlists);
    return playlist;
}

export function deletePlaylist(id) {
    const playlists = getPlaylists().filter(p => p.id !== id);
    setJSON(KEYS.PLAYLISTS, playlists);
}

export function renamePlaylist(id, newName) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === id);
    if (pl) {
        pl.name = newName;
        setJSON(KEYS.PLAYLISTS, playlists);
    }
}

export function addToPlaylist(playlistId, track) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return false;

    if (pl.tracks.some(t => t.id === track.id)) return false; // already exists

    pl.tracks.push({
        id: track.id,
        title: track.title,
        artist: track.artist,
        artistId: track.artistId,
        album: track.album,
        albumArt: track.albumArt,
        albumArtSmall: track.albumArtSmall,
        duration: track.duration
    });
    setJSON(KEYS.PLAYLISTS, playlists);
    return true;
}

export function removeFromPlaylist(playlistId, trackId) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;

    pl.tracks = pl.tracks.filter(t => t.id !== trackId);
    setJSON(KEYS.PLAYLISTS, playlists);
}

// ===== Recently Played =====
export function getRecentlyPlayed() {
    return getJSON(KEYS.RECENT, []);
}

export function addToRecentlyPlayed(track) {
    let recent = getRecentlyPlayed();
    recent = recent.filter(t => t.id !== track.id);
    recent.unshift({
        id: track.id,
        title: track.title,
        artist: track.artist,
        artistId: track.artistId,
        album: track.album,
        albumArt: track.albumArt,
        albumArtSmall: track.albumArtSmall,
        duration: track.duration
    });
    if (recent.length > 30) recent = recent.slice(0, 30);
    setJSON(KEYS.RECENT, recent);
}

// ===== EQ Settings =====
export function getEQSettings() {
    return getJSON(KEYS.EQ_SETTINGS, {
        preset: 'flat',
        bands: [0, 0, 0, 0, 0]
    });
}

export function saveEQSettings(settings) {
    setJSON(KEYS.EQ_SETTINGS, settings);
}

// ===== Volume =====
export function getVolume() {
    return getJSON(KEYS.VOLUME, 80);
}

export function saveVolume(vol) {
    setJSON(KEYS.VOLUME, vol);
}

// ===== Quality =====
export function getQuality() {
    return getJSON('fashin_quality', 'high');
}

export function saveQuality(q) {
    setJSON('fashin_quality', q);
}

// ===== Search History =====
const SEARCH_HISTORY_KEY = 'fashin_search_history';
const MAX_SEARCH_HISTORY = 20;

export function getSearchHistory() {
    return getJSON(SEARCH_HISTORY_KEY, []);
}

export function addToSearchHistory(query) {
    let history = getSearchHistory();
    history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
    history.unshift(query);
    if (history.length > MAX_SEARCH_HISTORY) history = history.slice(0, MAX_SEARCH_HISTORY);
    setJSON(SEARCH_HISTORY_KEY, history);
}

export function removeFromSearchHistory(query) {
    let history = getSearchHistory();
    history = history.filter(q => q !== query);
    setJSON(SEARCH_HISTORY_KEY, history);
}

export function clearSearchHistory() {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
}
