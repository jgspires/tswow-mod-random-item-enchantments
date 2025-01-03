import { Item, Random, Creature } from "../lily-common/src";
import { MinHeap } from "../lily-common/src/data-structures";
import { StatUtils } from "./components";
import { CustomStat } from "./components/types";
import { EnchantManager } from "./EnchantManager";
import {
  enchantRollSettings,
  PERFECT_ITEM_PREFIX,
  enchantNames,
  qualityRollSettings,
  creatureRankBonuses,
} from "./settings";
import { EnchantmentRollSettings } from "./settings/types";

export class RandomItemGenerator {
  enchantManager: EnchantManager;
  freeIDs: MinHeap;
  usedIDs: Set<number>;
  maxID: number;
  itemQualitySettings: Map<Item.Quality, EnchantmentRollSettings>;

  static ITEM_CREATION_ID_START = 100000;

  constructor() {
    this.maxID = RandomItemGenerator.ITEM_CREATION_ID_START - 1;
    this.enchantManager = new EnchantManager();
    this.freeIDs = new MinHeap();
    this.usedIDs = new Set<number>();
    this.itemQualitySettings = enchantRollSettings;
    this.setupAndCleanIDs();
    this.cleanUpItems();
  }

  /**
   * Generates a custom `ItemTemplate` using an existing `ItemTemplate` as parent to clone from.
   * Generated `ItemTemplate` will be an "enchanted" version of the one provided as parameter.
   *
   * Note: "enchantments" here refer to stat boosts added to the `ItemTemplate` by this addon, not actual `Enchantments`.
   */
  createEnchantedItemFromItem(
    existingTemp: TSItemTemplate,
    creature: TSCreature
  ): TSItemTemplate | undefined {
    const newId = this.getLowestFreeID();
    const newTemplate = CreateItemTemplate(newId, existingTemp.GetEntry());

    const quality = this.rollForQuality(existingTemp, creature);
    newTemplate.SetQuality(quality);

    console.log(
      `createEnchantedItemFromItem: Item ${existingTemp.GetName()}: Item class = ${existingTemp.GetClass()}, Item subclass = ${existingTemp.GetSubClass()}`
    );
    if (this.attemptToGenEnchantments(newTemplate, creature) == 0) {
      console.log(
        `createEnchantedItemFromItem: No enchantments added to item ${newTemplate.GetName()}.`
      );
      return undefined;
    }

    console.log(
      `createEnchantedItemFromItem: NewTemplate entry = ${newTemplate.GetEntry()}. Name = ${newTemplate.GetName()}`
    );
    this.createNewId();
    newTemplate.SetMaterial(existingTemp.GetMaterial());
    newTemplate.Save();
    return newTemplate;
  }

  /**
   * Randomly chooses enchantments, applies them to the template, and sets the item name accordingly.
   *
   * @param item `ItemTemplate` to which the enchantments and name will be applied.
   * @returns `number` - The amount of successfully added enchantments.
   */
  private attemptToGenEnchantments(item: TSItemTemplate, creature: TSCreature): number {
    const enchantGenResult = this.enchantManager.generateEnchantments(item, creature);
    const enchantsToAdd = enchantGenResult.enchantments;

    if (enchantsToAdd.length == 0) return 0;

    const freeEnchantSlots = StatUtils.MAX_ITEM_STATS - item.GetStatsCount();

    // This should never happen. But if it ever does, the implementation must be updated so that all rolled enchantments must match the existing ones.
    // So enchantments are not rolled and lost...
    if (freeEnchantSlots == 0) {
      console.log(
        `attemptToGenEnchantments: Item ${item.GetName()} already has ${
          StatUtils.MAX_ITEM_STATS
        } stats. Cannot add more. Only existing stats will be modified.`
      );
    }

    if (freeEnchantSlots < enchantsToAdd.length) {
      console.log(
        `attemptToGenEnchantments: Item ${item.GetName()} has ${freeEnchantSlots} free slots, but ${
          enchantsToAdd.length
        } enchantments were rolled. ${
          enchantsToAdd.length - freeEnchantSlots
        } enchantment(s) will be potentially not applied. If it is an existing one its value will be incremented.`
      );
    }

    const successfulEnchants: CustomStat[] = this.addOrUpdateCustomStats(
      item,
      enchantsToAdd
    );

    if (successfulEnchants.length > 0)
      item.SetName(
        this.composeItemName(item, successfulEnchants, enchantGenResult.isPerfect)
      );

    if (successfulEnchants.length < enchantsToAdd.length)
      console.warn(
        `attemptToGenEnchantments: Could not add all enchantments to item with template of entry ${item.GetEntry()} (${item.GetName()}).
        Total rolled enchantments were ${enchantsToAdd.length}. Added enchantments: ${
          successfulEnchants.length
        }`
      );

    return successfulEnchants.length;
  }

  /**
   * Adds or updates the custom stats (enchantments) of the item.
   *
   * @param item `ItemTemplate` to which the stats will be added or updated.
   * @param customStats The custom stats to be added or updated on the item.
   * @returns `CustomStat[]` - The custom stats that were successfully added or updated.
   */
  private addOrUpdateCustomStats(
    item: TSItemTemplate,
    customStats: CustomStat[]
  ): CustomStat[] {
    console.log("addOrUpdateCustomStats: Starting...");
    const addedStats: CustomStat[] = [];
    for (const customStat of customStats) {
      const addedStatOrUndef = StatUtils.addOrUpdateStat(item, customStat);
      if (addedStatOrUndef) {
        console.log(
          `addOrUpdateCustomStats: Sucessfully added or updated stat ${
            customStat.stat
          } with value of ${customStat.value} to item ${item.GetName()}.`
        );
        addedStats.push(addedStatOrUndef);
      } else
        console.warn(
          `addOrUpdateCustomStats: Could not add stat ${
            customStat.stat
          } to item ${item.GetName()}.`
        );
    }
    return addedStats;
  }

  /**
   * Composes the final name of the item with the enchantments.
   *
   * @param item `ItemTemplate` to which the enchantments and name will be applied.
   * @param enchantments The custom stats (enchantments) to be added to the item's name.
   * @param isPerfect `boolean` - Whether the item is perfect or not (adds a special prefix if so).
   * @param prefixesOnly `boolean` - Whether to only use prefixes in the name.
   * @returns `string` - The final name of the item.
   */
  private composeItemName(
    item: TSItemTemplate,
    enchantments: CustomStat[],
    isPerfect: boolean = false,
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

    if (isPerfect) finalName = `${PERFECT_ITEM_PREFIX} ${finalName}`;

    console.log(
      `Added ${
        enchantments.length
      } enchantments to ${item.GetName()}! Final item name returned = ${finalName}.`
    );
    return finalName;
  }

  private getRandomAffixName(stat: number, suffix: boolean = false): string {
    if (!suffix) {
      const prefixIndex = Random.getRandomInt(0, enchantNames[stat].prefixes.length - 1);
      return enchantNames[stat].prefixes[prefixIndex];
    } else {
      const suffixIndex = Random.getRandomInt(0, enchantNames[stat].suffixes.length - 1);
      return enchantNames[stat].suffixes[suffixIndex];
    }
  }

  /**
   * Potentially improves the quality of the item, up to Legendary.
   * Creatures of higher rank have a higher chance of getting better quality items.
   *
   * Becomes increasingly more difficult the higher the item's quality is.
   */
  private rollForQuality(template: TSItemTemplate, creature: TSCreature): Item.Quality {
    let itemQuality = template.GetQuality();
    // Legendaries, artifacts, and heirlooms keep their rarity.
    if (itemQuality >= Item.Quality.LEGENDARY) return itemQuality;

    console.log("rollForQuality: starting...");

    const creatureTemplate = creature.GetTemplate();
    const rollMultiplier = this.qualityRollMultiplierForRank(creatureTemplate.GetRank());

    console.log(
      `rollForQuality: Creature rank = ${creatureTemplate.GetRank()}. Rank Roll multiplier = ${rollMultiplier}`
    );

    let roll = Random.getRandomChance();
    console.log(`rollForQuality: Base Roll = ${roll}`);

    let neededRoll =
      qualityRollSettings.minRollForRarityUptier +
      itemQuality * qualityRollSettings.addMinRollPerRarity;

    roll = Math.round(roll * rollMultiplier);

    console.log(
      `rollForQuality: Final Roll = ${roll}. Roll multiplier = ${rollMultiplier}. Needed Roll = ${neededRoll}. Current Quality = ${itemQuality}`
    );

    while (roll >= neededRoll && itemQuality < Item.Quality.LEGENDARY) {
      console.log(
        `rollForQuality: Roll successful! Quality upgraded from current Quality = ${itemQuality} to ${
          itemQuality + 1
        }`
      );
      itemQuality++;
      neededRoll += qualityRollSettings.addMinRollPerRarity;
      roll = Random.getRandomChance();

      roll = Math.round(roll * rollMultiplier);
      console.log(
        `rollForQuality: Roll = ${roll}. Roll multiplier = ${rollMultiplier}. Needed Roll = ${neededRoll}`
      );
    }

    return itemQuality;
  }

  /**
   * Returns the quality roll multiplier for the creature's rank.
   * @param creatureRank creature rank for which to get the multiplier.
   * @returns `number` - The quality roll multiplier.
   */
  private qualityRollMultiplierForRank(creatureRank: Creature.Rank): number {
    return creatureRankBonuses.get(creatureRank)?.qualityRollMultiplier || 1;
  }

  // Gets the lowest free ID and increments (creates) the new ID
  private createNewId(): number {
    let newID: number;

    if (!this.freeIDs.isEmpty()) {
      console.log("createNewId: Free IDs heap not empty. Reusing free ID...");
      newID = this.freeIDs.pop(); // Reuse the lowest free ID
      console.log("createNewId: Reused free ID = " + newID);
    } else {
      console.log(
        "createNewId: Free IDs heap empty. Creating new ID from current maxID..."
      );
      newID = this.maxID + 1;
      console.log("createNewId: New ID = " + newID);
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

  private setupAndCleanIDs() {
    let q = QueryCharacters("SELECT MAX(entry) FROM custom_item_template");

    if (q.GetRow()) {
      const rowID = q.GetUInt32(0);
      if (rowID > RandomItemGenerator.ITEM_CREATION_ID_START) this.maxID = rowID;
    }
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

    console.log(`setupAndCleanIDs: Ids in Use length = ${idsInUse.size}`);

    for (let i = RandomItemGenerator.ITEM_CREATION_ID_START; i <= this.maxID; i++) {
      if (!idsInUse.has(i)) {
        console.log(`setupAndCleanIDs: Reclaiming unused id ${i}`);
        this.freeIDs.push(i);
      }
    }
  }
}
