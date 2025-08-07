'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { PricingModal } from '@/components/modals/PricingModal';

export function GlobalModalProvider() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [showPricingModal, setShowPricingModal] = useState(false);

  useEffect(() => {
    // Check if pricing modal should be opened
    if (searchParams.get('modal') === 'pricing') {
      setShowPricingModal(true);
      
      // Remove the modal parameter from URL after opening
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('modal');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, pathname]);

  const handleClosePricingModal = () => {
    setShowPricingModal(false);
  };

  return (
    <>
      <PricingModal 
        open={showPricingModal} 
        onClose={handleClosePricingModal} 
      />
    </>
  );
}