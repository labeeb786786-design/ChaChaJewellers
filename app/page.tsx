import { Hero } from "@/components/home/hero";
import { StoreGallery } from "@/components/home/store-gallery";
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
      <FeaturedCollections />
      <Bullions />
      <TrustSection reviews={reviews} />
      <SellGoldPromo />
      <ServicesOverview />
      <StoreGallery />
      <StoreLocation />
    </>
  );
}
