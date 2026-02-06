/**
 * Advanced audio playback with pitch shifting (voice enhancement)
 * Makes voices sound younger/cuter, perfect for cartoon characters
 */

export const playAudioWithPitchShift = async (
    url: string,
    pitchShift: number = 1.2, // 1.15-1.25 for cartoon/child-like voice
    onEnded?: () => void
): Promise<{ stop: () => void }> => {
    try {
        // 1. Fetch audio data
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        // 2. Create audio context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();

        // 3. Decode audio data
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // 4. Create playback source
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        // ✨✨✨ Core Magic: Pitch Shift ✨✨✨
        // Default is 1.0 (original pitch)
        // 1.15 to 1.25 makes voice higher/thinner, like a child/cartoon character
        // Works best with OpenAI 'nova' voice
        source.playbackRate.value = pitchShift;

        // 5. Handle end event
        if (onEnded) {
            source.onended = onEnded;
        }

        // 6. Connect and play
        source.connect(audioCtx.destination);
        source.start(0);

        // Return control object
        return {
            stop: () => {
                try {
                    source.stop();
                } catch (e) {
                    // Ignore if already stopped
                }

                if (audioCtx.state !== 'closed') {
                    audioCtx.close().catch(e => console.warn("Error closing context:", e));
                }
            }
        };

    } catch (error) {
        console.error("Advanced audio playback failed, falling back to simple mode:", error);

        // Debug: Log what we tried to decode
        if (typeof arrayBuffer !== 'undefined') {
            console.log(`[AudioDebug] ArrayBuffer size: ${arrayBuffer.byteLength}`);
            if (arrayBuffer.byteLength > 4) {
                const view = new Uint8Array(arrayBuffer.slice(0, 4));
                console.log(`[AudioDebug] Header (Hex): ${Array.from(view).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
            }
        }

        // Fallback: use simple Audio element if Web Audio API fails
        const audio = new Audio(url);
        if (onEnded) {
            audio.onended = onEnded;
        }
        await audio.play();

        return {
            stop: () => {
                audio.pause();
                audio.currentTime = 0;
            }
        };
    }
};

/**
 * Play audio from ArrayBuffer (for in-memory audio data)
 */
export const playAudioBuffer = async (
    buffer: ArrayBuffer,
    pitchShift: number = 1.2
): Promise<void> => {
    try {
        // 1. Create audio context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();

        // 2. Decode audio data
        const audioBuffer = await audioCtx.decodeAudioData(buffer);

        // 3. Create playback source
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        // ✨ Pitch Shift
        source.playbackRate.value = pitchShift;

        // 4. Connect and play
        source.connect(audioCtx.destination);
        source.start(0);

    } catch (error) {
        console.error("Audio playback failed:", error);
        // Fallback: use Blob URL
        const blob = new Blob([buffer], { type: 'audio/mp3' });
        const audio = new Audio(URL.createObjectURL(blob));
        audio.play();
    }
};
