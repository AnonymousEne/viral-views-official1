export interface TargetNote {
  startTime: number;
  endTime: number;
  midi: number;
  velocity: number;
}

export interface PitchFrame {
  time: number;
  frequency: number;
  clarity: number;
  rms: number;
}

export interface SungNote {
  startTime: number;
  endTime: number;
  /** RMS-weighted median MIDI note number detected across the segment. */
  midi: number;
  frames: PitchFrame[];
}

export interface CorrectionSegment {
  /** Time range in the *source* (sung) recording this segment reads from. */
  sungStart: number;
  sungEnd: number;
  /** Time range this segment occupies in the *corrected output*. */
  outStart: number;
  outEnd: number;
  /** Target pitch, in MIDI note number, or null for an unmatched/passthrough segment. */
  targetMidi: number | null;
  /** Detected source pitch for the segment (for computing the semitone shift), or null if unvoiced. */
  sourceMidi: number | null;
}

export interface CorrectionPlan {
  segments: CorrectionSegment[];
  outputDuration: number;
}

export const A4_MIDI = 69;
export const A4_HZ = 440;

export function hzToMidi(hz: number): number {
  return A4_MIDI + 12 * Math.log2(hz / A4_HZ);
}

export function midiToHz(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - A4_MIDI) / 12);
}
