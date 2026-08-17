import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/db";
import { generateSlug, slugify, type SluggableTable } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Gold Bangle")).toBe("gold-bangle");
  });

  it("strips apostrophes without leaving a hyphen in their place", () => {
    expect(slugify("Chacha's Bridal Set")).toBe("chachas-bridal-set");
  });

  it("collapses runs of punctuation into a single hyphen", () => {
    expect(slugify("22k -- Kada Bangle!!  Pair")).toBe("22k-kada-bangle-pair");
  });

  it("trims leading and trailing punctuation", () => {
    expect(slugify("  -Diamond Halo Pendant- ")).toBe("diamond-halo-pendant");
  });

  it("matches the DB's slug check constraint", () => {
    expect(slugify("Temple Necklace Set #7")).toMatch(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
    );
  });
});

/**
 * Minimal stand-in for the slice of SupabaseClient generateSlug actually
 * calls, keyed per table so tests can prove it checks the table it's told to.
 */
function fakeSupabase(
  existingByTable: Partial<Record<SluggableTable, string[]>>,
): SupabaseClient<Database> {
  return {
    from(table: string) {
      const existing = existingByTable[table as SluggableTable] ?? [];
      return {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        select(_columns: string) {
          return {
            eq(_column: string, value: string) {
              return {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                limit(_n: number) {
                  return Promise.resolve({
                    data: existing.includes(value) ? [{ id: "row-id" }] : [],
                    error: null,
                  });
                },
              };
            },
          };
        },
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("generateSlug", () => {
  it("returns the plain slug when it's free", async () => {
    const supabase = fakeSupabase({ products: [] });
    expect(await generateSlug("Gold Bangle", supabase, "products")).toBe(
      "gold-bangle",
    );
  });

  it("appends -2 on a single collision", async () => {
    const supabase = fakeSupabase({ products: ["gold-bangle"] });
    expect(await generateSlug("Gold Bangle", supabase, "products")).toBe(
      "gold-bangle-2",
    );
  });

  it("keeps incrementing past multiple collisions", async () => {
    const supabase = fakeSupabase({
      products: ["gold-bangle", "gold-bangle-2", "gold-bangle-3"],
    });
    expect(await generateSlug("Gold Bangle", supabase, "products")).toBe(
      "gold-bangle-4",
    );
  });

  it("checks the table it's told to check", async () => {
    // "gold-bangle" is taken in products but not in categories.
    const supabase = fakeSupabase({ products: ["gold-bangle"] });
    expect(await generateSlug("Gold Bangle", supabase, "categories")).toBe(
      "gold-bangle",
    );
    expect(await generateSlug("Gold Bangle", supabase, "products")).toBe(
      "gold-bangle-2",
    );
  });

  it("rejects a name with nothing sluggable in it", async () => {
    const supabase = fakeSupabase({ products: [] });
    await expect(generateSlug("!!!", supabase, "products")).rejects.toThrow();
  });
});
