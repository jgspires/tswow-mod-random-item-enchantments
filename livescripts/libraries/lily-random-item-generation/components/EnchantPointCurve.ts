import { Random } from "../../lily-common/src";
import { LIB_NAME } from "../Constants";
import { EnchantPointsAndVariance } from "./types";

export namespace EnchantPointCurve {
  type Level = number;
  type Points = number;

  const MAX_ITEM_LEVEL = 300;
  const DEFAULT_POINT_VARIANCE_PERCENT = 20;

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
   * @param variance Percentage of variance to apply to the points. Default is `DEFAULT_POINT_VARIANCE_PERCENT` constant.
   * @returns enchantment points for given `ItemLevel`. Or `0` if level does not exist in curve.
   */
  export function getPoints(
    level: number,
    variance: number = DEFAULT_POINT_VARIANCE_PERCENT
  ): EnchantPointsAndVariance {
    const points = enchantPoints.get(level);
    if (!points) {
      console.warn(
        `${LIB_NAME}: Attempt to access enchant points at non-existent level: ${level}. Returning 0.`
      );
      return { points: 0, variance: 0 };
    }
    const varianceFactor = Random.getRandomInt(100 - variance, 100 + variance) / 100;
    return {
      points: Math.round(points * varianceFactor),
      variance: varianceFactor,
      hasMaxVariance: varianceFactor === variance ? true : false,
    };
  }

  function calculatePointsForLevel(level: number): number {
    return Math.round(
      formula.steepness * Math.pow(formula.growthFactor, level - 1) + formula.baseline
    );
  }
}
