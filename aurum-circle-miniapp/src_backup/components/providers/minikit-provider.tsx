"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { initializeMiniKit, isInWorldApp } from "@/lib/minikit";

interface MiniKitContextType {
  isInstalled: boolean;
  isInitialized: boolean;
  user: unknown | null;
  error: string | null;
}

const MiniKitContext = createContext<MiniKitContextType>({
  isInstalled: false,
  isInitialized: false,
  user: null,
  error: null,
});

export function MiniKitProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<unknown | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let minikit: unknown = null;

    const initializeMiniKitSafely = async () => {
      try {
        // Check if initializeMiniKit is available and is a function
        if (typeof initializeMiniKit !== "function") {
          throw new Error(
            "initializeMiniKit is not available or is not a function"
          );
        }

        // Initialize MiniKit when component mounts
        minikit = initializeMiniKit();

        if (minikit && isMounted) {
          setIsInitialized(true);
          setIsInstalled(isInWorldApp());

          // Listen for user changes
          const handleUserChange = (userData: unknown) => {
            if (isMounted) {
              setUser(userData);
            }
          };

          // Set up event listeners if available
          if (typeof window !== "undefined" && window.addEventListener) {
            window.addEventListener("minikit:user", handleUserChange);

            return () => {
              window.removeEventListener("minikit:user", handleUserChange);
            };
          }
        }
      } catch (err) {
        console.error("Failed to initialize MiniKit:", err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Unknown error occurred"
          );
        }
      }
    };

    initializeMiniKitSafely();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <MiniKitContext.Provider
      value={{ isInstalled, isInitialized, user, error }}
    >
      {children}
    </MiniKitContext.Provider>
  );
}

export const useMiniKit = () => {
  const context = useContext(MiniKitContext);
  if (!context) {
    throw new Error("useMiniKit must be used within a MiniKitProvider");
  }
  return context;
};
