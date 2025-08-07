"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { SignalButton } from "./SignalButton";
import MysticTag from "@/components/bazi/mystic-tag";

interface Profile {
  id: string;
  name: string;
  age: number;
  university: string;
  photos: string[];
  bio: string;
  vibes: string[];
  score: number;
  isBlurred: boolean;
  hasSignal: boolean;
  mysticTags?: Array<{
    id: string;
    name: string;
    type: "celestial" | "terrestrial" | "elemental";
    element: "fire" | "earth" | "metal" | "water" | "wood";
    description: string;
    emoji: string;
  }>;
}

interface ProfileCardProps {
  profile: Profile;
  onSignal: (signalType: string) => void;
  isActive: boolean;
  dragDirection?: "left" | "right" | "up" | null;
}

const UNIVERSITY_NAMES = {
  bu: "Bangkok University",
  cu: "Chulalongkorn University",
  tu: "Thammasat University",
  ku: "Kasetsart University",
  mu: "Mahidol University",
};

const VIBE_EMOJIS = {
  academic: "📚",
  creative: "🎨",
  athletic: "💪",
  social: "🦋",
  mysterious: "🎭",
  adventurous: "🗺️",
  chill: "😌",
  entrepreneur: "🚀",
};

export function ProfileCard({
  profile,
  onSignal,
  isActive,
  dragDirection,
}: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showFullBio, setShowFullBio] = useState(false);

  const hasMultiplePhotos = profile.photos.length > 1;
  const currentPhoto =
    profile.photos[currentPhotoIndex] || "/placeholder-profile.svg";
  const universityName =
    UNIVERSITY_NAMES[profile.university as keyof typeof UNIVERSITY_NAMES] ||
    profile.university;

  const handlePhotoNext = () => {
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length);
    }
  };

  const handlePhotoPrev = () => {
    if (hasMultiplePhotos) {
      setCurrentPhotoIndex((prev) =>
        prev === 0 ? profile.photos.length - 1 : prev - 1
      );
    }
  };

  const ScoreDisplay = () => (
    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
        <span className="text-white text-sm font-medium">{profile.score}</span>
      </div>
    </div>
  );

  const SignalOverlay = () =>
    profile.hasSignal && (
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="w-20 h-20 bg-accent/90 rounded-full flex items-center justify-center backdrop-blur-sm">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-3xl"
          >
            ✨
          </motion.div>
        </div>
      </motion.div>
    );

  return (
    <div className="relative w-full h-full bg-card rounded-3xl overflow-hidden shadow-2xl">
      {/* Main Photo */}
      <div className="relative h-3/5">
        <div className="relative w-full h-full">
          <Image
            src={currentPhoto}
            alt={`${profile.name}'s photo`}
            fill
            className={`object-cover transition-all duration-300 ${
              profile.isBlurred ? "blur-md" : ""
            }`}
            priority={isActive}
          />

          {/* Blur overlay for mystery profiles */}
          {profile.isBlurred && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          )}

          {/* Photo navigation (only if multiple photos and not blurred) */}
          {hasMultiplePhotos && !profile.isBlurred && (
            <>
              <button
                onClick={handlePhotoPrev}
                className="absolute left-0 top-0 w-1/3 h-full bg-transparent z-10"
                aria-label="Previous photo"
              />
              <button
                onClick={handlePhotoNext}
                className="absolute right-0 top-0 w-1/3 h-full bg-transparent z-10"
                aria-label="Next photo"
              />

              {/* Photo indicators */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-1">
                {profile.photos.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentPhotoIndex ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <ScoreDisplay />
        <SignalOverlay />

        {/* Drag direction indicator overlay */}
        {dragDirection && (
          <div
            className={`
            absolute inset-0 transition-all duration-200
            ${dragDirection === "left" ? "bg-red-500/30" : ""}
            ${dragDirection === "right" ? "bg-green-500/30" : ""}
            ${dragDirection === "up" ? "bg-accent/30" : ""}
          `}
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="h-2/5 p-6 flex flex-col justify-between">
        {/* Name and Age */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2
              className={`text-2xl font-bold font-playfair ${
                profile.isBlurred ? "blur-sm" : "text-text-primary"
              }`}
            >
              {profile.isBlurred ? "••••••" : profile.name}
            </h2>
            <p className="text-text-secondary text-lg">
              {profile.isBlurred ? "••" : profile.age} • {universityName}
            </p>
          </div>

          {/* Signal button for blurred profiles */}
          {profile.isBlurred && (
            <SignalButton onSignal={onSignal} disabled={!isActive} />
          )}
        </div>

        {/* Vibes */}
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.vibes.slice(0, 3).map((vibe, index) => (
            <div
              key={vibe}
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-all
                ${
                  profile.isBlurred
                    ? "bg-border/50 text-text-muted blur-sm"
                    : "bg-accent/20 text-accent border border-accent/30"
                }
              `}
            >
              <span className="mr-1">
                {VIBE_EMOJIS[vibe as keyof typeof VIBE_EMOJIS] || "✨"}
              </span>
              {profile.isBlurred ? "•••••" : vibe}
            </div>
          ))}
          {profile.vibes.length > 3 && (
            <div className="px-3 py-1 rounded-full text-sm font-medium bg-border/50 text-text-muted">
              +{profile.vibes.length - 3}
            </div>
          )}
        </div>

        {/* Mystic Tags */}
        {profile.mysticTags && profile.mysticTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.mysticTags.slice(0, 3).map((tag) => (
              <MysticTag key={tag.id} tag={tag} size="sm" />
            ))}
            {profile.mysticTags.length > 3 && (
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-border/50 text-text-muted">
                +{profile.mysticTags.length - 3}
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="flex-1">
            <p
              className={`text-text-secondary text-sm leading-relaxed ${
                profile.isBlurred ? "blur-sm" : ""
              } ${showFullBio ? "" : "line-clamp-3"}`}
            >
              {profile.isBlurred
                ? "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"
                : profile.bio}
            </p>
            {profile.bio.length > 150 && !profile.isBlurred && (
              <button
                onClick={() => setShowFullBio(!showFullBio)}
                className="text-accent text-sm mt-1 hover:text-accent/80 transition-colors"
              >
                {showFullBio ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
