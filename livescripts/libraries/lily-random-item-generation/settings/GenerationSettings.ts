import { Creature, Item } from "../../lily-common/src";
import {
  CreatureRankSettings,
  EnchantmentRollSettings,
  QualityUptierSettings,
} from "./types";

/**
 * Roll multipliers for item generation based on creature rank.
 * Higher rank creatures have a higher chance of dropping better quality items and thus, more enchantments.
 * `1.0` is the base value (i.e. roll chances are not modified).
 */
export const creatureRankBonuses = new Map<Creature.Rank, CreatureRankSettings>([
  [
    Creature.Rank.NORMAL,
    {
      qualityRollMultiplier: 1.065,
    },
  ],
  [
    Creature.Rank.ELITE,
    {
      qualityRollMultiplier: 1.2,
      enchantRollBonus: 25,
    },
  ],
  [
    Creature.Rank.RARE_ELITE,
    {
      qualityRollMultiplier: 1.25,
      enchantRollBonus: 35,
    },
  ],
  [
    Creature.Rank.BOSS,
    {
      // Was 1.35. With +8 per rarity below, a boss's blue drop becomes legendary 3.3% of the time
      // (was 10.5%), and an epic 15% (was 31%). Dungeon bosses use these too (see dungeonLootSettings).
      qualityRollMultiplier: 1.25,
      enchantRollBonus: 50,
    },
  ],
  [
    Creature.Rank.RARE,
    {
      qualityRollMultiplier: 1.1,
      enchantRollBonus: 15,
    },
  ],
]);

export const qualityUptierSettings: QualityUptierSettings = {
  minRollForRarityUptier: 75,
  // Was 5. Each rarity step is harder to reach, which mostly thins out epics and legendaries.
  // Side effect: with a 1.0 multiplier (normal mobs) the epic step needs 107, so normal mobs can no longer
  // upgrade anything to legendary, and a green from a normal mob becomes epic 0.2% of the time (was 1.8%).
  // To keep more open-world jackpots, raise NORMAL's qualityRollMultiplier (1.05 gives about 1% green → epic).
  // Legendaries remain impossible below 1.065 multiplier, which would require a 100 roll (1/7800 final prob.)
  addMinRollPerRarity: 8,
};

export const enchantRollSettings = new Map<Item.Quality, EnchantmentRollSettings>([
  [
    Item.Quality.POOR,
    {
      enchantmentNeededRoll: 90,
      extraNeededChancePerRoll: 101,
      maxEnchants: 1,
      enchantPointMultiplier: 0.25,
    },
  ],
  [
    Item.Quality.NORMAL,
    {
      enchantmentNeededRoll: 90,
      extraNeededChancePerRoll: 101,
      maxEnchants: 1,
      enchantPointMultiplier: 0.75,
    },
  ],
  [
    Item.Quality.UNCOMMON,
    {
      enchantmentNeededRoll: 70,
      extraNeededChancePerRoll: 25,
      maxEnchants: 2,
      enchantPointMultiplier: 1.0,
    },
  ],
  [
    Item.Quality.RARE,
    {
      enchantmentNeededRoll: 50,
      extraNeededChancePerRoll: 22,
      maxEnchants: 3,
      enchantPointMultiplier: 2.0,
    },
  ],
  [
    Item.Quality.EPIC,
    {
      enchantmentNeededRoll: 30,
      extraNeededChancePerRoll: 30,
      maxEnchants: 3,
      enchantPointMultiplier: 3.0,
    },
  ],
  [
    Item.Quality.LEGENDARY,
    {
      enchantmentNeededRoll: 0,
      extraNeededChancePerRoll: 45,
      maxEnchants: 3,
      enchantPointMultiplier: 5.0,
    },
  ],
]);

/**
 * Where an item's enchantment points come from.
 *
 * - `ITEM_BUDGET` (default): Blizzard's item stat budget for the item's level and slot (RandPropPoints.dbc,
 *   exported by this module's datascripts), times the quality's `enchantPointMultiplier`. Enchantments then
 *   stay the same size relative to the item at every level: a green enchantment is worth about one green
 *   item's stats, a rare one about two, an epic three, a legendary five. Rings, wrists and other small
 *   slots get smaller budgets than chests and two-handers, as in the base game.
 * - `CURVE`: the absolute point curve in `EnchantPointCurve.ts`. Also used automatically when the budget
 *   table is missing (datascripts not built) or an item's slot has no budget.
 */
export const enchantPointSettings = {
  source: "ITEM_BUDGET" as "ITEM_BUDGET" | "CURVE",
  /**
   * Which RandPropPoints column to start from:
   * - `GOOD`: every quality starts from the green budget, so `enchantPointMultiplier` alone decides
   *   how much stronger each quality is.
   * - `ITEM_QUALITY`: blues start from the blue column and epics/legendaries from the epic one,
   *   which makes higher qualities roughly another 15–40% stronger.
   */
  budgetColumn: "GOOD" as "GOOD" | "ITEM_QUALITY",
  /** Random variance applied to the points, in percent either way. A roll at the very top can make a "Perfect" item. */
  variancePercent: 20,
};

/**
 * Dungeon and raid loot.
 *
 * Most 5-player dungeon bosses are `ELITE` rank in the database, so before this they rolled like any
 * elite. The core flags them as dungeon bosses at startup, which is what `dungeonBossesUseBossBonuses` checks.
 */
export const dungeonLootSettings = {
  /** Flagged dungeon bosses use the `BOSS` rank bonuses above (when those are better than their own rank's). */
  dungeonBossesUseBossBonuses: true,
  /**
   * Every other creature inside a dungeon or raid gets these on top of its rank's bonuses.
   * The default only adds enchantments (an elite's green rolls at least one 66% of the time instead of 56%,
   * a blue 86% instead of 76%). A rarity bonus above about 1.04 would let trash upgrade rarity more
   * often than bosses do.
   */
  trash: {
    enabled: true,
    /** Multiplies the rank's quality roll multiplier. */
    qualityRollMultiplier: 1.0,
    /** Added to the rank's enchantment roll bonus. */
    enchantRollBonus: 10,
  },
};
