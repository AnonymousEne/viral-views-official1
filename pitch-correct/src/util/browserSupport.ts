/** Everything the offline correction pipeline needs from the browser. */
export function checkBrowserSupport(): string | null {
  const missing: string[] = [];

  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) missing.push("Web Audio (AudioContext)");
  if (typeof OfflineAudioContext === "undefined") missing.push("OfflineAudioContext");
  if (typeof AudioWorkletNode === "undefined") missing.push("AudioWorklet");
  if (typeof Worker === "undefined") missing.push("Web Workers");
  if (typeof WebAssembly === "undefined") missing.push("WebAssembly");

  if (missing.length === 0) return null;
  return (
    `This browser is missing support for: ${missing.join(", ")}. ` +
    "Try the latest Chrome, Firefox, Edge, or Safari."
  );
}
