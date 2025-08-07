"use client";

import { useState } from "react";
import { BirthData } from "@/types/bazi";
import { validateBirthData, getTimezoneOptions } from "@/lib/bazi-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface BirthDataInputProps {
  value: BirthData | null;
  onChange: (birthData: BirthData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function BirthDataInput({
  value,
  onChange,
  onNext,
  onBack,
}: BirthDataInputProps) {
  const [date, setDate] = useState(
    value?.date.toISOString().split("T")[0] || ""
  );
  const [time, setTime] = useState(
    value?.date.toTimeString().slice(0, 5) || ""
  );
  const [timezone, setTimezone] = useState(value?.timezone || "Asia/Bangkok");
  const [isPrivate, setIsPrivate] = useState(value?.isPrivate ?? true);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  const timezoneOptions = getTimezoneOptions();

  const handleSubmit = () => {
    if (!date || !time) {
      setErrors(["Please fill in both date and time"]);
      return;
    }

    try {
      const birthDate = new Date(`${date}T${time}`);
      const birthData: BirthData = {
        date: birthDate,
        timezone,
        isPrivate,
      };

      const validation = validateBirthData(birthData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      setErrors([]);
      onChange(birthData);
      onNext();
    } catch (error) {
      setErrors(["Invalid date or time format"]);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
    setErrors([]);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    setErrors([]);
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimezone(e.target.value);
    setErrors([]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-primary mb-2">
          Birth Data for BaZi
        </h2>
        <p className="text-text-muted text-sm">
          Your birth information will be used to generate your unique BaZi
          mystic tags
        </p>
      </div>

      {/* Privacy Notice */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-lg">ℹ️</div>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">Privacy Notice</h3>
            <p className="text-sm text-blue-700">
              Your birth data is used solely for generating your BaZi mystic
              tags. It is stored securely and never shared with other users
              unless you choose to make it public.
            </p>
            <button
              onClick={() => setShowPrivacyNotice(!showPrivacyNotice)}
              className="text-blue-600 text-sm mt-2 underline"
            >
              {showPrivacyNotice ? "Hide details" : "Learn more"}
            </button>
            {showPrivacyNotice && (
              <div className="text-sm text-blue-600 mt-2 space-y-1">
                <p>• Birth data is processed locally in your browser</p>
                <p>• Only the generated mystic tags are stored</p>
                <p>• You can update or remove your birth data at any time</p>
                <p>
                  • Your information is used for cultural and entertainment
                  purposes only
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Birth Date Input */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Birth Date *
        </label>
        <Input
          type="date"
          value={date}
          onChange={handleDateChange}
          className="w-full"
          max={new Date().toISOString().split("T")[0]}
        />
      </div>

      {/* Birth Time Input */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Birth Time *
        </label>
        <Input
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="w-full"
        />
        <p className="text-xs text-text-muted mt-1">
          For more accurate BaZi calculations, please provide the exact birth
          time
        </p>
      </div>

      {/* Timezone Selection */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Timezone *
        </label>
        <select
          value={timezone}
          onChange={handleTimezoneChange}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {timezoneOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.offset})
            </option>
          ))}
        </select>
      </div>

      {/* Privacy Setting */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Birth Data Privacy
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="privacy"
              checked={isPrivate}
              onChange={() => setIsPrivate(true)}
              className="text-primary"
            />
            <span className="text-sm">Keep private</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="privacy"
              checked={!isPrivate}
              onChange={() => setIsPrivate(false)}
              className="text-primary"
            />
            <span className="text-sm">Make public</span>
          </label>
        </div>
        <p className="text-xs text-text-muted mt-1">
          {isPrivate
            ? "Only you can see your birth data and BaZi calculations"
            : "Other users can see your BaZi mystic tags (not your birth data)"}
        </p>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-1">
            Please fix the following errors:
          </h4>
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview */}
      {date && time && (
        <Card className="p-4 bg-card-muted rounded-lg">
          <h3 className="font-medium text-text-primary mb-3">BaZi Preview</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Birth Date:</strong>{" "}
              {new Date(`${date}T${time}`).toLocaleDateString()}
            </div>
            <div>
              <strong>Birth Time:</strong> {time}
            </div>
            <div>
              <strong>Timezone:</strong> {timezone}
            </div>
            <div>
              <strong>Privacy:</strong> {isPrivate ? "Private" : "Public"}
            </div>
            <div className="text-text-muted">
              Your BaZi mystic tags will be generated based on this information
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button onClick={onBack} variant="outline" className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!date || !time}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
