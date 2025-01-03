import { Item } from "../../../../lily-common/src/Item";

export type ClassMultiplierOverride = {
  class: Item.Class;
  subclasses?: Item.Subclass[];
  overrideMultiplier: number;
};
