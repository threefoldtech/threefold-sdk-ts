import { validate } from "class-validator";

import { Zmount } from "../../src";

describe("Zmount Class", () => {
  let zmount: Zmount;

  beforeEach(() => {
    zmount = new Zmount();
  });

  describe("size property validation", () => {
    it("should fail validation if size is less than the minimum", async () => {
      // Less than 100 MB
      expect(() => (zmount.size = 50 * 1024 ** 2)).toThrow();
    });

    it("should fail validation if size is greater than the maximum", async () => {
      // Greater than 10 TB
      expect(() => (zmount.size = 15 * 1024 ** 4)).toThrow();
    });

    it("should pass validation if size is within the valid range", async () => {
      zmount.size = 5 * 1024 ** 3;

      const errors = await validate(zmount);
      expect(errors.length).toBe(0);
    });
  });

  describe("challenge method", () => {
    it("should return the size as a string", () => {
      zmount.size = 5 * 1024 ** 3;

      const result = zmount.challenge();
      expect(result).toBe("5368709120");
    });
  });
});
