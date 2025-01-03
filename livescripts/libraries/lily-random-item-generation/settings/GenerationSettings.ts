import { Item, Creature } from "../../lily-common/src";
import {
  CreatureRankSettings,
  QualityUptierSettings,
  EnchantmentRollSettings,
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
      qualityRollMultiplier: 1.0,
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
      qualityRollMultiplier: 1.35,
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
  addMinRollPerRarity: 5,
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
