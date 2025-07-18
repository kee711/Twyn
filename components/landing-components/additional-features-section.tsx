'use client';

import { Card } from "@/components/ui/card";
import { Save, BarChart3, Users, Shield } from "lucide-react";

export const AdditionalFeaturesSection = () => {
  return (
    <section className="py-20 sm:py-32 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-landing-text-primary mb-4">
            More reasons you'll love it
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-landing-primary-100 rounded-lg">
                <Save className="w-6 h-6 text-landing-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-landing-text-primary">Save with URL</h3>
            </div>
            <p className="text-landing-text-secondary">
              Save posts or thoughts seamlessly and reuse later.
            </p>
          </Card>

          <Card className="p-8 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-landing-primary-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-landing-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-landing-text-primary">Analyze Your Growth</h3>
            </div>
            <p className="text-landing-text-secondary">
              Track best-performing posts with simple analytics.
            </p>
          </Card>

          <Card className="p-8 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-landing-primary-100 rounded-lg">
                <Users className="w-6 h-6 text-landing-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-landing-text-primary">Beta Privilege</h3>
            </div>
            <p className="text-landing-text-secondary">
              Free for beta users + Private Discord for creators.
            </p>
          </Card>

          <Card className="p-8 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-landing-primary-100 rounded-lg">
                <Shield className="w-6 h-6 text-landing-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-landing-text-primary">Secure & Safe</h3>
            </div>
            <p className="text-landing-text-secondary">
              Your data stays private and secure.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};