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

  // For a sung note that spans multiple target notes, split its source time
  // range proportionally (by each target's duration) across those targets,
  // in temporal order, instead of replaying the same audio for each.
  const subRange = new Map<string, { start: number; end: number }>();
  for (let i = 0; i < sung.length; i++) {
    const targets = bySung[i];
    if (targets.length <= 1) continue;
    const note = sung[i];
    const totalTargetDur = targets.reduce((sum, j) => sum + (target[j].endTime - target[j].startTime), 0);
    const noteDur = note.endTime - note.startTime;
    let cursor = note.startTime;
    for (const j of targets) {
      const frac = totalTargetDur > 0 ? (target[j].endTime - target[j].startTime) / totalTargetDur : 1 / targets.length;
      const dur = noteDur * frac;
      subRange.set(`${i}:${j}`, { start: cursor, end: cursor + dur });
      cursor += dur;
    }
  }

  const rangeFor = (i: number, j: number) => subRange.get(`${i}:${j}`) ?? { start: sung[i].startTime, end: sung[i].endTime };

  const segments: CorrectionSegment[] = [];
  for (let j = 0; j < target.length; j++) {
    const sungIndices = byTarget[j];
    if (sungIndices.length === 0) continue;

    const ranges = sungIndices.map((i) => rangeFor(i, j));
    const sungStart = Math.min(...ranges.map((r) => r.start));
    const sungEnd = Math.max(...ranges.map((r) => r.end));

    // Dominant sung note = the one contributing the most voiced duration,
    // used to decide the source pitch (and hence the octave-preserving shift).
    let dominant = sungIndices[0];
    let dominantDur = -Infinity;
    for (const i of sungIndices) {
      const r = rangeFor(i, j);
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
