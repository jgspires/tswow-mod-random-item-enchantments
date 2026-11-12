import { Creature } from "../lily-common/src";
import { craftingSettings, creatureRankBonuses, dungeonLootSettings } from "./settings";

export type LootSourceBonuses = {
  /** Multiplies the quality upgrade roll. */
  qualityRollMultiplier: number;
  /** Added to the enchantment count roll. */
  enchantRollBonus: number;
};

/** Works out the roll bonuses of an item's source: a creature (rank, dungeons, raids) or crafting. */
export namespace LootSource {
  export function bonusesFor(creature: TSCreature): LootSourceBonuses {
    const template = creature.GetTemplate();
    const rank: Creature.Rank = template.GetRank();
    const own = bonusesForRank(rank);

    const isDungeonBoss = (template.GetFlagsExtra() & Creature.FlagExtra.DUNGEON_BOSS) != 0;
    if (isDungeonBoss) {
      if (!dungeonLootSettings.dungeonBossesUseBossBonuses) return own;
      const boss = bonusesForRank(Creature.Rank.BOSS);
      return {
        qualityRollMultiplier: Math.max(own.qualityRollMultiplier, boss.qualityRollMultiplier),
        enchantRollBonus: Math.max(own.enchantRollBonus, boss.enchantRollBonus),
      };
    }

    const trash = dungeonLootSettings.trash;
    // IsDungeon() is true for raids as well.
    if (trash.enabled && rank != Creature.Rank.BOSS && creature.GetMap().IsDungeon()) {
      return {
        qualityRollMultiplier: own.qualityRollMultiplier * trash.qualityRollMultiplier,
        enchantRollBonus: own.enchantRollBonus + trash.enchantRollBonus,
      };
    }

    return own;
  }

  /** Bonuses for items players craft (see `craftingSettings`). */
  export function bonusesForCrafting(): LootSourceBonuses {
    return {
      qualityRollMultiplier: craftingSettings.qualityRollMultiplier,
      enchantRollBonus: craftingSettings.enchantRollBonus,
    };
  }

  export function bonusesForRank(rank: Creature.Rank): LootSourceBonuses {
    const settings = creatureRankBonuses.get(rank);
    return {
      qualityRollMultiplier: settings?.qualityRollMultiplier || 1,
      enchantRollBonus: settings?.enchantRollBonus || 0,
    };
  }
}
