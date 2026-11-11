export namespace Creature {
  export enum Rank {
    NORMAL = 0,
    ELITE = 1,
    RARE_ELITE = 2,
    BOSS = 3,
    RARE = 4,
  }

  /**
   * `flags_extra` bits from TrinityCore's CreatureData.h.
   *
   * Note: most 5-player dungeon bosses are `ELITE` rank in the database, not `BOSS`. The core marks them
   * with `DUNGEON_BOSS` at startup (from `instance_encounters`), so this flag is how to recognise them.
   */
  export enum FlagExtra {
    DUNGEON_BOSS = 0x10000000,
  }
}
