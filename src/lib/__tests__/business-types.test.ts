import { BUSINESS_TYPES, getBusinessTypeConfig } from "../business-types";

describe("business-types config", () => {
  it("has 8 business types matching onboarding UI", () => {
    expect(BUSINESS_TYPES).toHaveLength(8);
    expect(BUSINESS_TYPES.map((t) => t.id)).toEqual([
      "spare_parts",
      "garments",
      "hardware",
      "electronics",
      "grocery",
      "pharmacy",
      "wholesale",
      "custom",
    ]);
  });

  it("returns the matching config for a known type", () => {
    const spareParts = getBusinessTypeConfig("spare_parts");
    expect(spareParts.extraFields.some((f) => f.key === "partNumber")).toBe(true);
  });

  it("falls back to the custom config for an unknown/free-text business type", () => {
    const config = getBusinessTypeConfig("my furniture shop");
    expect(config.id).toBe("custom");
    expect(config.extraFields).toHaveLength(0);
  });

  it("falls back to custom config when businessType is undefined", () => {
    expect(getBusinessTypeConfig(undefined).id).toBe("custom");
  });
});
