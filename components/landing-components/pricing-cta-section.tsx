'use client';

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

export const PricingCTASection = () => {
  const pricingPlans = [
    {
      name: "TWYN FREE",
      price: "$0",
      period: "/mo. per user",
      badge: "LIMITED BETA ACCESS",
      badgeColor: "bg-green-100 text-green-700 border-green-200",
      features: [
        "AI-assisted content generation (limit: 50 posts or comment interactions per month)",
        "Basic topic suggestions based on your profile",
        "Basic scheduling and auto-upload features",
        "Community support via Discord (beta users only)"
      ]
    },
    {
      name: "TWYN PRO",
      price: "$19",
      period: "/mo. per user",
      badge: "COMING SOON",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
      features: [
        "Everything in Twyn Free, plus:",
        "Increased AI interaction limits (1,000 posts or comment interactions per month)",
        "Up to 3 accounts",
        "Analytics to track your best-performing posts"
      ]
    },
    {
      name: "TWYN PRO+",
      price: "$39",
      period: "/mo. per user",
      badge: "COMING SOON",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
      features: [
        "Everything in Twyn Pro, plus:",
        "Increased AI interaction limits (3,000 posts or comment interactions per month)",
        "Priority scheduling and auto-posting",
        "Exclusive access to advanced content strategy tips and premium support"
      ]
    }
  ];

  return (
    <section id="pricing" className="py-20 sm:py-32 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-landing-text-primary mb-4">
            Unlock the full potential of Twyn <span className="text-landing-primary-600">for free</span>
          </h2>
          <p className="text-lg text-landing-text-secondary max-w-2xl mx-auto">
            During our beta period, take advantage of all features at no cost.
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