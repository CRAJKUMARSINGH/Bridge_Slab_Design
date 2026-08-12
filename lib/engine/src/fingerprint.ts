/**
 * Deterministic input fingerprint (djb2 hash, no crypto dependency).
 */
import type { BridgeInputs } from "./types.js";

function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  const b = h.toString(16).padStart(8, "0");
  return (b + b + b + b).slice(0, 32);
}

export function fingerprintInputs(inputs: BridgeInputs): string {
  return djb2(JSON.stringify(inputs, Object.keys(inputs).sort()));
}
