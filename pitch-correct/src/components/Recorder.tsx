import { useCallback, useEffect, useRef, useState } from "react";
import { describeMicError } from "../util/micError";

interface RecorderProps {
  onCapture: (blob: Blob, url: string) => void;
}

export function Recorder({ onCapture }: RecorderProps) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onCapture(blob, url);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      setError(describeMicError(err));
    }
  }, [onCapture]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onCapture(file, url);
    },
    [onCapture],
  );

  return (
    <div className="panel">
      <h2>1. Vocal take</h2>
      <div className="row">
        {recording ? (
          <button className="btn danger" onClick={stopRecording}>
            ● Stop recording
          </button>
        ) : (
          <button className="btn" onClick={startRecording}>
            ● Record from mic
          </button>
        )}
        <label className="btn secondary">
          Upload audio file
          <input
            type="file"
            accept="audio/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      {previewUrl && (
        <audio className="preview" controls src={previewUrl}>
          <track kind="captions" />
        </audio>
      )}
    </div>
  );
}
