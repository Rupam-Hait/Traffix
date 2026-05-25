import * as Tone from 'tone';

let muted = false;
let ready = false;
let synth;
let bass;
let poly;

const ensureAudio = async () => {
  if (muted) return false;
  if (Tone.context.state !== 'running') {
    await Tone.start();
  }
  if (!ready) {
    synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.004, decay: 0.08, sustain: 0.04, release: 0.08 },
    }).toDestination();
    bass = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 3,
      envelope: { attack: 0.001, decay: 0.25, sustain: 0.01, release: 0.12 },
    }).toDestination();
    poly = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.12, sustain: 0.05, release: 0.18 },
    }).toDestination();
    ready = true;
  }
  return true;
};

export const unlockAudio = () => ensureAudio();

export const setMuted = (value) => {
  muted = value;
  Tone.Destination.mute = value;
};

export const getMuted = () => muted;

export const playNodeVisit = async (nodeIndex = 0) => {
  if (!(await ensureAudio())) return;
  const scale = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'];
  synth.triggerAttackRelease(scale[nodeIndex % scale.length], '32n');
};

export const playPathFound = async () => {
  if (!(await ensureAudio())) return;
  const now = Tone.now();
  ['C5', 'E5', 'G5', 'B5', 'C6'].forEach((note, index) => {
    poly.triggerAttackRelease(note, '16n', now + index * 0.055);
  });
};

export const playBlock = async () => {
  if (!(await ensureAudio())) return;
  bass.triggerAttackRelease('C2', '16n');
};

export const playReset = async () => {
  if (!(await ensureAudio())) return;
  const now = Tone.now();
  ['G4', 'E4', 'C4'].forEach((note, index) => {
    synth.triggerAttackRelease(note, '32n', now + index * 0.05);
  });
};

export default function SoundEngine() {
  return null;
}
