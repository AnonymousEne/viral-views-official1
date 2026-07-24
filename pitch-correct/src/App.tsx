import { useCallback, useMemo, useRef, useState } from "react";
import { Recorder } from "./components/Recorder";
import { MidiUpload } from "./components/MidiUpload";
import { PitchTimeline } from "./components/PitchTimeline";
import { LiveMode } from "./components/LiveMode";
import { runCorrectionPipeline } from "./audio/pipeline";
import { audioBufferToWav } from "./audio/wav";
import type { PipelineResult, PipelineStage } from "./audio/pipeline";
import type { TargetNote } from "./audio/types";
import { checkBrowserSupport } from "./util/browserSupport";

const STAGE_LABEL: Record<PipelineStage, string> = {
  "decoding-audio": "Decoding your recording…",
  "parsing-midi": "Reading the MIDI reference…",
  "detecting-pitch": "Analyzing your pitch…",
  aligning: "Aligning to the melody…",
  rendering: "Rendering the corrected take…",
};

type Tab = "offline" | "live";

function describeProcessError(err: unknown): string {
  if (err instanceof DOMException && (err.name === "EncodingError" || err.name === "NotSupportedError")) {
    return "Couldn't read that audio file — it may be corrupted or an unsupported format. Try a WAV, MP3, or M4A file.";
  }
  return err instanceof Error ? err.message : "Something went wrong while processing.";
}

export default function App() {
  const [unsupportedReason] = useState<string | null>(() => checkBrowserSupport());
  const [tab, setTab] = useState<Tab>("offline");
  const [vocalBlob, setVocalBlob] = useState<Blob | null>(null);
  const [vocalUrl, setVocalUrl] = useState<string | null>(null);
  const [midiData, setMidiData] = useState<ArrayBuffer | null>(null);
  const [targetNotes, setTargetNotes] = useState<TargetNote[]>([]);
  const [stage, setStage] = useState<PipelineStage | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [correctedUrl, setCorrectedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    return audioContextRef.current;
  }, []);

  const canProcess = Boolean(vocalBlob) && Boolean(midiData) && stage === null && !unsupportedReason;

  const handleProcess = useCallback(async () => {
    if (!vocalBlob || !midiData) return;
    setError(null);
    setResult(null);
    if (correctedUrl) URL.revokeObjectURL(correctedUrl);
    setCorrectedUrl(null);

    try {
      const ctx = getAudioContext();
      const pipelineResult = await runCorrectionPipeline(vocalBlob, midiData, ctx, (progress) =>
        setStage(progress.stage),
      );
      setResult(pipelineResult);
      const wavBlob = audioBufferToWav(pipelineResult.correctedBuffer);
      setCorrectedUrl(URL.createObjectURL(wavBlob));
    } catch (err) {
      setError(describeProcessError(err));
    } finally {
      setStage(null);
    }
  }, [vocalBlob, midiData, correctedUrl, getAudioContext]);

  const pitchFrames = useMemo(() => result?.pitchFrames ?? [], [result]);

  return (
    <div className="app">
      <header>
        <h1>Pitch Correct</h1>
        <p className="subtitle">Snap a sung take onto a reference MIDI melody — pitch and timing.</p>
        <nav className="tabs">
          <button className={tab === "offline" ? "tab active" : "tab"} onClick={() => setTab("offline")}>
            Correct a take
          </button>
          <button className={tab === "live" ? "tab active" : "tab"} onClick={() => setTab("live")}>
            Live monitor
          </button>
        </nav>
      </header>

      {unsupportedReason && (
        <div className="panel">
          <p className="error">{unsupportedReason}</p>
        </div>
      )}

      {tab === "offline" ? (
        <main>
          <Recorder
            onCapture={(blob, url) => {
              setVocalBlob(blob);
              setVocalUrl(url);
              setResult(null);
              if (correctedUrl) URL.revokeObjectURL(correctedUrl);
              setCorrectedUrl(null);
            }}
          />
          <MidiUpload
            onLoaded={(data, notes) => {
              setMidiData(data);
              setTargetNotes(notes);
              setResult(null);
            }}
          />

          <div className="panel">
            <h2>3. Correct</h2>
            <button className="btn primary" disabled={!canProcess} onClick={handleProcess}>
              {stage ? STAGE_LABEL[stage] : "Snap to MIDI"}
            </button>
            {error && <p className="error">{error}</p>}
          </div>

          {(targetNotes.length > 0 || pitchFrames.length > 0) && (
            <div className="panel">
              <h2>Pitch timeline</h2>
              <PitchTimeline targetNotes={targetNotes} pitchFrames={pitchFrames} />
            </div>
          )}

          {result && correctedUrl && (
            <div className="panel">
              <h2>4. Result</h2>
              {result.plan.segments.length === 0 ? (
                <p className="error">
                  No singing was detected in your recording, so there's nothing to correct. Make sure the
                  recording isn't silent or too quiet, then try again.
                </p>
              ) : (
                <>
                  <div className="ab-row">
                    <div>
                      <p className="ab-label">Original</p>
                      {vocalUrl && <audio controls src={vocalUrl} />}
                    </div>
                    <div>
                      <p className="ab-label">Corrected</p>
                      <audio controls src={correctedUrl} />
                    </div>
                  </div>
                  <a className="btn secondary" href={correctedUrl} download="corrected-vocal.wav">
                    Download corrected WAV
                  </a>
                  <p className="meta">
                    {result.plan.segments.length} note(s) matched of {targetNotes.length} target note(s).
                  </p>
                </>
              )}
            </div>
          )}
        </main>
      ) : (
        <LiveMode targetNotes={targetNotes} midiLoaded={midiData !== null} onLoadMidi={(data, notes) => {
          setMidiData(data);
          setTargetNotes(notes);
        }} />
      )}
    </div>
  );
}
