import { useEffect, useRef } from "react";
import type { PitchFrame, TargetNote } from "../audio/types";
import { hzToMidi } from "../audio/types";

interface PitchTimelineProps {
  targetNotes: TargetNote[];
  pitchFrames: PitchFrame[];
  height?: number;
}

const PADDING_MIDI = 3;

export function PitchTimeline({ targetNotes, pitchFrames, height = 260 }: PitchTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(container.clientWidth, 400);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const duration = Math.max(
      1,
      targetNotes.length ? targetNotes[targetNotes.length - 1].endTime : 0,
      pitchFrames.length ? pitchFrames[pitchFrames.length - 1].time : 0,
    );

    const midiValues = [
      ...targetNotes.map((n) => n.midi),
      ...pitchFrames.filter((f) => f.frequency > 0).map((f) => hzToMidi(f.frequency)),
    ];
    const minMidi = (midiValues.length ? Math.min(...midiValues) : 60) - PADDING_MIDI;
    const maxMidi = (midiValues.length ? Math.max(...midiValues) : 72) + PADDING_MIDI;
    const midiRange = Math.max(1, maxMidi - minMidi);

    const xForTime = (t: number) => (t / duration) * width;
    const yForMidi = (m: number) => height - ((m - minMidi) / midiRange) * height;

    // Background gridlines every octave.
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let m = Math.ceil(minMidi / 12) * 12; m <= maxMidi; m += 12) {
      const y = yForMidi(m);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Target MIDI notes as piano-roll bars.
    ctx.fillStyle = "rgba(90, 200, 250, 0.55)";
    for (const note of targetNotes) {
      const x = xForTime(note.startTime);
      const w = Math.max(1, xForTime(note.endTime) - x);
      const y = yForMidi(note.midi) - 4;
      ctx.fillRect(x, y, w, 8);
    }

    // Detected sung pitch curve.
    ctx.strokeStyle = "#ff5d73";
    ctx.lineWidth = 2;
    ctx.beginPath();
    let drawing = false;
    for (const frame of pitchFrames) {
      if (frame.frequency <= 0 || frame.clarity < 0.4) {
        drawing = false;
        continue;
      }
      const x = xForTime(frame.time);
      const y = yForMidi(hzToMidi(frame.frequency));
      if (!drawing) {
        ctx.moveTo(x, y);
        drawing = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }, [targetNotes, pitchFrames, height]);

  return (
    <div className="timeline" ref={containerRef}>
      <canvas ref={canvasRef} />
      <div className="legend">
        <span><i className="swatch target" /> MIDI target</span>
        <span><i className="swatch sung" /> Your pitch</span>
      </div>
    </div>
  );
}
