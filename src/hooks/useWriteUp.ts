
"use client";

import * as React from 'react'; // Changed import
import { WriteUpContext } from '@/contexts/WriteUpContext';

export const useWriteUp = () => {
  const context = React.useContext(WriteUpContext); // Changed useContext
  if (context === undefined) {
    throw new Error('useWriteUp must be used within a WriteUpProvider');
  }
  return context;
};
