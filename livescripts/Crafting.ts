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
 *  Uses the Spell.OnCreateItem event (added to tswow-core and Spell::DoCreateItem in Lily's fork).
 *  It fires just before a spell stores a newly created item, with the item ID still changeable. So the
 *  craft itself is untouched (reagents, bag checks, "Made by", the "You create" message, skill-ups):
 *  the item is rolled like a drop, using `craftingSettings` instead of a creature's bonuses, and if it
 *  gets enchantments, the enchanted copy is created in its place.
 *
 *  Spells other than crafting can create equipment too (a few quest and item spells); those roll as well.
 */

export function registerCraftingEnchantments(events: TSEvents, generator: RandomItemGenerator) {
  events.Spell.OnCreateItem((spell, player, itemId) => {
    if (!craftingSettings.enabled) return;

    const template = GetItemTemplate(itemId.get());
    if (!template || !isEquipment(template)) return;

    const enchanted = generator.createEnchantedItemFromItem(
      template,
      LootSource.bonusesForCrafting(),
      player
    );
    if (!enchanted) return;

    // Before the "You create" message, so the client already knows the new item's name and stats.
    player.SendItemQueryPacket(enchanted);
    itemId.set(enchanted.GetEntry());
    console.log(
      `${LIB_NAME}: ${player.GetName()} crafted ${template.GetName()}; created ${enchanted.GetName()} (${enchanted.GetEntry()}) instead.`
    );
  });
}

function isEquipment(template: TSItemTemplate): boolean {
  return (
    template.GetClass() == Item.Class.ITEM_CLASS_ARMOR ||
    template.GetClass() == Item.Class.ITEM_CLASS_WEAPON
  );
}
