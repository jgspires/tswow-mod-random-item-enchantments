const qualityRollSettings: QualityRollSettings = {
  minRollForRarityUptier: 75,
  addMinRollPerRarity: 5,
};

const enchantRollSettings = new Map<Lily.Item.Quality, EnchantRollSettings>([
  [
    Lily.Item.Quality.NORMAL,
    {
      enchantmentNeededRoll: 90,
      extraNeededChancePerRoll: 101,
      maxEnchants: 1,
      enchantPointMultiplier: 0.75,
    },
  ],
  [
    Lily.Item.Quality.UNCOMMON,
    {
      enchantmentNeededRoll: 50,
      extraNeededChancePerRoll: 85,
      maxEnchants: 2,
      enchantPointMultiplier: 1.0,
    },
  ],
  [
    Lily.Item.Quality.RARE,
    {
      enchantmentNeededRoll: 10,
      extraNeededChancePerRoll: 40,
      maxEnchants: 3,
      enchantPointMultiplier: 1.25,
    },
  ],
  [
    Lily.Item.Quality.EPIC,
    {
      enchantmentNeededRoll: 0,
      extraNeededChancePerRoll: 20,
      maxEnchants: 3,
      enchantPointMultiplier: 1.5,
    },
  ],
  [
    Lily.Item.Quality.LEGENDARY,
    {
      enchantmentNeededRoll: 0,
      extraNeededChancePerRoll: 0,
      maxEnchants: 3,
      enchantPointMultiplier: 2.0,
    },
  ],
]);
