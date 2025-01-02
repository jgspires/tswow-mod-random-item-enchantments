export namespace Utils {
  /**
   * Returns a stringified and 'prettified' JSON string of the object.
   *
   * @param obj - The object to be stringified.
   * @returns `string` containing the stringified object.
   */
  export function toPrettyJson(obj: Object, spaces = 2): string {
    return JSON.stringify(obj, null, spaces);
  }
}
