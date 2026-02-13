// ===== Lyrics Module (Auto-Synced with lrclib.net) =====

const lyricsCache = new Map();
let currentLyrics = null; // { plain: string, synced: Array<{time: number, text: string}> }
let currentLineIndex = -1;

// Fetch lyrics from lrclib.net (free, no auth)
export async function fetchLyrics(artist, title) {
    const key = `${artist}|${title}`;
    if (lyricsCache.has(key)) return lyricsCache.get(key);

    const cleanArtist = artist.split(',')[0].trim().replace(/\s*\(.*?\)\s*/g, '');
    const cleanTitle = title.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*-\s*.*$/, '');

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        // lrclib.net API - search endpoint
        const searchUrl = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
        const res = await fetch(searchUrl, { signal: controller.signal });

        clearTimeout(timeout);

        if (!res.ok) return null;

        const results = await res.json();
        if (!results || results.length === 0) return null;

        // Take first result
        const data = results[0];

        const lyrics = {
            plain: data.plainLyrics || data.syncedLyrics || null,
            synced: data.syncedLyrics ? parseLRC(data.syncedLyrics) : null
        };

        if (lyrics.plain || lyrics.synced) {
            lyricsCache.set(key, lyrics);
        }

        currentLyrics = lyrics;
        return lyrics;

    } catch (err) {
        console.warn('Lyrics fetch failed:', err.message);
        return null;
    }
}

// Parse LRC format: [mm:ss.xx] text
function parseLRC(lrcString) {
    if (!lrcString) return null;

    const lines = lrcString.split('\n');
    const parsed = [];

    for (const line of lines) {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const ms = parseInt(match[3].padEnd(3, '0')); // Handle 2 or 3 digit ms
            const text = match[4].trim();

            const timeInSeconds = minutes * 60 + seconds + ms / 1000;
            parsed.push({ time: timeInSeconds, text });
        }
    }

    return parsed.length > 0 ? parsed : null;
}

// Get current lyric line based on playback time
export function getCurrentLine(currentTime) {
    if (!currentLyrics || !currentLyrics.synced) return -1;

    const lines = currentLyrics.synced;

    // Find the line that should be active at currentTime
    for (let i = lines.length - 1; i >= 0; i--) {
        if (currentTime >= lines[i].time) {
            return i;
        }
    }

    return -1;
}

// Render lyrics with sync highlighting
export function renderLyrics(lyricsData, containerElement) {
    if (!lyricsData) {
        containerElement.innerHTML = '<p class="lyrics-placeholder">Lirik tidak tersedia</p>';
        return;
    }

    if (lyricsData.synced) {
        // Render synced lyrics
        containerElement.innerHTML = lyricsData.synced.map((line, i) =>
            `<p class="lyric-line" data-index="${i}">${line.text || '♪'}</p>`
        ).join('');
        currentLineIndex = -1;
    } else if (lyricsData.plain) {
        // Render plain lyrics
        containerElement.textContent = lyricsData.plain;
    } else {
        containerElement.innerHTML = '<p class="lyrics-placeholder">Lirik tidak tersedia</p>';
    }
}

// Update active lyric line (call from player's time update)
export function updateActiveLine(currentTime, containerElement) {
    if (!currentLyrics || !currentLyrics.synced) return;

    const newIndex = getCurrentLine(currentTime);

    if (newIndex !== currentLineIndex) {
        // Deactivate previous line
        if (currentLineIndex >= 0) {
            const prevLine = containerElement.querySelector(`[data-index="${currentLineIndex}"]`);
            if (prevLine) prevLine.classList.remove('active');
        }

        // Activate new line
        if (newIndex >= 0) {
            const activeLine = containerElement.querySelector(`[data-index="${newIndex}"]`);
            if (activeLine) {
                activeLine.classList.add('active');
                // Auto-scroll to active line
                activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        currentLineIndex = newIndex;
    }
}

// Reset lyrics state
export function resetLyrics() {
    currentLyrics = null;
    currentLineIndex = -1;
}
