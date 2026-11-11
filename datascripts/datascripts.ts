import { std } from "wow/wotlk";

/*
 *  Lily's Random Item Enchantments - datascripts
 *
 *  Copies Blizzard's item stat budgets from RandPropPoints.dbc into a world table, so the livescripts
 *  can size enchantments relative to each item instead of with one absolute curve.
 *
 *  RandPropPoints is the table random-suffix items ("of the Bear") use: for every item level it holds
 *  a point budget per quality column (good = green, superior = blue, epic) and per slot group:
 *    0 = head, chest, legs, two-handers      1 = shoulders, waist, feet, hands, trinkets
 *    2 = neck, wrists, rings, cloaks, shields, off-hand items      3 = one-handers      4 = ranged, wands
 *
 *  The livescripts load this table on startup. Run `build data` before starting the server.
 */

const MODULE_NAME = "Lily's Random Item Enchantments";
const BUDGET_TABLE = "lily_rie_item_budget";
const SLOT_GROUPS = 5;

console.log(`${MODULE_NAME}: Exporting item stat budgets (RandPropPoints.dbc) to ${BUDGET_TABLE}...`);

// Separate priorities, because statements in the same priority may run in parallel.
std.SQL.Databases.world_dest.writeEarly(
  `CREATE TABLE IF NOT EXISTS ${BUDGET_TABLE} (` +
    "item_level SMALLINT UNSIGNED NOT NULL, " +
    "slot TINYINT UNSIGNED NOT NULL, " +
    "good INT UNSIGNED NOT NULL, " +
    "superior INT UNSIGNED NOT NULL, " +
    "epic INT UNSIGNED NOT NULL, " +
    "PRIMARY KEY (item_level, slot))"
);

const values: string[] = [];
const samples: string[] = [];
const SAMPLE_LEVELS = [10, 25, 60, 115, 200, 264];

for (const row of std.DBC.RandPropPoints.queryAll({})) {
  const itemLevel = row.ID.get();
  for (let slot = 0; slot < SLOT_GROUPS; slot++) {
    values.push(
      `(${itemLevel}, ${slot}, ${row.Good.getIndex(slot)}, ${row.Superior.getIndex(slot)}, ${row.Epic.getIndex(slot)})`
    );
  }
  if (SAMPLE_LEVELS.indexOf(itemLevel) >= 0) {
    samples.push(
      `ilvl ${itemLevel}: good ${row.Good.getIndex(0)}/${row.Good.getIndex(1)}/${row.Good.getIndex(2)}/` +
        `${row.Good.getIndex(3)}/${row.Good.getIndex(4)}`
    );
  }
}

if (values.length == 0) {
  console.error(`${MODULE_NAME}: RandPropPoints.dbc has no rows. Enchantments will fall back to the point curve.`);
} else {
  // One statement, so the rows land together; REPLACE keeps rebuilds idempotent.
  std.SQL.Databases.world_dest.write(
    `REPLACE INTO ${BUDGET_TABLE} (item_level, slot, good, superior, epic) VALUES ${values.join(", ")}`
  );
  console.log(`${MODULE_NAME}: Exported ${values.length / SLOT_GROUPS} item levels. Samples (slot groups 0-4):`);
  for (const sample of samples) console.log(`${MODULE_NAME}:   ${sample}`);
}
