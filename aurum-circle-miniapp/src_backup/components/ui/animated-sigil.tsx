"use client";

import { motion } from "framer-motion";

interface AnimatedSigilProps {
  size?: number;
  className?: string;
}

export function AnimatedSigil({
  size = 96,
  className = "",
}: AnimatedSigilProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: 0.5,
      }}
    >
      {/* Outer circle with pulse animation */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-accent-gold"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner circle */}
      <motion.div
        className="absolute inset-4 rounded-full border border-accent-gold/50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.8,
        }}
      />

      {/* Center symbol */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {/* Custom sigil symbol - could be replaced with an SVG */}
        <div className="relative w-1/2 h-1/2">
          <motion.div
            className="absolute inset-0 border-t-2 border-l-2 border-accent-gold"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute inset-0 border-b-2 border-r-2 border-accent-gold"
            initial={{ rotate: 0 }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-accent-gold rounded-full"
          style={{
            top: `${20 + Math.sin((i * 60 * Math.PI) / 180) * 30}%`,
            left: `${20 + Math.cos((i * 60 * Math.PI) / 180) * 30}%`,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
}
