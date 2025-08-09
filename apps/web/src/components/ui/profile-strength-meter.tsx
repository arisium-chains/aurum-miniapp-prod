'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProfileStrengthMeterProps {
  score: number; // 0-100
  campusRank?: number; // Percentile rank
  maxScore?: number; // Maximum possible score (default: 100)
}

const ProfileStrengthMeter: React.FC<ProfileStrengthMeterProps> = ({ 
  score, 
  campusRank,
  maxScore = 100
}) => {
  // Calculate percentage
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  
  // Determine color based on strength
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm font-medium">
        <span>Profile Strength</span>
        <span>{score}/{maxScore}</span>
      </div>
      
      {/* Progress bar */}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      {/* Campus rank */}
      {campusRank !== undefined && (
        <div className="text-xs text-gray-500">
          Campus Rank: Top {campusRank}%
        </div>
      )}
      
      {/* Tips for improvement */}
      <div className="text-xs text-gray-500 mt-2">
        {percentage >= 80 ? (
          <span className="text-green-600">Excellent! Your profile is strong.</span>
        ) : percentage >= 60 ? (
          <span>Good start! Add more details to improve your profile.</span>
        ) : (
          <span>Boost your profile by adding a clear photo and completing your bio.</span>
        )}
      </div>
    </div>
  );
};

export default ProfileStrengthMeter;