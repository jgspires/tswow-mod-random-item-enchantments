import { Stat } from "wow/wotlk/std/Item/ItemStats";
import { IEnchantmentGenerator } from "../contracts/IEnchantmentGenerator";
import { EnumUtils } from "../../utils/EnumToString";
import { std } from "wow/wotlk";
import { EnchantmentGeneration as EG } from "../Defines";
import { GeneratorOptions } from "../contracts/components/GeneratorOptions";
import { StatEffects } from "../contracts/components/StatEffects";
import { SpellItemEnchantmentRow } from "wow/wotlk/dbc/SpellItemEnchantment";

export let currentEnchantId = EG.SharedDefines.ENCHANT_LEVEL_ID_START + 1;

export abstract class EnchantGenerator implements IEnchantmentGenerator {
  namingSchema: string;
  maxEnchantmentLevel: number;
  parentEnchantID: number;
  statEffects: StatEffects[];

  constructor(options: GeneratorOptions) {
    const {
      statEffects,
      namingSchema = EG.Defines.DEFAULT_NAMING_SCHEMA,
      maxEnchantmentLevel = EG.SharedDefines.MAX_ENCHANT_LEVEL,
      parentEnchantID = EG.Defines.DEFAULT_PARENT_ENCHANT_ID,
    } = options;

    this.statEffects = statEffects;
    this.namingSchema = namingSchema;
    this.maxEnchantmentLevel = maxEnchantmentLevel;
    this.parentEnchantID = parentEnchantID;
  }

  /**
   * Generates one `Enchantment` per level until `maxLevel` for `stats` in the generator's
   * stat list.
   *
   * Follows the generator's settings, such as `namingSchema` and `parentEnchantID`.
   *
   */
  public generate(): void {
    for (const statEffects of this.statEffects) {
      this.generateEnchantmentLevels(statEffects);
    }
  }

  protected generateEnchantmentLevels(statEffects: StatEffects): void {
    for (let level = 1; level <= this.maxEnchantmentLevel; level++) {
      const newEnchant = this.createEnchantmentLevelForStat(statEffects, level);

      console.log(`Added Enchant: ${newEnchant.Name.enGB.get()}!`);
    }
  }

  /**
   * Calculates the effect value for a given `enchantlevel`.
   *
   * Effect value is the amount by which an enchantment does something.
   * Such as how much it boosts a given stat.
   *
   * @param level - Level of the enchantment for which the total effect value will be calculated.
   * @returns `number` of resulting effect value for the provided `enchantLevel`.
   */
  protected calculateEffectValueForLevel(level: number): number {
    return 1 * level;
  }

  /**
   * Creates 1 `Enchantment` with ID respective for the given `level` and `stat` provided.
   *
   * The `Enchantment` increases `stat` and uses `parentEnchantId` enchantment as a base.
   * The stats improved by the enchantment equal `statsPerLevel * level`.
   * The Enchantment `name` is defined by the `namingSchema` used.
   *
   * @returns The newly created `Enchantment`
   */
  protected createEnchantmentLevelForStat(
    statEffects: StatEffects,
    level: number
  ): SpellItemEnchantmentRow {
    const enchantIdName = EnumUtils.getEnumKeyByValue(Stat, statEffects.stat);
    const enchantStatValue = this.calculateEffectValueForLevel(level);
    const enchantmentName = this.localizeEnchantment(statEffects.stat, enchantStatValue);

    // New enchantment creation
    const createdEnchant = std.DBC.SpellItemEnchantment.findById(this.parentEnchantID)
      .clone(currentEnchantId)
      .Name.enGB.set(enchantmentName)
      .EffectArg.set(statEffects.enchantEffects.effectArgs)
      .Effect.set(statEffects.enchantEffects.effects)
      .EffectPointsMin.set([enchantStatValue, 0, 0])
      .EffectPointsMax.set([enchantStatValue, 0, 0]);

    currentEnchantId++;

    return createdEnchant;
  }

  /**
   * Creates a human-readable name for use in an `Enchantment` following the provided schema.
   * This is the text shown in item tooltips in-game for the `Enchantment`.
   *
   * @param stat - Stat from which to derive `Enchantment` name. i.e. `Strength`, `Agility`, `Mana`
   * @param effectValue - Amount to add to `Enchantment` name (such as +1, +2) etc
   * @param namingSchema - Naming schema to use for the `Enchantment` name.
   * `The [VAL]` and `[STAT]` placeholders are used for `effectValue` and `stat` name, respectively.
   * If they are ommited, the `effectValue` of the enchantment and its stat will *not* be visible by default.
   * @returns `string` of the newly created `Enchantment` name
   */
  protected localizeEnchantment(
    stat: Stat,
    effectValue: number,
    namingSchema = this.namingSchema
  ): string {
    const statName = EnumUtils.enumToHumanString(Stat, stat);
    return namingSchema.replace("[VAL]", `${effectValue}`).replace("[STAT]", statName);
  }
}
