export type MercRng = {
  nextFloat: () => number;
  nextInt: (min: number, max: number) => number;
  pickOne: <T>(items: T[]) => T | null;
  shuffle: <T>(items: T[]) => T[];
};

function hashSeed(seed: string | number | undefined): number {
  const source = String(seed ?? Date.now());
  let hash = 1779033703 ^ source.length;

  for (let i = 0; i < source.length; i += 1) {
    hash = Math.imul(hash ^ source.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }

  return hash >>> 0 || 1;
}

export function createRng(seed?: string | number): MercRng {
  let state = hashSeed(seed);

  const nextFloat = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const nextInt = (min: number, max: number) => {
    const low = Math.ceil(min);
    const high = Math.floor(max);
    return Math.floor(nextFloat() * (high - low + 1)) + low;
  };

  const pickOne = <T>(items: T[]) => {
    if (!items.length) return null;
    return items[nextInt(0, items.length - 1)] ?? null;
  };

  const shuffle = <T>(items: T[]) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  return { nextFloat, nextInt, pickOne, shuffle };
}
