'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface ScoreBreakdownProps {
  facialScore: number;
  universityBonus: number;
  nftBonus: number;
  totalScore: number;
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ 
  facialScore, 
  universityBonus, 
  nftBonus,
  totalScore
}) => {
  const [showInfo, setShowInfo] = useState(false);
  
  const components = [
    { label: 'Facial Score', value: facialScore, color: 'bg-blue-500' },
    { label: 'University Bonus', value: universityBonus, color: 'bg-green-500' },
    { label: 'NFT Bonus', value: nftBonus, color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Score Breakdown</h3>
        <div className="relative">
          <Info 
            className="w-5 h-5 text-gray-400 cursor-pointer" 
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          />
          {showInfo && (
            <div className="absolute right-0 top-6 w-64 p-3 bg-gray-900 text-xs rounded-lg shadow-lg z-10">
              <p className="mb-2">Your score is calculated based on:</p>
              <ul className="space-y-1">
                <li>• Facial attractiveness analysis</li>
                <li>• University prestige ranking</li>
                <li>• NFT holder status (males only)</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        {components.map((component, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${component.color}`} />
              <span className="text-gray-300">{component.label}</span>
            </div>
            <motion.span 
              className="font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              +{component.value}
            </motion.span>
          </div>
        ))}
        
        <div className="border-t border-gray-700 pt-4 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Score</span>
            <motion.span 
              className="text-2xl font-bold text-yellow-400"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {totalScore}
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreBreakdown;