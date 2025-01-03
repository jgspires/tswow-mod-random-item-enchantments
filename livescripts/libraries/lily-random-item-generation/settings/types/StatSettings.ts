import { ClassSubclassRequirements } from "./components";
import { StatMultiplierSettings } from "./StatMultiplierSettings";

export type StatSettings = {
  multipliers: StatMultiplierSettings;
  requirements?: ClassSubclassRequirements[];
};

export type StatSettingsToAdd = Partial<StatSettings>;
