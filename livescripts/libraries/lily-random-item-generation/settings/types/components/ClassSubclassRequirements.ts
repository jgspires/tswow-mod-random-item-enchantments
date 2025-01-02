import { Item } from "../../../../lily-common/src";

export type ClassSubclassRequirements = {
  classRequirement: Item.Class;
  subclassRequirements?: Item.SubClass[];
};
