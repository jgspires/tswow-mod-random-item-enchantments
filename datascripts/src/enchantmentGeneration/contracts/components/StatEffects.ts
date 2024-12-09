import { Stat } from "wow/wotlk/std/Item/ItemStats";
import { EnchantmentGeneration } from "../../Defines";

/**
 * Specifies which `enchantEffects` to use for a given `stat`.
 * For use in enchantment generation, so the generator knows which effects to set for `stat`.
 */
export type StatEffects = {
  stat: Stat;
  enchantEffects: EnchantEffects;
};

/**
 *
 * @param stat `stat` with which to create the `statEffect`
 * @param effect `effect` ID with which to interact with the `effectArg`. Such as `stat_add`.
 * @param effectArg argument to add to the `statEffect`, such as a `stat`
 * @returns
 */
export function createSingleStatEffect(
  stat: Stat,
  effect: number,
  effectArg: number
): StatEffects {
  return {
    stat,
    enchantEffects: {
      effectArgs: [effectArg, 0, 0],
      effects: [effect, 0, 0],
    },
  };
}

export function StatEffectsFromSingleStats(
  stats: Stat[],
  effectArg: number
): StatEffects[] {
  const statEffects: StatEffects[] = [];
  for (const stat of stats) {
    statEffects.push(createSingleStatEffect(stat, effectArg, stat));
  }
  return statEffects;
}
