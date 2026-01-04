// analyzeAudio.js
export const playAudioWithMouth = (url, onLevel) => {
  const audio = new Audio(url);
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;

  const data = new Uint8Array(analyser.frequencyBinCount);

  src.connect(analyser);
  analyser.connect(ctx.destination);

  const tick = () => {
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;

    onLevel(Math.min(1, avg / 100));

    if (!audio.paused) requestAnimationFrame(tick);
    else onLevel(0);
  };

  audio.play();
  tick();
};
