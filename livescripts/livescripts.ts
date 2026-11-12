import { Item } from "./libraries/lily-common/src";
import { RandomItemGenerator, LIB_NAME, LootSource } from "./libraries/lily-random-item-generation";
import { EnchantPointCurve, ItemBudget } from "./libraries/lily-random-item-generation/components/";
import { registerCraftingEnchantments } from "./Crafting";

const randomItemGenerator = new RandomItemGenerator();

export function Main(events: TSEvents) {
  console.log(`${LIB_NAME}: Livescripts started!`);
  EnchantPointCurve.generatePointCurve();
  // Item stat budgets exported by this module's datascripts (falls back to the point curve if missing).
  ItemBudget.load();

  events.Player.OnLogin(SendModuleStartMessage);

  // Fires once per server boot, but not again on livescript reloads, which is when cleanup could be unsafe.
  events.World.OnStartup(() => randomItemGenerator.cleanUpUnusedTemplates());

  events.Creature.OnGenerateLoot((creature, player) => {
    const loot = creature.GetLoot();
    for (let i = 0; i < loot.GetItemCount(); i++) {
      const currentLootItem = loot.GetItem(i);
      rollEnchantedItemFromLoot(currentLootItem, creature, player);
    }
  });

  // Crafted equipment (see Crafting.ts and craftingSettings). Shares the generator, so item IDs stay unique.
  registerCraftingEnchantments(events, randomItemGenerator);
}

function rollEnchantedItemFromLoot(
  lootItem: TSLootItem,
  creature: TSCreature,
  player?: TSPlayer
) {
  const itemTemplate = lootItem.GetTemplate();
  if (
    itemTemplate.GetClass() == Item.Class.ITEM_CLASS_ARMOR ||
    itemTemplate.GetClass() == Item.Class.ITEM_CLASS_WEAPON
  ) {
    console.log(
      `rollEnchantedItemFromLoot: Found equipment ${itemTemplate.GetName()}, will attempt to generate enchantments.`
    );
    const newItem = randomItemGenerator.createEnchantedItemFromItem(
      itemTemplate,
      LootSource.bonusesFor(creature),
      player
    );

    if (newItem) {
      lootItem.SetItemID(newItem.GetEntry());
      player?.SendItemQueryPacket(newItem);
      console.log(
        `rollEnchantedItemFromLoot: Replaced loot item ${itemTemplate.GetName()} with newly created item (${newItem.GetName()})!`
      );
    } else {
      console.log(
        `rollEnchantedItemFromLoot: No enchantments added to item ${itemTemplate.GetName()}. Skipping...`
      );
    }
    console.log("rollEnchantedItemFromLoot: Finished attempt at item stat enchantment.");
    console.log("--------------------------------------------");
  }
}

function SendModuleStartMessage(player: TSPlayer, firstLogin: bool) {
  player.SendBroadcastMessage(`This server runs Lily's Random Item Enchantments module.`);
}
