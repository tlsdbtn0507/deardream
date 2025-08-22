// app/news/layout.tsx
'use client';

import React from 'react';
import { FeedProvider } from '@/components/context/feedContext';

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <FeedProvider>{children}</FeedProvider>;
}