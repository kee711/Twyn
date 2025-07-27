'use client';

import { Footer } from "@/components/blocks/footer";
import React from "react";
import { PricingModal } from "@/components/modals/PricingModal";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/* New Landing Components */
import { Navigation } from "@/components/landing-components/navigation";
import { FeatureSection } from "@/components/landing-components/feature-section";
import { AdditionalFeaturesSection } from "@/components/landing-components/additional-features-section";
import { PricingCTASection } from "@/components/landing-components/pricing-cta-section";
import { FAQSection } from "@/components/landing-components/faq-section";
import { HeroSection } from "@/components/landing-components/hero-section";

// app/page.tsx
export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // Check for pricing modal parameter
  useEffect(() => {
    const modal = searchParams.get('modal');
    if (modal === 'pricing') {
      setPricingModalOpen(true);
    }
  }, [searchParams]);

  const handleClosePricingModal = () => {
    setPricingModalOpen(false);
    // Remove the modal parameter from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('modal');
    router.replace(newUrl.pathname + newUrl.search);
  };

  return (
    <div className="landing-page bg-landing-background-primary">
      <Navigation />
      <HeroSection />
      <FeatureSection />
      <AdditionalFeaturesSection />
      <PricingCTASection />
      <FAQSection />

      <Footer
        brand={{
          name: "Twyn",
          description: "Minimize your time & energy to post, engage, and grow on Threads.",
        }}
        socialLinks={[
          {
            name: "Discord",
            href: "#",
          },
          {
            name: "Twitter",
            href: "#",
          },
          {
            name: "Threads",
            href: "#",
          },
        ]}
        columns={[
          {
            title: "Product",
            links: [
              {
                name: "Features",
                icon: "Blocks",
                href: "#features",
              },
              {
                name: "Pricing",
                icon: "CreditCard",
                href: "#pricing",
              },
            ],
          },
          {
            title: "Legal",
            links: [
              {
                name: "Data Deletion Policy",
                icon: "Handshake",
                href: "/data-deletion-policy",
                openInNewTab: true,
              },
              {
                name: "Privacy Policy",
                icon: "Scale",
                href: "/privacy",
                openInNewTab: true,
              },
            ],
          },
        ]}
        copyright="Threads AI Inc. © 2024"
      />

      <PricingModal
        open={pricingModalOpen}
        onClose={handleClosePricingModal}
      />
    </div>
  );
}