import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const SIDEBAR_STORAGE_KEY = 'simpel_sidebar_collapsed';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const setCollapsed = (value: boolean) => {
    setCollapsedState(value);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
    } catch {
      // localStorage not available
    }
  };

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
}
