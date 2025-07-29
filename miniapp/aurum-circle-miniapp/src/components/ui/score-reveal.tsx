'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ScoreRevealProps {
  score: number;
  onRevealComplete?: () => void;
}

const ScoreReveal: React.FC<ScoreRevealProps> = ({ score, onRevealComplete }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger reveal after a short delay
    const timer = setTimeout(() => {
      setIsRevealed(true);
      
      // Show confetti for high scores
      if (score >= 90) {
        setShowConfetti(true);
        
        // Hide confetti after animation
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      }
      
      // Notify parent when reveal is complete
      if (onRevealComplete) {
        setTimeout(onRevealComplete, 2000);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [score, onRevealComplete]);

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 50 }).map((_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 rounded-full"
      style={{
        backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      initial={{ opacity: 0, y: 0 }}
      animate={showConfetti ? { 
        opacity: 1, 
        y: [0, -100],
        x: [0, (Math.random() - 0.5) * 100],
        rotate: [0, 360],
      } : {}}
      transition={{
        duration: 2,
        delay: Math.random() * 0.5,
      }}
    />
  ));

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Confetti */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiParticles}
          </div>
        )}
      </AnimatePresence>

      {/* Score badge */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="relative w-48 h-48">
          {/* Badge background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          />
          
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-transparent opacity-30"
            initial={{ x: -100 }}
            animate={isRevealed ? { x: 100 } : {}}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
          
          {/* Score text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence>
              {!isRevealed ? (
                <motion.div
                  className="text-5xl font-bold text-white"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  ???
                </motion.div>
              ) : (
                <motion.div
                  className="text-5xl font-bold text-white"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                >
                  {score}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="mt-2 text-yellow-100 font-medium">Your Score</div>
          </div>
        </div>
      </motion.div>

      {/* Sparkle effect for high scores */}
      {score >= 90 && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="font-semibold text-white">Top Tier Score!</span>
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ScoreReveal;