'use client';

import React from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-transition-enter min-h-[inherit] flex flex-col flex-1">
      {children}
    </div>
  );
}
