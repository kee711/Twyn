'use client';

import { Card } from "@/components/ui/card";
import { BarChart3, Calendar, Rocket } from "lucide-react";
import { useTranslations } from 'next-intl';

export const AdditionalFeaturesSection = () => {
  const t = useTranslations();
  return (
    <section
      id="benefits"
      className="pb-20 px-4 sm:pb-32 bg-landing-background-primary relative mx-auto"
    >
      <div
        className="container mx-auto pt-12 p-6 sm:py-16 px-4 md:px-12 max-w-6xl rounded-2xl"
        style={{
          backgroundImage: "url('/landing-page/grain-bg.png')",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }}>
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-16">
          {/* Left side - Main content */}
          <div className="space-y-0 sm:space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-none rounded-xl">
              <Rocket className="w-12 h-12 text-landing-text-reverse" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-landing-text-reverse leading-tight">
              {t('landing.additionalFeatures.title')}
            </h2>
            <p className="text-lg text-landing-text-reverse opacity-70 leading-relaxed max-w-md">
              {t('landing.additionalFeatures.subtitle')}
            </p>
          </div>

          {/* Right side - Feature cards grid */}
          <div className="grid grid-cols-1 gap-6">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-300 shadow-lg">
              <div className="space-y-2 sm:space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-landing-primary-500 rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-landing-text-primary">
                  {t('landing.additionalFeatures.saveUrl.title')}
                </h3>
                <p className="text-sm text-landing-text-secondary whitespace-pre-line">
                  {t('landing.additionalFeatures.saveUrl.description')}
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-white/20 hover:bg-white/90 transition-all duration-300 shadow-lg">
              <div className="space-y-2 sm:space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-landing-primary-500 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-landing-text-primary">
                  {t('landing.additionalFeatures.analytics.title')}
                </h3>
                <p className="text-sm text-landing-text-secondary">
                  {t('landing.additionalFeatures.analytics.description')}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};