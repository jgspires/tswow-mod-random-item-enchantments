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
}
