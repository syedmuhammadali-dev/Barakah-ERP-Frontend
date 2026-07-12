import { computeAdjustedStock } from "../inventory-utils";

describe("computeAdjustedStock", () => {
  it("adds a positive delta to the current stock", () => {
    expect(computeAdjustedStock(10, 5)).toBe(15);
  });

  it("subtracts a negative delta from the current stock", () => {
    expect(computeAdjustedStock(10, -4)).toBe(6);
  });

  it("never goes below zero", () => {
    expect(computeAdjustedStock(3, -10)).toBe(0);
  });

  it("returns the same value when delta is zero", () => {
    expect(computeAdjustedStock(7, 0)).toBe(7);
  });
});
