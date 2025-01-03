import { Item } from "../../../lily-common/src/Item";

export type ItemClassWithSubclasses = {
  class: Item.Class;
  subclasses: Item.Subclass[];
};
