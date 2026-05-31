export const playAudioWithMouth = async (url, onLevel = () => {}) => {
  let audio = null;
  let ctx = null;
  let source = null;
  let analyser = null;
  let rafId = null;
  let stopped = false;

  const cleanup = async () => {
    stopped = true;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    try { source?.disconnect(); } catch {}
    try { analyser?.disconnect(); } catch {}

    try {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    } catch {}

    try {
      if (ctx && ctx.state !== 'closed') await ctx.close();
    } catch {}

    onLevel(0);
  };

  if (!url) {
    onLevel(0);
    return { stop: cleanup, audio: null };
  }

  audio = new Audio(url);
  audio.crossOrigin = 'anonymous';

  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextCtor) {
      await audio.play();
      return { stop: cleanup, audio };
    }

    ctx = new AudioContextCtor();
    if (ctx.state === 'suspended') await ctx.resume();

    source = ctx.createMediaElementSource(audio);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.68;

    source.connect(analyser);
    analyser.connect(ctx.destination);

    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (stopped || !audio || audio.paused || audio.ended) {
        onLevel(0);
        return;
      }

      analyser.getByteFrequencyData(data);

      const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
      const level = Math.min(1, avg / 70);

      onLevel(level);
      rafId = requestAnimationFrame(tick);
    };

    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });

    await audio.play();
    tick();

    return { stop: cleanup, audio };
  } catch (err) {
    console.error('[playAudioWithMouth]', err);

    try {
      await audio.play();
    } catch {}

    onLevel(0);

    return { stop: cleanup, audio };
  }
};
