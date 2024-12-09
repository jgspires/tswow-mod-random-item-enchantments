import { Stat } from "wow/wotlk/std/Enchant/EnchantmentEffect";

export class EnumUtils {
  public static getEnumKeyByValue(enumObj: any, value: number): string | undefined {
    return enumObj[value];
  }

  public static enumToHumanString(
    enumObj: any,
    value: number,
    fallback: string = "Unknown"
  ): string {
    const baseString = this.getEnumKeyByValue(enumObj, value);
    if (!baseString) return fallback;

    return baseString
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}
