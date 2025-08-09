"use client";

import { motion } from "framer-motion";
import { WorldIDButton } from "@/components/auth/world-id-button";
import { ConnectWalletButton } from "@/components/ui/connect-wallet-button";
import { ParticleBackground } from "@/components/ui/particle-background";
import { AnimatedSigil } from "@/components/ui/animated-sigil";
import { NetworkIndicator } from "@/components/ui/network-indicator";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { useEffect, useState } from "react";
import { useMiniKit } from "@/components/providers/minikit-provider";

export default function SplashPage() {
  const [showWalletButton, setShowWalletButton] = useState(false);
  const { user } = useMiniKit();

  // Show wallet button after World ID verification
  useEffect(() => {
    if (user) {
      setShowWalletButton(true);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Status indicators */}
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <NetworkIndicator />
        <SessionIndicator />
      </div>

      {/* Animated particle background */}
      <ParticleBackground density={0.3} className="z-0" />

      {/* Main content */}
      <motion.div
        className="relative z-10 text-center max-w-md mx-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        {/* Logo/Title */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <h1 className="text-5xl md:text-6xl font-playfair font-bold text-text-primary mb-4">
            Aurum Circle
          </h1>
          <p className="text-text-secondary text-lg font-inter">
            Exclusive dating for Bangkok students
          </p>
        </motion.div>

        {/* Animated sigil */}
        <motion.div
          className="mx-auto mb-12"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.5, delay: 1.5 }}
        >
          <AnimatedSigil size={96} />
        </motion.div>

        {/* CTA Buttons */}
        {!showWalletButton ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2 }}
          >
            <WorldIDButton>Connect World ID to Enter</WorldIDButton>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 2 }}
          >
            <ConnectWalletButton>
              Connect Wallet to Continue
            </ConnectWalletButton>
          </motion.div>
        )}

        {/* Subtitle */}
        <motion.p
          className="text-text-muted text-sm mt-6 font-inter"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2.5 }}
        >
          Prove your humanity. Join the circle.
        </motion.p>
      </motion.div>

      {/* Bottom fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
    </div>
  );
}
