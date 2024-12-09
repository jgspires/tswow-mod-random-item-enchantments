namespace EnchantPointCurve {
  type Level = number;
  type Points = number;

  const MAX_ITEM_LEVEL = 300;

  /** Stores enchantment points available per level for enchantment generation on created items.  */
  const enchantPoints = new Map<Level, Points>([]);
  const formula = {
    growthFactor: 1.021,
    steepness: 7,
    baseline: 0,
  };

  export function generatePointCurve(maxLevel = MAX_ITEM_LEVEL) {
    console.log(`${LIB_NAME}: Starting generation of custom enchantment point curve...`);
    for (let i = 1; i <= maxLevel; i++) {
      enchantPoints.set(i, calculatePointsForLevel(i));
    }
    console.log(`${LIB_NAME}: Generation of enchantment power point complete!`);
  }

  /**
   * Prints points per level for all levels in the point curve to `stdout`.
   *
   * For debugging or curiosity purposes.
   */
  export function printPointCurve() {
    for (let i = 1; i <= enchantPoints.size; i++) {
      console.log(`${LIB_NAME}: Level ${i}: ${enchantPoints.get(i)}`);
    }
  }

  /**
   *
   * @param level `ItemLevel` for which to get the enchantment points.
   * @returns enchantment points for given `ItemLevel`. Or `0` if level does not exist in curve.
   */
  export function getPoints(level: number): number {
    const points = enchantPoints.get(level);
    if (!points) {
      console.warn(
        `${LIB_NAME}: Attempt to access enchant points at non-existent level: ${level}. Returning 0.`
      );
      return 0;
    }
    return points;
  }

  function calculatePointsForLevel(level: number): number {
    return Math.round(
      formula.steepness * Math.pow(formula.growthFactor, level - 1) + formula.baseline
    );
  }
}
