import { ClassSubclassRequirements, MultiplierOverrides } from "./components";

export type EnchantmentStatSettings = {
  multiplier: number;
  requirements?: ClassSubclassRequirements[];
  multiplierOverrides?: MultiplierOverrides[];
};
