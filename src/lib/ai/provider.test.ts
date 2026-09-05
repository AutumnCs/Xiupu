import { describe, expect, it } from "vitest";
import { getProviderConfig } from "./provider";

describe("getProviderConfig", () => {
  it("rejects incomplete configuration", () => {
    expect(() => getProviderConfig({ baseUrl: "", apiKey: "", model: "" }))
      .toThrow("AI provider is not configured");
  });

  it("normalizes a configured base URL", () => {
    expect(getProviderConfig({
      baseUrl: "https://api.example.com/v1/",
      apiKey: "test-key",
      model: "test-model",
    })).toEqual({
      baseUrl: "https://api.example.com/v1",
      apiKey: "test-key",
      model: "test-model",
    });
  });
});
