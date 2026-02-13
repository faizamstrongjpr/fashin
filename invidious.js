// ===== INVIDIOUS PROXY MODULE =====
// Bypasses local IP blocking by using public Invidious instances

const INSTANCES = [
    'https://inv.tux.pizza',
    'https://invidious.jing.rocks',
    'https://vid.puffyan.us',
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.privacyredirect.com',
    'https://iv.ggtyler.dev',
    'https://invidious.lunar.icu'
];

export async function getStreamFromInvidious(videoId) {
    console.log(`🛡️ Trying Invidious Proxy for ${videoId}...`);

    // Shuffle instances for load balancing
    const shuffled = INSTANCES.sort(() => 0.5 - Math.random());

    for (const base of shuffled) {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 4000); // 4s timeout

            const url = `${base}/api/v1/videos/${videoId}`;
            // console.log(`   Trying ${base}...`);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(id);

            if (res.ok) {
                const data = await res.json();

                // Extract best audio format
                if (data.adaptiveFormats) {
                    const audio = data.adaptiveFormats
                        .filter(f => f.type && f.type.startsWith('audio/webm'))
                        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

                    if (audio.length > 0) {
                        console.log(`   ✅ Found stream on ${base}`);
                        return { url: audio[0].url, source: base };
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }
    return null;
}
