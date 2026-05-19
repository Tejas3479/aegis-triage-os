"use client";

import React from 'react';
import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-8">The page you are looking for does not exist.</p>
      <Link href="/">
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded">Go Home</button>
      </Link>
    </div>
  );
}
