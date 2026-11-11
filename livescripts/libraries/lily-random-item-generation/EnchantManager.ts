import { Random, Item } from "../lily-common/src";
import { Logger } from "../lily-common/src/utils";
import { StatUtils } from "./components";
import { EnchantPointCurve } from "./components/EnchantPointCurve";
import { ItemBudget } from "./components/ItemBudget";
import {
  CustomStat,
  EnchantGenResult,
  EnchantPointsAndVariance,
  ItemClassPair,
} from "./components/types";
import { LootSource } from "./LootSource";
import {
  enchantRollSettings,
  enchantPointSettings,
  statPoolSettings,
  StatPoolCategory,
  StatSettingsManager,
} from "./settings";
import { StatMultiplierSettings, StatSettings } from "./settings/types";
import { StatPool } from "./StatPool";

export class EnchantManager {
  static MIN_ENCHANTMENT_VALUE = 0;
  private statSettingsManager: StatSettingsManager;
  private logger: Logger;

  constructor() {
    this.statSettingsManager = StatSettingsManager.getInstance();
    this.logger = new Logger("EnchantManager");
  }

  /**
   * @param item the (already quality-rolled) item template to generate enchantments for.
   * @param creature the creature that dropped it (rank and dungeon bonuses).
   * @param classToRollFor class whose stat weights to use (see `StatPool.pickClassToRollFor`),
   * or `undefined` to use only the item-type affinities.
   */
  public generateEnchantments(
    item: TSItemTemplate,
    creature: TSCreature,
    classToRollFor?: number
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
    const totalPointsAndVariance: EnchantPointsAndVariance = this.rollPointsForItem(item);
    const totalPoints = totalPointsAndVariance.points * pointMultiplier;

    const enchantCount = this.rollForEnchantCount(
      item.GetQuality(),
      LootSource.bonusesFor(creature).enchantRollBonus
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

    const category = StatPool.categoryFor(item);
    const pickedStats: number[] = this.pickStatsForItem(
      enchantCount,
      itemClassPair,
      category,
      classToRollFor,
      true
    );
    if (pickedStats.length === 0) {
      this.logger.error(
        `generateEnchantments: No valid stats picked for item ${item.GetName()}. Aborting generation.`
      );
      return { enchantments: [] };
    }

    // Only the picked stats share the points; cap how much of them avoidance stats may take.
    // This can append one extra stat (see `statPoolSettings.avoidanceExcessStat`).
    const pickedPoints = this.applyAvoidanceCap(
      pickedStats,
      statValues.slice(0, pickedStats.length)
    );

    this.logger.debug(
      `generateEnchantments: pushing stat enchantments for item ${item.GetName()}. Stat count = ${
        pickedStats.length
      }. Enchant count = ${enchantCount}`
    );
    // Push the picked stats and their values to the enchantment list of the item.
    for (let i = 0; i < pickedStats.length; i++) {
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

      // Every picked stat is worth at least 1, so no affix ends up naming an empty stat.
      const value = Math.max(1, Math.round(pickedPoints[i] * statMultiplier));
      this.logger.debug(
        `generateEnchantments: Stat value = ${pickedPoints[i]}. Multiplier = ${statMultiplier}. Final value = ${value}`
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
    const isPerfect = this.isItemPerfect(item.GetQuality(), enchantCount, hasMaxVariance);

    if (isPerfect)
      this.logger.info(`generateEnchantments: Item ${item.GetName()} is perfect!`);

    return {
      enchantments,
      isPerfect,
    };
  }

  /**
   * Checks if the item is perfect.
   * An item is perfect if it has the maximum possible point variance and rolled the maximum number of
   * enchantments for its quality.
   *
   * Counts rolled enchantments rather than distinct stats: with weighted stat pools the same stat is picked
   * twice more often (the two merge into one bigger stat), and the avoidance cap can add a stamina stat.
   *
   * @param itemQuality item quality to check for perfection.
   * @param enchantCount number of enchantments rolled for the item.
   * @param hasMaxVariance `true` if the item has the maximum possible point variance.
   * @returns `boolean` - `true` if the item is perfect, `false` otherwise.
   */
  private isItemPerfect(
    itemQuality: Item.Quality,
    enchantCount: number,
    hasMaxVariance: boolean
  ): boolean {
    const rollSettings = enchantRollSettings.get(itemQuality);
    if (!rollSettings) return false;

    return hasMaxVariance && enchantCount === rollSettings.maxEnchants;
  }

  /**
   * Returns how many enchantments this new item will get.
   * Does not actually generate any enchantments.
   *
   * Mostly determined by item `quality` and creature rank (plus dungeon bonuses), with a degree of randomness.
   *
   * @param quality item quality used in roll.
   * @param rankBonus nominal bonus added to every roll (from `LootSource.bonusesFor`).
   * @returns `number` - Amount of enchantments rolled.
   */
  private rollForEnchantCount(quality: Item.Quality, rankBonus: number): number {
    const rollSettings = enchantRollSettings.get(quality);
    if (!rollSettings) return 0;

    this.logger.debug(`rollForEnchantCount: starting...`);

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
   * Rolls the enchantment points for an item (before the quality multiplier), with variance.
   * Uses the item's stat budget when `enchantPointSettings.source` is "ITEM_BUDGET" and a budget exists
   * for its level and slot; otherwise the point curve.
   */
  private rollPointsForItem(item: TSItemTemplate): EnchantPointsAndVariance {
    const variance = enchantPointSettings.variancePercent;
    if (enchantPointSettings.source == "ITEM_BUDGET") {
      const column =
        enchantPointSettings.budgetColumn == "ITEM_QUALITY"
          ? ItemBudget.columnForQuality(item.GetQuality())
          : ItemBudget.Column.GOOD;
      const budget = ItemBudget.getBudget(item.GetItemLevel(), item.GetInventoryType(), column);
      if (budget !== undefined) {
        this.logger.debug(
          `rollPointsForItem: Item budget for ${item.GetName()} (item level ${item.GetItemLevel()}, inventory type ${item.GetInventoryType()}) = ${budget}.`
        );
        return EnchantPointCurve.applyVariance(budget, variance);
      }
      this.logger.debug(
        `rollPointsForItem: No item budget for ${item.GetName()} (item level ${item.GetItemLevel()}, inventory type ${item.GetInventoryType()}). Using the point curve.`
      );
    }
    return EnchantPointCurve.getPoints(item.GetItemLevel(), variance);
  }

  /**
   * Picks `statCount` stats for an item, weighted by class and item type (see `StatPoolSettings.ts`).
   * If `allowRepeats` is `false`, each stat will only be chosen at most once.
   *
   * @returns `number[]` - Array of picked stat keys. May be shorter than `statCount` if no stat is allowed.
   */
  private pickStatsForItem(
    statCount: number,
    itemClassPair: ItemClassPair,
    category: StatPoolCategory,
    classToRollFor: number | undefined,
    allowRepeats: boolean = false
  ): number[] {
    const statList: Item.Stat[] = this.statSettingsManager
      .getStatList()
      .filter((stat) => this.statIsAllowedForItem(stat, itemClassPair));
    if (statList.length === 0) {
      this.logger.error(`pickStatsForItem: No stats allowed for this item. Returning empty array.`);
      return [];
    }

    const pickedStats: number[] = [];
    for (let i = 0; i < statCount && statList.length > 0; i++) {
      const offStat = Math.random() < statPoolSettings.offStatChance;
      const pickedStat = this.pickWeightedStat(statList, category, classToRollFor, offStat);
      this.logger.debug(
        `pickStatsForItem: Picked ${Item.Stat[pickedStat]} (class ${classToRollFor}, ${
          offStat ? "off-stat pick" : "class pick"
        }).`
      );
      pickedStats.push(pickedStat);
      if (!allowRepeats) statList.splice(statList.indexOf(pickedStat), 1);
    }

    return pickedStats;
  }

  /**
   * Picks one stat from `statList` with probability proportional to its weight.
   * Falls back to item-type affinities if the class weights rule out every stat, and to a plain
   * random pick if those do too.
   */
  private pickWeightedStat(
    statList: Item.Stat[],
    category: StatPoolCategory,
    classToRollFor: number | undefined,
    offStat: boolean
  ): Item.Stat {
    let weights = statList.map((stat) =>
      StatPool.statWeight(stat, category, classToRollFor, offStat)
    );
    let total = weights.reduce((sum, weight) => sum + weight, 0);

    if (total <= 0) {
      weights = statList.map((stat) => StatPool.statWeight(stat, category, undefined, true));
      total = weights.reduce((sum, weight) => sum + weight, 0);
    }
    if (total <= 0) return statList[Random.getRandomInt(0, statList.length - 1)];

    let roll = Math.random() * total;
    for (let i = 0; i < statList.length; i++) {
      roll -= weights[i];
      if (roll < 0) return statList[i];
    }
    return statList[statList.length - 1];
  }

  /** Whether a stat has settings and meets its item class/subclass requirements. */
  private statIsAllowedForItem(stat: Item.Stat, itemClassPair: ItemClassPair): boolean {
    const settings = this.statSettingsManager.getSettingsForStat(stat);
    if (!settings) return false;
    return this.statIsValidForItem(settings, itemClassPair);
  }

  /**
   * Limits the share of an item's points that avoidance stats (dodge, parry, defence, block rating)
   * can take to `statPoolSettings.avoidanceShareCap`. The excess goes to the other picked stats,
   * in proportion to their points. If every pick is an avoidance stat, the excess becomes
   * `statPoolSettings.avoidanceExcessStat`, which is appended to `pickedStats` (or is lost if unset).
   *
   * @returns the points per entry of `pickedStats` after the cap (not rounded).
   */
  private applyAvoidanceCap(pickedStats: number[], points: number[]): number[] {
    let total = 0;
    let avoidance = 0;
    let otherCount = 0;
    for (let i = 0; i < pickedStats.length; i++) {
      total += points[i];
      if (StatPool.isAvoidance(pickedStats[i])) avoidance += points[i];
      else otherCount++;
    }

    const allowed = statPoolSettings.avoidanceShareCap * total;
    if (avoidance <= allowed || avoidance <= 0) return points;

    const scale = allowed / avoidance;
    const excess = avoidance - allowed;
    const otherPoints = total - avoidance;
    this.logger.debug(
      `applyAvoidanceCap: Avoidance stats rolled ${avoidance} of ${total} points. Capped at ${allowed}.`
    );

    const capped = points.map((value, i) => {
      if (StatPool.isAvoidance(pickedStats[i])) return value * scale;
      if (otherPoints > 0) return value + (excess * value) / otherPoints;
      return value + excess / otherCount;
    });

    const excessStat = statPoolSettings.avoidanceExcessStat;
    if (otherCount == 0 && excessStat !== undefined) {
      pickedStats.push(excessStat);
      capped.push(excess);
    }
    return capped;
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
