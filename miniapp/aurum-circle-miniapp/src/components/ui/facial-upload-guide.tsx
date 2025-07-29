'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, X } from 'lucide-react';

interface FacialUploadGuideProps {
  onNext: () => void;
}

const FacialUploadGuide: React.FC<FacialUploadGuideProps> = ({ onNext }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Positioning",
      description: "Use your front camera and face the camera directly",
      icon: <Camera className="w-12 h-12 text-blue-400" />
    },
    {
      title: "Lighting",
      description: "Ensure neutral lighting with no harsh shadows on your face",
      icon: <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"></div>
    },
    {
      title: "Expression",
      description: "Maintain a neutral expression with your mouth closed",
      icon: <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-gray-800"></div>
      </div>
    },
    {
      title: "Preparation",
      description: "Remove masks, sunglasses, and ensure clear visibility of your face",
      icon: <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
        <X className="w-6 h-6 text-red-400" />
      </div>
    }
  ];

  return (
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Facial Upload Guide</h2>
          <p className="text-gray-400">
            Follow these tips for the best scoring results
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((s, index) => (
            <motion.div
              key={index}
              className={`flex items-start space-x-4 p-4 rounded-xl ${
                step === index ? 'bg-gray-700' : 'bg-gray-900'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex-shrink-0 mt-1">
                {s.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{s.title}</h3>
                <p className="text-gray-400">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-8">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  step === index ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <div className="flex space-x-3">
            {step > 0 && (
              <button
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                onClick={() => setStep(step - 1)}
              >
                Back
              </button>
            )}
            
            {step < steps.length - 1 ? (
              <button
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
                onClick={() => setStep(step + 1)}
              >
                Next
              </button>
            ) : (
              <button
                className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition-colors"
                onClick={onNext}
              >
                Got it!
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FacialUploadGuide;