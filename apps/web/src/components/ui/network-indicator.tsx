"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type NetworkStatus = "online" | "offline" | "reconnecting" | "error";

interface NetworkIndicatorProps {
  className?: string;
}

export function NetworkIndicator({ className = "" }: NetworkIndicatorProps) {
  const [status, setStatus] = useState<NetworkStatus>("online");
  const [showDetails, setShowDetails] = useState(false);

  // Simulate network status changes
  useEffect(() => {
    const handleOnline = () => setStatus("online");
    const handleOffline = () => setStatus("offline");

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Simulate periodic network checks
    const interval = setInterval(() => {
      // In a real app, you would check actual network connectivity
      // For now, we'll just simulate occasional network issues
      if (status === "online" && Math.random() < 0.05) {
        setStatus("reconnecting");
        setTimeout(() => {
          if (Math.random() < 0.8) {
            setStatus("online");
          } else {
            setStatus("error");
          }
        }, 2000);
      }
    }, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case "online":
        return {
          color: "bg-green-500",
          label: "Online",
          description: "Connected to Aurum Circle network",
        };
      case "offline":
        return {
          color: "bg-red-500",
          label: "Offline",
          description: "No internet connection",
        };
      case "reconnecting":
        return {
          color: "bg-yellow-500",
          label: "Reconnecting",
          description: "Attempting to restore connection",
        };
      case "error":
        return {
          color: "bg-red-500",
          label: "Connection Error",
          description: "Unable to connect to network",
        };
      default:
        return {
          color: "bg-gray-500",
          label: "Unknown",
          description: "Network status unknown",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`relative ${className}`}>
      <motion.button
        className="flex items-center gap-2 p-2 rounded-full bg-bg-secondary border border-border"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDetails(!showDetails)}
        aria-label="Network status"
      >
        <div className="relative">
          <div className={`w-3 h-3 rounded-full ${config.color}`} />
          {status === "reconnecting" && (
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
                {status === "reconnecting" && (
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
            {status === "error" && (
              <button
                className="w-full py-2 px-3 bg-accent-gold text-bg-primary rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                onClick={() => {
                  setStatus("reconnecting");
                  setTimeout(() => {
                    setStatus("online");
                  }, 1500);
                }}
              >
                Retry Connection
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
