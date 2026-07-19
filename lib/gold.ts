import goldData from "@/lib/data/gold-prices.json";

export type MetalPrices = {
  gold24k: number;
  gold22k: number;
  gold18k?: number;
  silver: number;
};

export type GoldPricePoint = {
  date: string;
  gold24k: number;
  gold22k: number;
  silver: number;
};

export type GoldPriceData = {
  currency: string;
  unit: string;
  asOf: string;
  current: MetalPrices;
  history: GoldPricePoint[];
};

/**
 * getGoldPrices — current + historical metal prices in GBP per gram.
 *
 * ⚠️ MOCK DATA. The values in lib/data/gold-prices.json are illustrative only.
 * TODO before launch: replace this with a live metals API (e.g. metals-api.com,
 * GoldAPI.io, Metalprice API). Do the fetch server-side with a secret API key,
 * convert the spot XAU/XAG price to GBP per gram, derive 22k (= 24k * 22/24)
 * and 18k (= 24k * 18/24), and return the same shape so the UI is unchanged.
 */
export async function getGoldPrices(): Promise<GoldPriceData> {
  return goldData as GoldPriceData;
}

export function formatGBP(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
