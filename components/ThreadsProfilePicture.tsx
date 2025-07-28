'use client';

import { useThreadsProfilePicture } from '@/hooks/useThreadsProfilePicture';
import { cn } from '@/lib/utils';

interface ThreadsProfilePictureProps {
  socialId: string | null;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function ThreadsProfilePicture({ 
  socialId, 
  alt = "Profile picture", 
  className = "w-8 h-8 rounded-full",
  fallback = null
}: ThreadsProfilePictureProps) {
  const { profilePictureUrl, loading, error } = useThreadsProfilePicture(socialId);

  // Don't render anything while loading or if there's an error
  if (loading || error || !profilePictureUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img 
      src={profilePictureUrl} 
      alt={alt} 
      className={cn(className)}
      onError={(e) => {
        // Hide the image if it fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}