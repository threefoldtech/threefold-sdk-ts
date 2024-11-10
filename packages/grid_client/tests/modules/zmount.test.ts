import { Zmount } from "../../src";

let zmount: Zmount;

beforeEach(() => {
  zmount = new Zmount();
});
describe("Zmount module", () => {
  test("Zmount instance is of type Zmount.", () => {
    expect(zmount).toBeInstanceOf(Zmount);
  });

  test("Min value for size.", () => {
    const size = 100 * 1025 ** 2;

    zmount.size = size;

    const result = zmount.challenge();

    expect(result).toBe(size.toString());
  });

  test("Max value for size.", () => {
    const size = 100 * 1025 ** 4;
    const result = () => zmount.challenge();

    expect(() => {
      zmount.size = size;
      result;
    }).toThrow(
      expect.objectContaining({
        constraints: {
          max: "size must not be greater than 10995116277760",
        },
      }),
    );
  });

  test("Size doesn't accept decimal value.", () => {
    const size = 1.5;

    const result = () => zmount.challenge();

    expect(() => {
      zmount.size = size;
      result;
    }).toThrow(
      expect.objectContaining({
        constraints: {
          isInt: "size must be an integer number",
          min: "size must not be less than 104857600",
        },
      }),
    );
  });

  test("Size empty value.", () => {
    const result = () => zmount.challenge();

    expect(result).toThrow();
  });

  test("Size negative value.", () => {
    const negative_size = -1;

    const result = () => zmount.challenge();

    expect(() => {
      zmount.size = negative_size;
      result;
    }).toThrow(
      expect.objectContaining({
        constraints: {
          min: "size must not be less than 104857600",
        },
      }),
    );
  });
});
