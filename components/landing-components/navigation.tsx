'use client';

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export const Navigation = () => {
  return (
    <nav className="fixed top-0 py-2 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-landing-primary-600 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <span className="font-semibold text-landing-text-primary">Twyn</span>
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-1 text-landing-text-secondary hover:text-landing-text-primary cursor-pointer transition-colors">
              <span>Products</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-1 text-landing-text-secondary hover:text-landing-text-primary cursor-pointer transition-colors">
              <span>Services</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <span className="text-landing-text-secondary hover:text-landing-text-primary cursor-pointer transition-colors">Pricing</span>
            <div className="flex items-center space-x-1 text-landing-text-secondary hover:text-landing-text-primary cursor-pointer transition-colors">
              <span>Resources</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <span className="text-landing-text-secondary hover:text-landing-text-primary cursor-pointer transition-colors">About</span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="text-landing-text-secondary hover:text-landing-text-primary hover:bg-gray-50">
              Log in
            </Button>
            <Button className="bg-landing-primary-600 hover:bg-landing-primary-700 text-white px-6 py-3">
              Sign up
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}; 