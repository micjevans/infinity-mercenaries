const LEVEL_THRESHOLDS = [0, 5, 15, 30, 50, 75, 105, 140] as const;

export function calculateLevel(xp: number | null | undefined): number {
  const safeXp = Math.max(0, Number(xp || 0));

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (safeXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }

  return 1;
}

export function calculateXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  return LEVEL_THRESHOLDS[level - 1];
}

export function calculateLevelProgress(xp: number | null | undefined): number {
  const safeXp = Math.max(0, Number(xp || 0));
  const currentLevel = calculateLevel(safeXp);
  const currentLevelXp = calculateXpForLevel(currentLevel);
  const nextLevelXp = calculateXpForLevel(currentLevel + 1);
  const required = nextLevelXp - currentLevelXp;

  if (required <= 0) return 100;

  return Math.min(100, Math.max(0, ((safeXp - currentLevelXp) / required) * 100));
}

export function calculatePerkPoints(level: number, usedPoints = 0): number {
  return Math.max(0, level - 1 - usedPoints);
}
