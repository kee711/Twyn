import { useState, useEffect } from 'react';

interface ProfilePictureCache {
  [socialId: string]: {
    url: string | null;
    timestamp: number;
  };
}

// Cache for 5 minutes (300,000 ms)
const CACHE_DURATION = 5 * 60 * 1000;
const cache: ProfilePictureCache = {};

export function useThreadsProfilePicture(socialId: string | null) {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socialId) {
      setProfilePictureUrl(null);
      return;
    }

    const fetchProfilePicture = async () => {
      // Check cache first
      const cached = cache[socialId];
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        setProfilePictureUrl(cached.url);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/threads/profile-picture?socialId=${encodeURIComponent(socialId)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile picture');
        }

        const data = await response.json();
        const url = data.profilePictureUrl;

        // Cache the result
        cache[socialId] = {
          url,
          timestamp: now
        };

        setProfilePictureUrl(url);
      } catch (err) {
        console.error('Error fetching profile picture:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setProfilePictureUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfilePicture();
  }, [socialId]);

  return { profilePictureUrl, loading, error };
}

// Utility function to clear cache for a specific social ID
export function clearProfilePictureCache(socialId: string) {
  delete cache[socialId];
}

// Utility function to clear all cache
export function clearAllProfilePictureCache() {
  Object.keys(cache).forEach(key => delete cache[key]);
}