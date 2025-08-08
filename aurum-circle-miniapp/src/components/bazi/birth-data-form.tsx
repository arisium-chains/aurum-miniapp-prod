import React, { useState } from "react";
import { BaseComponentProps } from "@/types";
import { BirthData } from "@/types/bazi";
import { getTimezoneOptions, validateBirthData } from "@/lib/bazi-utils";

interface BirthDataFormProps extends BaseComponentProps {
  initialData?: Partial<BirthData>;
  onSubmit: (birthData: BirthData) => void;
  onSkip?: () => void;
  showSkip?: boolean;
  className?: string;
}

const BirthDataForm: React.FC<BirthDataFormProps> = ({
  initialData,
  onSubmit,
  onSkip,
  showSkip = true,
  className = "",
}) => {
  const [formData, setFormData] = useState({
    date: initialData?.date?.toISOString().split("T")[0] || "",
    timezone: initialData?.timezone || "Asia/Bangkok",
    isPrivate: initialData?.isPrivate ?? true,
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timezoneOptions = getTimezoneOptions();

  const validateForm = (): boolean => {
    const birthData: BirthData = {
      date: new Date(formData.date),
      timezone: formData.timezone,
      isPrivate: formData.isPrivate,
    };

    const validation = validateBirthData(birthData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const birthData: BirthData = {
        date: new Date(formData.date),
        timezone: formData.timezone,
        isPrivate: formData.isPrivate,
      };

      onSubmit(birthData);
    } catch (error) {
      console.error("Error submitting birth data:", error);
      setErrors(["Failed to submit birth data. Please try again."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear errors when user makes changes
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
          <span className="text-xl">🔮</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Discover Your Mystic Tags
        </h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Share your birth date and time to calculate your unique BaZi profile
          and discover your mystical identity.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <span className="text-blue-600">🔒</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Privacy & Security
            </h4>
            <p className="text-xs text-blue-700 leading-relaxed">
              Your birth data is used solely for BaZi calculations and is stored
              securely. You can choose to keep it private and only show your
              mystic tags to others.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Birth Date */}
        <div>
          <label
            htmlFor="birthDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Birth Date *
          </label>
          <input
            type="date"
            id="birthDate"
            value={formData.date}
            onChange={(e) => handleInputChange("date", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            max={new Date().toISOString().split("T")[0]}
            required
          />
          {errors.some((error) => error.includes("date")) && (
            <p className="text-xs text-red-600 mt-1">
              {errors.find((error) => error.includes("date"))}
            </p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Timezone *
          </label>
          <select
            id="timezone"
            value={formData.timezone}
            onChange={(e) => handleInputChange("timezone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            {timezoneOptions.map((timezone) => (
              <option key={timezone.value} value={timezone.value}>
                {timezone.label} ({timezone.offset})
              </option>
            ))}
          </select>
        </div>

        {/* Privacy Setting */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPrivate}
                onChange={(e) =>
                  handleInputChange("isPrivate", e.target.checked)
                }
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="ml-3 text-sm text-gray-700">
                Keep birth data private (only show mystic tags)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-7">
              Others will only see your mystic tags, not your birth details
            </p>
          </div>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-red-800 mb-2">
              Please fix the following errors:
            </h4>
            <ul className="text-xs text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          {showSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Skip for Now
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Calculating...
              </div>
            ) : (
              "Calculate My Tags"
            )}
          </button>
        </div>
      </form>

      {/* Preview */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Your BaZi profile will include mystical tags like Phoenix, Dragon,
          Lotus, and more!
        </p>
      </div>
    </div>
  );
};

export default BirthDataForm;
