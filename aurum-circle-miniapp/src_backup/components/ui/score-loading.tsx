"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2, Clock } from "lucide-react";

interface ScoreLoadingProps {
  message?: string;
  processingTime?: number;
}

const ScoreLoading: React.FC<ScoreLoadingProps> = ({
  message = "Analyzing your image...",
  processingTime,
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {/* Main loading animation */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Outer ring */}
        <motion.div
          className="w-32 h-32 border-4 border-gray-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute inset-4 border-4 border-yellow-500 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
        </div>
      </motion.div>

      {/* Loading message */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-gray-200 mb-2">{message}</h3>
        <p className="text-gray-400">
          Our AI is analyzing your facial features to calculate your score
        </p>
      </motion.div>

      {/* Progress indicators */}
      <motion.div
        className="flex space-x-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-yellow-400 rounded-full"
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Processing time indicator */}
      {processingTime && (
        <motion.div
          className="flex items-center space-x-2 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Clock className="w-4 h-4" />
          <span>Processing: {processingTime}ms</span>
        </motion.div>
      )}

      {/* Animated dots */}
      <motion.div
        className="flex space-x-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-1 bg-gray-400 rounded-full"
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1.4,
              delay: i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default ScoreLoading;
