// BaZi and Mystic Tag System Types

export interface BirthData {
  date: Date;
  timezone: string;
  isPrivate: boolean;
}

export interface BaZiData {
  heavenlyStems: string[];
  earthlyBranches: string[];
  elements: ElementBalance;
  mysticTags: MysticTag[];
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
}

export interface ElementBalance {
  fire: number;
  earth: number;
  metal: number;
  water: number;
  wood: number;
}

export interface MysticTag {
  id: string;
  name: string;
  type: "celestial" | "terrestrial" | "elemental";
  element: "fire" | "earth" | "metal" | "water" | "wood";
  description: string;
  emoji: string;
  compatibility: Record<string, number>; // Tag ID -> compatibility score
}

export interface TagCompatibility {
  tag1Id: string;
  tag2Id: string;
  score: number;
  description: string;
}

export interface BaZiProfile {
  userId: string;
  birthData: BirthData;
  baziData: BaZiData;
  tags: MysticTag[];
  calculatedAt: Date;
  isPublic: boolean;
}

// Heavenly Stems
export const HEAVENLY_STEMS = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
];

// Earthly Branches
export const EARTHLY_BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];

// Elements
export const ELEMENTS = ["fire", "earth", "metal", "water", "wood"] as const;
export type Element = (typeof ELEMENTS)[number];

// Mystic Tag Types
export const MYSTIC_TAGS = [
  // Celestial Tags
  {
    id: "phoenix",
    name: "Phoenix",
    type: "celestial" as const,
    element: "fire" as const,
    emoji: "🦅",
    description: "Reborn from ashes, passionate and transformative",
  },
  {
    id: "dragon",
    name: "Dragon",
    type: "celestial" as const,
    element: "earth" as const,
    emoji: "🐉",
    description: "Mighty and wise, natural leader",
  },
  {
    id: "tiger",
    name: "Tiger",
    type: "celestial" as const,
    element: "metal" as const,
    emoji: "🐅",
    description: "Fierce and protective, courageous warrior",
  },
  {
    id: "turtle",
    name: "Turtle",
    type: "celestial" as const,
    element: "water" as const,
    emoji: "🐢",
    description: "Patient and wise, steady and reliable",
  },
  {
    id: "phoenix",
    name: "Fenghuang",
    type: "celestial" as const,
    element: "fire" as const,
    emoji: "🦚",
    description: "Legendary bird of good fortune",
  },

  // Terrestrial Tags
  {
    id: "lotus",
    name: "Lotus",
    type: "terrestrial" as const,
    element: "water" as const,
    emoji: "🪷",
    description: "Pure and elegant, rising above challenges",
  },
  {
    id: "bamboo",
    name: "Bamboo",
    type: "terrestrial" as const,
    element: "wood" as const,
    emoji: "🎋",
    description: "Flexible yet strong, adaptable and resilient",
  },
  {
    id: "mountain",
    name: "Mountain",
    type: "terrestrial" as const,
    element: "earth" as const,
    emoji: "⛰️",
    description: "Stable and majestic, foundation of strength",
  },
  {
    id: "river",
    name: "River",
    type: "terrestrial" as const,
    element: "water" as const,
    emoji: "🏞️",
    description: "Flowing and dynamic, ever-changing",
  },
  {
    id: "forest",
    name: "Forest",
    type: "terrestrial" as const,
    element: "wood" as const,
    emoji: "🌲",
    description: "Rich and diverse, full of life",
  },

  // Elemental Tags
  {
    id: "flame",
    name: "Flame",
    type: "elemental" as const,
    element: "fire" as const,
    emoji: "🔥",
    description: "Passionate and energetic, inspiring others",
  },
  {
    id: "crystal",
    name: "Crystal",
    type: "elemental" as const,
    element: "metal" as const,
    emoji: "🔮",
    description: "Clear and focused, revealing truth",
  },
  {
    id: "storm",
    name: "Storm",
    type: "elemental" as const,
    element: "water" as const,
    emoji: "⛈️",
    description: "Powerful and transformative, cleansing renewal",
  },
  {
    id: "blossom",
    name: "Blossom",
    type: "elemental" as const,
    element: "wood" as const,
    emoji: "🌸",
    description: "Beautiful and delicate, new beginnings",
  },
  {
    id: "desert",
    name: "Desert",
    type: "elemental" as const,
    element: "earth" as const,
    emoji: "🏜️",
    description: "Vast and mysterious, hidden treasures",
  },
] as const;

export type MysticTagType = (typeof MYSTIC_TAGS)[number];
