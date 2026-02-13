
(async () => {
    try {
        const query = 'nadhif basalamah kota ini tak sama tanpamu';
        const searchUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&q=${encodeURIComponent(query)}&_format=json&_marker=0&ctx=web6dot0&p=1&n=5`;

        console.log('Searching:', searchUrl);
        const res = await fetch(searchUrl);
        // Sometimes Saavn returns HTML/Text even with _format=json? No usually JSON.
        // It might be JSONP?
        const text = await res.text();
        console.log('Response:', text.substring(0, 500));

        try {
            const data = JSON.parse(text);
            if (data.results && data.results.length > 0) {
                console.log('Found:', data.results[0].title);
                console.log('Encrypted URL:', data.results[0].encrypted_media_url);
            } else {
                console.log('No results found in data.results');
            }
        } catch (e) {
            console.log('JSON Parse error');
        }

    } catch (e) {
        console.error('Error:', e);
    }
})();
