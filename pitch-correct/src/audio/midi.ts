import { Midi } from "@tonejs/midi";
import type { TargetNote } from "./types";

/**
 * Parse a .mid file into a flat, monophonic, time-sorted note timeline.
 *
 * If the file has multiple tracks/notes overlapping, we flatten everything
 * into a single melody line by picking the highest-pitched note active at
 * any moment (typical lead/vocal-line heuristic) and trimming overlaps so
 * the result is strictly monophonic and gap-tolerant.
 */
export async function parseMidiTargets(data: ArrayBuffer): Promise<TargetNote[]> {
  const midi = new Midi(data);

  const raw: TargetNote[] = [];
  for (const track of midi.tracks) {
    for (const note of track.notes) {
      raw.push({
        startTime: note.time,
        endTime: note.time + note.duration,
        midi: note.midi,
        velocity: note.velocity,
      });
    }
  }

  return toMonophonic(raw);
}

/**
 * Collapse a set of possibly-overlapping notes into a single monophonic,
 * time-sorted, non-overlapping melody line.
 */
export function toMonophonic(notes: TargetNote[]): TargetNote[] {
  if (notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime || b.midi - a.midi);
  const result: TargetNote[] = [];

  for (const note of sorted) {
    if (note.endTime <= note.startTime) continue;

    const prev = result[result.length - 1];
    if (prev && note.startTime < prev.endTime) {
      if (note.midi >= prev.midi) {
        // Higher (or equal) note takes priority: cut the previous note short.
        prev.endTime = note.startTime;
        if (prev.endTime <= prev.startTime) result.pop();
        result.push({ ...note });
      } else {
        // Lower note starts inside a higher note that's already playing: skip it
        // unless it extends past the current note, in which case pick it up after.
        if (note.endTime > prev.endTime) {
          result.push({ ...note, startTime: prev.endTime });
        }
        continue;
      }
    } else {
      result.push({ ...note });
    }
  }

  return result.filter((n) => n.endTime > n.startTime);
}
