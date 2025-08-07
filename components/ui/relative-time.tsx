'use client';

import { useEffect, useState } from 'react';

interface RelativeTimeProps {
  timestamp: string | Date;
  className?: string;
}

export function RelativeTime({ timestamp, className = '' }: RelativeTimeProps) {
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    const calculateRelativeTime = () => {
      const now = new Date();
      const then = new Date(timestamp);
      const diffInMs = now.getTime() - then.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const diffInWeeks = Math.floor(diffInDays / 7);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        if (diffInMinutes < 1) {
          setRelativeTime('방금 전');
        } else {
          setRelativeTime(`${diffInMinutes}분 전`);
        }
      } else if (diffInHours < 24) {
        setRelativeTime(`${diffInHours}시간 전`);
      } else if (diffInDays < 7) {
        setRelativeTime(`${diffInDays}일 전`);
      } else {
        setRelativeTime(`${diffInWeeks}주 전`);
      }
    };

    calculateRelativeTime();
    const interval = setInterval(calculateRelativeTime, 60000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return <span className={className}>{relativeTime}</span>;
}