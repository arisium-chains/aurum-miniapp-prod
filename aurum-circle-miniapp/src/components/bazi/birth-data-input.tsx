"use client";

import { useState } from "react";
import { BirthData } from "@/types/bazi";
import { getTimezoneOptions, validateBirthData } from "@/lib/bazi-utils";
import { BaseComponentProps } from "@/types";

interface BirthDataInputProps extends BaseComponentProps {
  value?: BirthData;
  onChange?: (birthData: BirthData) => void;
  showPrivacyNotice?: boolean;
  required?: boolean;
  className?: string;
}

const timezoneOptions = getTimezoneOptions();

export function BirthDataInput({
  value,
  onChange,
  showPrivacyNotice = true,
  required = false,
  className = "",
}: BirthDataInputProps) {
  const [internalValue, setInternalValue] = useState<BirthData>(
    value || {
      date: new Date(),
      timezone: "Asia/Bangkok",
      isPrivate: true,
    }
  );

  const [errors, setErrors] = useState<string[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  const handleChange = (field: keyof BirthData, newValue: any) => {
    const updatedValue = {
      ...internalValue,
      [field]: newValue,
    };

    setInternalValue(updatedValue);
    onChange?.(updatedValue);

    // Validate on change
    const validation = validateBirthData(updatedValue);
    setErrors(validation.errors);
    setShowValidation(validation.errors.length > 0);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    handleChange("date", date);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number);
    const newDate = new Date(internalValue.date);
    newDate.setHours(hours, minutes || 0);
    handleChange("date", newDate);
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange("timezone", e.target.value);
  };

  const handlePrivacyToggle = () => {
    handleChange("isPrivate", !internalValue.isPrivate);
  };

  const getDateString = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const getTimeString = (date: Date): string => {
    return date.toTimeString().slice(0, 5);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Date Input */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Birth Date {required && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="date"
              value={getDateString(internalValue.date)}
              onChange={handleDateChange}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
              max={getDateString(new Date())}
            />
          </div>
          <div>
            <input
              type="time"
              value={getTimeString(internalValue.date)}
              onChange={handleTimeChange}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Timezone Input */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Timezone {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={internalValue.timezone}
          onChange={handleTimezoneChange}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {timezoneOptions.map((timezone) => (
            <option key={timezone.value} value={timezone.value}>
              {timezone.label} ({timezone.offset})
            </option>
          ))}
        </select>
      </div>

      {/* Privacy Toggle */}
      <div className="flex items-center justify-between p-4 bg-card-muted rounded-lg">
        <div>
          <h4 className="font-medium text-text-primary">Birth Data Privacy</h4>
          <p className="text-sm text-text-muted">
            {internalValue.isPrivate
              ? "Your birth data is private and used only for BaZi calculations"
              : "Your birth data is visible to other users for compatibility matching"}
          </p>
        </div>
        <button
          onClick={handlePrivacyToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            internalValue.isPrivate ? "bg-border" : "bg-primary"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
              internalValue.isPrivate ? "translate-x-1" : "translate-x-6"
            }`}
          />
        </button>
      </div>

      {/* Validation Errors */}
      {showValidation && errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-1">
            Validation Errors
          </h4>
          <ul className="text-xs text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Privacy Notice */}
      {showPrivacyNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 text-lg">ℹ️</div>
            <div className="text-sm">
              <h4 className="font-medium text-blue-800 mb-1">
                About BaZi Calculations
              </h4>
              <p className="text-blue-700 leading-relaxed">
                BaZi (Eight Characters) is an ancient Chinese astrological
                system that uses your birth data to determine your cosmic
                elements and personality traits. Your information is used solely
                for generating your unique mystic tags and compatibility
                insights.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {internalValue.date && (
        <div className="p-4 bg-card-muted rounded-lg">
          <h4 className="font-medium text-text-primary mb-2">BaZi Preview</h4>
          <div className="text-sm text-text-muted space-y-1">
            <div>Birth Date: {internalValue.date.toLocaleDateString()}</div>
            <div>Timezone: {internalValue.timezone}</div>
            <div>Privacy: {internalValue.isPrivate ? "Private" : "Public"}</div>
            <div className="text-xs text-text-muted mt-2">
              BaZi calculation will be performed when you submit your profile.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface BirthDataSummaryProps extends BaseComponentProps {
  birthData?: BirthData;
  isPrivate?: boolean;
  showFullDate?: boolean;
  className?: string;
}

export function BirthDataSummary({
  birthData,
  isPrivate = true,
  showFullDate = false,
  className = "",
}: BirthDataSummaryProps) {
  if (!birthData) {
    return (
      <div className={`text-sm text-text-muted ${className}`}>
        Birth data not provided
      </div>
    );
  }

  const displayDate = isPrivate
    ? "Private"
    : showFullDate
    ? birthData.date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : birthData.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">Birth:</span>
        <span
          className={`text-sm font-medium ${
            isPrivate ? "text-text-muted" : "text-text-primary"
          }`}
        >
          {displayDate}
        </span>
        {isPrivate && (
          <span className="text-xs text-text-muted">(Private)</span>
        )}
      </div>
      <div className="text-xs text-text-muted">
        Timezone: {birthData.timezone}
      </div>
    </div>
  );
}
