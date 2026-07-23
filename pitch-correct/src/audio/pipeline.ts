import { parseMidiTargets } from "./midi";
import { detectPitchTrackAsync, segmentIntoNotes } from "./pitchDetect";
import { buildCorrectionPlan } from "./align";
import { renderCorrectedAudio } from "./correctionEngine";
import { decodeAudioFile } from "./wav";
import type { CorrectionPlan, PitchFrame, SungNote, TargetNote } from "./types";

export interface PipelineResult {
  inputBuffer: AudioBuffer;
  correctedBuffer: AudioBuffer;
  targetNotes: TargetNote[];
  pitchFrames: PitchFrame[];
  sungNotes: SungNote[];
  plan: CorrectionPlan;
}

export type PipelineStage =
  | "decoding-audio"
  | "parsing-midi"
  | "detecting-pitch"
  | "aligning"
  | "rendering";

export interface PipelineProgress {
  stage: PipelineStage;
}

/**
 * Full offline pipeline: decode the vocal take, parse the MIDI reference,
 * detect the sung pitch track, align it to the target melody, and render
 * the corrected take. This is the single entry point the UI drives.
 */
export async function runCorrectionPipeline(
  vocalFile: Blob,
  midiData: ArrayBuffer,
  audioContext: BaseAudioContext,
  onProgress?: (progress: PipelineProgress) => void,
): Promise<PipelineResult> {
  onProgress?.({ stage: "decoding-audio" });
  const inputBuffer = await decodeAudioFile(vocalFile, audioContext);

  onProgress?.({ stage: "parsing-midi" });
  const targetNotes = await parseMidiTargets(midiData);

  onProgress?.({ stage: "detecting-pitch" });
  const channelData = inputBuffer.getChannelData(0);
  const pitchFrames = await detectPitchTrackAsync(channelData, inputBuffer.sampleRate);

  onProgress?.({ stage: "aligning" });
  const sungNotes = segmentIntoNotes(pitchFrames);
  const plan = buildCorrectionPlan(sungNotes, targetNotes);

  onProgress?.({ stage: "rendering" });
  const correctedBuffer = await renderCorrectedAudio(inputBuffer, plan);

  return { inputBuffer, correctedBuffer, targetNotes, pitchFrames, sungNotes, plan };
}
