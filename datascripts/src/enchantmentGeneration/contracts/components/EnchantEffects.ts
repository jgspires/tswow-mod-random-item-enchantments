type EnchantEffects = {
  effects: [number, number, number]; // What to do with stats? Add primary stat? Add armor? Add resist?
  effectArgs: [number, number, number]; // Which stats will the respective effects be applied to?
  //effectPointsMin: number[]; // How many points of the respective stats will be added at min?
  //effectPointsMax: number[]; // How many points of the respective stats will be added at max?
};
