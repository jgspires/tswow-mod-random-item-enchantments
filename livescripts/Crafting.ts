import { Item } from "./libraries/lily-common/src";
import {
  LIB_NAME,
  LootSource,
  RandomItemGenerator,
} from "./libraries/lily-random-item-generation";
import { craftingSettings } from "./libraries/lily-random-item-generation/settings";

/*
 *  Random enchantments for crafted equipment.
 *
 *  The core creates crafted items in Spell::DoCreateItem, which has no TSWoW hook of its own, and its item
 *  ID can't be changed from outside. So instead of replacing the core's crafting (and losing skill-ups,
 *  "Made by" and the "You create" message), this lets the craft happen normally and then swaps the new item:
 *
 *  1. Spell.OnEffect, before a "create item" effect runs: if it creates armour or a weapon, note the
 *     newest item of that entry the player already has.
 *  2. Spell.OnAfterCast, after the cast's effects ran: find the item that is newer than that, roll it
 *     like a drop (with `craftingSettings` instead of a creature's bonuses), and if it got enchantments,
 *     replace it with the enchanted copy, keeping its "Made by" crafter. The player sees "You create:"
 *     for the plain item, then "You receive item:" for the enchanted one.
 *
 *  The replacement rolls its own random suffix ("of the Bear") if the item has one, so a crafted item
 *  with a random suffix may end up with a different suffix than the one it was created with.
 *
 *  Crafting spells take effect instantly when the cast finishes, so step 2 always runs after step 1.
 */

const SPELL_EFFECT_CREATE_ITEM = 24;
const SPELL_EFFECT_CREATE_ITEM_2 = 157;
const SPELL_EFFECT_HANDLE_HIT_TARGET = 3;

// UpdateFields.h: ITEM_FIELD_CREATOR = OBJECT_END (0x6) + 0x4
const ITEM_FIELD_CREATOR = 0x0a;

// Player.h inventory layout
const INVENTORY_SLOT_BAG_0 = 255;
const INVENTORY_SLOT_BAG_START = 19;
const INVENTORY_SLOT_BAG_END = 23;
const INVENTORY_SLOT_ITEM_START = 23;
const INVENTORY_SLOT_ITEM_END = 39;

type PendingCraft = {
  player: TSPlayer;
  itemEntry: number;
  /** GUID counter of the newest item of `itemEntry` the player had before the craft (0 if none). */
  newestBefore: number;
};

/** Crafts whose effects have run but whose items haven't been checked yet. Usually empty or one entry. */
let pendingCrafts: PendingCraft[] = [];

export function registerCraftingEnchantments(events: TSEvents, generator: RandomItemGenerator) {
  events.Spell.OnEffect((spell, cancel, info, mode, unitTarget) => {
    if (!craftingSettings.enabled || mode != SPELL_EFFECT_HANDLE_HIT_TARGET) return;
    const effect = info.GetType();
    if (effect != SPELL_EFFECT_CREATE_ITEM && effect != SPELL_EFFECT_CREATE_ITEM_2) return;

    const player = unitTarget ? unitTarget.ToPlayer() : undefined;
    const itemEntry = info.GetItemType();
    if (!player || itemEntry == 0) return;

    const template = GetItemTemplate(itemEntry);
    if (!template || !isEquipment(template)) return;

    pendingCrafts.push({ player, itemEntry, newestBefore: newestItemGuid(player, itemEntry) });
  });

  events.Spell.OnAfterCast(() => {
    if (pendingCrafts.length == 0) return;
    const crafts = pendingCrafts;
    pendingCrafts = [];
    for (const craft of crafts) enchantCraftedItem(generator, craft);
  });
}

function isEquipment(template: TSItemTemplate): boolean {
  return (
    template.GetClass() == Item.Class.ITEM_CLASS_ARMOR ||
    template.GetClass() == Item.Class.ITEM_CLASS_WEAPON
  );
}

function isRealItem(item: TSItem | undefined): item is TSItem {
  return item !== undefined && !item.IsNull();
}

/** Every item in the backpack and the four bags. */
function bagItems(player: TSPlayer): TSItem[] {
  const items: TSItem[] = [];
  for (let slot = INVENTORY_SLOT_ITEM_START; slot < INVENTORY_SLOT_ITEM_END; slot++) {
    const item = player.GetItemByPos(INVENTORY_SLOT_BAG_0, slot);
    if (isRealItem(item)) items.push(item);
  }
  for (let bagSlot = INVENTORY_SLOT_BAG_START; bagSlot < INVENTORY_SLOT_BAG_END; bagSlot++) {
    const bag = player.GetItemByPos(INVENTORY_SLOT_BAG_0, bagSlot);
    if (!isRealItem(bag)) continue;
    const size = bag.GetBagSize();
    for (let slot = 0; slot < size; slot++) {
      const item = player.GetItemByPos(bagSlot, slot);
      if (isRealItem(item)) items.push(item);
    }
  }
  return items;
}

/** Item GUID counters only ever increase, so the highest one of an entry is the newest item. */
function newestItemGuid(player: TSPlayer, itemEntry: number): number {
  let newest = 0;
  for (const item of bagItems(player)) {
    if (item.GetEntry() == itemEntry && item.GetGUIDLow() > newest) newest = item.GetGUIDLow();
  }
  return newest;
}

/** The item of the craft's entry that is newer than anything the player had before the craft. */
function findCraftedItem(craft: PendingCraft): TSItem | undefined {
  let found: TSItem | undefined = undefined;
  let foundGuid = craft.newestBefore;
  for (const item of bagItems(craft.player)) {
    if (item.GetEntry() == craft.itemEntry && item.GetGUIDLow() > foundGuid) {
      found = item;
      foundGuid = item.GetGUIDLow();
    }
  }
  return found;
}

function enchantCraftedItem(generator: RandomItemGenerator, craft: PendingCraft) {
  const player = craft.player;
  if (player.IsNull() || !player.IsInWorld()) return;

  const crafted = findCraftedItem(craft);
  // The craft failed, or the item went somewhere unusual (it's left alone then).
  if (!crafted) return;

  const template = crafted.GetTemplate();
  const enchanted = generator.createEnchantedItemFromItem(
    template,
    LootSource.bonusesForCrafting(),
    player
  );
  if (!enchanted) return;

  const creator = crafted.GetCoreUInt64(ITEM_FIELD_CREATOR);
  player.SendItemQueryPacket(enchanted);

  // Add the enchanted copy first. If the bags are full that fails; removing the crafted item then frees
  // its slot for a second try.
  let replacement = player.AddItem(enchanted.GetEntry(), 1);
  player.RemoveItem(crafted, 1);
  if (!isRealItem(replacement)) replacement = player.AddItem(enchanted.GetEntry(), 1);

  if (!isRealItem(replacement)) {
    // Should never happen, but never leave the player without the item they crafted.
    console.error(
      `${LIB_NAME}: Could not give ${player.GetName()} the enchanted ${enchanted.GetName()} (${enchanted.GetEntry()}) for their crafted ${template.GetName()}. Giving the plain item back.`
    );
    player.AddItem(template.GetEntry(), 1);
    return;
  }

  // Keep "Made by <crafter>".
  if (creator != 0) replacement.SetCoreUInt64(ITEM_FIELD_CREATOR, creator);
  console.log(
    `${LIB_NAME}: Crafted ${template.GetName()} for ${player.GetName()} became ${enchanted.GetName()} (${enchanted.GetEntry()}).`
  );
}
