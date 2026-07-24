import { detectPitchTrack, DEFAULT_PITCH_OPTIONS } from "./pitchDetect";
import type { PitchDetectOptions } from "./pitchDetect";

export interface PitchWorkerRequest {
  channelData: Float32Array;
  sampleRate: number;
  options?: Partial<PitchDetectOptions>;
}

self.onmessage = (event: MessageEvent<PitchWorkerRequest>) => {
  const { channelData, sampleRate, options } = event.data;
  const opts = { ...DEFAULT_PITCH_OPTIONS, ...options };
  const frames = detectPitchTrack(channelData, sampleRate, opts);
  (self as unknown as Worker).postMessage({ frames });
};
