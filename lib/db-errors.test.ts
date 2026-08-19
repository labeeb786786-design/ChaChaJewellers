import { describe, expect, it } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { friendlyUniqueViolationMessage } from "./db-errors";

function fakeError(overrides: Partial<PostgrestError> = {}): PostgrestError {
  return {
    name: "PostgrestError",
    message: "duplicate key value violates unique constraint \"products_sku_key\"",
    details: "Key (sku)=(CJ-ITEM) already exists.",
    hint: "",
    code: "23505",
    ...overrides,
  } as PostgrestError;
}

describe("friendlyUniqueViolationMessage", () => {
  it("matches the column named in the error's details", () => {
    const error = fakeError();
    expect(
      friendlyUniqueViolationMessage(error, {
        sku: "sku message",
        slug: "slug message",
      }),
    ).toBe("sku message");
  });

  it("matches whichever column the details mention, not insertion order", () => {
    const error = fakeError({ details: "Key (slug)=(gold-bangle) already exists." });
    expect(
      friendlyUniqueViolationMessage(error, {
        sku: "sku message",
        slug: "slug message",
      }),
    ).toBe("slug message");
  });

  it("returns null for a non-unique-violation error code", () => {
    const error = fakeError({ code: "23503" });
    expect(friendlyUniqueViolationMessage(error, { sku: "sku message" })).toBeNull();
  });

  it("returns null when the violated column isn't in the given map", () => {
    const error = fakeError({ details: "Key (email)=(a@b.com) already exists." });
    expect(friendlyUniqueViolationMessage(error, { sku: "sku message" })).toBeNull();
  });
});
