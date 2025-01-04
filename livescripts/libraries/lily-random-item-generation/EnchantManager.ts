import { Random, Item, Creature } from "../lily-common/src";
import { Logger } from "../lily-common/src/utils";
import { StatUtils } from "./components";
import { EnchantPointCurve } from "./components/EnchantPointCurve";
import {
  CustomStat,
  EnchantGenResult,
  EnchantPointsAndVariance,
  ItemClassPair,
} from "./components/types";
import {
  enchantRollSettings,
  creatureRankBonuses,
  StatSettingsManager,
} from "./settings";
import { StatMultiplierSettings, StatSettings } from "./settings/types";

export class EnchantManager {
  static MIN_ENCHANTMENT_VALUE = 0;
  private statSettingsManager: StatSettingsManager;
  private logger: Logger;

  constructor() {
    this.statSettingsManager = StatSettingsManager.getInstance();
    this.logger = new Logger("EnchantManager");
  }

  public generateEnchantments(
    item: TSItemTemplate,
    creature: TSCreature
  ): EnchantGenResult {
    const enchantments: CustomStat[] = [];
    const pointMultiplier = enchantRollSettings.get(
      item.GetQuality()
    )?.enchantPointMultiplier;
    if (pointMultiplier == undefined) {
      this.logger.error(
        `generateEnchantments: Item ${item.GetName()} (Quality = ${item.GetQuality()}) Has no point multiplier. Aborting generation.`
      );
      return { enchantments: [] };
    }

    const itemClassPair: ItemClassPair = {
      class: item.GetClass(),
      subclass: item.GetSubClass(),
    };
    const totalPointsAndVariance: EnchantPointsAndVariance = EnchantPointCurve.getPoints(
      item.GetItemLevel()
    );
    const totalPoints = totalPointsAndVariance.points * pointMultiplier;

    const enchantCount = this.rollForEnchantCount(
      item.GetQuality(),
      creature.GetTemplate().GetRank()
    );

    if (enchantCount == 0) {
      this.logger.error(
        `generateEnchantments: Item ${item.GetName()} (Quality = ${
          Item.Quality[item.GetQuality()]
        }) rolled 0 enchantments. Aborting generation.`
      );
      return { enchantments: [] };
    }

    this.logger.debug(
      `generateEnchantments: Generating ${enchantCount} enchantment(s) for item ${item.GetName()}. Quality = ${
        Item.Quality[item.GetQuality()]
      }. Total points = ${totalPoints}. Rarity Multiplier = ${pointMultiplier}. Variance factor = ${
        totalPointsAndVariance.variance
      }.`
    );

    const statValues: number[] = StatUtils.distributeStatsRandomlyWithMinimum(
      totalPoints,
      enchantCount,
      EnchantManager.MIN_ENCHANTMENT_VALUE
    );

    const pickedStats: number[] = this.pickRandomStatsForItem(
      enchantCount,
      itemClassPair,
      true
    );
    if (pickedStats.length === 0) {
      this.logger.error(
        `generateEnchantments: No valid stats picked for item ${item.GetName()}. Aborting generation.`
      );
      return { enchantments: [] };
    }

    this.logger.debug(
      `generateEnchantments: pushing stat enchantments for item ${item.GetName()}. Stat count = ${
        pickedStats.length
      }. Enchant count = ${enchantCount}`
    );
    // Push the picked stats and their values to the enchantment list of the item.
    for (let i = 0; i < enchantCount; i++) {
      const stat = pickedStats[i];
      const statSettings = this.statSettingsManager.getSettingsForStat(stat);
      if (!statSettings) {
        this.logger.error(
          `generateEnchantments: No stat settings found for stat ${stat}. Skipping...`
        );
        continue;
      }

      const statMultiplier = this.getStatMultiplierForItem(
        statSettings.multipliers,
        itemClassPair
      );

      const value = Math.round(statValues[i] * statMultiplier);
      this.logger.debug(
        `generateEnchantments: Stat value = ${statValues[i]}. Multiplier = ${statMultiplier}. Final value = ${value}`
      );

      this.logger.debug(
        `generateEnchantments: Pushing final stat enchantment Stat|Value: (${
          Item.Stat[stat]
        }|${value}) to item ${item.GetName()}.`
      );

      const statToAdd: CustomStat = {
        stat,
        value,
      };
      const index = enchantments.findIndex((enchantment) => enchantment.stat === stat);
      if (index === -1) {
        this.logger.debug("generateEnchantments: Adding as new stat enchantment.");
        enchantments.push(statToAdd);
      } else {
        this.logger.debug(
          `generateEnchantments: Updating existing stat 
          ${Item.Stat[stat]} enchantment. Incrementing value from 
          ${enchantments[index].value} with ${value}`
        );
        enchantments[index].value += value;
        this.logger.debug(
          `generateEnchantments: Final ${Item.Stat[stat]} enchantment value = 
          ${enchantments[index].value}.`
        );
      }
    }

    // Is item perfect? i.e. Max point variance and all possible enchantments added? Tag it as such.
    const hasMaxVariance = totalPointsAndVariance.hasMaxVariance || false;
    const isPerfect = this.isItemPerfect(item.GetQuality(), enchantments, hasMaxVariance);

    if (isPerfect)
      this.logger.info(`generateEnchantments: Item ${item.GetName()} is perfect!`);

    return {
      enchantments,
      isPerfect,
    };
  }

  /**
   * Checks if the item is perfect.
   * An item is perfect if it has the maximum possible point variance and all possible enchantments added for its quality.
   *
   * @param itemQuality item quality to check for perfection.
   * @param enchantments enchantments added to the item.
   * @param hasMaxVariance `true` if the item has the maximum possible point variance.
   * @returns `boolean` - `true` if the item is perfect, `false` otherwise.
   */
  private isItemPerfect(
    itemQuality: Item.Quality,
    enchantments: CustomStat[],
    hasMaxVariance: boolean
  ): boolean {
    const rollSettings = enchantRollSettings.get(itemQuality);
    if (!rollSettings) return false;

    return hasMaxVariance && enchantments.length === rollSettings.maxEnchants;
  }

  /**
   * Returns how many enchantments this new item will get.
   * Does not actually generate any enchantments.
   *
   * Mostly determined by item `quality` and creature `rank`, with a degree of randomness.
   *
   * @param quality item quality used in roll.
   * @returns `number` - Amount of enchantments rolled.
   */
  private rollForEnchantCount(quality: Item.Quality, rank: Creature.Rank): number {
    const rollSettings = enchantRollSettings.get(quality);
    if (!rollSettings) return 0;

    this.logger.debug(`rollForEnchantCount: starting...`);
    const rankBonus = this.enchantRollBonusForRank(rank);

    let enchantCount = 0;
    let neededRoll = rollSettings.enchantmentNeededRoll;
    let roll = Random.getRandomChance() + rankBonus;
    this.logger.debug(
      `rollForEnchantCount: Total Roll = ${roll}. Needed Roll = ${neededRoll}. Rank Bonus = ${rankBonus}.`
    );

    while (roll >= neededRoll) {
      enchantCount++;
      this.logger.debug(
        `rollForEnchantCount: Roll successful! Enchantment count increased to ${enchantCount}.`
      );
      if (enchantCount >= rollSettings.maxEnchants) {
        this.logger.debug(
          `rollForEnchantCount: Max enchantments reached for quality ${quality}. Breaking...`
        );
        break;
      }

      neededRoll += rollSettings.extraNeededChancePerRoll;
      roll = Random.getRandomChance() + rankBonus;
      this.logger.debug(
        `rollForEnchantCount: Total Roll = ${roll}. Needed Roll = ${neededRoll}. Rank Bonus = ${rankBonus}.`
      );
    }

    return enchantCount;
  }

  /**
   * Returns the quality roll nominal bonus for the creature's rank.
   * The bonus is added to the base roll chance for enchantment count.
   *
   * @param creatureRank rank for which to get the bonus.
   * @returns `number` - Nominal (value) bonus to be added to enchantment roll.
   */
  private enchantRollBonusForRank(creatureRank: Creature.Rank): number {
    return creatureRankBonuses.get(creatureRank)?.enchantRollBonus || 0;
  }

  /**
   * Picks a random stat for the item.
   * If `allowRepeats` is `false`, each stat will only be chosen at most once.
   *
   * @param statCount Number of stats to pick.
   * @param itemClassPair Item class pair to check for stat validity.
   * @param allowRepeats If `true`, the same stat can be picked multiple times.
   * @param statSettings Stat settings map to use for picking stats.
   * @returns `number[]` - Array of picked stat keys.
   */
  private pickRandomStatsForItem(
    statCount: number,
    itemClassPair: ItemClassPair,
    allowRepeats: boolean = false
  ): number[] {
    const statList: Item.Stat[] = this.statSettingsManager.getStatList().slice();
    if (statList.length === 0) {
      this.logger.error(
        `pickRandomStats: No stat settings found. Returning empty array.`
      );
      return [];
    }

    if (!allowRepeats && statCount > statList.length) {
      this.logger.error(
        `pickRandomStats: Requested stats exceed available stats without repeats. Returning empty array.`
      );
      return [];
    }

    const pickedStats: number[] = [];

    for (let i = 0; i < statCount; i++) {
      const pickedStatIndex = this.pickRandomStatForItem(itemClassPair, statList);
      if (
        pickedStatIndex === null ||
        pickedStatIndex < 0 ||
        pickedStatIndex >= statList.length
      ) {
        this.logger.error(
          `pickRandomStats: Invalid stat ${pickedStatIndex} picked. Stopping early.`
        );
        break;
      }
      pickedStats.push(pickedStatIndex);
      if (!allowRepeats) statList.splice(pickedStatIndex, 1); // Ensure correct indexing.
    }

    return pickedStats;
  }

  /**
   * Picks a random stat for the item.
   *
   * @param itemClassPair Item class pair to check for stat validity/conditions.
   * @param statSettings Stat settings map to use for picking stats.
   * @returns `number | null` - Picked stat key or null if no valid stats are found.
   */
  private pickRandomStatForItem(
    itemClassPair: ItemClassPair,
    statList: Item.Stat[]
  ): number | null {
    if (statList.length === 0) {
      this.logger.error(`pickRandomStat: No stat settings found. Returning null.`);
      return null;
    }

    const localStatList: Item.Stat[] = statList.slice();

    while (localStatList.length > 0) {
      const randomIndex = Random.getRandomInt(0, localStatList.length - 1);
      const pickedStatKey = localStatList[randomIndex];
      const pickedStatSettings =
        this.statSettingsManager.getSettingsForStat(pickedStatKey);

      if (!pickedStatSettings) {
        this.logger.error(
          `pickRandomStat: non-existent settings for stat ${Item.Stat[pickedStatKey]}. Skipping...`
        );
        localStatList.splice(randomIndex, 1); // Remove invalid stat.
        continue;
      }

      if (this.statIsValidForItem(pickedStatSettings, itemClassPair)) {
        return pickedStatKey;
      }

      this.logger.debug(
        `pickRandomStat: Stat ${
          Item.Stat[pickedStatKey]
        } is not valid for item Class|Subclass pair (${Item.Class[itemClassPair.class]}|${
          Item.Subclass[itemClassPair.subclass]
        }). Skipping...`
      );
      localStatList.splice(randomIndex, 1); // Remove invalid stat.
    }

    this.logger.warn(`pickRandomStat: No valid stats found. Returning null.`);
    return null;
  }

  private statIsValidForItem(
    enchantStatSettings: StatSettings,
    itemClassPair: ItemClassPair
  ): boolean {
    // If stat has no classRequirements, return the stat as any equip type is allowed.
    if (
      !enchantStatSettings.requirements ||
      enchantStatSettings.requirements.length === 0
    )
      return true;

    // If the stat is allowed for the item class and there are no subclass requirements, return true.
    // If the stat has subclass requirements, check if the item's subclass is allowed in addition to the class.
    // return true if it is, false if it isn't.
    return enchantStatSettings.requirements.find((value) => {
      if (value.classRequirement === itemClassPair.class) {
        if (value.subclassRequirements && value.subclassRequirements.length > 0) {
          return value.subclassRequirements.includes(itemClassPair.subclass);
        }
        return true;
      }
    })
      ? true
      : false;
  }

  private getStatMultiplierForItem(
    statSettings: StatMultiplierSettings,
    itemClassPair: ItemClassPair
  ): number {
    const itemClassMultiplier =
      this.statSettingsManager.getStatMultiplierForItemClass(itemClassPair);
    let chosenMultiplier = statSettings.baseMultiplier;

    if (
      statSettings.classMultiplierOverrides &&
      statSettings.classMultiplierOverrides.length > 0
    ) {
      const multiplierOverride = statSettings.classMultiplierOverrides.find((value) => {
        if (value.class === itemClassPair.class) {
          if (value.subclasses && value.subclasses.length > 0) {
            return value.subclasses.includes(itemClassPair.subclass);
          }
          return true;
        }
      });

      if (multiplierOverride) chosenMultiplier = multiplierOverride.overrideMultiplier;
    }

    return chosenMultiplier * itemClassMultiplier;
  }
}
