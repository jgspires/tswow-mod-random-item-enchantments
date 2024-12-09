/** Global namespace for Lily's libraries and utils */
namespace Lily {
  export namespace Item {
    /** Mimics item class enum from tswow's (TrinityCore's) source code. */
    export const enum Class {
      ITEM_CLASS_CONSUMABLE = 0,
      ITEM_CLASS_CONTAINER = 1,
      ITEM_CLASS_WEAPON = 2,
      ITEM_CLASS_GEM = 3,
      ITEM_CLASS_ARMOR = 4,
      ITEM_CLASS_REAGENT = 5,
      ITEM_CLASS_PROJECTILE = 6,
      ITEM_CLASS_TRADE_GOODS = 7,
      ITEM_CLASS_GENERIC = 8,
      ITEM_CLASS_RECIPE = 9,
      ITEM_CLASS_MONEY = 10,
      ITEM_CLASS_QUIVER = 11,
      ITEM_CLASS_QUEST = 12,
      ITEM_CLASS_KEY = 13,
      ITEM_CLASS_PERMANENT = 14,
      ITEM_CLASS_MISC = 15,
      ITEM_CLASS_GLYPH = 16,
    }
    /** Mimics item quality enum from tswow's (TrinityCore's) source code. */
    export const enum Quality {
      POOR = 0, //GREY
      NORMAL = 1, //WHITE
      UNCOMMON = 2, //GREEN
      RARE = 3, //BLUE
      EPIC = 4, //PURPLE
      LEGENDARY = 5, //ORANGE
      ARTIFACT = 6, //LIGHT YELLOW
      HEIRLOOM = 7,
    }

    /** Mimics ItemModType enum from tswow's (TrinityCore's) source code. */
    export const enum ModType {
      MANA = 0,
      HEALTH = 1,
      AGILITY = 3,
      STRENGTH = 4,
      INTELLECT = 5,
      SPIRIT = 6,
      STAMINA = 7,
      DEFENSE_SKILL_RATING = 12,
      DODGE_RATING = 13,
      PARRY_RATING = 14,
      BLOCK_RATING = 15,
      HIT_MELEE_RATING = 16,
      HIT_RANGED_RATING = 17,
      HIT_SPELL_RATING = 18,
      CRIT_MELEE_RATING = 19,
      CRIT_RANGED_RATING = 20,
      CRIT_SPELL_RATING = 21,
      HIT_TAKEN_MELEE_RATING = 22,
      HIT_TAKEN_RANGED_RATING = 23,
      HIT_TAKEN_SPELL_RATING = 24,
      CRIT_TAKEN_MELEE_RATING = 25,
      CRIT_TAKEN_RANGED_RATING = 26,
      CRIT_TAKEN_SPELL_RATING = 27,
      HASTE_MELEE_RATING = 28,
      HASTE_RANGED_RATING = 29,
      HASTE_SPELL_RATING = 30,
      HIT_RATING = 31,
      CRIT_RATING = 32,
      HIT_TAKEN_RATING = 33,
      CRIT_TAKEN_RATING = 34,
      RESILIENCE_RATING = 35,
      HASTE_RATING = 36,
      EXPERTISE_RATING = 37,
      ATTACK_POWER = 38,
      RANGED_ATTACK_POWER = 39,
      //FERAL_ATTACK_POWER       = 40, not in 3.3
      SPELL_HEALING_DONE = 41, // deprecated
      SPELL_DAMAGE_DONE = 42, // deprecated
      MANA_REGENERATION = 43,
      ARMOR_PENETRATION_RATING = 44,
      SPELL_POWER = 45,
      HEALTH_REGEN = 46,
      SPELL_PENETRATION = 47,
      BLOCK_VALUE = 48,
    }
  }
}
