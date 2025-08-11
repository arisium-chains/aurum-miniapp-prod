'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { initializeMiniKit, isInWorldApp } from '@/lib/minikit';

interface MiniKitUser {
  id: string;
  [key: string]: unknown;
}

interface MiniKitContextType {
  isInstalled: boolean;
  isInitialized: boolean;
  user: MiniKitUser | null;
}

const MiniKitContext = createContext<MiniKitContextType>({
  isInstalled: false,
  isInitialized: false,
  user: null,
});

export function MiniKitProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<MiniKitUser | null>(null);

  useEffect(() => {
    // Initialize MiniKit when component mounts
    const minikit = initializeMiniKit();

    if (minikit) {
      setIsInitialized(true);
      setIsInstalled(isInWorldApp());

      // Temporary placeholder - actual MiniKit event handling would go here
      // when MiniKit is properly integrated
      setIsInstalled(isInWorldApp());
    }

    // Return undefined if no cleanup is needed
    return undefined;
  }, []);

  return (
    <MiniKitContext.Provider value={{ isInstalled, isInitialized, user }}>
      {children}
    </MiniKitContext.Provider>
  );
}

export const useMiniKit = () => {
  const context = useContext(MiniKitContext);
  if (!context) {
    throw new Error('useMiniKit must be used within a MiniKitProvider');
  }
  return context;
};
