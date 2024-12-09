namespace Lily {
  export namespace Random {
    export function seed(): number {
      return Math.floor(Math.random() * 1000000) + Date.now();
    }

    export function getRandNumberWithSeed(seed: number, max: number): number {
      return Math.floor(Math.abs(Math.sin(seed) * 10000) % max);
    }

    /**
     * Generates a random integer between the specified minimum and maximum values (inclusive).
     *
     * The function ensures the range is adjusted to integers even if floating-point values are provided.
     *
     * @param {number} min - The minimum value (inclusive). If not an integer, it will be rounded up.
     * @param {number} max - The maximum value (inclusive). If not an integer, it will be rounded down.
     * @returns {number} A random integer between `min` and `max` (inclusive).
     */
    export function getRandomInt(min: number, max: number): number {
      if (min > max) {
        throw new Error("The 'min' value must not be greater than the 'max' value.");
      }

      // Ensure min and max are integers
      min = Math.ceil(min);
      max = Math.floor(max);

      // Generate random integer within range (inclusive)
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generates a random integer between `0` and `99`, simulating the throw of a 100-sided die.
     * Useful for odds/chances/probabilites calculations.
     *
     * @returns a random integer between `0` and `99` (inclusive)
     */
    export function getRandomChance(): number {
      return getRandomInt(0, 99);
    }
  }
}
