(function () {
  let ctx = null;
  let musicInterval = null;

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function isSfxEnabled() {
    const s = window.ArenaStorage && window.ArenaStorage.getSettings();
    return !s || s.sfx !== false;
  }

  function playTone(freq, duration, type = "sine", gainVal = 0.08, delay = 0) {
    if (!isSfxEnabled()) return;
    const audio = ensureContext();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(gainVal, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + duration);
  }

  window.ArenaAudio = {
    playDice() {
      [220, 310, 260, 390].forEach((f, idx) => playTone(f, 0.06, "triangle", 0.06, idx * 0.05));
    },
    playHop() {
      playTone(460, 0.07, "sine", 0.055);
    },
    playLadder() {
      [392, 494, 587, 784].forEach((f, idx) => playTone(f, 0.14, "triangle", 0.08, idx * 0.08));
    },
    playSnake() {
      if (!isSfxEnabled()) return;
      const audio = ensureContext();
      if (!audio) return;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(420, audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, audio.currentTime + 0.45);
      gain.gain.setValueAtTime(0.07, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.48);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + 0.5);
    },
    playWin() {
      [523, 659, 784, 1046].forEach((f, idx) => playTone(f, 0.25, "triangle", 0.1, idx * 0.11));
    },
    syncMusic(enabled) {
      if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
      }
      if (!enabled) return;
      const notes = [261.6, 329.6, 392.0, 329.6];
      let step = 0;
      musicInterval = setInterval(() => {
        const audio = ensureContext();
        if (!audio) return;
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(notes[step % notes.length], audio.currentTime);
        gain.gain.setValueAtTime(0.018, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0008, audio.currentTime + 0.42);
        osc.connect(gain);
        gain.connect(audio.destination);
        osc.start();
        osc.stop(audio.currentTime + 0.45);
        step++;
      }, 650);
    }
  };
})();
