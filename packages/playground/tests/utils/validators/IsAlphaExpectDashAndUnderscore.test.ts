import { describe, expect, it } from "vitest";

import { IsAlphanumericExpectDashAndUnderscore } from "../../../src/utils/validators";

const validator = IsAlphanumericExpectDashAndUnderscore(
  "Username should consist of letters, numbers, dashs and underscores only.",
);

describe("IsAlphanumericExpectDashAndUnderscore", () => {
  it("returns an error message for input with spaces", () => {
    const result = validator("hello world!");
    expect(result).toEqual({
      message: "Username should consist of letters, numbers, dashs and underscores only.",
      requiredTrue: true,
    });
  });

  it("returns an error message for input with special characters", () => {
    const result = validator("hello@world");
    expect(result).toEqual({
      message: "Username should consist of letters, numbers, dashs and underscores only.",
      requiredTrue: true,
    });
  });

  it("returns undefined for valid username that contains underscore", () => {
    const result = validator("hello_world");
    expect(result).toBeUndefined();
  });

  it("returns undefined for valid username that contains dash", () => {
    const result = validator("hello-world");
    expect(result).toBeUndefined();
  });

  it("returns undefined for valid username", () => {
    const result = validator("hello");
    expect(result).toBeUndefined();
  });

  it("returns undefined for valid username/email that starts with numbers", () => {
    const result = validator("4me");
    expect(result).toBeUndefined();
  });
});
