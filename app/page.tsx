import { Hero } from "@/components/home/hero";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { GoldPriceWidget } from "@/components/home/gold-price-widget";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { SellGoldPromo } from "@/components/home/sell-gold-promo";
import { ServicesOverview } from "@/components/home/services-overview";
import { ReviewsMarquee } from "@/components/home/reviews-marquee";
import { StoreLocation } from "@/components/home/store-location";
import { getReviews } from "@/lib/reviews";

export default async function HomePage() {
  const reviews = await getReviews();

  return (
    <>
      <Hero />
      <FeaturedCollections />
      <GoldPriceWidget />
      <WhyChooseUs />
      <SellGoldPromo />
      <ServicesOverview />
      <ReviewsMarquee reviews={reviews} />
      <StoreLocation />
    </>
  );
}
