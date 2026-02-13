// ===== YouTube Audio Module =====
// Connects to our local backend server for YouTube search & streaming

import { getQuality } from './storage.js';

let API_BASE = '/api'; // Relative path for cloud deployment
const streamCache = new Map();

// Helper to try fetch with fallback to 127.0.0.1
async function fetchWithFallback(endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        return res;
    } catch (err) {
        if (API_BASE.startsWith('/')) {
            // If relative path fails (maybe file:// protocol), try localhost
            console.warn('Relative path failed, switching to localhost');
            API_BASE = 'http://localhost:3333/api';
            return await fetch(`${API_BASE}${endpoint}`);
        }
        throw err;
    }
}

// Search YouTube
async function searchYouTube(query) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        let url = `${API_BASE}/search?q=${encodeURIComponent(query)}`;

        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`Search failed: ${res.status}`);
            const data = await res.json();
            return data.items || [];
        } catch (e) {
            if (e.message.includes('Failed to fetch') && API_BASE.includes('localhost')) {
                API_BASE = 'http://127.0.0.1:3333/api';
                url = `${API_BASE}/search?q=${encodeURIComponent(query)}`;
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeout);
                const data = await res.json();
                return data.items || [];
            }
            throw e;
        }

    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

// Match a track to YouTube and get audio URL
export async function matchTrack(track) {
    const quality = getQuality();

    // 🚀 FAST PATH: If track already has a YOUTUBE video ID, 
    // skip redundant search and go DIRECTLY to audio endpoint!
    if (track.id && /[a-zA-Z]/.test(track.id)) {
        const audioUrl = `${API_BASE}/audio/${track.id}?quality=${quality}`;
        console.log(`⚡ Direct play: ${track.id} (Quality: ${quality})`);
        return audioUrl;
    }

    // SLOW PATH: Only if track has no ID (e.g., from playlist/favorites)
    // Cache key now includes quality to avoid serving wrong format
    const cacheKey = `${track.artist}-${track.title}-${quality}`;

    if (streamCache.has(cacheKey)) {
        const cached = streamCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 1800000) {
            return cached.url;
        }
    }

    const queries = [
        `${track.artist} ${track.title}`,
        `${track.title} ${track.artist}`
    ];

    for (const query of queries) {
        try {
            const results = await searchYouTube(query);

            if (results.length) {
                const best = results[0];
                const audioUrl = `${API_BASE}/audio/${best.id}?quality=${quality}`;
                streamCache.set(cacheKey, { url: audioUrl, timestamp: Date.now() });
                return audioUrl;
            }
        } catch (err) {
            console.warn(`Search failed for "${query}":`, err.message);
        }
    }

    throw new Error('Tidak ditemukan di YouTube (Cek Backend)');
}

export function clearCache() {
    streamCache.clear();
}
