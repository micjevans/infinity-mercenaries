/**
 * Calculate trooper level based on XP
 * @param {number} xp - The trooper's current XP
 * @returns {number} - The calculated level
 */
export const calculateLevel = (xp) => {
  if (!xp || xp < 0) return 1;

  if (xp < 5) return 1;
  if (xp < 15) return 2;
  if (xp < 30) return 3;
  if (xp < 50) return 4;
  if (xp < 75) return 5;
  if (xp < 105) return 6;
  if (xp < 140) return 7;
  return 8; // Level 8 and above
};

/**
 * Calculate XP needed to reach a specific level
 * @param {number} level - The target level
 * @returns {number} - XP required to reach this level
 */
export const calculateXpForLevel = (level) => {
  // Hardcoded exact thresholds for common levels
  switch (level) {
    case 1:
      return 0;
    case 2:
      return 5;
    case 3:
      return 15;
    case 4:
      return 30;
    case 5:
      return 50;
    case 6:
      return 75;
    case 7:
      return 105;
    default:
      return 140; // Level 8 and above
  }
};

/**
 * Calculate progress percentage to next level
 * @param {number} xp - Current XP
 * @returns {number} - Percentage progress to next level (0-100)
 */
export const calculateLevelProgress = (xp) => {
  const currentLevel = calculateLevel(xp);
  const currentLevelXp = calculateXpForLevel(currentLevel);
  const nextLevelXp = calculateXpForLevel(currentLevel + 1);

  // Calculate how far the player is between current level and next level
  const xpIntoCurrentLevel = xp - currentLevelXp;
  const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;

  return Math.min(
    100,
    Math.max(0, (xpIntoCurrentLevel / xpRequiredForNextLevel) * 100)
  );
};

/**
 * Calculate available perk points
 * @param {number} level - The trooper's current level
 * @param {number} usedPoints - Previously spent perk points
 * @returns {number} - Available perk points to spend
 */
export const calculatePerkPoints = (level, usedPoints = 0) => {
  // Each level above 1 gives 1 perk point
  const totalPoints = level - 1;
  return Math.max(0, totalPoints - usedPoints);
};
