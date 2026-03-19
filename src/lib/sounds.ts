// Web Audio API sound effects — no external files needed
const audioCtx = typeof window !== "undefined" ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.08) {
  if (!audioCtx) return;
  // Resume context if suspended (autoplay policy)
  if (audioCtx.state === "suspended") audioCtx.resume();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

export function playTabSwitch() {
  playTone(800, 0.08, "sine", 0.05);
  setTimeout(() => playTone(1200, 0.06, "sine", 0.03), 40);
}

export function playButtonClick() {
  playTone(600, 0.05, "square", 0.03);
}

export function playSuccess() {
  playTone(523, 0.1, "sine", 0.06); // C
  setTimeout(() => playTone(659, 0.1, "sine", 0.06), 100); // E
  setTimeout(() => playTone(784, 0.15, "sine", 0.06), 200); // G
}

export function playBootBeep() {
  playTone(1200, 0.08, "sine", 0.04);
}

export function playBootComplete() {
  playTone(523, 0.1, "sine", 0.05);
  setTimeout(() => playTone(659, 0.1, "sine", 0.05), 100);
  setTimeout(() => playTone(784, 0.15, "sine", 0.05), 200);
  setTimeout(() => playTone(1047, 0.25, "sine", 0.05), 320);
}

export function playPortalEnter() {
  // Whoosh + chime
  playTone(200, 0.3, "sawtooth", 0.03);
  setTimeout(() => playTone(880, 0.4, "sine", 0.06), 100);
}

export function playFriendAdd() {
  playTone(440, 0.08, "sine", 0.05);
  setTimeout(() => playTone(554, 0.08, "sine", 0.05), 80);
  setTimeout(() => playTone(659, 0.12, "sine", 0.05), 160);
  setTimeout(() => playTone(880, 0.2, "sine", 0.05), 260);
}
