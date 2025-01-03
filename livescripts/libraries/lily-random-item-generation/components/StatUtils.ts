import { Item } from "../../lily-common/src";
import { CustomStat } from "./types";

export class StatUtils {
  static MAX_ITEM_STATS = 10;

  /**
   * Adds a new stat to the item or updates an existing stat if it already exists.
   *
   * @param item - The item to which the stat will be added or updated.
   * @param customStat - The custom stat to be added or updated on the item.
   * @returns `CustomStat | undefined` - The custom stat that was added or updated. Returns `undefined` if the stat could not be added or updated.
   */
  static addOrUpdateStat(
    item: TSItemTemplate,
    customStat: CustomStat
  ): CustomStat | undefined {
    const statIndex = this.findStatIndex(item, customStat.stat);
    if (statIndex == -1) {
      if (this.addNewStatToItem(item, customStat) == -1) return undefined;
    } else {
      if (!this.updateItemStat(item, customStat)) return undefined;
    }
    return customStat;
  }

  /**
   * Adds a custom stat to the provided item.
   *
   * @param item  The item to add the stat to.
   * @param customStat  The stat to add.
   * @param value The value of the stat.
   * @returns `number` - The index of the stat in the item's enchantments. Returns -1 if the stat could not be added.
   */
  static addNewStatToItem(item: TSItemTemplate, customStat: CustomStat): number {
    for (let i = 0; i < this.MAX_ITEM_STATS; i++) {
      if (item.GetStatValue(i) == 0.0) {
        item.SetStatType(i, customStat.stat);
        item.SetStatValue(i, customStat.value);
        item.SetStatsCount(item.GetStatsCount() + 1);
        return i;
      }
    }
    return -1;
  }

  static updateItemStat(item: TSItemTemplate, customStat: CustomStat): boolean {
    const statIndex = this.findStatIndex(item, customStat.stat);
    if (statIndex == -1) return false;

    item.SetStatValue(statIndex, item.GetStatValue(statIndex) + customStat.value);
    return true;
  }

  /**
   * Finds the index of the stat in the item's stat list.
   *
   * @param item The item to check for the stat.
   * @param stat The stat to check for.
   * @returns `number` - The index of the stat in the item's enchantments. Returns -1 if the stat is not found.
   */
  static findStatIndex(item: TSItemTemplate, stat: Item.Stat): number {
    for (let i = 0; i < this.MAX_ITEM_STATS; i++) {
      if (item.GetStatType(i) == stat) return i;
    }
    return -1;
  }

  /**
   * Distributes a power pool among a number of enchantments, ensuring each enchantment receives at least a minimum value.
   *
   * @param valuePool - The total power pool to distribute.
   * @param enchantmentCount - The number of enchantments to distribute the power among.
   * @param minValue - The minimum value each enchantment should receive.
   * @returns `number[]` - An array of values representing the distributed power among the enchantments
   */
  static distributeStatsRandomlyWithMinimum(
    valuePool: number,
    enchantmentCount: number,
    minValue: number
  ): number[] {
    if (minValue * enchantmentCount > valuePool) {
      console.log("Not enough pool to allocate the minimum value to each enchantment.");
      return [];
    }

    // Step 1: Allocate the minimum value to each enchantment
    const base = Array.from({ length: enchantmentCount }, () => minValue);
    const remainingPool = valuePool - minValue * enchantmentCount;

    // Step 2: Randomly distribute the remaining pool
    const randomDistribution = this.randomlyDistributeStats(
      remainingPool,
      enchantmentCount
    );

    // Step 3: Combine the base values with the random distribution
    const distributed = base.map((val, i) => val + randomDistribution[i]);

    // Step 4: Ensure no enchantment gets exactly zero unless compensated
    let zeroCount = distributed.filter((val) => val === 0).length;

    if (zeroCount > 0) {
      for (let i = 0; i < enchantmentCount; i++) {
        if (distributed[i] === 0) {
          // Find the first non-zero value to transfer 1 unit
          for (let j = 0; j < enchantmentCount; j++) {
            if (distributed[j] > 1) {
              distributed[j]--;
              distributed[i]++;
              break;
            }
          }
        }
      }
    }

    return distributed;
  }

  /**
   * Distributes a value pool among a number of enchantments.
   *
   * @param valuePool - The total value to distribute.
   * @param enchantmentCount - The number of enchantments amongst which to distribute the value.
   * @returns `number[]` - An array of values representing the distributed value among the enchantments.
   */
  private static randomlyDistributeStats(
    valuePool: number,
    enchantmentCount: number
  ): number[] {
    const partitions = Array.from({ length: enchantmentCount - 1 }, () =>
      Math.random()
    ).sort((a, b) => a - b);

    partitions.unshift(0);
    partitions.push(1);

    const distributed = [];
    for (let i = 0; i < enchantmentCount; i++) {
      const value = Math.round(valuePool * (partitions[i + 1] - partitions[i]));
      distributed.push(value);
    }

    const total = distributed.reduce((sum, value) => sum + value, 0);
    if (total !== valuePool) {
      distributed[0] += valuePool - total;
    }

    return distributed;
  }
}
