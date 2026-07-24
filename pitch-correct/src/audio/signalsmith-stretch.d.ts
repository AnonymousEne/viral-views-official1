declare module "signalsmith-stretch" {
  export interface StretchSchedulePoint {
    output?: number;
    active?: boolean;
    input?: number;
    rate?: number;
    semitones?: number;
    tonalityHz?: number;
    formantSemitones?: number;
    formantCompensation?: boolean;
    formantBaseHz?: number;
    loopStart?: number;
    loopEnd?: number;
  }

  export interface StretchConfigureOptions {
    blockMs?: number | null;
    intervalMs?: number;
    splitComputation?: boolean;
    preset?: "default" | "cheaper";
  }

  export interface StretchNode extends AudioWorkletNode {
    readonly inputTime: number;
    schedule(point: StretchSchedulePoint): Promise<void>;
    start(when?: number, offset?: number): Promise<void>;
    stop(when?: number): Promise<void>;
    addBuffers(buffers: Float32Array[]): Promise<number>;
    dropBuffers(toSeconds?: number): Promise<{ start: number; end: number } | void>;
    latency(): Promise<number>;
    configure(options: StretchConfigureOptions): Promise<void>;
    setUpdateInterval(seconds: number, callback?: (time: number) => void): Promise<void>;
  }

  export default function SignalsmithStretch(
    audioContext: BaseAudioContext,
    channelOptions?: AudioWorkletNodeOptions,
  ): Promise<StretchNode>;
}
