namespace EnchantManager {
  export const possibleStats: Lily.Item.ModType[] = [
    Lily.Item.ModType.MANA,
    Lily.Item.ModType.HEALTH,
    Lily.Item.ModType.AGILITY,
    Lily.Item.ModType.STRENGTH,
    Lily.Item.ModType.INTELLECT,
    Lily.Item.ModType.SPIRIT,
    Lily.Item.ModType.STAMINA,
  ];

  export function generateEnchantments(item: TSItemTemplate): CustomEnchantment[] {
    let remainingFactor = 100;
    const enchantList: CustomEnchantment[] = [];
    const pointMultiplier = enchantRollSettings.get(
      item.GetQuality()
    )?.enchantPointMultiplier;
    if (pointMultiplier == undefined) return [];

    const pointsForLevel =
      EnchantPointCurve.getPoints(item.GetItemLevel()) * pointMultiplier;
    const enchantCount = rollForEnchantCount(item.GetQuality());

    for (let i = 0; i < enchantCount; i++) {
      // TO FIX BUG: IF ITEM IS ONLY ALLOWED A LIMITED NUMBER OF ENCHANTMENTS
      // USE ENTIRE POINT POOL
      const chosenFactor = Lily.Random.getRandomInt(1, remainingFactor);
      const enchantPoints = Math.round((pointsForLevel * chosenFactor) / 100);
      remainingFactor -= chosenFactor;

      enchantList.push({
        value: enchantPoints,
        stat: pickEnchantment(),
      });

      if (remainingFactor <= 0) break;
    }

    // If all enchantments were added but there is still factor (percentage) remaining:
    // redistribute it.
    if (remainingFactor > 0) {
      const factorPerEnchant = remainingFactor / enchantList.length;
      enchantList.forEach(
        (enchant) =>
          (enchant.value += Math.round((pointsForLevel * factorPerEnchant) / 100))
      );
    }

    return enchantList;
  }

  /**
   * Checks how many enchantments this new item will get.
   * Does not actually generate any enchantments.
   *
   * Mostly determined by item `quality`, with a degree of randomness.
   *
   * @param quality item quality used in roll.
   * @returns `number` - Amount of enchantments rolled.
   */
  export function rollForEnchantCount(quality: Lily.Item.Quality): number {
    const rollSettings = enchantRollSettings.get(quality);
    if (!rollSettings) return 0;

    let enchantCount = 0;
    let neededRoll = rollSettings.enchantmentNeededRoll;
    let roll = random.getRandomChance();

    while (roll >= neededRoll && enchantCount < rollSettings.maxRolls) {
      enchantCount++;
      neededRoll += rollSettings.extraNeededChancePerRoll;
      roll = random.getRandomChance();
    }

    return enchantCount;
  }

  function pickEnchantment(statList = possibleStats): number {
    return statList[Lily.Random.getRandomInt(0, statList.length - 1)];
  }
}
