const qualityRollSettings: QualityRollSettings = {
  minRollForRarityUptier: 70,
  addMinRollPerRarity: 3,
};

const enchantRollSettings = new Map<Lily.Item.Quality, EnchantRollSettings>([
  [
    Lily.Item.Quality.NORMAL,
    {
      enchantmentNeededRoll: 90,
      extraNeededChancePerRoll: 101,
      maxRolls: 1,
      enchantPointMultiplier: 0.75,
    },
  ],
  [
    Lily.Item.Quality.UNCOMMON,
    {
      enchantmentNeededRoll: 50,
      extraNeededChancePerRoll: 85,
      maxRolls: 2,
      enchantPointMultiplier: 1.0,
    },
  ],
  [
    Lily.Item.Quality.RARE,
    {
      enchantmentNeededRoll: 10,
      extraNeededChancePerRoll: 40,
      maxRolls: 3,
      enchantPointMultiplier: 1.25,
    },
  ],
  [
    Lily.Item.Quality.EPIC,
    {
      enchantmentNeededRoll: 0,
      extraNeededChancePerRoll: 20,
      maxRolls: 3,
      enchantPointMultiplier: 1.5,
    },
  ],
  [
    Lily.Item.Quality.LEGENDARY,
    {
      enchantmentNeededRoll: 0,
      extraNeededChancePerRoll: 0,
      maxRolls: 3,
      enchantPointMultiplier: 2.0,
    },
  ],
]);
