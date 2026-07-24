import SignalsmithStretch from "signalsmith-stretch";
import type { StretchSchedulePoint } from "signalsmith-stretch";
import type { CorrectionPlan, CorrectionSegment } from "./types";

export interface CorrectionEngineOptions {
  /** Extra silence appended after the last target note, in seconds. */
  tailPadding: number;
  /** Fade duration (seconds) at the edges of silence gaps, to avoid clicks. */
  gapFade: number;
  /**
   * Maximum time-stretch factor in either direction before we stop trying
   * to stretch a single pass and reach for a different strategy instead.
   * Real phase-vocoder stretching degrades audibly well before this, so
   * this is a hard ceiling, not a target.
   */
  maxStretchRate: number;
  /**
   * Max matched segments rendered through a single stretch-node instance.
   * signalsmith-stretch has an undocumented, fixed-size internal queue for
   * pending schedule() calls - empirically ~24 (see test/capacity.ts):
   * scheduling a 25th point before the engine has "consumed" (played
   * through) any of the previous ones silently evicts the entire backlog,
   * leaving everything before it silent. Since offline rendering schedules
   * the whole plan up front - nothing is ever "consumed" before rendering
   * starts - any plan with more matched notes than this limit would
   * silently lose almost all of its audio. Kept safely under the observed
   * limit. Longer takes render in multiple chunks (each its own fresh node)
   * that get concatenated; see renderCorrectedAudio.
   */
  maxSegmentsPerChunk: number;
}

export const DEFAULT_ENGINE_OPTIONS: CorrectionEngineOptions = {
  tailPadding: 0.5,
  gapFade: 0.01,
  maxStretchRate: 3,
  maxSegmentsPerChunk: 16,
};

interface RenderChunk {
  /** This chunk's start time on the global output timeline, in seconds. */
  startOffset: number;
  /** This chunk's length in samples. */
  length: number;
  /** Segments belonging to this chunk, still in global output-time coordinates. */
  segments: CorrectionSegment[];
}

function planChunks(plan: CorrectionPlan, opts: CorrectionEngineOptions, sampleRate: number): RenderChunk[] {
  const totalOutputSeconds = Math.max(plan.outputDuration, 0) + opts.tailPadding;

  if (plan.segments.length === 0) {
    return [{ startOffset: 0, length: Math.max(1, Math.ceil(totalOutputSeconds * sampleRate)), segments: [] }];
  }

  const chunks: RenderChunk[] = [];
  let idx = 0;
  let prevEnd = 0;
  while (idx < plan.segments.length) {
    const group = plan.segments.slice(idx, idx + opts.maxSegmentsPerChunk);
    idx += group.length;
    const isLastChunk = idx >= plan.segments.length;
    const chunkGlobalEnd = isLastChunk ? totalOutputSeconds : group[group.length - 1].outEnd;
    const startOffset = prevEnd;
    const length = Math.max(1, Math.round((chunkGlobalEnd - startOffset) * sampleRate));
    chunks.push({ startOffset, length, segments: group });
    prevEnd = startOffset + length / sampleRate;
  }
  return chunks;
}

async function renderChunk(
  input: AudioBuffer,
  chunk: RenderChunk,
  opts: CorrectionEngineOptions,
): Promise<AudioBuffer> {
  const sampleRate = input.sampleRate;
  const numberOfChannels = input.numberOfChannels;

  const offlineCtx = new OfflineAudioContext(numberOfChannels, chunk.length, sampleRate);

  const node = await SignalsmithStretch(offlineCtx, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [numberOfChannels],
  });

  const channelBuffers: Float32Array[] = [];
  for (let ch = 0; ch < numberOfChannels; ch++) {
    channelBuffers.push(input.getChannelData(ch).slice());
  }
  await node.addBuffers(channelBuffers);

  const gain = offlineCtx.createGain();
  node.connect(gain);
  gain.connect(offlineCtx.destination);

  // Re-express this chunk's segments in local (chunk-relative) output time
  // so the existing, already-verified buildSchedule/applyGainAutomation
  // logic - written for a single, whole-plan render - works unchanged.
  // Clamped to >= 0: the first segment's outStart should land at exactly
  // local 0, but float subtraction can leave a tiny negative epsilon
  // (e.g. -0.000005), which AudioParam methods reject outright.
  const localPlan: CorrectionPlan = {
    segments: chunk.segments.map((s) => ({
      ...s,
      outStart: Math.max(0, s.outStart - chunk.startOffset),
      outEnd: Math.max(0, s.outEnd - chunk.startOffset),
    })),
    outputDuration: chunk.length / sampleRate,
  };

  applyGainAutomation(gain, localPlan, opts.gapFade);

  const schedulePoints = buildSchedule(localPlan, opts.maxStretchRate);
  for (const point of schedulePoints) {
    await node.schedule(point);
  }

  return offlineCtx.startRendering();
}

/**
 * Render the input recording into a corrected buffer whose pitch and timing
 * follow `plan` (built by `buildCorrectionPlan`): each matched segment is
 * time-stretched to fill its exact target window and pitch-shifted onto the
 * target note, using the Signalsmith Stretch WASM engine. Anything outside
 * a matched segment (lead-in, trailing audio, MIDI rests) renders as silence
 * so the output timing follows the reference MIDI exactly.
 *
 * Rendered in chunks of at most `maxSegmentsPerChunk` matched notes, each
 * through its own fresh stretch-node instance, then concatenated - see the
 * doc comment on that option for why (a hard, undocumented capacity limit
 * in the underlying WASM engine).
 *
 * NOTE: silence gaps are implemented with a downstream GainNode rather than
 * the stretch node's own `active: false` schedule flag. Empirically (see
 * test/harness3), scheduling `active: false` mid-stream on this node
 * silences the *entire* render, not just the region after that point - a
 * bug/quirk in signalsmith-stretch. The stretch node is kept `active: true`
 * for the whole render; muting is done natively via AudioParam automation.
 */
export async function renderCorrectedAudio(
  input: AudioBuffer,
  plan: CorrectionPlan,
  options: Partial<CorrectionEngineOptions> = {},
): Promise<AudioBuffer> {
  const opts = { ...DEFAULT_ENGINE_OPTIONS, ...options };
  const sampleRate = input.sampleRate;
  const numberOfChannels = input.numberOfChannels;

  const chunks = planChunks(plan, opts, sampleRate);
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const finalBuffer = new AudioBuffer({ numberOfChannels, length: totalLength, sampleRate });

  let sampleOffset = 0;
  for (const chunk of chunks) {
    const chunkBuffer = await renderChunk(input, chunk, opts);
    for (let ch = 0; ch < numberOfChannels; ch++) {
      finalBuffer.copyToChannel(chunkBuffer.getChannelData(ch), ch, sampleOffset);
    }
    sampleOffset += chunk.length;
  }

  return finalBuffer;
}

/**
 * Turn a correction plan into the ordered list of Signalsmith Stretch
 * schedule() calls: always `active: true`, repositioning/re-pitching the
 * read head at each segment's output start. Gaps are silenced separately
 * via the GainNode (see applyGainAutomation) rather than via `active`.
 *
 * Mismatched note lengths (a singer's held note much shorter or much longer
 * than its target) are common - a missed note, an ad-lib, a rest the singer
 * didn't hold. Left alone, the naive `rate = sourceDuration / duration`
 * can demand absurd stretch factors (a 50ms blip smeared across 3 seconds,
 * or a 3-second note crushed into 150ms), which reliably sounds broken
 * however good the underlying algorithm is. Two different fixes for two
 * different directions, both bounded by `maxStretchRate`:
 *   - source much longer than needed (rate > max): cap the rate and just
 *     read a *portion* of the source, rather than the whole thing sped up
 *     unnaturally.
 *   - source much shorter than needed (rate < 1/max): loop the sung
 *     snippet via the node's native `loopStart`/`loopEnd`, so a short
 *     sound naturally sustains for the target's duration instead of being
 *     stretched into mush.
 */
export function buildSchedule(plan: CorrectionPlan, maxStretchRate = DEFAULT_ENGINE_OPTIONS.maxStretchRate): StretchSchedulePoint[] {
  const points: StretchSchedulePoint[] = [];

  if (plan.segments.length === 0 || plan.segments[0].outStart > 1e-6) {
    points.push({ output: 0, active: true, input: 0, rate: 1, semitones: 0, loopStart: 0, loopEnd: 0 });
  }

  for (const seg of plan.segments) {
    const duration = seg.outEnd - seg.outStart;
    const sourceDuration = seg.sungEnd - seg.sungStart;
    const naturalRate = duration > 0 ? sourceDuration / duration : 1;
    const semitones = seg.targetMidi != null && seg.sourceMidi != null ? seg.targetMidi - seg.sourceMidi : 0;

    if (naturalRate < 1 / maxStretchRate && sourceDuration > 0) {
      // Source is much shorter than the target window: loop it to sustain
      // naturally rather than stretching one short sound to mush.
      points.push({
        output: seg.outStart,
        active: true,
        input: seg.sungStart,
        rate: 1,
        semitones,
        loopStart: seg.sungStart,
        loopEnd: seg.sungEnd,
      });
    } else {
      const rate = Math.min(naturalRate, maxStretchRate);
      points.push({
        output: seg.outStart,
        active: true,
        input: seg.sungStart,
        rate,
        semitones,
        loopStart: seg.sungStart,
        loopEnd: seg.sungStart,
      });
    }
  }

  return points;
}

/**
 * Build native AudioParam gain automation that's 1 during matched segments
 * and 0 everywhere else (lead-in, trailing audio, MIDI rests), with short
 * linear fades at each edge to avoid clicks.
 */
export function applyGainAutomation(gain: GainNode, plan: CorrectionPlan, fade: number): void {
  const param = gain.gain;
  param.cancelScheduledValues(0);

  if (plan.segments.length === 0) {
    param.setValueAtTime(0, 0);
    return;
  }

  const EPS = 1e-6;
  let cursor = 0;

  plan.segments.forEach((seg, i) => {
    if (seg.outStart > cursor + EPS) {
      let flatZeroFrom: number;
      if (i === 0) {
        param.setValueAtTime(0, 0);
        flatZeroFrom = 0;
      } else {
        const downEnd = Math.min(cursor + fade, seg.outStart);
        param.setValueAtTime(1, cursor);
        param.linearRampToValueAtTime(0, downEnd);
        flatZeroFrom = downEnd;
      }
      const upStart = Math.max(flatZeroFrom, seg.outStart - fade);
      param.setValueAtTime(0, upStart);
      param.linearRampToValueAtTime(1, seg.outStart);
    } else {
      param.setValueAtTime(1, seg.outStart);
    }
    cursor = seg.outEnd;
  });

  param.setValueAtTime(1, cursor);
  param.linearRampToValueAtTime(0, cursor + fade);
}
