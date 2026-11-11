# Random Item Enchantments

TSWoW module that adds random stat enchantments to equipment on loot drops.
This module's functionality works independently of the game's usual item suffix and properties.

## How a drop is rolled

1. **Rarity.** The item may upgrade its quality, up to legendary. Each step needs a higher roll (`qualityUptierSettings`), and the creature's rank multiplies the roll (`creatureRankBonuses`).
2. **Enchantment count.** Rolled from the (new) quality, plus the creature's rank bonus (`enchantRollSettings`). Zero enchantments means the item drops unchanged.
3. **Enchantment points.** The item's stat budget for its item level and slot, times the quality's `enchantPointMultiplier`, ±20%. A green enchantment is worth about one green item's stats, a rare about two, an epic three, a legendary five.
4. **Stats.** Each enchantment picks a stat, weighted by the class it's rolled for and the item type (see below), and the points are split randomly between them.

All settings live in `livescripts/libraries/lily-random-item-generation/settings/`.

## Item budgets (datascripts)

Enchantment points come from Blizzard's item stat budgets in `RandPropPoints.dbc`: the table random-suffix items like "of the Bear" use. The module's datascripts export it to the world table `lily_rie_item_budget`, and the livescripts load it on startup.

- Run `build data` before starting the server. The datascript log prints sample budgets per item level.
- Without the table, or for slots with no budget (tabards, for example), points fall back to the curve in `components/EnchantPointCurve.ts`.
- `enchantPointSettings` (in `GenerationSettings.ts`) switches between the budget and the curve, and chooses whether every quality starts from the green budget (default) or from its own quality's column.

## Stat pools

Stats lean towards whoever the item is for (`settings/StatPoolSettings.ts`):

- The class is the looter's, or a random group member's on the same map whose armour type, shield, relic or weapon the item suits.
- Each pick weighs stats by **class weight × item-type affinity**: a mage looting cloth mostly sees intellect, spell power, spirit, haste and crit; a warrior looting plate mostly sees strength, stamina, hit, expertise and some defensive stats.
- `offStatChance` (15%) of picks ignore the class, so surprising rolls still happen.
- If nobody suits the item, it rolls on the item-type affinity alone, so cloth still rolls caster stats for someone else.

Enchantable stats now also include attack power, spell power, mana per 5 seconds, hit, haste, expertise, armour penetration, defence, dodge and parry. Crit can roll on any item, not only weapons.

**Avoidance cap.** Dodge, parry, defence and block rating together can take at most 40% of an item's points (`avoidanceShareCap`). The rest goes to the item's other stats, or to stamina if it rolled only avoidance. High avoidance is still possible, but it takes many items rather than one lucky drop.

**Shields.** Block value is ×1.5 on shields; block rating is ×1.0 (it counts towards the avoidance cap). Both are set explicitly in `StatSettings.ts`.

## Dungeons

`dungeonLootSettings` in `GenerationSettings.ts`:

- Most 5-player dungeon bosses are elite rank in the database, so they used to roll like any elite. Creatures the core flags as dungeon bosses now use the boss bonuses.
- Every other creature in a dungeon or raid gets +10 to the enchantment count roll.

## Rarity odds (exact, from the roll rules)

| Source | Green → blue or better | Green → epic or better | Blue → legendary | Epic → legendary | Blue rolls ≥1 enchantment |
|---|---|---|---|---|---|
| Normal mob | 10% | 0.2% | 0% | 0% | 51% |
| Elite (outdoors) | 25% | 4.5% | 2.2% | 12% | 76% |
| Dungeon trash (elite) | 25% | 4.5% | 2.2% | 12% | 86% |
| Dungeon or raid boss | 28% | 6.2% | 3.3% | 15% | 100% |

With +8 per rarity step, normal mobs can no longer upgrade anything to legendary. Raising `NORMAL`'s `qualityRollMultiplier` to 1.05 brings their green → epic chance to about 1%.
