import names from "../data/names/planetNames.json";

type NameKind = "planets" | "continents" | "cities";

interface GenerateNameOptions {
  kind: NameKind;
  seed: number;
  allowPrefix?: boolean;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function choose<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)];
}

function clampVowelRuns(input: string, maxRun: number): string {
  const vowels = "aeiouyAEIOUY";
  let run = 0;
  let out = "";
  for (const ch of input) {
    if (vowels.includes(ch)) {
      run += 1;
      if (run <= maxRun) out += ch;
    } else {
      run = 0;
      out += ch;
    }
  }
  return out;
}

export function generateName(options: GenerateNameOptions): string {
  const { kind, seed, allowPrefix = true } = options;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set: any = (names as any)[kind];
  const rng = mulberry32(seed >>> 0);

  const usePrefix = allowPrefix && rng() < 0.6 && set.prefixes?.length > 0;
  const prefix = usePrefix ? choose(rng, set.prefixes) : "";
  const core = choose(rng, set.cores);

  // Occasionally add an infix syllable for variety
  const addInfix = rng() < 0.35;
  const infixes = ["a", "e", "i", "o", "u", "yr", "th", "an", "el", "ar", "en"];
  const infix = addInfix ? choose(rng, infixes) : "";

  // Choose suffix but avoid repetitive or banned ones
  const bannedSuffixes: string[] = Array.isArray(set.rules?.avoidSuffix)
    ? set.rules.avoidSuffix
    : [];
  const pool = (set.suffixes as string[]).filter(
    (s) => !bannedSuffixes.includes(s)
  );
  let suffix = pool.length > 0 ? choose(rng, pool) : "";

  // Reduce chance of repeating same suffix like "ia" pattern
  if (suffix === "ia") {
    if (rng() < 0.75) {
      suffix = choose(
        rng,
        pool.filter((s) => s !== "ia")
      );
    }
  }

  // Compose and clean
  let name = `${prefix}${core}${infix}${suffix}`;

  // Fix awkward letter collisions
  name = name.replace(/([aouiey])\1{2,}/gi, "$1$1");

  // Enforce vowel run limit
  const maxRun =
    typeof set.rules?.maxVowelRun === "number" ? set.rules.maxVowelRun : 2;
  name = clampVowelRuns(name, maxRun);

  // Beautify casing
  name = name.charAt(0).toUpperCase() + name.slice(1);

  return name;
}

export function generatePlanetName(seed: number): string {
  return generateName({ kind: "planets", seed, allowPrefix: true });
}

export function generateContinentName(seed: number): string {
  return generateName({ kind: "continents", seed, allowPrefix: true });
}

export function generateCityName(seed: number): string {
  return generateName({ kind: "cities", seed, allowPrefix: true });
}
