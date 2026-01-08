import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  // Fix: Added React import to resolve the React namespace for ReactNode
  icon: React.ReactNode;
  path: string;
}

export interface ReportItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  implemented?: boolean;
}

export interface AnalysisData {
  category: string;
  salesRate: number;
  stockVolume: number;
  salesVolume: number;
}
