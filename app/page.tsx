import { Hero } from "@/components/home/hero";
import { GoldPriceWidget } from "@/components/home/gold-price-widget";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { Bullions } from "@/components/home/bullions";
import { TrustSection } from "@/components/home/trust-section";
import { SellGoldPromo } from "@/components/home/sell-gold-promo";
import { ServicesOverview } from "@/components/home/services-overview";
import { StoreLocation } from "@/components/home/store-location";
import { getReviews } from "@/lib/reviews";

export default async function HomePage() {
  const reviews = await getReviews();

  return (
    <>
      <Hero />
      <GoldPriceWidget />
      <FeaturedCollections />
      <Bullions />
      <TrustSection reviews={reviews} />
      <SellGoldPromo />
      <ServicesOverview />
      <StoreLocation />
    </>
  );
}
