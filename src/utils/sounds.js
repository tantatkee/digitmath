/**
 * Sound effects for DigitMath using the Web Audio API.
 * No external files needed — all sounds are generated programmatically.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume context on mobile (requires user gesture)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a short beep-style tone.
 * @param {number} freq - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type ('sine', 'square', 'triangle', 'sawtooth')
 * @param {number} volume - Gain 0.0 to 1.0
 */
function playTone(freq, duration, type = 'sine', volume = 0.4) {
  const ctx = getCtx();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

/**
 * Click sound — short, crisp tick
 */
export function playClick() {
  playTone(600, 0.08, 'square', 0.25);
}

/**
 * Undo/Clear sound — slightly lower, reversed feel
 */
export function playUndo() {
  playTone(350, 0.1, 'triangle', 0.25);
}

/**
 * Correct answer sound — cheerful ascending arpeggio
 */
export function playCorrect() {
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.18, 'sine', 0.4), i * 90);
  });
}

/**
 * Wrong answer sound — buzzy error tone
 */
export function playWrong() {
  playTone(180, 0.25, 'sawtooth', 0.3);
}

/**
 * Skip sound — descending whoosh
 */
export function playSkip() {
  const ctx = getCtx();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(500, ctx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);

  gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.25);
}

/**
 * Game session complete — big fanfare
 */
export function playGameOver() {
  const notes = [523, 659, 784, 880, 1047]; // C E G A C
  const durations = [0.15, 0.15, 0.15, 0.15, 0.4];
  let t = 0;
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, durations[i], 'triangle', 0.5), t);
    t += durations[i] * 1000 - 10;
  });
}
