import { Item } from "../../lily-common/src";
import { Logger } from "../../lily-common/src/utils";
import { ItemClassPair, ItemClassWithSubclasses } from "../components/types";
import { StatMultiplierSettings, StatSettings, StatSettingsToAdd } from "./types";
import { ClassSubclassRequirements } from "./types/components";

/**
 * Manages the settings for enchantment stats for randomly-generated items.
 */
export class StatSettingsManager {
  private static DEFAULT_BASE_MULTIPLIER = 1.0;
  private static instance: StatSettingsManager;

  /** Settings for each stat that can be enchanted/added on items. */
  private statSettings: Map<Item.Stat, StatSettings>;

  /** Stat value multipliers for specific item class/subclass combinations that apply to all stats. */
  private itemClassStatMultipliers: Map<ItemClassWithSubclasses, number>;

  private logger: Logger;

  private constructor() {
    this.statSettings = new Map();
    this.itemClassStatMultipliers = new Map();
    this.logger = new Logger("StatSettingsManager");
  }

  /**
   * Gets the singleton instance of the StatSettingsManager.
   */
  public static getInstance(): StatSettingsManager {
    if (!StatSettingsManager.instance) {
      StatSettingsManager.instance = new StatSettingsManager();
    }
    return StatSettingsManager.instance;
  }

  /**
   * Populates the stat settings with the provided set of stats.
   *
   * Stats will have the default base multiplier of `1.0` and no requirements.
   *
   * This will overwrite any existing settings.
   *
   * @param statSet The set of stats with which to populate the settings.
   */
  public populateStatSettings(statSet: Set<Item.Stat>): void {
    let addedStats = 0;
    this.logger.debug("populateStatSettings: clearing existing stat settings...");
    this.statSettings.clear();
    this.logger.debug("populateStatSettings: existing stat settings cleared.");

    this.logger.debug("populateStatSettings: populating stats with default settings...");
    statSet.forEach((stat) => {
      this.addStatToSettings(stat);
      addedStats++;
      this.logger.debug(
        `populateStatSettings: Added stat ${Item.Stat[stat]} to settings!`
      );
    });
    this.logger.info(
      `populateStatSettings: Added ${addedStats} stats with default settings.`
    );
  }

  /**
   * Adds a stat to the settings with the provided multipliers and requirements.
   *
   * If no multipliers are provided, the stat will have a base multiplier of 1.0.
   *
   * If no requirements are provided, the stat may be picked to any item.
   *
   * @param stat The stat to add to the settings.
   * @param statSettingsToAdd The multipliers and requirements to add to the stat.
   */
  public addStatToSettings(stat: Item.Stat, statSettingsToAdd?: StatSettingsToAdd): void {
    const newStatSetting: StatSettings = {
      multipliers: statSettingsToAdd?.multipliers || {
        baseMultiplier: StatSettingsManager.DEFAULT_BASE_MULTIPLIER,
      },
      requirements: statSettingsToAdd?.requirements,
    };

    this.statSettings.set(stat, newStatSetting);
  }

  /**
   * Sets the multiplier settings for multiple stats with multiple multipliers.
   * Each map entry should contain an array of stats and their multiplier settings.
   *
   * Existing multiplier settings for any given stats, if any, will be replaced.
   *
   * @param statMultiplierMap A map of stats to their multiplier settings.
   */
  public setMultipliersForStats(
    statMultiplierMap: Map<Item.Stat[], StatMultiplierSettings>
  ): void {
    let updatedStats = 0;
    let updatedEntries = 0;

    statMultiplierMap.forEach((multiplierSettings, stats) => {
      updatedStats += this.setMultipliersForStatArray(stats, multiplierSettings);
      updatedEntries++;
    });
    this.logger.info(
      `setMultipliersForStats: custom multipliers set for ${updatedStats} stats between ${updatedEntries} entries.`
    );
  }

  /**
   * Sets the multiplier settings for an array of stats.
   *
   * @param stats The stats for which the multiplier settings will be updated.
   * @param multiplierSettings The new multiplier settings to apply to all provided stats. Replaces the previous one.
   */
  private setMultipliersForStatArray(
    stats: Item.Stat[],
    multiplierSettings: StatMultiplierSettings
  ): number {
    let updatedStats = 0;
    this.logger.debug(
      `setMultipliersForStatArray: Setting multipliers for grouped stat entries...`
    );
    for (const stat of stats) {
      const statSettings = this.statSettings.get(stat);
      if (statSettings) {
        statSettings.multipliers = multiplierSettings;
        this.logger.debug(
          `setMultipliersForStatArray: ${Item.Stat[stat]}: Set base multiplier to ${multiplierSettings.baseMultiplier}!`
        );
        updatedStats++;
        if (statSettings.multipliers.classMultiplierOverrides) {
          for (const classMultOverride of statSettings.multipliers
            .classMultiplierOverrides) {
            this.logger.debug(
              `setMultipliersForStatArray: ${
                Item.Stat[stat]
              }: Set class|subclass multiplier override to ${
                classMultOverride.overrideMultiplier
              } for class ${Item.Class[classMultOverride.class]} and ${
                classMultOverride.subclasses?.length
              } subclas(ses)!`
            );
          }
        }
      } else
        this.logger.warn(
          `setMultipliersForStatArray: Stat ${Item.Stat[stat]} (${stat}) does not exist in the settings.`
        );
    }

    return updatedStats;
  }

  /**
   * Sets the requirements for multiple stats with multiple different requirements.
   * Each map entry should contain an array of stats and their requirements.
   *
   * Existing requirements for any given stats, if any, will be replaced.
   *
   * @param statRequirementMap A map of stats to their requirements.
   */
  public setRequirementsForStats(
    statRequirementMap: Map<Item.Stat[], ClassSubclassRequirements[]>
  ): void {
    let updatedStats = 0;
    let updatedEntries = 0;

    statRequirementMap.forEach((requirements, stats) => {
      updatedStats += this.setRequirementsForStatArray(stats, requirements);
      updatedEntries++;
    });
    this.logger.info(
      `setRequirementsForStats: custom requirements set for ${updatedStats} stats between ${updatedEntries} entries.`
    );
  }

  /**
   * Sets the requirement for an array of stats.
   *
   * @param stats The stats for which the requirements will be updated.
   * @param requirements The new requirements to apply to all provided stats. Replaces the previous ones.
   *
   * @returns `number` The number of stats for which the requirements were set.
   */
  private setRequirementsForStatArray(
    stats: Item.Stat[],
    requirements: ClassSubclassRequirements[]
  ): number {
    let updatedStats = 0;
    this.logger.debug(
      `setRequirementsForStatArray: Setting requirements for grouped stat entries...`
    );
    for (const stat of stats) {
      const statSettings = this.statSettings.get(stat);
      if (statSettings) {
        statSettings.requirements = requirements;
        this.logger.debug(
          `setRequirementsForStatArray: ${Item.Stat[stat]}: requirements set!`
        );
        updatedStats++;
      } else
        this.logger.error(
          `setRequirementsForStatArray: Stat ${Item.Stat[stat]} (${stat}) does not exist in the settings.`
        );
    }
    return updatedStats;
  }

  /**
   * Gets the stat settings for a specific stat.
   *
   * @param stat The stat for which to get the settings.
   * @returns The settings for the provided stat, or `undefined` if the stat does not exist in the settings.
   */
  public getSettingsForStat(stat: Item.Stat): StatSettings | undefined {
    return this.statSettings.get(stat);
  }

  /**
   * Checks if settings exist for a given stat.
   *
   * @param stat - The stat to check for existing settings.
   * @returns `true` if settings exist for the specified stat, otherwise `false`.
   */
  public settingsExistForStat(stat: Item.Stat): boolean {
    return this.statSettings.has(stat);
  }

  /**
   * Returns the stat list of all stat settings currently in the manager.
   * The stat list corresponds to the keys of the stat settings map.
   *
   * This list is a copy of the keys, so modifying it will not affect the original settings.
   *
   * @returns The list of stats in the settings.
   */
  public getStatList(): Item.Stat[] {
    return Array.from(this.statSettings.keys());
  }

  /**
   * Adds a global stat multiplier for specified item class/subclass combinations.
   *
   * This multiplier will ALWAYS apply to ALL stats, considering the item class/subclass combo is met.
   *
   * If you want to add a multiplier that only applies to a specific stat, use the `addStatToSettings` or `setMultipliersForStatArray` methods.
   *
   * These multipliers stacks multiplicatively with any stat-specific multipliers, class override multipliers, and other global multipliers.
   *
   * If no subclasses are specified in the `itemClassWithSubclasses` parameter, the multiplier will apply to all subclasses of the item class.
   *
   * @param itemClassWithSubclasses The item class/subclass combinations and multipliers to add.
   */
  public setStatMultipliersForItemClasses(
    itemClassWithSubclasses: Map<ItemClassWithSubclasses, number>
  ): void {
    let updatedEntries = 0;
    this.logger.debug(
      `setGlobalStatMultipliersForItemClasses: Setting global stat multipliers for item class combinations...`
    );
    itemClassWithSubclasses.forEach((multiplier, itemClassWithSubclasses) => {
      this.itemClassStatMultipliers.set(itemClassWithSubclasses, multiplier);
      updatedEntries++;
    });
    this.logger.info(
      `setGlobalStatMultipliersForItemClasses: global item class multipliers set for ${updatedEntries} entries.`
    );
  }

  /**
   * Gets the global stat multiplier for a specific item class/subclass combination
   *
   * If the item class/subclass combination (pair)
   * does not have a multiplier set, it will return `1.0`.
   *
   * @param itemClassPair The item class/subclass combination
   * for which to get the stat multiplier.
   * @returns `number` The stat multiplier for the specified item class/subclass combination.
   *
   */
  public getStatMultiplierForItemClass(itemClassPair: ItemClassPair): number {
    this.itemClassStatMultipliers.forEach((multiplier, itemClassWithSubclasses) => {
      if (
        itemClassWithSubclasses.class === itemClassPair.class &&
        itemClassWithSubclasses.subclasses.includes(itemClassPair.subclass)
      ) {
        return multiplier;
      }
    });

    return 1.0;
  }
}
