import { Item } from "../../lily-common/src";

/*
 *  Stat pools: which stats an item is likely to roll.
 *
 *  Each pick weighs every allowed stat by
 *      class weight (for the class the item is rolled for) × item-type affinity
 *  and picks one at random in proportion to that weight. So a mage looting cloth mostly sees intellect,
 *  spell power, spirit, haste and crit; a warrior looting plate mostly sees strength, stamina, hit,
 *  expertise and some defensive stats.
 *
 *  The class the item is rolled for is the looter's, or a random group member's on the same map whose
 *  armour type, shield or weapon type the item suits. If nobody suits it (a warrior looting cloth while
 *  solo), the class weight is skipped and only the item-type affinity counts, so the cloth still rolls
 *  caster stats for someone else.
 *
 *  Allowed stats (requirements, minimum item levels) are set in `StatSettings.ts`.
 */

type StatWeights = Partial<Record<Item.Stat, number>>;

export const statPoolSettings = {
  /**
   * Chance (0–1) for each pick to ignore the class weights and use only the item-type affinity,
   * so off-spec and surprising rolls still happen.
   */
  offStatChance: 0.15,

  /**
   * Avoidance cap: dodge, parry, defence and block rating together may take at most this share (0–1)
   * of an item's enchantment points. The excess moves to the item's other rolled stats; if it rolled
   * only avoidance stats, the excess becomes `avoidanceExcessStat` (set it to `undefined` to drop it).
   * High avoidance stays reachable, but only by collecting many items, not from one lucky drop.
   */
  avoidanceShareCap: 0.4,
  avoidanceStats: [
    Item.Stat.DODGE_RATING,
    Item.Stat.PARRY_RATING,
    Item.Stat.DEFENSE_SKILL_RATING,
    Item.Stat.BLOCK_RATING,
  ],
  avoidanceExcessStat: Item.Stat.STAMINA as Item.Stat | undefined,
};

/** The item types that have their own stat affinities. */
export enum StatPoolCategory {
  CLOTH,
  LEATHER,
  MAIL,
  PLATE,
  SHIELD,
  /** Rings, necklaces, trinkets, cloaks and shirts: everyone wears them. */
  JEWELLERY,
  /** Off-hand frills ("held in off-hand"). */
  HELD_IN_OFF_HAND,
  /** Librams, idols, totems and sigils. */
  RELIC,
  MELEE_WEAPON,
  STAFF,
  RANGED_WEAPON,
  WAND,
}

/**
 * How much each class wants each stat, covering all of its specs. Unlisted stats count as 0,
 * so they only appear through off-stat picks.
 */
export const classStatWeights: Record<number, StatWeights> = {
  [Item.PlayerClass.WARRIOR]: {
    [Item.Stat.STRENGTH]: 1.5,
    [Item.Stat.AGILITY]: 0.5,
    [Item.Stat.STAMINA]: 1.2,
    [Item.Stat.HEALTH]: 0.6,
    [Item.Stat.ATTACK_POWER]: 0.8,
    [Item.Stat.HIT_RATING]: 1.0,
    [Item.Stat.CRIT_RATING]: 1.0,
    [Item.Stat.HASTE_RATING]: 0.6,
    [Item.Stat.EXPERTISE_RATING]: 1.0,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 1.0,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0.8,
    [Item.Stat.DODGE_RATING]: 0.6,
    [Item.Stat.PARRY_RATING]: 0.6,
    [Item.Stat.BLOCK_RATING]: 0.6,
    [Item.Stat.BLOCK_VALUE]: 0.6,
  },
  [Item.PlayerClass.PALADIN]: {
    [Item.Stat.STRENGTH]: 1.3,
    [Item.Stat.AGILITY]: 0.4,
    [Item.Stat.STAMINA]: 1.2,
    [Item.Stat.INTELLECT]: 1.0,
    [Item.Stat.SPIRIT]: 0.2,
    [Item.Stat.HEALTH]: 0.6,
    [Item.Stat.MANA]: 0.4,
    [Item.Stat.ATTACK_POWER]: 0.6,
    [Item.Stat.SPELL_POWER]: 0.9,
    [Item.Stat.MANA_REGENERATION]: 0.6,
    [Item.Stat.HIT_RATING]: 0.9,
    [Item.Stat.CRIT_RATING]: 1.0,
    [Item.Stat.HASTE_RATING]: 0.9,
    [Item.Stat.EXPERTISE_RATING]: 0.7,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 0.5,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0.7,
    [Item.Stat.DODGE_RATING]: 0.5,
    [Item.Stat.PARRY_RATING]: 0.5,
    [Item.Stat.BLOCK_RATING]: 0.5,
    [Item.Stat.BLOCK_VALUE]: 0.5,
  },
  [Item.PlayerClass.HUNTER]: {
    [Item.Stat.STRENGTH]: 0.1,
    [Item.Stat.AGILITY]: 1.5,
    [Item.Stat.STAMINA]: 1.0,
    [Item.Stat.INTELLECT]: 0.6,
    [Item.Stat.SPIRIT]: 0.1,
    [Item.Stat.HEALTH]: 0.5,
    [Item.Stat.MANA]: 0.3,
    [Item.Stat.ATTACK_POWER]: 1.0,
    [Item.Stat.MANA_REGENERATION]: 0.2,
    [Item.Stat.HIT_RATING]: 1.0,
    [Item.Stat.CRIT_RATING]: 1.0,
    [Item.Stat.HASTE_RATING]: 0.8,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 1.0,
  },
  [Item.PlayerClass.ROGUE]: {
    [Item.Stat.STRENGTH]: 0.3,
    [Item.Stat.AGILITY]: 1.5,
    [Item.Stat.STAMINA]: 1.0,
    [Item.Stat.HEALTH]: 0.5,
    [Item.Stat.ATTACK_POWER]: 1.0,
    [Item.Stat.HIT_RATING]: 1.0,
    [Item.Stat.CRIT_RATING]: 1.0,
    [Item.Stat.HASTE_RATING]: 1.0,
    [Item.Stat.EXPERTISE_RATING]: 1.0,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 1.0,
    // No dodge on purpose: rogues already get the most dodge per agility of any class.
  },
  [Item.PlayerClass.PRIEST]: {
    [Item.Stat.INTELLECT]: 1.5,
    [Item.Stat.SPIRIT]: 1.2,
    [Item.Stat.STAMINA]: 1.0,
    [Item.Stat.HEALTH]: 0.4,
    [Item.Stat.MANA]: 0.6,
    [Item.Stat.SPELL_POWER]: 1.5,
    [Item.Stat.MANA_REGENERATION]: 0.8,
    [Item.Stat.HIT_RATING]: 0.7,
    [Item.Stat.CRIT_RATING]: 0.9,
    [Item.Stat.HASTE_RATING]: 1.0,
  },
  [Item.PlayerClass.DEATH_KNIGHT]: {
    [Item.Stat.STRENGTH]: 1.5,
    [Item.Stat.AGILITY]: 0.3,
    [Item.Stat.STAMINA]: 1.2,
    [Item.Stat.HEALTH]: 0.6,
    [Item.Stat.ATTACK_POWER]: 0.8,
    [Item.Stat.HIT_RATING]: 1.0,
    [Item.Stat.CRIT_RATING]: 1.0,
    [Item.Stat.HASTE_RATING]: 0.8,
    [Item.Stat.EXPERTISE_RATING]: 1.0,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 1.0,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0.8,
    [Item.Stat.DODGE_RATING]: 0.6,
    [Item.Stat.PARRY_RATING]: 0.6,
  },
  [Item.PlayerClass.SHAMAN]: {
    [Item.Stat.STRENGTH]: 0.3,
    [Item.Stat.AGILITY]: 1.0,
    [Item.Stat.STAMINA]: 1.0,
    [Item.Stat.INTELLECT]: 1.2,
    [Item.Stat.SPIRIT]: 0.2,
    [Item.Stat.HEALTH]: 0.5,
    [Item.Stat.MANA]: 0.5,
    [Item.Stat.ATTACK_POWER]: 0.8,
    [Item.Stat.SPELL_POWER]: 1.2,
    [Item.Stat.MANA_REGENERATION]: 0.8,
    [Item.Stat.HIT_RATING]: 1.0,
    [Item.Stat.CRIT_RATING]: 1.0,
    [Item.Stat.HASTE_RATING]: 1.0,
    [Item.Stat.EXPERTISE_RATING]: 0.6,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 0.4,
  },
  [Item.PlayerClass.MAGE]: {
    [Item.Stat.INTELLECT]: 1.5,
    [Item.Stat.SPIRIT]: 0.8,
    [Item.Stat.STAMINA]: 1.0,
    [Item.Stat.HEALTH]: 0.4,
    [Item.Stat.MANA]: 0.6,
    [Item.Stat.SPELL_POWER]: 1.5,
    [Item.Stat.MANA_REGENERATION]: 0.2,
    [Item.Stat.HIT_RATING]: 0.9,
    [Item.Stat.CRIT_RATING]: 1.0,
    [Item.Stat.HASTE_RATING]: 1.0,
  },
  [Item.PlayerClass.WARLOCK]: {
    [Item.Stat.INTELLECT]: 1.2,
    [Item.Stat.SPIRIT]: 0.8,
    [Item.Stat.STAMINA]: 1.2,
    [Item.Stat.HEALTH]: 0.5,
    [Item.Stat.MANA]: 0.4,
    [Item.Stat.SPELL_POWER]: 1.5,
    [Item.Stat.HIT_RATING]: 0.9,
    [Item.Stat.CRIT_RATING]: 0.8,
    [Item.Stat.HASTE_RATING]: 1.0,
  },
  [Item.PlayerClass.DRUID]: {
    [Item.Stat.STRENGTH]: 0.6,
    [Item.Stat.AGILITY]: 1.1,
    [Item.Stat.STAMINA]: 1.2,
    [Item.Stat.INTELLECT]: 1.0,
    [Item.Stat.SPIRIT]: 0.8,
    [Item.Stat.HEALTH]: 0.6,
    [Item.Stat.MANA]: 0.4,
    [Item.Stat.ATTACK_POWER]: 0.8,
    [Item.Stat.SPELL_POWER]: 1.0,
    [Item.Stat.MANA_REGENERATION]: 0.6,
    [Item.Stat.HIT_RATING]: 0.9,
    [Item.Stat.CRIT_RATING]: 1.0,
    [Item.Stat.HASTE_RATING]: 1.0,
    [Item.Stat.EXPERTISE_RATING]: 0.7,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 0.7,
    [Item.Stat.DODGE_RATING]: 0.4,
  },
};

/**
 * How well each stat fits each item type. Unlisted stats count as 1.0, so this table only lists what
 * an item type pushes up (> 1) or holds back (< 1, or 0 for never).
 */
export const itemStatAffinities: Record<number, StatWeights> = {
  [StatPoolCategory.CLOTH]: {
    [Item.Stat.INTELLECT]: 1.3,
    [Item.Stat.SPIRIT]: 1.2,
    [Item.Stat.SPELL_POWER]: 1.3,
    [Item.Stat.STRENGTH]: 0.2,
    [Item.Stat.AGILITY]: 0.2,
    [Item.Stat.ATTACK_POWER]: 0.2,
    [Item.Stat.EXPERTISE_RATING]: 0.2,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 0.2,
    [Item.Stat.DODGE_RATING]: 0.2,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0,
    [Item.Stat.PARRY_RATING]: 0,
  },
  [StatPoolCategory.LEATHER]: {
    [Item.Stat.AGILITY]: 1.3,
    [Item.Stat.ATTACK_POWER]: 1.2,
    [Item.Stat.STRENGTH]: 0.5,
    [Item.Stat.INTELLECT]: 0.9,
    [Item.Stat.SPIRIT]: 0.8,
    [Item.Stat.SPELL_POWER]: 0.9,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0,
    [Item.Stat.PARRY_RATING]: 0,
  },
  [StatPoolCategory.MAIL]: {
    [Item.Stat.AGILITY]: 1.1,
    [Item.Stat.INTELLECT]: 1.1,
    [Item.Stat.STRENGTH]: 0.4,
    [Item.Stat.SPIRIT]: 0.4,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0.2,
    [Item.Stat.PARRY_RATING]: 0.2,
  },
  [StatPoolCategory.PLATE]: {
    [Item.Stat.STRENGTH]: 1.3,
    [Item.Stat.STAMINA]: 1.2,
    [Item.Stat.DEFENSE_SKILL_RATING]: 1.2,
    [Item.Stat.AGILITY]: 0.4,
    [Item.Stat.ATTACK_POWER]: 0.7,
    [Item.Stat.INTELLECT]: 0.7,
    [Item.Stat.SPELL_POWER]: 0.7,
    [Item.Stat.SPIRIT]: 0.2,
  },
  [StatPoolCategory.SHIELD]: {
    [Item.Stat.STAMINA]: 1.2,
    [Item.Stat.DEFENSE_SKILL_RATING]: 1.2,
    [Item.Stat.BLOCK_RATING]: 1.2,
    [Item.Stat.BLOCK_VALUE]: 1.2,
    [Item.Stat.STRENGTH]: 0.7,
    [Item.Stat.INTELLECT]: 0.8,
    [Item.Stat.SPELL_POWER]: 0.8,
    [Item.Stat.MANA_REGENERATION]: 0.8,
    [Item.Stat.HASTE_RATING]: 0.6,
    [Item.Stat.EXPERTISE_RATING]: 0.4,
    [Item.Stat.AGILITY]: 0.2,
    [Item.Stat.ATTACK_POWER]: 0.2,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 0.2,
  },
  [StatPoolCategory.JEWELLERY]: {},
  [StatPoolCategory.HELD_IN_OFF_HAND]: {
    [Item.Stat.INTELLECT]: 1.3,
    [Item.Stat.SPELL_POWER]: 1.3,
    [Item.Stat.SPIRIT]: 1.2,
    [Item.Stat.STRENGTH]: 0,
    [Item.Stat.AGILITY]: 0,
    [Item.Stat.ATTACK_POWER]: 0,
    [Item.Stat.EXPERTISE_RATING]: 0,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 0,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0,
    [Item.Stat.DODGE_RATING]: 0,
    [Item.Stat.PARRY_RATING]: 0,
  },
  [StatPoolCategory.RELIC]: {},
  [StatPoolCategory.MELEE_WEAPON]: {
    [Item.Stat.DEFENSE_SKILL_RATING]: 0.6,
    [Item.Stat.DODGE_RATING]: 0.6,
    [Item.Stat.PARRY_RATING]: 0.6,
  },
  [StatPoolCategory.STAFF]: {
    [Item.Stat.INTELLECT]: 1.2,
    [Item.Stat.SPELL_POWER]: 1.3,
    [Item.Stat.SPIRIT]: 1.1,
    [Item.Stat.AGILITY]: 0.8,
    [Item.Stat.ATTACK_POWER]: 0.8,
    [Item.Stat.STRENGTH]: 0.6,
    [Item.Stat.EXPERTISE_RATING]: 0.6,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 0.6,
    [Item.Stat.DODGE_RATING]: 0.3,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0,
    [Item.Stat.PARRY_RATING]: 0,
  },
  [StatPoolCategory.RANGED_WEAPON]: {
    [Item.Stat.AGILITY]: 1.3,
    [Item.Stat.ATTACK_POWER]: 1.2,
    [Item.Stat.STRENGTH]: 0.3,
    [Item.Stat.INTELLECT]: 0.2,
    [Item.Stat.SPIRIT]: 0,
    [Item.Stat.SPELL_POWER]: 0,
    [Item.Stat.MANA_REGENERATION]: 0,
    [Item.Stat.EXPERTISE_RATING]: 0,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0,
    [Item.Stat.DODGE_RATING]: 0,
    [Item.Stat.PARRY_RATING]: 0,
  },
  [StatPoolCategory.WAND]: {
    [Item.Stat.INTELLECT]: 1.3,
    [Item.Stat.SPELL_POWER]: 1.4,
    [Item.Stat.SPIRIT]: 1.2,
    [Item.Stat.STRENGTH]: 0,
    [Item.Stat.AGILITY]: 0,
    [Item.Stat.ATTACK_POWER]: 0,
    [Item.Stat.EXPERTISE_RATING]: 0,
    [Item.Stat.ARMOR_PENETRATION_RATING]: 0,
    [Item.Stat.DEFENSE_SKILL_RATING]: 0,
    [Item.Stat.DODGE_RATING]: 0,
    [Item.Stat.PARRY_RATING]: 0,
  },
};
