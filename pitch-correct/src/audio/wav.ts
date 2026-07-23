import { WaveFile } from "wavefile";

/** Encode an AudioBuffer as a 16-bit PCM WAV file (Blob, audio/wav). */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const channels: Float64Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(Float64Array.from(buffer.getChannelData(ch)));
  }

  const wav = new WaveFile();
  wav.fromScratch(numChannels, buffer.sampleRate, "32f", channels.length === 1 ? channels[0] : channels);
  wav.toBitDepth("16");

  const bytes = wav.toBuffer();
  return new Blob([new Uint8Array(bytes)], { type: "audio/wav" });
}

/** Decode an arbitrary audio file (wav/mp3/webm/etc, whatever the browser supports) into an AudioBuffer. */
export async function decodeAudioFile(file: Blob, context: BaseAudioContext): Promise<AudioBuffer> {
  const arrayBuffer = await file.arrayBuffer();
  return context.decodeAudioData(arrayBuffer);
}
