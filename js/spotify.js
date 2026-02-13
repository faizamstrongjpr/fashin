// ===== Deezer API Integration (No Auth Required!) =====
// Uses Vite proxy to bypass CORS — requests go through localhost

const DEEZER_BASE = '/deezer-api'; // Proxied through Vite → api.deezer.com

// Simple fetch helper
async function deezerFetch(endpoint) {
    const url = `${DEEZER_BASE}${endpoint}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });

        clearTimeout(timeout);

        if (!res.ok) throw new Error(`Deezer API error: ${res.status}`);

        return await res.json();
    } catch (err) {
        clearTimeout(timeout);
        console.error('Deezer fetch error:', err);
        throw new Error('Gagal menghubungi server musik. Periksa koneksi internet.');
    }
}

// ===== Public API Methods =====

// Search tracks
export async function searchTracks(query, limit = 20) {
    const data = await deezerFetch(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return (data.data || []).map(normalizeTrack);
}

// Search artists
export async function searchArtists(query, limit = 6) {
    const data = await deezerFetch(`/search/artist?q=${encodeURIComponent(query)}&limit=${limit}`);
    return data.data || [];
}

// Get chart/trending tracks
export async function getChart(limit = 20) {
    const data = await deezerFetch(`/chart/0/tracks?limit=${limit}`);
    return (data.data || []).map(normalizeTrack);
}

// Get genre chart
export async function getGenreChart(genreId, limit = 20) {
    try {
        const data = await deezerFetch(`/chart/${genreId}/tracks?limit=${limit}`);
        return (data.data || []).map(normalizeTrack);
    } catch {
        return [];
    }
}

// Get genres
export async function getCategories(limit = 20) {
    const data = await deezerFetch(`/genre`);
    return (data.data || []).filter(g => g.id !== 0).slice(0, limit).map(g => ({
        id: g.id,
        name: g.name,
        icons: [{ url: g.picture_medium || g.picture }]
    }));
}

// Get genre artists
export async function getCategoryPlaylists(genreId, limit = 10) {
    const data = await deezerFetch(`/genre/${genreId}/artists?limit=${limit}`);
    return (data.data || []).map(a => ({
        id: a.id,
        name: a.name,
        images: [{ url: a.picture_medium }]
    }));
}

// Get artist top tracks
export async function getArtistTopTracks(artistId) {
    const data = await deezerFetch(`/artist/${artistId}/top?limit=15`);
    return (data.data || []).map(normalizeTrack);
}

// Get recommendations (use charts)
export async function getRecommendations(seedTracks = [], seedArtists = [], limit = 20) {
    try {
        const data = await deezerFetch(`/chart/0/tracks?limit=${limit}`);
        return (data.data || []).map(normalizeTrack);
    } catch {
        return [];
    }
}

// Get playlist tracks
export async function getPlaylistTracks(playlistId, limit = 30) {
    const data = await deezerFetch(`/playlist/${playlistId}/tracks?limit=${limit}`);
    return (data.data || []).map(normalizeTrack);
}

// Normalize Deezer track to our standard format
function normalizeTrack(track) {
    return {
        id: String(track.id),
        title: track.title_short || track.title || 'Unknown',
        artist: track.artist?.name || 'Unknown Artist',
        artistId: String(track.artist?.id || ''),
        album: track.album?.title || '',
        albumArt: track.album?.cover_big || track.album?.cover_medium || track.album?.cover || '',
        albumArtSmall: track.album?.cover_small || track.album?.cover || '',
        duration: (track.duration || 0) * 1000,
        previewUrl: null // Not used — direct full playback only
    };
}

// Format duration ms to mm:ss
export function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

// Always configured — no API key needed!
export function isConfigured() {
    return true;
}

// Export the raw fetcher for custom endpoints (like playlists)
export { deezerFetch as fetchDeezerData };
