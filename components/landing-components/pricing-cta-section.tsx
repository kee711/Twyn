'use client';

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useTranslations } from 'next-intl';

export const PricingCTASection = () => {
  const t = useTranslations();
  
  const pricingPlans = [
    {
      name: t('landing.pricing.freePlan'),
      price: "$0",
      period: t('landing.pricing.monthlyUser'),
      badge: t('landing.pricing.limitedBeta'),
      badgeColor: "bg-landing-primary-100 text-landing-primary-700 border-landing-primary-200",
      features: [
        t('landing.pricing.freeFeatures.feature1'),
        t('landing.pricing.freeFeatures.feature2'),
        t('landing.pricing.freeFeatures.feature3'),
        t('landing.pricing.freeFeatures.feature4')
      ]
    },
    {
      name: t('landing.pricing.proPlan'),
      price: "$19",
      period: t('landing.pricing.monthlyUser'),
      badge: t('landing.pricing.comingSoon'),
      badgeColor: "bg-landing-bg-primary text-landing-primary-600 border-landing-primary-200",
      features: [
        t('landing.pricing.proFeatures.feature1'),
        t('landing.pricing.proFeatures.feature2'),
        t('landing.pricing.proFeatures.feature3'),
        t('landing.pricing.proFeatures.feature4')
      ]
    },
    {
      name: t('landing.pricing.proPlusPlan'),
      price: "$39",
      period: t('landing.pricing.monthlyUser'),
      badge: t('landing.pricing.comingSoon'),
      badgeColor: "bg-landing-bg-primary text-landing-primary-600 border-landing-primary-200",
      features: [
        t('landing.pricing.proPlusFeatures.feature1'),
        t('landing.pricing.proPlusFeatures.feature2'),
        t('landing.pricing.proPlusFeatures.feature3'),
        t('landing.pricing.proPlusFeatures.feature4')
      ]
    }
  ];

  return (
    <section id="pricing" className="pb-20 sm:pb-32 bg-landing-background-primary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-landing-text-primary mb-4">
            {t('landing.pricing.title')} <span className="text-landing-primary-600">{t('landing.pricing.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-landing-text-secondary max-w-2xl mx-auto">
            {t('landing.pricing.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className="p-8 bg-white border-gray-200 relative shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-landing-text-secondary uppercase tracking-wide">
                    {plan.name}
                  </h3>
                  <Badge className={plan.badgeColor}>
                    {plan.badge}
                  </Badge>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-landing-text-primary">{plan.price}</span>
                  <span className="text-landing-text-secondary ml-1">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-landing-text-secondary text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};