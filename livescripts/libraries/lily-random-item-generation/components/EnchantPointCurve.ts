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
  /*
   *  Only used when `enchantPointSettings.source` is "CURVE", or as a fallback when an item has no
   *  item budget (see GenerationSettings.ts).
   *
   *  Was steepness 7, growth 1.021. That roughly matched item budgets up to about item level 70, then
   *  outgrew them: an estimated 3–4x a green item's own stats at item level 200 and around 10x at 264.
   *  These values give the same points at low item levels (12 at item level 25) and stay roughly
   *  in proportion to item stats after that (18 at 60, 35 at 115, 97 at 200, 207 at 264).
   */
  const formula = {
    growthFactor: 1.012,
    steepness: 9,
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
    return applyVariance(points, variance);
  }

  /**
   * Applies a random ±`variance`% to a point amount.
   *
   * @param points base points before variance.
   * @param variance percentage of variance to apply either way.
   */
  export function applyVariance(
    points: number,
    variance: number = DEFAULT_POINT_VARIANCE_PERCENT
  ): EnchantPointsAndVariance {
    const varianceRoll = Random.getRandomInt(100 - variance, 100 + variance);
    const varianceFactor = varianceRoll / 100;
    return {
      points: Math.round(points * varianceFactor),
      variance: varianceFactor,
      // Compare the integer roll, not the factor: the factor (e.g. 1.2) never equals the percentage (e.g. 20).
      hasMaxVariance: varianceRoll === 100 + variance,
    };
  }

  function calculatePointsForLevel(level: number): number {
    return Math.round(
      formula.steepness * Math.pow(formula.growthFactor, level - 1) + formula.baseline
    );
  }
}
