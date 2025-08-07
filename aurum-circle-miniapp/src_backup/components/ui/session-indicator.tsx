"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMiniKit } from "@/components/providers/minikit-provider";

interface SessionIndicatorProps {
  className?: string;
}

export function SessionIndicator({ className = "" }: SessionIndicatorProps) {
  const { isInstalled, isInitialized, user } = useMiniKit();
  const [showDetails, setShowDetails] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  // Simulate session expiry
  useEffect(() => {
    if (user) {
      // Set expiry to 1 hour from now
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 1);
      setSessionExpiry(expiry);

      // Update expiry every minute
      const interval = setInterval(() => {
        const newExpiry = new Date();
        newExpiry.setHours(newExpiry.getHours() + 1);
        setSessionExpiry(newExpiry);
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [user]);

  const formatExpiryTime = () => {
    if (!sessionExpiry) return "";

    const now = new Date();
    const diffInMinutes = Math.floor(
      (sessionExpiry.getTime() - now.getTime()) / 60000
    );

    if (diffInMinutes < 1) return "Expires soon";
    if (diffInMinutes < 60) return `Expires in ${diffInMinutes}m`;

    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    return `Expires in ${hours}h ${minutes}m`;
  };

  const getSessionStatus = () => {
    if (!isInstalled) {
      return {
        status: "not-installed",
        color: "bg-gray-500",
        label: "World App Required",
        description: "Open in World App to authenticate",
      };
    }

    if (!isInitialized) {
      return {
        status: "initializing",
        color: "bg-yellow-500",
        label: "Initializing",
        description: "Setting up authentication",
      };
    }

    if (!user) {
      return {
        status: "not-authenticated",
        color: "bg-red-500",
        label: "Not Authenticated",
        description: "Verify World ID to access",
      };
    }

    return {
      status: "authenticated",
      color: "bg-green-500",
      label: "Authenticated",
      description: "Session active and secure",
    };
  };

  const config = getSessionStatus();

  return (
    <div className={`relative ${className}`}>
      <motion.button
        className="flex items-center gap-2 p-2 rounded-full bg-bg-secondary border border-border"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        aria-label="Session status"
      >
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          {config.status === "initializing" && (
            <motion.div
              className={`absolute inset-0 rounded-full ${config.color} opacity-50`}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        <span className="text-text-secondary text-sm hidden md:inline">
          {config.label}
        </span>
      </motion.button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-64 p-4 bg-bg-secondary border border-border rounded-lg shadow-lg z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                {config.status === "initializing" && (
                  <motion.div
                    className={`absolute inset-0 rounded-full ${config.color} opacity-50`}
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <h3 className="font-medium text-text-primary">{config.label}</h3>
            </div>

            <p className="text-text-secondary text-sm mb-3">
              {config.description}
            </p>

            {user && sessionExpiry && (
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Session</span>
                  <span className="text-text-primary">
                    {formatExpiryTime()}
                  </span>
                </div>
                <div className="w-full bg-bg-tertiary rounded-full h-2">
                  <motion.div
                    className="bg-accent-gold h-2 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 3600, ease: "linear" }}
                  />
                </div>
              </div>
            )}

            {config.status === "not-authenticated" && (
              <button
                className="w-full py-2 px-3 bg-accent-gold text-bg-primary rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                onClick={() => {
                  // In a real app, this would trigger World ID verification
                  // For now, we'll just simulate authentication
                  window.location.href = "/";
                }}
              >
                Verify World ID
              </button>
            )}

            {user && (
              <button
                className="w-full py-2 px-3 bg-bg-tertiary text-text-primary rounded-lg text-sm font-medium hover:bg-border-light transition-colors mt-2"
                onClick={() => {
                  // In a real app, this would log out the user
                  // For now, we'll just simulate logout
                  localStorage.removeItem("walletAddress");
                  window.location.href = "/";
                }}
              >
                Log Out
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
