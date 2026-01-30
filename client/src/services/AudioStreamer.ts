export class AudioStreamer {
    private audioContext: AudioContext;
    private source: AudioBufferSourceNode | null = null;
    private nextStartTime: number = 0;
    public isPlaying: boolean = false;
    private abortController: AbortController | null = null;
    private isStopped: boolean = false; // Flag to prevent playing if stopped during fetch

    // Global Mutex: Only one audio source can play at a time across ALL instances
    private static currentGlobalSource: AudioBufferSourceNode | null = null;

    // Simple static cache for decoded audio buffers
    private static audioCache: Map<string, AudioBuffer> = new Map();

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    async playStream(url: string, body: any): Promise<number> {
        // Stop any previous playback (instance level)
        this.stop();
        this.isStopped = false; // Reset flag

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const cacheKey = `${url}-${JSON.stringify(body)}`;

        // 1. Check Cache
        if (AudioStreamer.audioCache.has(cacheKey)) {
            console.log("[AudioStreamer] Playing from cache:", body.text?.substring(0, 20));
            const buffer = AudioStreamer.audioCache.get(cacheKey)!;
            if (this.isStopped) return 0; // Check if stopped while resuming context
            this.playBuffer(buffer);
            return buffer.duration;
        }

        this.isPlaying = true;
        this.abortController = new AbortController();

        try {
            console.log("[AudioStreamer] Fetching:", body.text?.substring(0, 20));
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: this.abortController.signal
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let receivedLength = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                    receivedLength += value.length;
                }
            }

            // If stopped during fetch (via AbortController or flag), abort
            if (this.isStopped) {
                console.log("[AudioStreamer] Playback aborted (stopped during fetch)");
                return 0;
            }

            // Concatenate
            const combined = new Uint8Array(receivedLength);
            let offset = 0;
            for (const chunk of chunks) {
                combined.set(chunk, offset);
                offset += chunk.length;
            }

            const audioBuffer = await this.audioContext.decodeAudioData(combined.buffer);

            // 2. Save to Cache
            AudioStreamer.audioCache.set(cacheKey, audioBuffer);

            // Final check before playing
            if (this.isStopped) return 0;

            this.playBuffer(audioBuffer);

            return audioBuffer.duration;

        } catch (e: any) {
            if (e.name === 'AbortError') {
                console.log("[AudioStreamer] Fetch aborted by user");
            } else {
                console.error("Stream error", e);
            }
            return 0;
        } finally {
            this.abortController = null;
        }
    }

    // Simple buffer player
    playBuffer(buffer: AudioBuffer) {
        console.log('[AudioStreamer] 🎵 playBuffer called, duration:', buffer.duration.toFixed(2) + 's');

        // GLOBAL MUTEX: Stop any other running audio globally!
        if (AudioStreamer.currentGlobalSource) {
            try {
                AudioStreamer.currentGlobalSource.stop();
            } catch (e) { }
            AudioStreamer.currentGlobalSource = null;
        }

        // Create a new source (sources are one-time use)
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);

        source.onended = () => {
            console.log('[AudioStreamer] ✅ Audio playback ended');
            this.isPlaying = false;
            // Clear global ref if it matches this source
            if (AudioStreamer.currentGlobalSource === source) {
                AudioStreamer.currentGlobalSource = null;
            }
        }

        source.start(0);
        this.source = source;
        this.isPlaying = true;

        // Update global ref
        AudioStreamer.currentGlobalSource = source;
    }

    stop() {
        this.isStopped = true; // Mark as stopped

        // Abort fetch if pending
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }

        // Stop current audio source
        if (this.source) {
            try {
                this.source.stop();
            } catch (e) { /* ignore if already stopped */ }
            this.source = null;
        }

        this.isPlaying = false;
    }
}
