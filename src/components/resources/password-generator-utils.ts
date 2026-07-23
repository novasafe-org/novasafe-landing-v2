export const CHARS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?/~",
  similar: "il1Lo0O",
  ambiguous: "{}[]()/\\'\"`~,;:.<>",
};

export function secureRandom(max: number) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

export interface PwOptions {
  length: number;
  upper: boolean;
  lower: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeSimilar: boolean;
  excludeAmbiguous: boolean;
  noRepeat: boolean;
  requireAll: boolean;
}

export function generatePassword(opts: PwOptions): string {
  let pool = "";
  const groups: string[] = [];
  if (opts.upper) {
    pool += CHARS.upper;
    groups.push(CHARS.upper);
  }
  if (opts.lower) {
    pool += CHARS.lower;
    groups.push(CHARS.lower);
  }
  if (opts.numbers) {
    pool += CHARS.numbers;
    groups.push(CHARS.numbers);
  }
  if (opts.symbols) {
    pool += CHARS.symbols;
    groups.push(CHARS.symbols);
  }
  if (opts.excludeSimilar) pool = pool.split("").filter((c) => !CHARS.similar.includes(c)).join("");
  if (opts.excludeAmbiguous) pool = pool.split("").filter((c) => !CHARS.ambiguous.includes(c)).join("");
  if (!pool) return "";

  const filterPool = (p: string) => {
    if (opts.excludeSimilar) p = p.split("").filter((c) => !CHARS.similar.includes(c)).join("");
    if (opts.excludeAmbiguous) p = p.split("").filter((c) => !CHARS.ambiguous.includes(c)).join("");
    return p;
  };

  const chars: string[] = [];
  if (opts.requireAll) {
    for (const g of groups) {
      const gp = filterPool(g);
      if (gp) chars.push(gp[secureRandom(gp.length)]);
    }
  }
  while (chars.length < opts.length) {
    const c = pool[secureRandom(pool.length)];
    if (opts.noRepeat && chars[chars.length - 1] === c) continue;
    chars.push(c);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, opts.length).join("");
}

export const WORDLIST = [
  "river", "forest", "orange", "sunlight", "cedar", "harbor", "meadow", "glacier", "canyon", "willow",
  "quantum", "cipher", "vector", "atlas", "pixel", "nebula", "comet", "aurora", "summit", "valley",
  "silver", "copper", "amber", "cobalt", "onyx", "ivory", "marble", "crystal", "velvet", "satin",
  "thunder", "echo", "whisper", "cascade", "horizon", "zenith", "phoenix", "falcon", "lynx", "otter",
  "orbit", "photon", "circuit", "fusion", "kernel", "lambda", "matrix", "neutron", "proton", "syntax",
];

export interface PhraseOptions {
  words: number;
  separator: string;
  capitalize: boolean;
  includeNumber: boolean;
  includeSymbol: boolean;
}

export function generatePassphrase(opts: PhraseOptions): string {
  const words: string[] = [];
  for (let i = 0; i < opts.words; i++) {
    let w = WORDLIST[secureRandom(WORDLIST.length)];
    if (opts.capitalize) w = w[0].toUpperCase() + w.slice(1);
    words.push(w);
  }
  let out = words.join(opts.separator);
  if (opts.includeNumber) out += opts.separator + secureRandom(100);
  if (opts.includeSymbol) out += "!@#$%&*"[secureRandom(7)];
  return out;
}

export function calcEntropy(pw: string): number {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 28;
  if (pool === 0) pool = 1;
  return Math.round(pw.length * Math.log2(pool));
}

export function crackTime(entropy: number): string {
  const guesses = Math.pow(2, entropy) / 2;
  const seconds = guesses / 1e11;
  if (seconds < 1) return "Instantly";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)} years`;
  if (years < 1e6) return `${Math.round(years / 1000)}K years`;
  if (years < 1e9) return `${Math.round(years / 1e6)}M years`;
  if (years < 1e12) return `${Math.round(years / 1e9)}B years`;
  return `${(years / 1e12).toFixed(1)}T years`;
}

export function strengthLabel(entropy: number) {
  if (entropy < 40) return { label: "Weak", color: "danger" as const, pct: 25 };
  if (entropy < 70) return { label: "Fair", color: "warning" as const, pct: 50 };
  if (entropy < 100) return { label: "Strong", color: "brand" as const, pct: 75 };
  return { label: "Very Strong", color: "success" as const, pct: 100 };
}

export function analyzeSequence(pw: string) {
  let seq = 0;
  for (let i = 0; i < pw.length - 2; i++) {
    const a = pw.charCodeAt(i);
    const b = pw.charCodeAt(i + 1);
    const c = pw.charCodeAt(i + 2);
    if (b - a === 1 && c - b === 1) seq++;
  }
  return seq > 0;
}

export function analyzeRepeats(pw: string) {
  return /(.)\1\1/.test(pw);
}

export function analyzeKeyboard(pw: string) {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"];
  const l = pw.toLowerCase();
  return rows.some((r) => {
    for (let i = 0; i <= r.length - 3; i++) if (l.includes(r.slice(i, i + 3))) return true;
    return false;
  });
}

export function analyzeDictionary(pw: string) {
  const l = pw.toLowerCase();
  return WORDLIST.some((w) => w.length >= 4 && l.includes(w));
}
