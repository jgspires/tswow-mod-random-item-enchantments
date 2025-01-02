import { Item, Creature } from "../../lily-common/src";
import {
  EnchantmentStatSettings,
  CreatureRankSettings,
  QualityRoll,
  EnchantmentRollSettings,
} from "./types";

/**
 * Set of stats that can be enchanted/added on items.
 * New stats can be added here.
 *
 * If you want specific multipliers or item class requirements for a stat, add it to the `initStatSettings` function.
 */
export const enchantStatSet = new Set<Item.Stat>([
  Item.Stat.HEALTH,
  Item.Stat.MANA,
  Item.Stat.AGILITY,
  Item.Stat.STRENGTH,
  Item.Stat.INTELLECT,
  Item.Stat.SPIRIT,
  Item.Stat.STAMINA,
  Item.Stat.BLOCK_RATING,
  Item.Stat.BLOCK_VALUE,
  Item.Stat.CRIT_RATING,
]);

export const enchantStatSettings = new Map<Item.Stat, EnchantmentStatSettings>();
initStatSettings();

function initStatSettings() {
  const enchantStatList = Array.from(enchantStatSet);
  for (const stat of enchantStatList) {
    if (enchantStatSettings.has(stat)) continue;
    switch (stat) {
      case Item.Stat.HEALTH:
      case Item.Stat.MANA:
        enchantStatSettings.set(stat, { multiplier: 10 });
        break;
      case Item.Stat.BLOCK_RATING:
      case Item.Stat.BLOCK_VALUE:
        enchantStatSettings.set(stat, {
          multiplier: 1,
          requirements: [
            {
              classRequirement: Item.Class.ITEM_CLASS_ARMOR,
              subclassRequirements: [Item.SubClass.ARMOR_SHIELD],
            },
          ],
          multiplierOverrides: [
            {
              class: Item.Class.ITEM_CLASS_ARMOR,
              subclasses: [Item.SubClass.ARMOR_SHIELD],
              overrideMultiplier: 5,
            },
          ],
        });
        break;
      case Item.Stat.CRIT_RATING:
        enchantStatSettings.set(stat, {
          multiplier: 1,
          requirements: [{ classRequirement: Item.Class.ITEM_CLASS_WEAPON }],
        });
        break;
      default:
        enchantStatSettings.set(stat, { multiplier: 1 });
        break;
    }
  }
}

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
      qualityRollMultiplier: 1.5,
      enchantRollBonus: 25,
    },
  ],
  [
    Creature.Rank.RARE_ELITE,
    {
      qualityRollMultiplier: 1.75,
      enchantRollBonus: 35,
    },
  ],
  [
    Creature.Rank.BOSS,
    {
      qualityRollMultiplier: 2.0,
      enchantRollBonus: 50,
    },
  ],
  [
    Creature.Rank.RARE,
    {
      qualityRollMultiplier: 1.25,
      enchantRollBonus: 15,
    },
  ],
]);

export const qualityRollSettings: QualityRoll = {
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
