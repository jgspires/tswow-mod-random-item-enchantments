import { Random, Item, Creature } from "../lily-common/src";
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
  enchantStatSettings,
  creatureRankBonuses,
} from "./settings";
import { EnchantmentStatSettings } from "./settings/types";

export class EnchantManager {
  static MIN_ENCHANTMENT_VALUE = 0;

  public generateEnchantments(
    item: TSItemTemplate,
    creature: TSCreature
  ): EnchantGenResult {
    const enchantments: CustomStat[] = [];
    const pointMultiplier = enchantRollSettings.get(
      item.GetQuality()
    )?.enchantPointMultiplier;
    if (pointMultiplier == undefined) {
      console.log(
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
      console.log(
        `generateEnchantments: Item ${item.GetName()} (Quality = ${item.GetQuality()}) rolled 0 enchantments. Aborting generation.`
      );
      return { enchantments: [] };
    }

    console.log(
      `generateEnchantments: Generating ${enchantCount} enchantment(s) for item ${item.GetName()}. Quality = ${item.GetQuality()}. Total points = ${totalPoints}. Variance factor = ${
        totalPointsAndVariance.variance
      }.`
    );

    const statValues: number[] = StatUtils.distributeStatsRandomlyWithMinimum(
      totalPoints,
      enchantCount,
      EnchantManager.MIN_ENCHANTMENT_VALUE
    );

    const pickedStats: number[] = this.pickRandomStats(
      enchantCount,
      itemClassPair,
      false
    );
    if (pickedStats.length === 0) {
      console.log(
        `generateEnchantments: No valid stats picked for item ${item.GetName()}. Aborting generation.`
      );
      return { enchantments: [] };
    }

    // Push the picked stats and their values to the enchantment list of the item.
    console.log(
      `generateEnchantments: pushing stat enchantments for item ${item.GetName()}. Stat count = ${
        pickedStats.length
      }. Enchant count = ${enchantCount}`
    );
    for (let i = 0; i < enchantCount; i++) {
      const stat = pickedStats[i];
      const statSettings = enchantStatSettings.get(stat);
      if (!statSettings) {
        console.log(
          `generateEnchantments: No stat settings found for stat ${stat}. Skipping...`
        );
        continue;
      }

      const statMultiplier = this.getStatMultiplierForItem(statSettings, itemClassPair);
      const value = Math.round(statValues[i] * statMultiplier);
      console.log(
        `generateEnchantments: Stat value = ${statValues[i]}. Multiplier = ${statMultiplier}. Final value = ${value}`
      );
      console.log(
        `generateEnchantments: Pushing final stat enchantment Stat|Value: (${stat}|${value}) to item ${item.GetName()}.`
      );
      enchantments.push({
        value,
        stat,
      });
    }

    // Is item perfect? i.e. Max point variance and all possible enchantments added? Tag it as such.
    const hasMaxVariance = totalPointsAndVariance.hasMaxVariance || false;
    const isPerfect = this.isItemPerfect(item.GetQuality(), enchantments, hasMaxVariance);

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

    console.log(`rollForEnchantCount: starting...`);
    const rankBonus = this.enchantRollBonusForRank(rank);

    let enchantCount = 0;
    let neededRoll = rollSettings.enchantmentNeededRoll;
    let roll = Random.getRandomChance() + rankBonus;
    console.log(
      `rollForEnchantCount: Total Roll = ${roll}. Needed Roll = ${neededRoll}. Rank Bonus = ${rankBonus}.`
    );

    while (roll >= neededRoll) {
      enchantCount++;
      console.log(
        `rollForEnchantCount: Roll successful! Enchantment count increased to ${enchantCount}.`
      );
      if (enchantCount >= rollSettings.maxEnchants) {
        console.log(
          `rollForEnchantCount: Max enchantments reached for quality ${quality}. Breaking...`
        );
        break;
      }

      neededRoll += rollSettings.extraNeededChancePerRoll;
      roll = Random.getRandomChance() + rankBonus;
      console.log(
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
  private pickRandomStats(
    statCount: number,
    itemClassPair: ItemClassPair,
    allowRepeats: boolean = false,
    statSettings: Map<Item.Stat, EnchantmentStatSettings> = enchantStatSettings
  ): number[] {
    if (statSettings.size === 0) {
      console.log(`pickRandomStats: No stat settings found. Returning empty array.`);
      return [];
    }

    if (!allowRepeats && statCount > statSettings.size) {
      console.log(
        `pickRandomStats: Requested stats exceed available stats without repeats. Returning empty array.`
      );
      return [];
    }

    const pickedStats: number[] = [];
    const localStatSettings = allowRepeats ? statSettings : new Map(statSettings);

    for (let i = 0; i < statCount; i++) {
      const pickedStatKey = this.pickRandomStat(itemClassPair, localStatSettings);
      if (pickedStatKey === null) break; // Stop if no valid stats are left.
      pickedStats.push(pickedStatKey);
      if (!allowRepeats) localStatSettings.delete(pickedStatKey);
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
  private pickRandomStat(
    itemClassPair: ItemClassPair,
    statSettings: Map<Item.Stat, EnchantmentStatSettings> = enchantStatSettings
  ): number | null {
    if (statSettings.size === 0) {
      console.log(`pickRandomStat: No stat settings found. Returning null.`);
      return null;
    }

    const statSettingsKeys = Array.from(statSettings.keys());
    while (statSettingsKeys.length > 0) {
      const randomIndex = Random.getRandomInt(0, statSettingsKeys.length - 1);
      const pickedStatKey = statSettingsKeys[randomIndex];
      const pickedStatSettings = statSettings.get(pickedStatKey);

      if (!pickedStatSettings) {
        console.log(`pickRandomStat: Invalid stat ${pickedStatKey}. Skipping.`);
        statSettingsKeys.splice(randomIndex, 1); // Remove invalid stat.
        continue;
      }

      if (this.statIsValidForItem(pickedStatSettings, itemClassPair)) {
        return pickedStatKey;
      }

      console.log(`pickRandomStat: Stat ${pickedStatKey} is not valid. Skipping.`);
      statSettingsKeys.splice(randomIndex, 1); // Remove invalid stat.
    }

    console.log(`pickRandomStat: No valid stats found. Returning null.`);
    return null;
  }

  private statIsValidForItem(
    enchantStatSettings: EnchantmentStatSettings,
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
    statSettings: EnchantmentStatSettings,
    itemClassPair: ItemClassPair
  ): number {
    if (
      !statSettings.multiplierOverrides ||
      statSettings.multiplierOverrides.length === 0
    )
      return statSettings.multiplier;

    const multiplierOverride = statSettings.multiplierOverrides.find((value) => {
      if (value.class === itemClassPair.class) {
        if (value.subclasses && value.subclasses.length > 0) {
          return value.subclasses.includes(itemClassPair.subclass);
        }
        return true;
      }
    });

    if (!multiplierOverride) return statSettings.multiplier;

    return multiplierOverride.overrideMultiplier;
  }
}
