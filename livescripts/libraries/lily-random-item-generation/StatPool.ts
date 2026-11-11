import { Item, Random } from "../lily-common/src";
import {
  classStatWeights,
  itemStatAffinities,
  StatPoolCategory,
  statPoolSettings,
} from "./settings";

/** Helpers for class- and item-aware stat picking. The weights themselves live in `settings/StatPoolSettings.ts`. */
export namespace StatPool {
  /** Weapon subclasses each class can use (Wrath of the Lich King proficiencies). */
  const weaponProficiencies: Record<number, Item.Subclass[]> = {
    [Item.PlayerClass.WARRIOR]: [
      Item.Subclass.WEAPON_AXE1H, Item.Subclass.WEAPON_AXE2H, Item.Subclass.WEAPON_MACE1H,
      Item.Subclass.WEAPON_MACE2H, Item.Subclass.WEAPON_SWORD1H, Item.Subclass.WEAPON_SWORD2H,
      Item.Subclass.WEAPON_POLEARM, Item.Subclass.WEAPON_STAFF, Item.Subclass.WEAPON_FIST_WEAPON,
      Item.Subclass.WEAPON_DAGGER, Item.Subclass.WEAPON_BOW, Item.Subclass.WEAPON_GUN,
      Item.Subclass.WEAPON_CROSSBOW, Item.Subclass.WEAPON_THROWN,
    ],
    [Item.PlayerClass.PALADIN]: [
      Item.Subclass.WEAPON_AXE1H, Item.Subclass.WEAPON_AXE2H, Item.Subclass.WEAPON_MACE1H,
      Item.Subclass.WEAPON_MACE2H, Item.Subclass.WEAPON_SWORD1H, Item.Subclass.WEAPON_SWORD2H,
      Item.Subclass.WEAPON_POLEARM,
    ],
    [Item.PlayerClass.HUNTER]: [
      Item.Subclass.WEAPON_AXE1H, Item.Subclass.WEAPON_AXE2H, Item.Subclass.WEAPON_SWORD1H,
      Item.Subclass.WEAPON_SWORD2H, Item.Subclass.WEAPON_POLEARM, Item.Subclass.WEAPON_STAFF,
      Item.Subclass.WEAPON_FIST_WEAPON, Item.Subclass.WEAPON_DAGGER, Item.Subclass.WEAPON_BOW,
      Item.Subclass.WEAPON_GUN, Item.Subclass.WEAPON_CROSSBOW, Item.Subclass.WEAPON_THROWN,
    ],
    [Item.PlayerClass.ROGUE]: [
      Item.Subclass.WEAPON_AXE1H, Item.Subclass.WEAPON_MACE1H, Item.Subclass.WEAPON_SWORD1H,
      Item.Subclass.WEAPON_FIST_WEAPON, Item.Subclass.WEAPON_DAGGER, Item.Subclass.WEAPON_BOW,
      Item.Subclass.WEAPON_GUN, Item.Subclass.WEAPON_CROSSBOW, Item.Subclass.WEAPON_THROWN,
    ],
    [Item.PlayerClass.PRIEST]: [
      Item.Subclass.WEAPON_MACE1H, Item.Subclass.WEAPON_STAFF, Item.Subclass.WEAPON_DAGGER,
      Item.Subclass.WEAPON_WAND,
    ],
    [Item.PlayerClass.DEATH_KNIGHT]: [
      Item.Subclass.WEAPON_AXE1H, Item.Subclass.WEAPON_AXE2H, Item.Subclass.WEAPON_MACE1H,
      Item.Subclass.WEAPON_MACE2H, Item.Subclass.WEAPON_SWORD1H, Item.Subclass.WEAPON_SWORD2H,
      Item.Subclass.WEAPON_POLEARM,
    ],
    [Item.PlayerClass.SHAMAN]: [
      Item.Subclass.WEAPON_AXE1H, Item.Subclass.WEAPON_AXE2H, Item.Subclass.WEAPON_MACE1H,
      Item.Subclass.WEAPON_MACE2H, Item.Subclass.WEAPON_STAFF, Item.Subclass.WEAPON_FIST_WEAPON,
      Item.Subclass.WEAPON_DAGGER,
    ],
    [Item.PlayerClass.MAGE]: [
      Item.Subclass.WEAPON_SWORD1H, Item.Subclass.WEAPON_STAFF, Item.Subclass.WEAPON_DAGGER,
      Item.Subclass.WEAPON_WAND,
    ],
    [Item.PlayerClass.WARLOCK]: [
      Item.Subclass.WEAPON_SWORD1H, Item.Subclass.WEAPON_STAFF, Item.Subclass.WEAPON_DAGGER,
      Item.Subclass.WEAPON_WAND,
    ],
    [Item.PlayerClass.DRUID]: [
      Item.Subclass.WEAPON_MACE1H, Item.Subclass.WEAPON_MACE2H, Item.Subclass.WEAPON_POLEARM,
      Item.Subclass.WEAPON_STAFF, Item.Subclass.WEAPON_FIST_WEAPON, Item.Subclass.WEAPON_DAGGER,
    ],
  };

  /** Stat pool category of an item: its armour type, shield, relic, jewellery or weapon kind. */
  export function categoryFor(item: TSItemTemplate): StatPoolCategory {
    const subclass = item.GetSubClass();
    const inventoryType = item.GetInventoryType();

    if (item.GetClass() == Item.Class.ITEM_CLASS_ARMOR) {
      // Cloaks are cloth by subclass but every class wears them.
      if (inventoryType == Item.InventoryType.CLOAK) return StatPoolCategory.JEWELLERY;
      if (inventoryType == Item.InventoryType.HOLDABLE) return StatPoolCategory.HELD_IN_OFF_HAND;
      switch (subclass) {
        case Item.Subclass.ARMOR_CLOTH:
          return StatPoolCategory.CLOTH;
        case Item.Subclass.ARMOR_LEATHER:
          return StatPoolCategory.LEATHER;
        case Item.Subclass.ARMOR_MAIL:
          return StatPoolCategory.MAIL;
        case Item.Subclass.ARMOR_PLATE:
          return StatPoolCategory.PLATE;
        case Item.Subclass.ARMOR_SHIELD:
          return StatPoolCategory.SHIELD;
        case Item.Subclass.ARMOR_LIBRAM:
        case Item.Subclass.ARMOR_IDOL:
        case Item.Subclass.ARMOR_TOTEM:
        case Item.Subclass.ARMOR_SIGIL:
          return StatPoolCategory.RELIC;
        default:
          return StatPoolCategory.JEWELLERY;
      }
    }

    if (item.GetClass() == Item.Class.ITEM_CLASS_WEAPON) {
      switch (subclass) {
        case Item.Subclass.WEAPON_STAFF:
          return StatPoolCategory.STAFF;
        case Item.Subclass.WEAPON_WAND:
          return StatPoolCategory.WAND;
        case Item.Subclass.WEAPON_BOW:
        case Item.Subclass.WEAPON_GUN:
        case Item.Subclass.WEAPON_CROSSBOW:
        case Item.Subclass.WEAPON_THROWN:
          return StatPoolCategory.RANGED_WEAPON;
        default:
          return StatPoolCategory.MELEE_WEAPON;
      }
    }

    return StatPoolCategory.JEWELLERY;
  }

  /** The armour type a class wears at a level (warriors and paladins switch to plate at 40, hunters and shamans to mail). */
  function armourFor(classId: number, level: number): Item.Subclass {
    switch (classId) {
      case Item.PlayerClass.WARRIOR:
      case Item.PlayerClass.PALADIN:
        return level >= 40 ? Item.Subclass.ARMOR_PLATE : Item.Subclass.ARMOR_MAIL;
      case Item.PlayerClass.DEATH_KNIGHT:
        return Item.Subclass.ARMOR_PLATE;
      case Item.PlayerClass.HUNTER:
      case Item.PlayerClass.SHAMAN:
        return level >= 40 ? Item.Subclass.ARMOR_MAIL : Item.Subclass.ARMOR_LEATHER;
      case Item.PlayerClass.ROGUE:
      case Item.PlayerClass.DRUID:
        return Item.Subclass.ARMOR_LEATHER;
      default:
        return Item.Subclass.ARMOR_CLOTH;
    }
  }

  /**
   * Whether an item is meant for a class: its armour type (now, or the one it grows into),
   * a shield or relic it uses, or a weapon it can wield. Jewellery and cloaks suit everyone.
   */
  export function itemSuitsClass(
    item: TSItemTemplate,
    category: StatPoolCategory,
    classId: number,
    level: number
  ): boolean {
    const subclass = item.GetSubClass();
    switch (category) {
      case StatPoolCategory.CLOTH:
      case StatPoolCategory.LEATHER:
      case StatPoolCategory.MAIL:
      case StatPoolCategory.PLATE:
        return subclass == armourFor(classId, level) || subclass == armourFor(classId, 80);
      case StatPoolCategory.SHIELD:
        return (
          classId == Item.PlayerClass.WARRIOR ||
          classId == Item.PlayerClass.PALADIN ||
          classId == Item.PlayerClass.SHAMAN
        );
      case StatPoolCategory.RELIC:
        return (
          (subclass == Item.Subclass.ARMOR_LIBRAM && classId == Item.PlayerClass.PALADIN) ||
          (subclass == Item.Subclass.ARMOR_IDOL && classId == Item.PlayerClass.DRUID) ||
          (subclass == Item.Subclass.ARMOR_TOTEM && classId == Item.PlayerClass.SHAMAN) ||
          (subclass == Item.Subclass.ARMOR_SIGIL && classId == Item.PlayerClass.DEATH_KNIGHT)
        );
      case StatPoolCategory.HELD_IN_OFF_HAND:
        return (
          classId != Item.PlayerClass.WARRIOR &&
          classId != Item.PlayerClass.HUNTER &&
          classId != Item.PlayerClass.ROGUE &&
          classId != Item.PlayerClass.DEATH_KNIGHT
        );
      case StatPoolCategory.MELEE_WEAPON:
      case StatPoolCategory.STAFF:
      case StatPoolCategory.RANGED_WEAPON:
      case StatPoolCategory.WAND: {
        const proficiencies = weaponProficiencies[classId];
        return proficiencies !== undefined && proficiencies.indexOf(subclass) >= 0;
      }
      default:
        return true;
    }
  }

  /**
   * Chooses the class an item's stats are rolled for: the looter's, or a random group member's on the same
   * map, among those the item suits. Returns `undefined` when there's no looter or the item suits nobody;
   * the item then rolls on item-type affinities alone.
   */
  export function pickClassToRollFor(
    item: TSItemTemplate,
    category: StatPoolCategory,
    looter?: TSPlayer
  ): number | undefined {
    if (!looter) return undefined;

    let candidates: TSPlayer[] = [looter];
    const group = looter.GetGroup();
    if (group) {
      const sameMap = group
        .GetMembers()
        .filter((member) => member.GetMapID() == looter.GetMapID());
      if (sameMap.length > 0) candidates = sameMap;
    }

    const suited = candidates.filter((player) =>
      itemSuitsClass(item, category, player.GetClass(), player.GetLevel())
    );
    if (suited.length == 0) return undefined;
    return suited[Random.getRandomInt(0, suited.length - 1)].GetClass();
  }

  /**
   * Weight of a stat for one pick: class weight × item-type affinity. Without a class, or on an
   * off-stat pick, only the item-type affinity counts.
   */
  export function statWeight(
    stat: Item.Stat,
    category: StatPoolCategory,
    classId: number | undefined,
    offStat: boolean
  ): number {
    const affinities = itemStatAffinities[category];
    const affinity = affinities && affinities[stat] !== undefined ? affinities[stat]! : 1;
    if (classId === undefined || offStat) return affinity;

    const classWeights = classStatWeights[classId];
    if (!classWeights) return affinity;
    const classWeight = classWeights[stat];
    return (classWeight === undefined ? 0 : classWeight) * affinity;
  }

  export function isAvoidance(stat: Item.Stat): boolean {
    return statPoolSettings.avoidanceStats.indexOf(stat) >= 0;
  }
}
