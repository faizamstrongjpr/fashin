import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/deezer-api': {
                target: 'https://api.deezer.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/deezer-api/, ''),
                secure: true
            },
            '/piped1': {
                target: 'https://pipedapi.kavin.rocks',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/piped1/, ''),
                secure: true
            },
            '/piped2': {
                target: 'https://pipedapi.adminforge.de',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/piped2/, ''),
                secure: true
            },
            '/piped3': {
                target: 'https://pipedapi.in.projectsegfau.lt',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/piped3/, ''),
                secure: true
            },
            '/piped4': {
                target: 'https://api.piped.yt',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/piped4/, ''),
                secure: true
            },
            '/lyrics-api': {
                target: 'https://api.lyrics.ovh',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/lyrics-api/, ''),
                secure: true
            }
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets'
    }
});
