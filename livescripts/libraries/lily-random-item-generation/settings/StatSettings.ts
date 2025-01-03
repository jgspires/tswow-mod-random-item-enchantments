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
]);

/**
 * Requirements for stats based on the item class/subclass.
 *
 * If a stat is not present in this map, it will not have any item requirements.
 * Thus, it will be available for all item classes/subclasses that roll random enchantments.
 */
const statItemRequirements = new Map<Item.Stat[], ClassSubclassRequirements[]>([
  [
    [Item.Stat.CRIT_RATING],
    [
      {
        classRequirement: Item.Class.ITEM_CLASS_WEAPON,
      },
    ],
  ],
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
  [
    [Item.Stat.BLOCK_RATING, Item.Stat.BLOCK_VALUE],
    {
      baseMultiplier: 1.0,
      classMultiplierOverrides: [
        // Increase block rating and block value for shields by 2x
        {
          class: Item.Class.ITEM_CLASS_ARMOR,
          subclasses: [Item.Subclass.ARMOR_SHIELD],
          overrideMultiplier: 2.0,
        },
      ],
    },
  ],
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
