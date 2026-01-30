
// 简单的音效合成器，无需外部文件
// 解决 "Failed to resolve import" 错误

// 兼容性处理：部分旧浏览器可能使用 webkitAudioContext
const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
const audioCtx = new AudioContextClass();

export const playUiSound = (type: 'pop' | 'swoosh' | 'click') => {
    // 许多浏览器要求由用户交互触发后才能 resume
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch((err) => console.warn('AudioContext resume failed', err));
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'pop') {
        // 气泡音：频率快速上升，极短
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);

        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }
    else if (type === 'swoosh') {
        // 收缩音：频率下降模拟风声
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.linearRampToValueAtTime(200, now + 0.15);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.15);

        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }
    else if (type === 'click') {
        // 点击音：短促的高频
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, now);

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        oscillator.start(now);
        oscillator.stop(now + 0.05);
    }
};

export const playBubble = () => playUiSound('pop');
export const playClick = () => playUiSound('click');
