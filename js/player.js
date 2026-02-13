// ===== Audio Player Engine =====
// Simple & Direct: Full song, no preview tricks

import { matchTrack } from './piped.js';
import { addToRecentlyPlayed, getVolume, saveVolume } from './storage.js';

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.crossOrigin = 'anonymous';
        this.audio.preload = 'auto';

        // Web Audio API
        this.audioCtx = null;
        this.source = null;
        this.filters = [];
        this.gainNode = null;

        // State
        this.queue = [];
        this.currentIndex = -1;
        this.currentTrack = null;
        this.isPlaying = false;
        this.shuffle = false;
        this.repeat = 0;
        this.volume = getVolume() / 100;
        this.isLoading = false;
        this._playId = 0;

        // Callbacks
        this.onTrackChange = null;
        this.onPlayStateChange = null;
        this.onTimeUpdate = null;
        this.onLoading = null;
        this.onError = null;

        this._setupAudioEvents();
        this.audio.volume = this.volume;
    }

    _setupAudioEvents() {
        this.audio.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) {
                this.onTimeUpdate({
                    current: this.audio.currentTime,
                    duration: this.audio.duration || 0,
                    progress: this.audio.duration ? (this.audio.currentTime / this.audio.duration) * 100 : 0
                });
            }
        });

        this.audio.addEventListener('ended', () => this._onTrackEnded());

        this.audio.addEventListener('playing', () => {
            this.isPlaying = true;
            this.isLoading = false;
            if (this.onPlayStateChange) this.onPlayStateChange(true);
            if (this.onLoading) this.onLoading(false);
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.onPlayStateChange) this.onPlayStateChange(false);
        });

        this.audio.addEventListener('waiting', () => {
            this.isLoading = true;
            if (this.onLoading) this.onLoading(true);
        });

        this.audio.addEventListener('error', () => {
            this.isLoading = false;
            if (this.onLoading) this.onLoading(false);
            if (this.onError) this.onError('Gagal memutar lagu');
        });
    }

    initAudioContext() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.source = this.audioCtx.createMediaElementSource(this.audio);
        this.gainNode = this.audioCtx.createGain();

        const freqs = [60, 230, 910, 4000, 14000];
        this.filters = freqs.map((freq, i) => {
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking';
            filter.frequency.value = freq;
            filter.gain.value = 0;
            filter.Q.value = 1;
            return filter;
        });

        let lastNode = this.source;
        this.filters.forEach(filter => {
            lastNode.connect(filter);
            lastNode = filter;
        });
        lastNode.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
    }

    // ========== PLAY (SIMPLE & DIRECT) ==========
    async play(track, trackList = null, index = -1) {
        if (!track) return;

        const thisPlayId = ++this._playId;

        this.audio.pause();
        this.isLoading = true;
        if (this.onLoading) this.onLoading(true);

        if (trackList) {
            this.queue = [...trackList];
            this.currentIndex = index >= 0 ? index : trackList.findIndex(t => t.id === track.id);
            if (this.currentIndex < 0) this.currentIndex = 0;
        }

        this.currentTrack = track;
        if (this.onTrackChange) this.onTrackChange(track);

        try {
            if (!this.audioCtx) this.initAudioContext();
            if (this.audioCtx?.state === 'suspended') this.audioCtx.resume().catch(() => { });

            // Direct: Get full stream URL and play
            const streamUrl = await matchTrack(track);

            // Check if user already changed track
            if (this._playId !== thisPlayId) return;

            this.audio.src = streamUrl;
            const p = this.audio.play();
            if (p) p.catch(() => { });

            addToRecentlyPlayed(track);

        } catch (err) {
            if (this._playId !== thisPlayId) return;
            console.error('Play error:', err);
            this.isLoading = false;
            if (this.onLoading) this.onLoading(false);
            if (this.onError) this.onError(`Gagal: ${err.message || 'Error'}`);
        }
    }

    togglePlay() {
        if (!this.currentTrack) return;
        if (this.isPlaying) this.audio.pause();
        else this.audio.play().catch(() => { });
    }

    next() {
        if (!this.queue.length) return;
        if (this.shuffle) this.currentIndex = Math.floor(Math.random() * this.queue.length);
        else this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        this.play(this.queue[this.currentIndex]);
    }

    prev() {
        if (!this.queue.length) return;
        if (this.audio.currentTime > 3) { this.audio.currentTime = 0; return; }
        if (this.shuffle) this.currentIndex = Math.floor(Math.random() * this.queue.length);
        else this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
        this.play(this.queue[this.currentIndex]);
    }

    seek(percent) {
        if (this.audio.duration) this.audio.currentTime = (percent / 100) * this.audio.duration;
    }

    setVolume(vol) {
        this.volume = vol / 100;
        this.audio.volume = this.volume;
        saveVolume(vol);
    }

    toggleShuffle() { this.shuffle = !this.shuffle; return this.shuffle; }
    toggleRepeat() { this.repeat = (this.repeat + 1) % 3; return this.repeat; }

    setEQBand(bandIndex, gain) {
        if (this.filters[bandIndex]) this.filters[bandIndex].gain.value = gain;
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    _onTrackEnded() {
        if (this.repeat === 2) {
            this.audio.currentTime = 0;
            this.audio.play();
        } else if (this.queue.length > 1 && (this.repeat === 1 || this.currentIndex < this.queue.length - 1)) {
            this.next();
        } else {
            this.isPlaying = false;
            if (this.onPlayStateChange) this.onPlayStateChange(false);
        }
    }

    addToQueue(track) { this.queue.push(track); }
    playNext(track) { this.queue.splice(this.currentIndex + 1, 0, track); }
}

export const player = new AudioPlayer();
