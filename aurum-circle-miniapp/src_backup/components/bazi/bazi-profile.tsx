import React from "react";
import { BaseComponentProps } from "@/types";
import { BaZiData, ElementBalance } from "@/types/bazi";
import { getElementColor, getElementEmoji } from "@/lib/bazi-utils";
import MysticTag from "./mystic-tag";

interface BaZiProfileProps extends BaseComponentProps {
  baziData: BaZiData;
  showDetails?: boolean;
  onTagClick?: (tagId: string) => void;
  className?: string;
}

const BaZiProfile: React.FC<BaZiProfileProps> = ({
  baziData,
  showDetails = false,
  onTagClick,
  className = "",
}) => {
  const { heavenlyStems, earthlyBranches, elements, mysticTags } = baziData;

  const renderElementBalance = (balance: ElementBalance) => {
    const maxValue = Math.max(...Object.values(balance));

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Element Balance</h4>
        <div className="space-y-2">
          {Object.entries(balance).map(([element, value]) => {
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            const color = getElementColor(element as keyof typeof balance);
            const emoji = getElementEmoji(element as keyof typeof balance);

            return (
              <div key={element} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-20">
                  <span className="text-sm">{emoji}</span>
                  <span className="text-xs font-medium capitalize text-gray-600">
                    {element}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-medium text-gray-600 min-w-[2rem]"
                      style={{ color }}
                    >
                      {value}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBaZiChart = () => (
    <div className="grid grid-cols-2 gap-4 text-center">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
        <h4 className="text-xs font-medium text-purple-700 mb-2">
          Heavenly Stems
        </h4>
        <div className="flex justify-center gap-1">
          {heavenlyStems.map((stem, index) => (
            <span
              key={index}
              className="text-lg font-bold text-purple-800 bg-white/70 px-2 py-1 rounded"
            >
              {stem}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
        <h4 className="text-xs font-medium text-green-700 mb-2">
          Earthly Branches
        </h4>
        <div className="flex justify-center gap-1">
          {earthlyBranches.map((branch, index) => (
            <span
              key={index}
              className="text-lg font-bold text-green-800 bg-white/70 px-2 py-1 rounded"
            >
              {branch}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mystic Tags */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Mystic Tags
          </h3>
          <span className="text-sm text-gray-500">
            {mysticTags.length} {mysticTags.length === 1 ? "tag" : "tags"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {mysticTags.map((tag) => (
            <MysticTag
              key={tag.id}
              tag={tag}
              size="md"
              showDescription={showDetails}
              onClick={() => onTagClick?.(tag.id)}
              className="hover:shadow-md"
            />
          ))}
        </div>
      </div>

      {/* Element Balance */}
      {renderElementBalance(elements)}

      {/* BaZi Chart */}
      {showDetails && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900">BaZi Chart</h4>
          {renderBaZiChart()}

          {/* Birth Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Birth Details
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Year:</span>
                <div className="font-medium">{baziData.birthYear}</div>
              </div>
              <div>
                <span className="text-gray-500">Month:</span>
                <div className="font-medium">{baziData.birthMonth}</div>
              </div>
              <div>
                <span className="text-gray-500">Day:</span>
                <div className="font-medium">{baziData.birthDay}</div>
              </div>
              <div>
                <span className="text-gray-500">Hour:</span>
                <div className="font-medium">{baziData.birthHour}:00</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BaZiProfile;
