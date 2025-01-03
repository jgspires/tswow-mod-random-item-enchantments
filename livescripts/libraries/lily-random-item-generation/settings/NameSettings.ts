import { Item } from "../../lily-common/src";
import { EnchantmentNameList } from "./types";

export const PERFECT_ITEM_PREFIX = "Perfect";

export const enchantAffixNames: Record<number, EnchantmentNameList> = {
  [Item.Stat.MANA]: {
    prefixes: ["Energized", "Mana-Infused", "Arcane"],
    suffixes: ["of Manastorm", "of the Magi", "of the Sorcerer"],
  },
  [Item.Stat.HEALTH]: {
    prefixes: ["Bulky", "Vital", "Healthy"],
    suffixes: ["of the Bull", "of the Bear", "of the Rhino"],
  },
  [Item.Stat.AGILITY]: {
    prefixes: ["Quick", "Agile", "Nimble"],
    suffixes: ["of Deftness", "of the Fox", "of the Wind"],
  },
  [Item.Stat.STRENGTH]: {
    prefixes: ["Powerful", "Mighty", "Strong"],
    suffixes: ["of Destruction", "of the Titan", "of the Colossus"],
  },
  [Item.Stat.INTELLECT]: {
    prefixes: ["Intelligent", "Wise", "Sage"],
    suffixes: ["of Knowledge", "of the Scholar", "of the Sage"],
  },
  [Item.Stat.SPIRIT]: {
    prefixes: ["Spirited", "Ethereal", "Mystic"],
    suffixes: ["of Introspection", "of the Spirit", "of the Soul"],
  },
  [Item.Stat.STAMINA]: {
    prefixes: ["Enduring", "Stalwart", "Resilient"],
    suffixes: ["of the Ox", "of the Mountain", "of the Fortress"],
  },
  [Item.Stat.DEFENSE_SKILL_RATING]: {
    prefixes: ["Defensive", "Guarded", "Shielded"],
    suffixes: ["of Protection", "of the Guardian", "of the Defender"],
  },
  [Item.Stat.DODGE_RATING]: {
    prefixes: ["Elusive", "Evasive", "Dodging"],
    suffixes: ["of Evasion", "of the Monkey", "of the Wind"],
  },
  [Item.Stat.PARRY_RATING]: {
    prefixes: ["Parrying", "Deflecting", "Countering"],
    suffixes: ["of the Duelist", "of the Gladiator", "of the Protector"],
  },
  [Item.Stat.BLOCK_RATING]: {
    prefixes: ["Blocking", "Shielding", "Guarding"],
    suffixes: ["of the Wall", "of the Shield", "of the Bulwark"],
  },
  [Item.Stat.HIT_MELEE_RATING]: {
    prefixes: ["Striking", "Hitting", "Bashing"],
    suffixes: ["of Precision", "of the Warrior", "of the Gladiator"],
  },
  [Item.Stat.HIT_RANGED_RATING]: {
    prefixes: ["Aiming", "Shooting", "Sniping"],
    suffixes: ["of Accuracy", "of the Marksman", "of the Hunter"],
  },
  [Item.Stat.HIT_SPELL_RATING]: {
    prefixes: ["Casting", "Channeling", "Focusing"],
    suffixes: ["of the Magus", "of the Sorcerer", "of the Wizard"],
  },
  [Item.Stat.CRIT_MELEE_RATING]: {
    prefixes: ["Critical", "Deadly", "Lethal"],
    suffixes: ["of the Assassin", "of the Berserker", "of the Slayer"],
  },
  [Item.Stat.CRIT_RANGED_RATING]: {
    prefixes: ["Precise", "Accurate", "Sharpshooting"],
    suffixes: ["of the Sharpshooter", "of the Sniper", "of the Ranger"],
  },
  [Item.Stat.CRIT_SPELL_RATING]: {
    prefixes: ["Potent", "Devastating", "Cataclysmic"],
    suffixes: ["of the Archmage", "of the Warlock", "of the Spellblade"],
  },
  [Item.Stat.HIT_TAKEN_MELEE_RATING]: {
    prefixes: ["Resistant", "Sturdy", "Tough"],
    suffixes: ["of the Juggernaut", "of the Fortress", "of the Bastion"],
  },
  [Item.Stat.HIT_TAKEN_RANGED_RATING]: {
    prefixes: ["Durable", "Fortified", "Impenetrable"],
    suffixes: ["of the Sentinel", "of the Guardian", "of the Protector"],
  },
  [Item.Stat.HIT_TAKEN_SPELL_RATING]: {
    prefixes: ["Ward", "Aegis", "Barrier"],
    suffixes: ["of the Spellbreaker", "of the Warden", "of the Protector"],
  },
  [Item.Stat.CRIT_TAKEN_MELEE_RATING]: {
    prefixes: ["Unyielding", "Resolute", "Adamant"],
    suffixes: ["of the Juggernaut", "of the Fortress", "of the Bastion"],
  },
  [Item.Stat.CRIT_TAKEN_RANGED_RATING]: {
    prefixes: ["Steadfast", "Unshakable", "Firm"],
    suffixes: ["of the Sentinel", "of the Guardian", "of the Protector"],
  },
  [Item.Stat.CRIT_TAKEN_SPELL_RATING]: {
    prefixes: ["Unbreakable", "Indomitable", "Invincible"],
    suffixes: ["of the Spellbreaker", "of the Warden", "of the Protector"],
  },
  [Item.Stat.HASTE_MELEE_RATING]: {
    prefixes: ["Swift", "Rapid", "Quick"],
    suffixes: ["of the Cheetah", "of the Wind", "of the Storm"],
  },
  [Item.Stat.HASTE_RANGED_RATING]: {
    prefixes: ["Fleet", "Speedy", "Nimble"],
    suffixes: ["of the Falcon", "of the Eagle", "of the Hawk"],
  },
  [Item.Stat.HASTE_SPELL_RATING]: {
    prefixes: ["Accelerated", "Expedited", "Hasty"],
    suffixes: ["of the Archmage", "of the Sorcerer", "of the Wizard"],
  },
  [Item.Stat.HIT_RATING]: {
    prefixes: ["Accurate", "Precise", "Sure"],
    suffixes: ["of the Marksman", "of the Sniper", "of the Hunter"],
  },
  [Item.Stat.CRIT_RATING]: {
    prefixes: ["Critical", "Deadly", "Lethal"],
    suffixes: ["of the Assassin", "of the Berserker", "of the Slayer"],
  },
  [Item.Stat.HIT_TAKEN_RATING]: {
    prefixes: ["Resistant", "Sturdy", "Tough"],
    suffixes: ["of the Juggernaut", "of the Fortress", "of the Bastion"],
  },
  [Item.Stat.CRIT_TAKEN_RATING]: {
    prefixes: ["Resilient", "Unyielding", "Steadfast"],
    suffixes: ["of the Sentinel", "of the Guardian", "of the Protector"],
  },
  [Item.Stat.RESILIENCE_RATING]: {
    prefixes: ["Unyielding", "Resolute", "Adamant"],
    suffixes: ["of the Rock", "of the Mountain", "of the Fortress"],
  },
  [Item.Stat.HASTE_RATING]: {
    prefixes: ["Swift", "Rapid", "Quick"],
    suffixes: ["of the Cheetah", "of the Wind", "of the Storm"],
  },
  [Item.Stat.EXPERTISE_RATING]: {
    prefixes: ["Expert", "Master", "Skilled"],
    suffixes: ["of the Veteran", "of the Master", "of the Champion"],
  },
  [Item.Stat.ATTACK_POWER]: {
    prefixes: ["Powerful", "Mighty", "Strong"],
    suffixes: ["of the Warrior", "of the Gladiator", "of the Berserker"],
  },
  [Item.Stat.RANGED_ATTACK_POWER]: {
    prefixes: ["Potent", "Forceful", "Vigorous"],
    suffixes: ["of the Hunter", "of the Ranger", "of the Sniper"],
  },
  [Item.Stat.SPELL_HEALING_DONE]: {
    prefixes: ["Healing", "Restorative", "Mending"],
    suffixes: ["of the Healer", "of the Cleric", "of the Priest"],
  },
  [Item.Stat.SPELL_DAMAGE_DONE]: {
    prefixes: ["Destructive", "Devastating", "Cataclysmic"],
    suffixes: ["of the Warlock", "of the Sorcerer", "of the Archmage"],
  },
  [Item.Stat.MANA_REGENERATION]: {
    prefixes: ["Regenerative", "Replenishing", "Restorative"],
    suffixes: ["of the Magi", "of the Sorcerer", "of the Wizard"],
  },
  [Item.Stat.ARMOR_PENETRATION_RATING]: {
    prefixes: ["Piercing", "Penetrating", "Rending"],
    suffixes: ["of the Gladiator", "of the Berserker", "of the Destroyer"],
  },
  [Item.Stat.SPELL_POWER]: {
    prefixes: ["Arcane", "Mystic", "Enchanted"],
    suffixes: ["of the Archmage", "of the Sorcerer", "of the Warlock"],
  },
  [Item.Stat.HEALTH_REGEN]: {
    prefixes: ["Revitalizing", "Rejuvenating", "Restorative"],
    suffixes: ["of the Healer", "of the Cleric", "of the Priest"],
  },
  [Item.Stat.SPELL_PENETRATION]: {
    prefixes: ["Piercing", "Penetrating", "Rending"],
    suffixes: ["of the Warlock", "of the Sorcerer", "of the Archmage"],
  },
  [Item.Stat.BLOCK_VALUE]: {
    prefixes: ["Fortified", "Reinforced", "Stalwart"],
    suffixes: ["of the Wall", "of the Shield", "of the Bulwark"],
  },
};
