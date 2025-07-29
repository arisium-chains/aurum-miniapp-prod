'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LeaderboardFilterProps {
  onFilterChange: (filters: { gender?: string; university?: string }) => void;
}

const universityOptions = [
  "All Universities",
  "Chulalongkorn University",
  "Mahidol International College",
  "Thammasat Rangsit",
  "Siriraj Hospital (Mahidol)",
  "Kasetsart University",
  "KMUTT",
  "Srinakharinwirot University",
  "Silpakorn University",
  "TU Tha Prachan",
  "Bangkok University",
  "Rangsit University",
  "Sripatum University",
  "Assumption University (ABAC)"
];

const LeaderboardFilter: React.FC<LeaderboardFilterProps> = ({ onFilterChange }) => {
  const [gender, setGender] = useState<string>('');
  const [university, setUniversity] = useState<string>('All Universities');

  const handleFilterChange = () => {
    const filters: { gender?: string; university?: string } = {};
    
    if (gender) {
      filters.gender = gender;
    }
    
    if (university && university !== 'All Universities') {
      filters.university = university;
    }
    
    onFilterChange(filters);
  };

  return (
    <motion.div 
      className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Gender</label>
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                gender === 'male' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => {
                setGender(gender === 'male' ? '' : 'male');
                setTimeout(handleFilterChange, 0);
              }}
            >
              Male
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                gender === 'female' 
                  ? 'bg-pink-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => {
                setGender(gender === 'female' ? '' : 'female');
                setTimeout(handleFilterChange, 0);
              }}
            >
              Female
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                !gender 
                  ? 'bg-gray-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => {
                setGender('');
                setTimeout(handleFilterChange, 0);
              }}
            >
              All
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">University</label>
          <select
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={university}
            onChange={(e) => {
              setUniversity(e.target.value);
              setTimeout(handleFilterChange, 0);
            }}
          >
            {universityOptions.map((uni) => (
              <option key={uni} value={uni}>
                {uni}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );
};

export default LeaderboardFilter;