import React from "react";
import { BaseComponentProps } from "@/types";
import { getElementColor, getElementEmoji } from "@/lib/bazi-utils";

interface MysticTagProps extends BaseComponentProps {
  tag: {
    id: string;
    name: string;
    type: "celestial" | "terrestrial" | "elemental";
    element: "fire" | "earth" | "metal" | "water" | "wood";
    description: string;
    emoji: string;
  };
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  compatibility?: Record<string, number>;
  onClick?: () => void;
  isSelected?: boolean;
}

const MysticTag: React.FC<MysticTagProps> = ({
  tag,
  size = "md",
  showDescription = false,
  compatibility,
  onClick,
  isSelected = false,
  className = "",
}) => {
  const elementColor = getElementColor(tag.element);
  const elementEmoji = getElementEmoji(tag.element);

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-3",
  };

  const typeColors = {
    celestial: "from-purple-500 to-pink-500",
    terrestrial: "from-green-500 to-emerald-500",
    elemental: "from-blue-500 to-cyan-500",
  };

  const borderColors = {
    celestial: "border-purple-200",
    terrestrial: "border-green-200",
    elemental: "border-blue-200",
  };

  return (
    <div
      className={`
        relative group cursor-pointer transition-all duration-200 hover:scale-105
        ${sizeClasses[size]}
        ${borderColors[tag.type]}
        ${isSelected ? "ring-2 ring-offset-2 ring-primary" : ""}
        ${onClick ? "hover:shadow-lg" : ""}
        bg-white/80 backdrop-blur-sm rounded-lg border
        ${className}
      `}
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${elementColor}10, ${elementColor}05)`,
        borderColor: elementColor,
      }}
    >
      {/* Tag Content */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0">
          <span className="text-lg">{tag.emoji}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{tag.name}</h3>
            <span className="text-xs text-gray-500">•</span>
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${elementColor}20`,
                color: elementColor,
              }}
            >
              {tag.element}
            </span>
          </div>

          {showDescription && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {tag.description}
            </p>
          )}
        </div>
      </div>

      {/* Compatibility Score */}
      {compatibility && Object.keys(compatibility).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Compatibility</span>
            <div className="flex items-center gap-1">
              <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${Object.values(compatibility)[0]}%`,
                    backgroundColor: elementColor,
                  }}
                />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: elementColor }}
              >
                {Object.values(compatibility)[0]}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hover Effect */}
      {onClick && (
        <div className="absolute inset-0 bg-black/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <span className="text-xs text-gray-700 font-medium">
            View Details
          </span>
        </div>
      )}

      {/* Type Badge */}
      <div
        className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
          tag.type === "celestial"
            ? "bg-purple-500"
            : tag.type === "terrestrial"
            ? "bg-green-500"
            : "bg-blue-500"
        }`}
      />
    </div>
  );
};

export default MysticTag;
