import { Item } from "../../lily-common/src";
import { ItemClassWithSubclasses } from "../components/types";
import { StatSettingsManager } from "./StatSettingsManager";
import { StatMultiplierSettings } from "./types";
import { ClassSubclassRequirements } from "./types/components";

/**
 * Manages the settings for enchantment stats for randomly-generated items.
 *
 * It is populated in `StatSettings.ts` with the settings for enchantment stats.
 *
 * This is a singleton instance.
 */
export const statSettingsManager = StatSettingsManager.getInstance();

/**
 * Set of stats that can be enchanted/added to randomly-generated items.
 * New stats can be added here.
 */
export const enchantableStats = new Set<Item.Stat>([
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
  // Added with the class/item stat pools (see StatPoolSettings.ts for who is likely to roll what).
  Item.Stat.ATTACK_POWER,
  Item.Stat.SPELL_POWER,
  Item.Stat.MANA_REGENERATION,
  Item.Stat.HIT_RATING,
  Item.Stat.HASTE_RATING,
  Item.Stat.EXPERTISE_RATING,
  Item.Stat.ARMOR_PENETRATION_RATING,
  Item.Stat.DEFENSE_SKILL_RATING,
  Item.Stat.DODGE_RATING,
  Item.Stat.PARRY_RATING,
]);

/**
 * Requirements for stats based on the item class/subclass.
 *
 * If a stat is not present in this map, it will not have any item requirements.
 * Thus, it will be available for all item classes/subclasses that roll random enchantments.
 */
const statItemRequirements = new Map<Item.Stat[], ClassSubclassRequirements[]>([
  // Crit used to be weapons-only. With class-aware stat pools it's a core stat for every damage dealer,
  // so it can roll on any item now. Ratings give more % per point at low levels, but so does every other
  // stat (a level 20 character's health, damage and crit are all small), so they stay comparable to the
  // primary stats on the same item and need no special scaling.
  // To restore weapons-only crit, uncomment this entry:
  // [[Item.Stat.CRIT_RATING], [{ classRequirement: Item.Class.ITEM_CLASS_WEAPON }]],
  [
    [Item.Stat.BLOCK_RATING, Item.Stat.BLOCK_VALUE],
    [
      {
        classRequirement: Item.Class.ITEM_CLASS_ARMOR,
        subclassRequirements: [Item.Subclass.ARMOR_SHIELD],
      },
    ],
  ],
]);

/**
 * Custom stat multipliers for enchantment stat values.
 *
 * Stat multipliers here include base multiplier and item class|subclass override multipliers.
 *
 * Override multipliers are used instead of the `baseMultiplier` when a stat is applied to a specific item class/subclass combination.
 *
 * If a stat is not present in this map, it will use the default multiplier of `1.0` in all cases.
 *
 * These stack multiplicatively with other multipliers.
 */
const statMultipliers = new Map<Item.Stat[], StatMultiplierSettings>([
  [[Item.Stat.HEALTH, Item.Stat.MANA], { baseMultiplier: 10.0 }], // Increase health and mana by 10x
  // Shields: block value is pure damage reduction on blocked hits, so it keeps a fun 1.5x.
  // Block rating is a chance to avoid most of a hit, so it stays at 1x and counts towards the avoidance cap.
  [
    [Item.Stat.BLOCK_VALUE],
    {
      baseMultiplier: 1.0,
      classMultiplierOverrides: [
        {
          class: Item.Class.ITEM_CLASS_ARMOR,
          subclasses: [Item.Subclass.ARMOR_SHIELD],
          overrideMultiplier: 1.5,
        },
      ],
    },
  ],
  [
    [Item.Stat.BLOCK_RATING],
    {
      baseMultiplier: 1.0,
      classMultiplierOverrides: [
        {
          class: Item.Class.ITEM_CLASS_ARMOR,
          subclasses: [Item.Subclass.ARMOR_SHIELD],
          overrideMultiplier: 1.0,
        },
      ],
    },
  ],
  // Blizzard's item budget prices these differently from primary stats (points per stat point):
  // attack power 0.5, spell power ~0.86, mana per 5 seconds ~2. These convert one enchantment point
  // into the matching amount, so every stat on an item is worth about the same.
  [[Item.Stat.ATTACK_POWER], { baseMultiplier: 2.0 }],
  [[Item.Stat.SPELL_POWER], { baseMultiplier: 1.15 }],
  [[Item.Stat.MANA_REGENERATION], { baseMultiplier: 0.5 }],
]);

/**
 * Global stat multipliers for enchantment stat values
 * These apply to all stats when applied to a specific item class/subclass combination.
 *
 * If an item class/subclass combination is not present in this map, it will not have any global stat multipliers.
 *
 * These stack multiplicatively with other multipliers.
 */
const globalStatMultsForItemClasses = new Map<ItemClassWithSubclasses, number>([
  [
    // Increase the stats for all miscellaneous armor items (rings et al) by 50%.
    {
      class: Item.Class.ITEM_CLASS_ARMOR,
      subclasses: [Item.Subclass.ARMOR_MISCELLANEOUS],
    },
    1.5,
  ],
]);

statSettingsManager.populateStatSettings(enchantableStats);
statSettingsManager.setMultipliersForStats(statMultipliers);
statSettingsManager.setStatMultipliersForItemClasses(globalStatMultsForItemClasses);
statSettingsManager.setRequirementsForStats(statItemRequirements);
