import { Item } from "../../lily-common/src";
import { LIB_NAME } from "../Constants";

/**
 * Blizzard's item stat budgets (RandPropPoints.dbc), exported to the world database by this module's datascripts.
 *
 * For every item level there is a point budget per slot group and per quality column. It is the table that
 * random-suffix items ("of the Bear") are sized with, so it grows with item level the same way item stats do.
 */
export namespace ItemBudget {
  export const TABLE = "lily_rie_item_budget";

  /** Which RandPropPoints column to read. */
  export enum Column {
    GOOD = 0,
    SUPERIOR = 1,
    EPIC = 2,
  }

  const SLOT_GROUPS = 5;
  /** Key: (item level × slot groups + slot group) × 3 + column. */
  const budgets = new Map<number, number>();
  let loaded = false;

  function key(itemLevel: number, slotGroup: number, column: Column): number {
    return (itemLevel * SLOT_GROUPS + slotGroup) * 3 + column;
  }

  /** Loads the budget table. Returns `false` (and logs a warning) if it is empty or missing. */
  export function load(): boolean {
    budgets.clear();
    loaded = false;

    // Created here as well so a missing datascript build gives an empty table instead of an SQL error.
    QueryWorld(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (item_level SMALLINT UNSIGNED NOT NULL, slot TINYINT UNSIGNED NOT NULL, ` +
        "good INT UNSIGNED NOT NULL, superior INT UNSIGNED NOT NULL, epic INT UNSIGNED NOT NULL, " +
        "PRIMARY KEY (item_level, slot))"
    );

    const result = QueryWorld(`SELECT item_level, slot, good, superior, epic FROM ${TABLE}`);
    let rows = 0;
    while (result.GetRow()) {
      const itemLevel = result.GetUInt16(0);
      const slotGroup = result.GetUInt8(1);
      budgets.set(key(itemLevel, slotGroup, Column.GOOD), result.GetUInt32(2));
      budgets.set(key(itemLevel, slotGroup, Column.SUPERIOR), result.GetUInt32(3));
      budgets.set(key(itemLevel, slotGroup, Column.EPIC), result.GetUInt32(4));
      rows++;
    }

    if (rows == 0) {
      console.warn(
        `${LIB_NAME}: Table ${TABLE} is empty. Run "build data" to export item budgets. Falling back to the point curve.`
      );
      return false;
    }

    loaded = true;
    console.log(`${LIB_NAME}: Loaded ${rows / SLOT_GROUPS} item levels of item stat budgets.`);
    return true;
  }

  export function isLoaded(): boolean {
    return loaded;
  }

  /**
   * RandPropPoints slot group for an inventory type, using the same grouping as TrinityCore's
   * `GenerateEnchSuffixFactor`. Returns `-1` for slots that have no stat budget (bags, tabards, ammo...).
   */
  export function slotGroupFor(inventoryType: number): number {
    switch (inventoryType) {
      case Item.InventoryType.HEAD:
      case Item.InventoryType.BODY:
      case Item.InventoryType.CHEST:
      case Item.InventoryType.LEGS:
      case Item.InventoryType.TWO_HAND_WEAPON:
      case Item.InventoryType.ROBE:
        return 0;
      case Item.InventoryType.SHOULDERS:
      case Item.InventoryType.WAIST:
      case Item.InventoryType.FEET:
      case Item.InventoryType.HANDS:
      case Item.InventoryType.TRINKET:
        return 1;
      case Item.InventoryType.NECK:
      case Item.InventoryType.WRISTS:
      case Item.InventoryType.FINGER:
      case Item.InventoryType.SHIELD:
      case Item.InventoryType.CLOAK:
      case Item.InventoryType.HOLDABLE:
        return 2;
      case Item.InventoryType.WEAPON:
      case Item.InventoryType.WEAPON_MAIN_HAND:
      case Item.InventoryType.WEAPON_OFF_HAND:
        return 3;
      case Item.InventoryType.RANGED:
      case Item.InventoryType.THROWN:
      case Item.InventoryType.RANGED_RIGHT:
      // Blizzard gives relics no budget; they share the ranged slot's budget here.
      case Item.InventoryType.RELIC:
        return 4;
      default:
        return -1;
    }
  }

  /** The RandPropPoints column that matches an item quality (poor and normal use the green column). */
  export function columnForQuality(quality: Item.Quality): Column {
    if (quality >= Item.Quality.EPIC) return Column.EPIC;
    if (quality == Item.Quality.RARE) return Column.SUPERIOR;
    return Column.GOOD;
  }

  /**
   * Budget for an item level and inventory type, or `undefined` if the table isn't loaded,
   * the slot has no budget, or the item level isn't in the table.
   */
  export function getBudget(itemLevel: number, inventoryType: number, column: Column): number | undefined {
    if (!loaded) return undefined;
    const slotGroup = slotGroupFor(inventoryType);
    if (slotGroup < 0) return undefined;
    const budget = budgets.get(key(itemLevel, slotGroup, column));
    if (budget === undefined || budget <= 0) return undefined;
    return budget;
  }
}
