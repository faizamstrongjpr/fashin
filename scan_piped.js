
(async () => {
    try {
        console.log('Fetching Piped instances...');
        const res = await fetch('https://piped-instances.kavin.rocks/');
        const instances = await res.json();

        console.log(`Found ${instances.length} instances. Testing...`);

        const videoId = 'dQw4w9WgXcQ'; // Rick Roll (always available)

        for (const inst of instances) {
            const url = inst.api_url;
            try {
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 2000); // 2s timeout

                const start = Date.now();
                const r = await fetch(`${url}/streams/${videoId}`, { signal: controller.signal });
                clearTimeout(id);

                if (r.ok) {
                    const millis = Date.now() - start;
                    console.log(`✅ WORKING: ${url} (${millis}ms)`);
                    // We only need one good one
                    break;
                }
            } catch (e) {
                // ignore
            }
        }
        console.log('Scan complete.');
    } catch (e) {
        console.error('Scan failed:', e);
    }
})();
