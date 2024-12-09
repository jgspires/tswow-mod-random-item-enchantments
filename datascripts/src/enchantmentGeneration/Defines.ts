import { Stat } from "wow/wotlk/std/Item/ItemStats";

export namespace EnchantmentGeneration {
  /**
   * Contains defines for custom enchantment procedural creation.
   * Procedural creation of enchantments takes place elsewhere, but uses these constants.
   */
  export const Defines = {
    /** Effect number for adding stats in SpellItemEnchantment dbc */
    ENCHANT_EFFECT_ADD_STAT: 5,

    /** Enchantment to use as parent when creating new enchantments. 68 = +1 Strength */
    DEFAULT_PARENT_ENCHANT_ID: 68,

    /**
     * Default name for custom enchantments. Where `VAL` is replaced by the stat amount and
     * `STAT` is replaced by the stat name.
     */
    DEFAULT_NAMING_SCHEMA: "+[VAL] [STAT]",
  } as const;

  export const SharedDefines = {
    /** ID from which the datascript-generated enchantments start. */
    ENCHANT_LEVEL_ID_START: 10000,

    /** Maximum amount of enchantments (levels) generated per stat. */
    MAX_ENCHANT_LEVEL: 500,
  } as const;

  /**
   * Maps stats to SpellItemEnchantment IDs to use as base to generate more for each stat.
   */
  export const StatToSpellEnchantId: Partial<Record<Stat, number>> = {
    [Stat.HEALTH]: 41,
    [Stat.MANA]: 24,
    [Stat.STRENGTH]: 68,
    [Stat.AGILITY]: 74,
    [Stat.INTELLECT]: 41,
    [Stat.SPIRIT]: 82,
    [Stat.ATTACK_POWER]: 1563,
  };
}
