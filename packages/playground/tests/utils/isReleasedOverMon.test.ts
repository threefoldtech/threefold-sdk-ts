import { describe, expect, it } from "vitest";

import { isReleasedOverMon } from "../../src/utils/date";

describe("isReleasedOverMon", () => {
  it("return true if the releaseDate is within 30 days", () => {
    const releaseDate = new Date("2024-09-1");
    const currentDate = new Date("2024-09-19");
    expect(isReleasedOverMon(releaseDate, currentDate)).toBe(true);
  });

  it("return false if the releaseDate was from more than 30 days", () => {
    const releaseDate = new Date("2024-09-1");
    const currentDate = new Date("2024-11-19");
    expect(isReleasedOverMon(releaseDate, currentDate)).toBe(false);
  });

  it("return true if releaseDate is today", () => {
    const releaseDate = new Date("2024-09-19");
    const currentDate = new Date("2024-09-19");
    expect(isReleasedOverMon(releaseDate, currentDate)).toBe(true);
  });
});
