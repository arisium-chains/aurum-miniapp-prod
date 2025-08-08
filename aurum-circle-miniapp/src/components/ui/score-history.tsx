"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, TrendingUp, Trash2 } from "lucide-react";
import { getScoreHistory, resetScoreHistory } from "@/lib/mock-score-storage";

interface ScoreHistoryProps {
  userId: string;
  onReset?: () => void;
}

interface ScoreRecord {
  score: {
    totalScore: number;
    components: {
      symmetry: number;
      vibe: number;
      mystique: number;
    };
    processingTime: number;
    timestamp: string;
  };
  createdAt: string;
  expiresAt: string;
}

const ScoreHistory: React.FC<ScoreHistoryProps> = ({ userId, onReset }) => {
  const [history, setHistory] = useState<ScoreRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadScoreHistory();
  }, [userId]);

  const loadScoreHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const scoreHistory = await getScoreHistory(userId);
      if (scoreHistory) {
        setHistory(scoreHistory.scores);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error loading score history:", err);
      setError("Failed to load score history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await resetScoreHistory(userId);
      setHistory([]);
      if (onReset) {
        onReset();
      }
    } catch (err) {
      console.error("Error resetting score history:", err);
      setError("Failed to reset score history");
    } finally {
      setIsResetting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 55) return "Average";
    return "Below Average";
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="text-red-400 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span>Score History</span>
        </h3>
        {history.length > 0 && (
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No score history available</p>
          <p className="text-sm mt-2">
            Complete a scoring session to see your history here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {history.map((record, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        record.score.totalScore
                      )}`}
                    >
                      {record.score.totalScore}
                    </div>
                    <div className="text-sm text-gray-400">
                      {getScoreLabel(record.score.totalScore)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(record.createdAt)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Symmetry</div>
                    <div className="text-sm font-medium text-blue-400">
                      {record.score.components.symmetry}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Vibe</div>
                    <div className="text-sm font-medium text-green-400">
                      {record.score.components.vibe}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Mystique</div>
                    <div className="text-sm font-medium text-purple-400">
                      {record.score.components.mystique}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Processing: {record.score.processingTime}ms</span>
                  </div>
                  <div>Expires: {formatDate(record.expiresAt)}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default ScoreHistory;
