"use client";

import React from 'react';

export default function DevDocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="container mx-auto py-4">
      {children}
    </div>
  )
} 