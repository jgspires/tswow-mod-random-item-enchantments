import { StatEffects } from "./StatEffects";

export type GeneratorOptions = {
  statEffects: StatEffects[];
  namingSchema?: string;
  maxEnchantmentLevel?: number;
  parentEnchantID?: number;
};
