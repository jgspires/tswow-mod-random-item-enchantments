export function Main(events: TSEvents) {
  console.log("Random Item Enchantments Livescripts started!");
  EnchantPointCurve.generatePointCurve();
  EnchantPointCurve.printPointCurve();
  const randomItemGenerator = new RandomItemGenerator();

  events.Player.OnLogin(SendModuleStartMessage);

  events.Creature.OnGenerateLoot((creature, player) => {
    const loot = creature.GetLoot();
    for (let i = 0; i < loot.GetItemCount(); i++) {
      const currentLootItem = loot.GetItem(i);
      const itemTemplate = currentLootItem.GetTemplate();
      if (
        itemTemplate.GetClass() == Lily.Item.Class.ITEM_CLASS_ARMOR ||
        itemTemplate.GetClass() == Lily.Item.Class.ITEM_CLASS_WEAPON
      ) {
        console.log(
          `Found equipment ${itemTemplate.GetName()}, will attempt to generate enchantments.`
        );
        const newItem = randomItemGenerator.createEnchantedItemFromItem(itemTemplate);
        console.log(`newItem = ${newItem}`);

        if (newItem == undefined) {
          console.log("No enchantment added to item");
        } else {
          currentLootItem.SetItemID(newItem.GetEntry());
          player?.SendItemQueryPacket(newItem);
          console.log("Replaced loot item with newly created item!");
        }
      }
    }
  });
}

function SendModuleStartMessage(player: TSPlayer, firstLogin: bool) {
  player.SendBroadcastMessage("This server runs Lily's Random Item Enchantments module.");
}
