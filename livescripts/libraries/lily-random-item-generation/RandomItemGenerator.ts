import { Item, Random } from "../lily-common/src";
import { Logger } from "../lily-common/src/utils";
import { StatUtils } from "./components";
import { CustomStat } from "./components/types";
import { EnchantManager } from "./EnchantManager";
import { LootSource } from "./LootSource";
import {
  enchantRollSettings,
  PERFECT_ITEM_PREFIX,
  enchantAffixNames,
  qualityUptierSettings,
} from "./settings";
import { EnchantmentRollSettings } from "./settings/types";
import { StatPool } from "./StatPool";

export class RandomItemGenerator {
  enchantManager: EnchantManager;
  /**
   * Highest item template ID ever handed out. IDs only ever go up and are never reused:
   * a reused ID can show a stale name and stats from the client's item cache.
   */
  lastID: number;
  itemQualitySettings: Map<Item.Quality, EnchantmentRollSettings>;

  private logger: Logger;

  static ITEM_CREATION_ID_START = 100000;
  /** `item_instance.itemEntry` is a MEDIUMINT UNSIGNED, so no item can use an entry above this. */
  static ITEM_ENTRY_MAX = 16777215;
  /** Small key/value table (characters DB) that persists `lastID` across restarts and livescript reloads. */
  static STATE_TABLE = "lily_rie_state";
  static LAST_ID_SETTING = "last_item_id";

  constructor() {
    this.enchantManager = new EnchantManager();
    this.itemQualitySettings = enchantRollSettings;
    this.logger = new Logger("RandomItemGenerator");
    this.lastID = this.loadLastID();
  }

  /**
   * Generates a custom `ItemTemplate` using an existing `ItemTemplate` as parent to clone from.
   * Generated `ItemTemplate` will be an "enchanted" version of the one provided as parameter.
   *
   * Note: "enchantments" here refer to stat boosts added to the `ItemTemplate` by this addon, not actual `Enchantments`.
   *
   * @param looter the player the loot is for, if any. Stats lean towards their class, or a group member's.
   */
  createEnchantedItemFromItem(
    existingTemp: TSItemTemplate,
    creature: TSCreature,
    looter?: TSPlayer
  ): TSItemTemplate | undefined {
    const newId = this.lastID + 1;
    if (newId > RandomItemGenerator.ITEM_ENTRY_MAX) {
      this.logger.error(
        `createEnchantedItemFromItem: Item ID space exhausted (next ID ${newId} > ${RandomItemGenerator.ITEM_ENTRY_MAX}). Dropping the base item unchanged.`
      );
      return undefined;
    }
    // CreateItemTemplate overwrites whatever template is in memory at `newId` with a fresh copy of the parent,
    // so if this attempt rolls no enchantments, the next attempt can safely reuse the same (still unsaved) ID.
    const newTemplate = CreateItemTemplate(newId, existingTemp.GetEntry());

    const quality = this.rollForQuality(existingTemp, creature);
    newTemplate.SetQuality(quality);

    console.log(
      `createEnchantedItemFromItem: Item ${existingTemp.GetName()}: Item class = ${
        Item.Class[existingTemp.GetClass()]
      }, Item subclass = ${existingTemp.GetSubClass()}`
    );
    const classToRollFor = StatPool.pickClassToRollFor(
      existingTemp,
      StatPool.categoryFor(existingTemp),
      looter
    );
    this.logger.debug(
      `createEnchantedItemFromItem: Rolling stats for class ${
        classToRollFor === undefined ? "none (item type only)" : classToRollFor
      }.`
    );
    if (this.attemptToGenEnchantments(newTemplate, creature, classToRollFor) == 0) {
      console.log(
        `createEnchantedItemFromItem: No enchantments added to item ${newTemplate.GetName()}.`
      );
      return undefined;
    }

    console.log(
      `createEnchantedItemFromItem: NewTemplate entry = ${newTemplate.GetEntry()}. Name = ${newTemplate.GetName()}`
    );
    this.commitID(newId);
    newTemplate.SetMaterial(existingTemp.GetMaterial());
    newTemplate.Save();
    return newTemplate;
  }

  /**
   * Randomly chooses enchantments, applies them to the template, and sets the item name accordingly.
   *
   * @param item `ItemTemplate` to which the enchantments and name will be applied.
   * @param classToRollFor class whose stat weights to use, or `undefined` for item-type affinities only.
   * @returns `number` - The amount of successfully added enchantments.
   */
  private attemptToGenEnchantments(
    item: TSItemTemplate,
    creature: TSCreature,
    classToRollFor?: number
  ): number {
    const enchantGenResult = this.enchantManager.generateEnchantments(
      item,
      creature,
      classToRollFor
    );
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
        addedStats.push(addedStatOrUndef);
        console.log(
          `addOrUpdateCustomStats: Sucessfully added or updated stat ${
            Item.Stat[customStat.stat]
          }. Value = ${customStat.value}. to item ${item.GetName()}.`
        );
      } else
        console.warn(
          `addOrUpdateCustomStats: Could not add stat ${Item.Stat[customStat.stat]} (${
            customStat.stat
          }) to item ${item.GetName()}.`
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
      return isPerfect ? `${PERFECT_ITEM_PREFIX} ${finalName}` : finalName;
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
      const prefixIndex = Random.getRandomInt(
        0,
        enchantAffixNames[stat].prefixes.length - 1
      );
      return enchantAffixNames[stat].prefixes[prefixIndex];
    } else {
      const suffixIndex = Random.getRandomInt(
        0,
        enchantAffixNames[stat].suffixes.length - 1
      );
      return enchantAffixNames[stat].suffixes[suffixIndex];
    }
  }

  /**
   * Potentially improves the quality of the item, up to Legendary.
   * Creatures of higher rank have a higher chance of getting better quality items. Dungeon bosses roll
   * with the boss bonuses, and other dungeon creatures can get extra bonuses (see `dungeonLootSettings`).
   *
   * Becomes increasingly more difficult the higher the item's quality is.
   */
  private rollForQuality(template: TSItemTemplate, creature: TSCreature): Item.Quality {
    let itemQuality = template.GetQuality();
    // Legendaries, artifacts, and heirlooms keep their rarity.
    if (itemQuality >= Item.Quality.LEGENDARY) return itemQuality;

    this.logger.debug("rollForQuality: starting...");

    const creatureTemplate = creature.GetTemplate();
    const rollMultiplier = LootSource.bonusesFor(creature).qualityRollMultiplier;

    this.logger.debug(
      `rollForQuality: Creature rank = ${creatureTemplate.GetRank()}. Roll multiplier (rank and dungeon bonuses) = ${rollMultiplier}`
    );

    let roll = Random.getRandomChance();
    this.logger.debug(`rollForQuality: Base Roll = ${roll}`);

    let neededRoll =
      qualityUptierSettings.minRollForRarityUptier +
      itemQuality * qualityUptierSettings.addMinRollPerRarity;

    roll = Math.round(roll * rollMultiplier);

    this.logger.debug(
      `rollForQuality: Final Roll = ${roll}. Roll multiplier = ${rollMultiplier}. Needed Roll = ${neededRoll}. Current Quality = ${itemQuality}`
    );

    while (roll >= neededRoll && itemQuality < Item.Quality.LEGENDARY) {
      this.logger.debug(
        `rollForQuality: Roll successful! Quality upgraded from current Quality = ${itemQuality} to ${
          itemQuality + 1
        }`
      );
      itemQuality++;
      neededRoll += qualityUptierSettings.addMinRollPerRarity;
      roll = Random.getRandomChance();

      roll = Math.round(roll * rollMultiplier);
      this.logger.debug(
        `rollForQuality: Roll = ${roll}. Roll multiplier = ${rollMultiplier}. Needed Roll = ${neededRoll}`
      );
    }

    return itemQuality;
  }

  /**
   * Works out the highest ID handed out so far, so new IDs always continue above it.
   *
   * Takes the highest of: the persisted counter, any saved template in our range, and any world
   * `item_template` in our range. The last one guards against colliding with items created elsewhere
   * (e.g. datascripts), because `CreateItemTemplate` would silently overwrite that item's template.
   */
  private loadLastID(): number {
    const start = RandomItemGenerator.ITEM_CREATION_ID_START;
    const table = RandomItemGenerator.STATE_TABLE;
    let last = start - 1;

    QueryCharacters(
      `CREATE TABLE IF NOT EXISTS ${table} (setting VARCHAR(64) NOT NULL PRIMARY KEY, num INT UNSIGNED NOT NULL)`
    );

    const stored = QueryCharacters(
      `SELECT num FROM ${table} WHERE setting = '${RandomItemGenerator.LAST_ID_SETTING}'`
    );
    if (stored.GetRow()) last = Math.max(last, stored.GetUInt32(0));

    const saved = QueryCharacters(
      `SELECT MAX(entry) FROM custom_item_template WHERE entry >= ${start}`
    );
    if (saved.GetRow()) last = Math.max(last, saved.GetUInt32(0));

    const world = QueryWorld(`SELECT MAX(entry) FROM item_template WHERE entry >= ${start}`);
    if (world.GetRow()) {
      const worldMax = world.GetUInt32(0);
      if (worldMax > last) {
        this.logger.warn(
          `loadLastID: World item_template already uses IDs up to ${worldMax}. Generated items will start above it.`
        );
        last = worldMax;
      }
    }

    this.persistLastID(last);
    this.logger.info(`loadLastID: Next generated item ID will be ${last + 1}.`);
    return last;
  }

  /** Marks `id` as used. Called only once a generated template is actually kept. */
  private commitID(id: number): void {
    this.lastID = id;
    this.persistLastID(id);
  }

  private persistLastID(id: number): void {
    QueryCharacters(
      `INSERT INTO ${RandomItemGenerator.STATE_TABLE} (setting, num) VALUES ('${RandomItemGenerator.LAST_ID_SETTING}', ${id}) ` +
        `ON DUPLICATE KEY UPDATE num = GREATEST(num, ${id})`
    );
  }

  /**
   * Deletes saved templates that no item uses any more, so `custom_item_template` doesn't grow forever.
   *
   * `item_instance` holds every persisted item (inventories, banks, mail, auctions and guild banks),
   * `character_gifts` holds the original entry of gift-wrapped items, and `item_loot_items` holds loot
   * stored inside items. Only module-generated templates (IDs from `ITEM_CREATION_ID_START`) are touched.
   *
   * Only call this at server startup (`World.OnStartup`), never on a livescript reload: while players are
   * online, freshly looted items may not be saved to `item_instance` yet, and their templates would be deleted.
   */
  cleanUpUnusedTemplates(): void {
    QueryCharacters(
      `DELETE FROM custom_item_template WHERE entry >= ${RandomItemGenerator.ITEM_CREATION_ID_START} ` +
        "AND entry NOT IN (SELECT itemEntry FROM item_instance) " +
        "AND entry NOT IN (SELECT entry FROM character_gifts) " +
        "AND entry NOT IN (SELECT item_id FROM item_loot_items)"
    );
    this.logger.info(
      "cleanUpUnusedTemplates: Removed saved templates that no item uses any more."
    );
  }
}
