import { Stat } from "wow/wotlk/std/Item/ItemStats";
import { StatEffectsFromSingleStats } from "../contracts/components/StatEffects";
import { EnchantGenerator } from "./EnchantGenerator";
import { EnchantmentGeneration as EG } from "../Defines";

const mainStats = [
  Stat.AGILITY,
  Stat.STRENGTH,
  Stat.INTELLECT,
  Stat.SPIRIT,
  Stat.STAMINA,
];

const statEffects = StatEffectsFromSingleStats(
  mainStats,
  EG.Defines.ENCHANT_EFFECT_ADD_STAT
);

export class PrimaryStatEnchantGenerator extends EnchantGenerator {
  constructor() {
    super({ statEffects });
  }
  protected calculateEffectValueForLevel(enchantLevel: number): number {
    return 1 * enchantLevel;
  }
}
