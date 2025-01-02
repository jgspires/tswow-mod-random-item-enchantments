import { Random, Item, Creature } from "../lily-common/src";
import { EnchantPointCurve } from "./components/EnchantPointCurve";
import { CustomStat, EnchantGenResult, ItemClassSubclassPair } from "./components/types";
import {
  enchantRollSettings,
  enchantStatSettings,
  creatureRankBonuses,
} from "./settings";
import { EnchantmentStatSettings } from "./settings/types";

export namespace EnchantManager {
  export function generateEnchantments(
    item: TSItemTemplate,
    creature: TSCreature
  ): EnchantGenResult {
    let remainingFactor = 100;
    const enchantList: CustomStat[] = [];
    const pointMultiplier = enchantRollSettings.get(
      item.GetQuality()
    )?.enchantPointMultiplier;
    if (pointMultiplier == undefined) {
      console.log(
        `generateEnchantments: Item ${item.GetName()} (Quality = ${item.GetQuality()}) Has no point multiplier. Aborting generation.`
      );
      return { enchantments: [] };
    }

    const itemClassPair = { class: item.GetClass(), subclass: item.GetSubClass() };
    const totalPointsAndVariance = EnchantPointCurve.getPoints(item.GetItemLevel());
    const totalPoints = totalPointsAndVariance.points * pointMultiplier;

    const enchantCount = rollForEnchantCount(
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
      `generateEnchantments: Generating ${enchantCount} enchantment(s) for item ${item.GetName()}. Quality = ${item.GetQuality()}. Total points = ${totalPoints}`
    );

    for (let i = 0; i < enchantCount; i++) {
      const chosenFactor = Random.getRandomInt(1, remainingFactor);
      const factoredPoints = Math.round((totalPoints * chosenFactor) / 100);

      console.log(`generateEnchantments: Generating enchantment ${i}...`);
      console.log(`generateEnchantments: Remaining factor before = ${remainingFactor}`);
      console.log(
        `generateEnchantments: Factored Points = ${factoredPoints}. Chosen factor = ${chosenFactor} / ${remainingFactor}`
      );

      remainingFactor -= chosenFactor;

      console.log(`generateEnchantments: Remaining factor after = ${remainingFactor}`);

      const pickedStat = pickRandomStat(itemClassPair);

      const statSettings = enchantStatSettings.get(pickedStat);
      if (!statSettings) {
        console.log(
          `generateEnchantments: No stat settings found for stat ${pickedStat}. Skipping...`
        );
        continue;
      }

      const multiplier = getStatMultiplierForItem(statSettings, itemClassPair);
      console.log(
        `generateEnchantments: Stat Multiplier for stat ${pickedStat} and item class pair (${itemClassPair.class}|${itemClassPair.subclass}) = ${multiplier}`
      );

      enchantList.push({
        value: Math.round(factoredPoints * multiplier),
        stat: pickedStat,
      });

      if (remainingFactor <= 0) break;
    }

    // If all enchantments were added but there is still factor (percentage) remaining:
    // redistribute it amongst all enchantments.
    if (remainingFactor > 0) {
      console.log(
        `generateEnchantments: Remaining factor was not 0 after generating enchantments. Applying remaining factor divided amongst all ${enchantList.length} enchantments.`
      );
      const factorPerEnchant = remainingFactor / enchantList.length;
      console.log(
        `generateEnchantments: Total remaining factor = ${remainingFactor}. Factor applied per enchantment = ${factorPerEnchant} (${enchantList.length} enchantments)`
      );
      console.log(
        `generateEnchantments: Points per enchantment based on factor: ${Math.round(
          (totalPoints * factorPerEnchant) / 100
        )} (${factorPerEnchant} * ${totalPoints} / 100)`
      );
      enchantList.forEach((enchant) => {
        const statSettings = enchantStatSettings.get(enchant.stat);
        if (statSettings) {
          const factoredPoints = Math.round((totalPoints * factorPerEnchant) / 100);
          const multiplier = getStatMultiplierForItem(statSettings, itemClassPair);

          enchant.value += Math.round(factoredPoints * multiplier);
        } else {
          console.log(
            `generateEnchantments: No stat settings found for stat ${enchant.stat}. Skipping...`
          );
        }
      });
    }

    // Is item perfect? i.e. Max point variance and all possible enchantments added? Tag it as such.
    const rollSettings = enchantRollSettings.get(item.GetQuality());
    let isPerfect = false;
    if (
      totalPointsAndVariance.hasMaxVariance == true &&
      enchantList.length === rollSettings?.maxEnchants
    ) {
      isPerfect = true;
    }

    return { enchantments: enchantList, isPerfect };
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
  export function rollForEnchantCount(
    quality: Item.Quality,
    rank: Creature.Rank
  ): number {
    const rollSettings = enchantRollSettings.get(quality);
    if (!rollSettings) return 0;

    console.log(`rollForEnchantCount: starting...`);
    const rankBonus = enchantRollBonusForRank(rank);

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
          ` rollForEnchantCount: Max enchantments reached for quality ${quality}. Breaking...`
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
  function enchantRollBonusForRank(creatureRank: Creature.Rank): number {
    return creatureRankBonuses.get(creatureRank)?.enchantRollBonus || 0;
  }

  function pickRandomStat(
    itemClassPair: ItemClassSubclassPair,
    statSettings = enchantStatSettings
  ): number {
    if (statSettings.size === 0) {
      console.log(`pickRandomStat: No stat settings found. Aborting and returning 0.`);
      return 0;
    }

    const statSettingsKeys = Array.from(statSettings.keys());
    do {
      let pickedStatIndex =
        statSettingsKeys[Random.getRandomInt(0, statSettingsKeys.length - 1)];
      let pickedStatSettings = statSettings.get(pickedStatIndex);
      if (!pickedStatSettings) {
        console.log(
          `pickRandomStat: No stat settings found for stat ${pickedStatIndex}. Skipping...`
        );
        continue;
      }

      // Remove picked stat from list to avoid picking it again.
      statSettingsKeys.splice(statSettingsKeys.indexOf(pickedStatIndex), 1);

      console.log(
        `pickRandomStat: Picked stat ${pickedStatIndex}! Checking if it's valid for item class and subclass...`
      );

      // Check if the stat is valid for the item class.
      if (statIsValidForItem(pickedStatSettings, itemClassPair)) {
        console.log(
          `pickRandomStat: Picked stat ${pickedStatIndex} is valid for class|subclass ${itemClassPair.class}|${itemClassPair.subclass}!`
        );
        return pickedStatIndex;
      }
      console.log(
        `pickRandomStat: Picked stat ${pickedStatIndex} is invalid for class|subclass ${itemClassPair.class}|${itemClassPair.subclass}!`
      );

      // If not, keep searching.
    } while (statSettingsKeys.length !== 0); // Keep searching until all stats have been checked.

    console.log(
      `pickRandomStat: No valid stats found for item class and subclass ${itemClassPair.class} | ${itemClassPair.subclass}. Aborting and returning 0.`
    );
    return 0;
  }

  function statIsValidForItem(
    enchantStatSettings: EnchantmentStatSettings,
    itemClassPair: ItemClassSubclassPair
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

  function getStatMultiplierForItem(
    statSettings: EnchantmentStatSettings,
    itemClassPair: ItemClassSubclassPair
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
