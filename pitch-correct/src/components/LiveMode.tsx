import { useCallback, useEffect, useRef, useState } from "react";
import { MidiUpload } from "./MidiUpload";
import { startLiveSession } from "../audio/liveEngine";
import type { LiveSession, LiveStatus } from "../audio/liveEngine";
import type { TargetNote } from "../audio/types";

interface LiveModeProps {
  targetNotes: TargetNote[];
  midiLoaded: boolean;
  onLoadMidi: (data: ArrayBuffer, notes: TargetNote[], fileName: string) => void;
}

function midiName(midi: number | null): string {
  if (midi == null) return "—";
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const rounded = Math.round(midi);
  const octave = Math.floor(rounded / 12) - 1;
  return `${names[((rounded % 12) + 12) % 12]}${octave}`;
}

export function LiveMode({ targetNotes, midiLoaded, onLoadMidi }: LiveModeProps) {
  const [status, setStatus] = useState<LiveStatus>({
    running: false,
    elapsed: 0,
    currentTargetMidi: null,
    detectedMidi: null,
    semitoneShift: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
      audioContextRef.current?.close();
    };
  }, []);

  const handleStart = useCallback(async () => {
    setError(null);
    try {
      if (!audioContextRef.current) audioContextRef.current = new AudioContext();
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") await ctx.resume();
      sessionRef.current = await startLiveSession(ctx, targetNotes, setStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the live session.");
    }
  }, [targetNotes]);

  const handleStop = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
  }, []);

  return (
    <main>
      <MidiUpload onLoaded={onLoadMidi} />

      <div className="panel">
        <h2>Live pitch monitor</h2>
        <p className="summary">
          Sing along in real time — your pitch snaps to whichever MIDI note is current on the timeline the
          moment you press play. Timing isn't corrected live (that needs the offline mode), only pitch.
          Use headphones to avoid mic feedback.
        </p>
        <div className="row">
          {status.running ? (
            <button className="btn danger" onClick={handleStop}>
              ■ Stop
            </button>
          ) : (
            <button className="btn primary" disabled={!midiLoaded} onClick={handleStart}>
              ▶ Start singing
            </button>
          )}
        </div>
        {error && <p className="error">{error}</p>}
        {!midiLoaded && <p className="summary">Load a MIDI reference above first.</p>}
        {status.running && (
          <p className="live-status">
            t={status.elapsed.toFixed(1)}s · target {midiName(status.currentTargetMidi)} · you{" "}
            {midiName(status.detectedMidi)} · shift {status.semitoneShift.toFixed(1)} st
          </p>
        )}
      </div>
    </main>
  );
}
