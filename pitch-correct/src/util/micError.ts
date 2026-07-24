/**
 * Turn a getUserMedia() rejection into a message that tells the user what
 * to actually do next, instead of a raw browser error string. The most
 * common case for this app: it's opened inside an embedded preview/iframe
 * that doesn't grant microphone access (a browser-enforced Permissions
 * Policy restriction, not something this app can override) - both an
 * iframe block and a user clicking "block" surface as the same
 * `NotAllowedError`, so the message covers both without guessing which.
 */
export function describeMicError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : err instanceof Error ? err.name : "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return (
        "Microphone access was blocked. If this page is embedded in a preview, browsers only allow " +
        "microphone access on pages opened directly — open this app in its own tab and try again. " +
        "Otherwise, check your browser's site permissions and allow microphone access. " +
        "You can always use “Upload audio file” instead."
      );
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No microphone was found on this device. Use “Upload audio file” instead.";
    case "NotReadableError":
    case "TrackStartError":
      return (
        "Your microphone couldn't be started — it may be in use by another app or browser tab. " +
        "Close whatever else is using it and try again, or use “Upload audio file” instead."
      );
    case "SecurityError":
      return (
        "Microphone access requires a secure connection (https://, or localhost during development). " +
        "Use “Upload audio file” instead."
      );
    default:
      return err instanceof Error && err.message
        ? `Microphone access failed: ${err.message}. You can use “Upload audio file” instead.`
        : "Microphone access failed. You can use “Upload audio file” instead.";
  }
}
