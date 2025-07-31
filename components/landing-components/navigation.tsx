'use client';

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const t = useTranslations();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -200; // 80px 여백 추가
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleLogin = () => {
    router.push('/signin');
  };

  const handleSignup = () => {
    router.push('/signin');
  };

  return (
    <nav className={`fixed top-0 py-2 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
      ? 'bg-landing-bg-primary/80 backdrop-blur-md border-b border-gray-200/50'
      : 'bg-transparent'
      }`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <img src="/twyn-logo-blk.svg" alt="Twyn" className="w-20 h-8" />
          </div>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-landing-text-secondary hover:text-landing-text-primary cursor-pointer transition-colors"
            >
              {t('landing.nav.features')}
            </button>
            <button
              onClick={() => scrollToSection('benefits')}
              className="text-landing-text-secondary hover:text-landing-text-primary cursor-pointer transition-colors"
            >
              {t('landing.nav.benefits')}
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-landing-text-secondary hover:text-landing-text-primary cursor-pointer transition-colors"
            >
              {t('landing.nav.pricing')}
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-landing-text-secondary hover:text-landing-text-primary cursor-pointer transition-colors"
            >
              {t('landing.nav.faq')}
            </button>
          </div>

          {/* Auth Buttons */}
          {/* <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleLogin}
              className="text-landing-text-secondary hover:text-landing-text-primary hover:bg-gray-50"
            >
              {t('landing.nav.login')}
            </Button>
            <Button
              onClick={handleSignup}
              className="bg-landing-primary-600 hover:bg-landing-primary-700 text-white px-6 py-3"
            >
              {t('landing.nav.signup')}
            </Button>
          </div> */}
        </div>
      </div>
    </nav>
  );
}; 