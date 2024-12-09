import { StatEffects } from "./components/StatEffects";

export interface IEnchantmentGenerator {
  readonly namingSchema: string;
  readonly maxEnchantmentLevel: number;
  readonly parentEnchantID: number;
  readonly statEffects: StatEffects[];

  /**
   * Generates multiple levels of the enchantment up until `maxLevel`.
   *
   * @param stats - `Stat` list for which to generate enchantments.
   * @param options - Generation options for optional override.
   */
  generate(): void;
}
