// Pre-generated neural voice clips (Kokoro TTS, voice af_heart). Each line is keyed by a hash of its text.
export function lineId(t: string) { let h = 5381; const s = t.trim(); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
