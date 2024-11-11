import { Zmount } from "../../src";

let zmount: Zmount;
const disk = 10;
const memory = 1024;
const CPUs = 2;

const newDiskValue = 100;
const newCPUValue = 4;

const min = newDiskValue * memory ** CPUs;
const max = disk * memory ** newCPUValue;

beforeEach(() => {
  zmount = new Zmount();
});
describe("Zmount module", () => {
  test("Zmount instance is of type Zmount.", () => {
    expect(zmount).toBeInstanceOf(Zmount);
  });

  test("Min value for size.", () => {
    expect(() => {
      zmount.size = min;
      zmount.challenge();
    }).toBeDefined();
  });

  test("Less than the min value of size.", () => {
    expect(() => {
      zmount.size = min - 1;
      zmount.challenge();
    }).toThrow();
  });

  test("Max value for size.", () => {
    expect(() => {
      zmount.size = max;
      zmount.challenge();
    }).toBeDefined();
  });

  test("Exceed the max value of size.", () => {
    expect(() => {
      zmount.size = max + 1;
      zmount.challenge();
    }).toThrow();
  });

  test("Size doesn't accept decimal value.", () => {
    expect(() => {
      zmount.size = 1.5;
      zmount.challenge();
    }).toThrow();
  });

  test("Size undefined value.", () => {
    expect(() => {
      zmount.size;
      zmount.challenge();
    }).toThrow();
  });

  test("Size negative value.", () => {
    expect(() => {
      zmount.size = -1;
      zmount.challenge();
    }).toThrow();
  });

  test("Size NaN value.", () => {
    expect(() => {
      zmount.size = NaN;
      zmount.challenge();
    }).toThrow();
  });
});
