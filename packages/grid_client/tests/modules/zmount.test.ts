import { validate } from "class-validator";

import { Zmount } from "../../src";
import { getRandomNumber } from "../../src/helpers/utils";

describe("Zmount Class", () => {
  let zmount: Zmount;
  const minSize = 50 * 1024 ** 2; // Less than 100 MB
  const maxSize = 15 * 1024 ** 4; // Greater than 10 TB
  const validSize = 5 * 1024 ** 3;

  beforeEach(() => {
    zmount = new Zmount();
  });

  describe("Initialization", () => {
    it("should be initialized with default values", () => {
      expect(zmount).toBeDefined();
      expect(zmount.size).toBeUndefined();
    });
  });

  describe("size property validation", () => {
    it("should fail validation if size is set to a non-numeric value", async () => {
      expect(() => (zmount.size = "not a number" as any)).toThrow();
    });

    it("should fail validation if size is null", async () => {
      expect(() => (zmount.size = null as any)).toThrow();
    });

    it("should fail validation if size is undefined", async () => {
      expect(() => (zmount.size = undefined as any)).toThrow();
    });

    it("should fail validation if size is less than the minimum", async () => {
      expect(() => (zmount.size = minSize)).toThrow();
    });

    it("should fail validation if size is greater than the maximum", async () => {
      expect(() => (zmount.size = maxSize)).toThrow();
    });

    it("should pass validation if size is a valid number within the range", async () => {
      const validSize = getRandomNumber(minSize, maxSize);
      zmount.size = validSize;
      const errors = await validate(zmount);
      expect(errors.length).toBe(0);
    });
  });

  describe("challenge method", () => {
    it("should return the size as a string", () => {
      zmount.size = validSize;

      const result = zmount.challenge();
      expect(result).toBe("5368709120");
    });
  });
});
