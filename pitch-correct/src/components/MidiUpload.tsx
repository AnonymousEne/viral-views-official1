import { useCallback, useState } from "react";
import { parseMidiTargets } from "../audio/midi";
import type { TargetNote } from "../audio/types";

interface MidiUploadProps {
  onLoaded: (data: ArrayBuffer, notes: TargetNote[], fileName: string) => void;
}

export function MidiUpload({ onLoaded }: MidiUploadProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const data = await file.arrayBuffer();
        const notes = await parseMidiTargets(data.slice(0));
        if (notes.length === 0) {
          setError("No notes found in this MIDI file.");
          return;
        }
        const duration = notes[notes.length - 1].endTime;
        setSummary(`${notes.length} notes, ${duration.toFixed(1)}s`);
        onLoaded(data, notes, file.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not parse MIDI file.");
      }
    },
    [onLoaded],
  );

  return (
    <div className="panel">
      <h2>2. Reference MIDI melody</h2>
      <div className="row">
        <label className="btn secondary">
          Upload .mid file
          <input
            type="file"
            accept=".mid,.midi,audio/midi"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      {summary && <p className="summary">{summary}</p>}
    </div>
  );
}
