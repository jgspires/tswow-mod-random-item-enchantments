type EnchantmentNamelist = {
  prefixes: string[];
  suffixes: string[];
};

const enchantNames: Record<number, EnchantmentNamelist> = {
  [Lily.Item.ModType.MANA]: {
    prefixes: ["Energized"],
    suffixes: ["of Manastorm"],
  },
  [Lily.Item.ModType.HEALTH]: {
    prefixes: ["Bulky"],
    suffixes: ["of the Bull"],
  },
  [Lily.Item.ModType.AGILITY]: {
    prefixes: ["Quick"],
    suffixes: ["of Deftness"],
  },
  [Lily.Item.ModType.STRENGTH]: {
    prefixes: ["Powerful"],
    suffixes: ["of Destruction"],
  },
  [Lily.Item.ModType.INTELLECT]: {
    prefixes: ["Intelligent"],
    suffixes: ["of Knowledge"],
  },
  [Lily.Item.ModType.SPIRIT]: {
    prefixes: ["Spirited"],
    suffixes: ["of Introspection"],
  },
  [Lily.Item.ModType.STAMINA]: {
    prefixes: ["Enduring"],
    suffixes: ["of the Ox"],
  },
  [Lily.Item.ModType.DEFENSE_SKILL_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.DODGE_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.PARRY_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.BLOCK_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HIT_MELEE_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HIT_RANGED_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HIT_SPELL_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.CRIT_MELEE_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.CRIT_RANGED_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.CRIT_SPELL_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HIT_TAKEN_MELEE_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HIT_TAKEN_RANGED_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HIT_TAKEN_SPELL_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.CRIT_TAKEN_MELEE_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.CRIT_TAKEN_RANGED_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.CRIT_TAKEN_SPELL_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HASTE_MELEE_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HASTE_RANGED_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HASTE_SPELL_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HIT_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.CRIT_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HIT_TAKEN_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.CRIT_TAKEN_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.RESILIENCE_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HASTE_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.EXPERTISE_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.ATTACK_POWER]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.RANGED_ATTACK_POWER]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.SPELL_HEALING_DONE]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.SPELL_DAMAGE_DONE]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.MANA_REGENERATION]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.ARMOR_PENETRATION_RATING]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.SPELL_POWER]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.HEALTH_REGEN]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.SPELL_PENETRATION]: {
    prefixes: [],
    suffixes: [],
  },
  [Lily.Item.ModType.BLOCK_VALUE]: {
    prefixes: [],
    suffixes: [],
  },
};
