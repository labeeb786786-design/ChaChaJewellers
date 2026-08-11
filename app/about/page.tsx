import { ComingSoon } from "@/components/layout/coming-soon";
import { SITE } from "@/lib/site";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <ComingSoon
      title="Our Story"
      description={`The story of Chacha Jewellers — a family-run home of fine South Asian gold in the heart of Oldham since ${SITE.foundedYear} — is being written. Come and say hello in the meantime.`}
    />
  );
}
