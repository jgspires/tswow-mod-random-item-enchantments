const random = Lily.Random;
const itemUtils = Lily.Item;

class RandomItemGenerator {
  usedIDs: Set<number>;
  freeIDs: MinHeap;
  maxID: number;
  itemQualitySettings: Map<Lily.Item.Quality, EnchantRollSettings>;

  static ITEM_CREATION_ID_START = 100000;
  static MIN_ROLL_FOR_RARITY_UPTIER = 75;

  constructor() {
    this.maxID = RandomItemGenerator.ITEM_CREATION_ID_START - 1;
    this.freeIDs = new MinHeap();
    this.usedIDs = new Set<number>();
    this.itemQualitySettings = enchantRollSettings;
    this.cleanUpItems();
  }

  /**
   * Generates a custom `ItemTemplate` using an existing `ItemTemplate` as parent to clone from.
   * Generated `ItemTemplate` will be an "enchanted" version of the one provided as parameter.
   *
   * Note: "enchantments" here refer to stat boosts added to the `ItemTemplate`, not actual `Enchantments`.
   */
  createEnchantedItemFromItem(existingTemp: TSItemTemplate): TSItemTemplate | undefined {
    const newId = this.createNewId();
    const newTemplate = CreateItemTemplate(newId, existingTemp.GetEntry());

    const quality = this.rollForQuality(existingTemp);
    newTemplate.SetQuality(quality);

    if (this.pickAndSetupEnchantments(newTemplate) == 0) return undefined;
    console.log(
      `NewTemplate entry = ${newTemplate.GetEntry()}. Name = ${newTemplate.GetName()}`
    );
    console.log(
      `InventoryType: old: ${existingTemp.GetInventoryType()}. New: ${newTemplate.GetInventoryType()}`
    );
    newTemplate.Save();
    return newTemplate;
  }

  /**
   * Randomly chooses enchantments, applies them to the template, and sets the item name accordingly.
   *
   * @param item `ItemTemplate` to which the enchantments and name will be applied.
   * @returns `number` - The amount of successfully added enchantments.
   */
  private pickAndSetupEnchantments(item: TSItemTemplate): number {
    const enchantsToAdd = EnchantManager.generateEnchantments(item);
    console.log(`EnchantsToAdd length = ${enchantsToAdd.length}`);
    if (enchantsToAdd.length == 0) return 0;
    console.log("Past enchantsToAdd length check!");

    const successfulEnchants: CustomEnchantment[] = [];
    for (let i = 0; i < 10; i++) {
      if (item.GetStatValue(i) == 0.0) {
        console.log(`Setting stat ${i}...`);
        const current = successfulEnchants.length;
        console.log(`Current = ${current}`);
        console.log(`Current Enchant Stat = ${enchantsToAdd[current].stat}`);
        console.log(`Current Enchant Value = ${enchantsToAdd[current].value}`);
        item.SetStatType(i, enchantsToAdd[current].stat);
        item.SetStatValue(i, enchantsToAdd[current].value);
        item.SetStatsCount(item.GetStatsCount() + 1);
        console.log(`Current Enchant Stat = ${enchantsToAdd[current].stat}`);
        console.log(`Current Enchant Value = ${enchantsToAdd[current].value}`);
        successfulEnchants.push(enchantsToAdd[current]);
        if (successfulEnchants.length >= enchantsToAdd.length) break;
      }
    }

    if (successfulEnchants.length > 0)
      item.SetName(this.composeItemName(item, successfulEnchants));

    if (successfulEnchants.length < enchantsToAdd.length)
      console.warn(
        `Could not add all enchantments to item with template of entry ${item.GetEntry()} (${item.GetName()}).
        Total rolled enchantments were ${enchantsToAdd.length}. Added enchantments: ${
          successfulEnchants.length
        }`
      );

    return successfulEnchants.length;
  }

  private composeItemName(
    item: TSItemTemplate,
    enchantments: CustomEnchantment[],
    prefixesOnly: boolean = false
  ): string {
    let finalName: string = "";
    // If only 1 affix, make it a prefix.
    if (enchantments.length == 1) {
      const affixName = this.getRandomAffixName(enchantments[0].stat);
      finalName += `${affixName} ${item.GetName()}`;
      return finalName;
    }

    for (let i = 0; i < enchantments.length; i++) {
      // Last enchantment is a suffix
      if (i == enchantments.length - 1 && !prefixesOnly) {
        const affixName = this.getRandomAffixName(enchantments[i].stat, true);
        finalName += `${item.GetName()} ${affixName}`;
      } else {
        const affixName = this.getRandomAffixName(enchantments[i].stat);
        finalName += `${affixName} `;
      }
    }

    if (prefixesOnly) finalName += item.GetName();

    return finalName;
  }

  private getRandomAffixName(stat: number, suffix: boolean = false): string {
    if (!suffix) {
      const prefixIndex = Lily.Random.getRandomInt(
        0,
        enchantNames[stat].prefixes.length - 1
      );
      return enchantNames[stat].prefixes[prefixIndex];
    } else {
      const suffixIndex = Lily.Random.getRandomInt(
        0,
        enchantNames[stat].suffixes.length - 1
      );
      return enchantNames[stat].suffixes[suffixIndex];
    }
  }

  /**
   * Potentially improves the quality of the item, up to Legendary.
   *
   * Becomes increasingly more difficult the higher the item's quality is.
   */
  private rollForQuality(template: TSItemTemplate): Lily.Item.Quality {
    let itemQuality = template.GetQuality();
    // Legendaries, artifacts, and heirlooms keep their rarity.
    if (itemQuality >= itemUtils.Quality.LEGENDARY) return itemQuality;

    let roll = random.getRandomChance();
    let neededRoll =
      qualityRollSettings.minRollForRarityUptier +
      itemQuality * qualityRollSettings.addMinRollPerRarity;
    while (roll >= neededRoll && itemQuality != itemUtils.Quality.LEGENDARY) {
      itemQuality++;
      neededRoll += qualityRollSettings.addMinRollPerRarity;
      roll = random.getRandomChance();
    }

    return itemQuality;
  }

  // Gets the lowest free ID and increments (creates) the new ID
  private createNewId(): number {
    let newID: number;

    if (!this.freeIDs.isEmpty()) {
      newID = this.freeIDs.pop(); // Reuse the lowest free ID
    } else {
      newID = this.maxID + 1;
      this.maxID = newID;
    }

    this.usedIDs.add(newID);
    return newID;
  }

  // Gets the lowest free ID without creating a new one
  private getLowestFreeID(): number {
    if (!this.freeIDs.isEmpty()) {
      return this.freeIDs.peek();
    }
    return this.maxID + 1;
  }

  // Fetches ALL IDs >= ITEM_CREATION_ID_START currently in use by the DB.
  private getIDsInUseFromDB(): number[] {
    const idsInUse: number[] = [];
    let res = QueryCharacters("SELECT entry FROM custom_item_template");

    while (res.GetRow()) {
      idsInUse.push(res.GetUInt32(0));
    }

    return idsInUse;
  }

  // Removes unused custom ItemTemplates from the DB and frees their IDs
  private cleanUpItems(): void {
    QueryCharacters(
      "DELETE FROM item_instance WHERE guid NOT IN ( SELECT item FROM character_inventory);"
    );
    QueryCharacters(
      "DELETE FROM custom_item_template WHERE entry NOT IN ( SELECT itemEntry FROM item_instance)"
    );

    const idsInUse = new Set(this.getIDsInUseFromDB());
    const idsToReclaim: number[] = [];

    // Iterate through used IDs
    this.usedIDs.forEach((id) => {
      if (!idsInUse.has(id)) {
        // Tag for deletion
        idsToReclaim.push(id);
      }
    });

    // Process deletions
    idsToReclaim.forEach((id) => {
      this.usedIDs.delete(id);
      this.freeIDs.push(id);
    });
  }
}
