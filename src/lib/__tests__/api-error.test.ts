import { getApiErrorMessage } from "../api-error";

describe("getApiErrorMessage", () => {
  it("returns the fallback for non-Error values", () => {
    expect(getApiErrorMessage("not an error", "fallback")).toBe("fallback");
    expect(getApiErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(getApiErrorMessage(null, "fallback")).toBe("fallback");
  });

  it("returns the fallback for an empty message", () => {
    expect(getApiErrorMessage(new Error(""), "fallback")).toBe("fallback");
  });

  it("strips the 'HTTP <code> <statusText>:' prefix added by ApiError", () => {
    expect(getApiErrorMessage(new Error("HTTP 400 Bad Request: SKU already exists"))).toBe(
      "SKU already exists",
    );
  });

  it("returns the fallback when only the technical prefix is present", () => {
    expect(getApiErrorMessage(new Error("HTTP 500 Internal Server Error"), "fallback")).toBe(
      "fallback",
    );
  });

  it("passes through a plain error message unchanged", () => {
    expect(getApiErrorMessage(new Error("Network request failed"))).toBe(
      "Network request failed",
    );
  });
});
