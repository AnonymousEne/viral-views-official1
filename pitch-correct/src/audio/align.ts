import type { CorrectionPlan, CorrectionSegment, SungNote, TargetNote } from "./types";

/** Circular pitch-class distance in semitones, ignoring octave (0-6). */
function pitchClassDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 12;
  return Math.min(diff, 12 - diff);
}

/**
 * Snap `sourceMidi` to the pitch class of `targetMidi`, keeping the singer's
 * own octave/register (the nearest octave-transposition of the target note).
 */
export function snapToNearestOctave(sourceMidi: number, targetMidi: number): number {
  const octaveShift = Math.round((sourceMidi - targetMidi) / 12);
  return targetMidi + 12 * octaveShift;
}

interface DtwCell {
  cost: number;
  from: "diag" | "up" | "left" | null;
}

/**
 * Dynamic time warping alignment between a sequence of sung notes and the
 * target MIDI melody, using octave-invariant pitch-class distance as the
 * per-pair cost. Returns the optimal monotonic path from (0,0) to (N-1,M-1),
 * guaranteeing every sung note and every target note appears at least once.
 */
function dtwAlign(sung: SungNote[], target: TargetNote[]): Array<[number, number]> {
  const n = sung.length;
  const m = target.length;
  const grid: DtwCell[][] = Array.from({ length: n }, () => new Array<DtwCell>(m));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const localCost = pitchClassDistance(sung[i].midi, target[j].midi);
      const candidates: Array<{ cost: number; from: DtwCell["from"] }> = [];
      if (i > 0 && j > 0) candidates.push({ cost: grid[i - 1][j - 1].cost, from: "diag" });
      if (i > 0) candidates.push({ cost: grid[i - 1][j].cost, from: "up" });
      if (j > 0) candidates.push({ cost: grid[i][j - 1].cost, from: "left" });

      if (candidates.length === 0) {
        grid[i][j] = { cost: localCost, from: null };
      } else {
        const best = candidates.reduce((a, b) => (b.cost < a.cost ? b : a));
        grid[i][j] = { cost: best.cost + localCost, from: best.from };
      }
    }
  }

  const path: Array<[number, number]> = [];
  let i = n - 1;
  let j = m - 1;
  while (i >= 0 && j >= 0) {
    path.push([i, j]);
    const cell = grid[i][j];
    if (cell.from === "diag") {
      i--;
      j--;
    } else if (cell.from === "up") {
      i--;
    } else if (cell.from === "left") {
      j--;
    } else {
      break;
    }
  }
  path.reverse();
  return path;
}

/**
 * Build the full correction plan: for every target (MIDI) note, figure out
 * which portion of the sung recording should be stretched/shifted to fill
 * it exactly, snapping pitch to the target's pitch class and timing to the
 * target's start/end.
 */
export function buildCorrectionPlan(sung: SungNote[], target: TargetNote[]): CorrectionPlan {
  if (sung.length === 0 || target.length === 0) {
    const outputDuration = target.length > 0 ? target[target.length - 1].endTime : 0;
    return { segments: [], outputDuration };
  }

  const path = dtwAlign(sung, target);

  const byTarget: number[][] = Array.from({ length: target.length }, () => []);
  const bySung: number[][] = Array.from({ length: sung.length }, () => []);
  for (const [i, j] of path) {
    if (byTarget[j][byTarget[j].length - 1] !== i) byTarget[j].push(i);
    if (bySung[i][bySung[i].length - 1] !== j) bySung[i].push(j);
  }

  // A sung note can span multiple target notes when the target has far more
  // notes than the singer actually produced (a dense auto-transcribed MIDI
  // reference against a much sparser vocal take is a common real case).
  // Each of those targets reuses the sung note's *full* range rather than a
  // proportionally-divided slice of it: slicing a short note across dozens
  // of targets produces sub-millisecond fragments - shorter than a single
  // pitch period - which the stretch engine cannot loop or shift into
  // anything but silence or buzzing garbage. Reusing the whole note and
  // leaning on the correction engine's existing loop/clamp handling (for
  // whatever duration mismatch results) is both simpler and correct: it's
  // the same "hold this syllable across these notes" behavior a human
  // pitch-correction engineer would reach for.
  const rangeFor = (i: number) => ({ start: sung[i].startTime, end: sung[i].endTime });

  const segments: CorrectionSegment[] = [];
  for (let j = 0; j < target.length; j++) {
    const sungIndices = byTarget[j];
    if (sungIndices.length === 0) continue;

    const ranges = sungIndices.map((i) => rangeFor(i));
    const sungStart = Math.min(...ranges.map((r) => r.start));
    const sungEnd = Math.max(...ranges.map((r) => r.end));

    // Dominant sung note = the one contributing the most voiced duration,
    // used to decide the source pitch (and hence the octave-preserving shift).
    let dominant = sungIndices[0];
    let dominantDur = -Infinity;
    for (const i of sungIndices) {
      const r = rangeFor(i);
      const dur = r.end - r.start;
      if (dur > dominantDur) {
        dominantDur = dur;
        dominant = i;
      }
    }

    const sourceMidi = sung[dominant].midi;
    const targetMidi = snapToNearestOctave(sourceMidi, target[j].midi);

    segments.push({
      sungStart,
      sungEnd,
      outStart: target[j].startTime,
      outEnd: target[j].endTime,
      targetMidi,
      sourceMidi,
    });
  }

  const outputDuration = target[target.length - 1].endTime;
  return { segments, outputDuration };
}
