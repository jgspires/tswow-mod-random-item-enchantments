import { Item } from "../../../../lily-common/src/Item";

export type MultiplierOverrides = {
  class: Item.Class;
  subclasses?: Item.SubClass[];
  overrideMultiplier: number;
};
