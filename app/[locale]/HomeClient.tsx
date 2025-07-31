'use client';

import { Footer } from "@/components/blocks/footer";
import React from "react";
import { PricingModal } from "@/components/modals/PricingModal";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

/* New Landing Components */
import { Navigation } from "@/components/landing-components/navigation";
import { FeatureSection } from "@/components/landing-components/feature-section";
import { AdditionalFeaturesSection } from "@/components/landing-components/additional-features-section";
import { PricingCTASection } from "@/components/landing-components/pricing-cta-section";
import { FAQSection } from "@/components/landing-components/faq-section";
import { HeroSection } from "@/components/landing-components/hero-section";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const t = useTranslations();

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
          description: t('landing.description'),
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
            title: t('navigation.product'),
            links: [
              {
                name: t('navigation.features'),
                icon: "Blocks",
                href: "#features",
              },
              {
                name: t('navigation.pricing'),
                icon: "CreditCard",
                href: "#pricing",
              },
            ],
          },
          {
            title: t('navigation.legal'),
            links: [
              {
                name: t('navigation.dataDeletion'),
                icon: "Handshake",
                href: "/data-deletion-policy",
                openInNewTab: true,
              },
              {
                name: t('navigation.privacy'),
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