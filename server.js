// ===== FASHIN Play — Backend Server =====
// STRATEGY: YouTube-Only + Aggressive Pre-Caching (Reliable & Fast)

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve frontend files (index.html, js, css)

// Determine yt-dlp path (Environment Variable -> System Path -> Local Fallback)
let YTDLP_PATH = process.env.YTDLP_PATH || 'yt-dlp'; // Default to system command

// Check if local exe exists (Windows dev fallback)
const localExe = path.join(process.cwd(), 'yt-dlp.exe');
if (fs.existsSync(localExe)) {
    YTDLP_PATH = localExe;
} else {
    console.log(`ℹ️ Local yt-dlp.exe not found, using system command: ${YTDLP_PATH}`);
}

// ========== URL CACHE (Pre-Caching System) ==========
const urlCache = new Map();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours (YouTube URLs valid ~6 hours)

function getCached(id) {
    const entry = urlCache.get(id);
    if (entry && (Date.now() - entry.timestamp) < CACHE_TTL) {
        return entry.url;
    }
    urlCache.delete(id);
    return null;
}

function setCached(id, url) {
    urlCache.set(id, { url, timestamp: Date.now() });
}

// Pre-resolve URL in background (non-blocking)
async function preResolve(id) {
    if (urlCache.has(id)) return; // Already cached or resolving

    urlCache.set(id, { url: null, timestamp: Date.now() }); // Mark as resolving

    try {
        const url = await resolveYouTubeUrl(id);
        if (url) setCached(id, url);
        else urlCache.delete(id);
    } catch (e) {
        urlCache.delete(id);
    }
}

// Resolve YouTube URL using yt-dlp
function resolveYouTubeUrl(id, quality = 'high') {
    return new Promise((resolve) => {
        const url = `https://www.youtube.com/watch?v=${id}`;

        let format = 'bestaudio[ext=m4a]/bestaudio'; // Default/High/Standard (AAC 128k)
        if (quality === 'lossless') {
            format = 'bestaudio'; // Opus 160k+
        }

        const yt = spawn(YTDLP_PATH, [
            '-f', format,
            '-g', // Get URL only
            '--no-warnings',
            url
        ]);

        let output = '';
        yt.stdout.on('data', d => output += d.toString());
        yt.on('close', code => {
            if (code === 0 && output.trim()) {
                resolve(output.trim());
            } else {
                resolve(null);
            }
        });
        yt.on('error', () => resolve(null));
    });
}

// ========== SEARCH API ==========
app.get('/api/search', async (req, res) => {
    let query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    console.log(`🔎 Searching: ${query}`);

    try {
        const results = await yts(query);

        if (results && results.videos && results.videos.length > 0) {
            let videos = results.videos.slice(0, 20);

            // Score and sort: Prefer Topic channels, Official Audio
            videos.sort((a, b) => getAudioScore(b) - getAudioScore(a));

            const items = videos.slice(0, 10).map(v => ({
                id: v.videoId,
                title: v.title,
                channel: v.author?.name,
                duration: v.seconds,
                thumbnail: v.thumbnail
            }));

            // 🚀 AGGRESSIVE PRE-CACHE: Resolve ALL search results in background
            console.log(`🚀 Pre-caching ${items.length} URLs...`);
            items.forEach(item => {
                preResolve(item.id); // Non-blocking, runs in background
            });

            return res.json({ items });
        }
    } catch (e) {
        console.error('Search failed:', e.message);
    }

    res.json({ items: [] });
});

// Audio quality scoring (prefer clean audio over music videos)
function getAudioScore(video) {
    let score = 0;
    const title = (video.title || '').toLowerCase();
    const channel = (video.author?.name || '').toLowerCase();

    // BEST: Topic channels (auto-generated, clean audio)
    if (channel.includes('- topic')) score += 100;

    // GREAT: Official Audio
    if (title.includes('official audio')) score += 80;
    if (title.includes('audio only')) score += 70;

    // GOOD: Lyric videos (usually no intro)
    if (title.includes('lyric')) score += 50;

    // BAD: Music Videos (often have intros/outros)
    if (title.includes('official video')) score -= 30;
    if (title.includes('music video')) score -= 40;

    // BAD: Live performances
    if (title.includes('live')) score -= 60;

    return score;
}

// ========== PRE-CACHE API ==========
app.post('/api/precache', (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });

    console.log(`🚀 Aggressive Pre-cache triggered for ${ids.length} tracks`);

    // Process in background
    ids.forEach(id => {
        preResolve(id);
    });

    res.json({ success: true, count: ids.length });
});

// ========== AUDIO API (YouTube Direct Stream) ==========
app.get('/api/audio/:id', async (req, res) => {
    const { id } = req.params;
    const quality = req.query.quality || 'high';
    console.log(`🎵 Stream: ${id} (${quality})`);

    try {
        // Check cache FIRST (instant if pre-resolved)
        // Note: Currently cache is ID-based. If quality changes, we might serve cached URL from diff quality.
        // For strictness we should cache by ID+Quality, but for now let's assume High/Standard share formats often.
        // Actually, if quality=lossless, we want Opus. If default was M4A, we serve M4A.
        // Let's rely on resolve logic to ignore cache if needed? No, cache is checked first.
        // IMPROVEMENT: Use simple cache key suffix.
        const cacheKey = `${id}_${quality}`;
        let directUrl = getCached(cacheKey) || getCached(id); // Fallback to ID-only if legacy

        if (directUrl) {
            console.log(`   ⚡ CACHE HIT (Instant)`);
        } else {
            // Cache miss - resolve now
            console.log(`   ⏳ Cache miss, resolving...`);
            const start = Date.now();

            directUrl = await resolveYouTubeUrl(id, quality);

            if (directUrl) {
                setCached(cacheKey, directUrl);
                console.log(`   ✅ Resolved in ${((Date.now() - start) / 1000).toFixed(2)}s`);
            } else {
                console.error(`   ❌ Failed to resolve URL`);
                return res.status(500).send('Failed to get stream URL');
            }
        }

        // Proxy the stream with Range support (for seeking)
        const fetchHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };

        if (req.headers.range) {
            fetchHeaders['Range'] = req.headers.range;
        }

        const response = await fetch(directUrl, { headers: fetchHeaders });

        if (!response.ok && response.status !== 206) {
            // URL might have expired, try re-resolving once
            console.log(`   ⚠️ Stream expired (${response.status}), re-resolving...`);
            urlCache.delete(id);

            const freshUrl = await resolveYouTubeUrl(id);
            if (freshUrl) {
                const retryResponse = await fetch(freshUrl, { headers: fetchHeaders });
                return pipeResponse(retryResponse, res);
            }

            return res.status(500).send('Stream error');
        }

        pipeResponse(response, res);

    } catch (e) {
        console.error('Stream error:', e.message);
        if (!res.headersSent) {
            res.status(500).send('Stream error');
        }
    }
});

// Pipe upstream response to client
async function pipeResponse(upstreamRes, res) {
    res.status(upstreamRes.status);

    // Copy relevant headers
    ['content-range', 'content-length', 'content-type', 'accept-ranges'].forEach(h => {
        if (upstreamRes.headers.get(h)) {
            res.setHeader(h, upstreamRes.headers.get(h));
        }
    });

    // Force content-type if missing (usually audio/webm for bestaudio)
    if (!res.getHeader('content-type')) {
        res.setHeader('Content-Type', 'audio/webm');
    }

    // Pipe the stream
    if (upstreamRes.body && upstreamRes.body.pipe) {
        upstreamRes.body.pipe(res);
    } else {
        // Node 18+ fetch returns ReadableStream, convert to Node stream
        const { Readable } = await import('stream');
        Readable.fromWeb(upstreamRes.body).pipe(res);
    }
}

app.listen(PORT, () => {
    console.log(`🚀 SERVER RUNNING at http://localhost:${PORT}`);
    console.log(`⚡ Mode: YOUTUBE-ONLY + PRE-CACHE (Reliable & Fast)`);
    console.log(`📊 Cache: ${urlCache.size} URLs cached`);
});
