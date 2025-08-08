import {
  BirthData,
  BaZiData,
  ElementBalance,
  MysticTag,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  MYSTIC_TAGS,
  Element,
  MysticTagType,
} from "@/types/bazi";

// BaZi Calculation Utilities

// Timezone to UTC offset mapping
const TIMEZONE_OFFSETS: Record<string, number> = {
  UTC: 0,
  "Asia/Bangkok": 7,
  "America/New_York": -5,
  "Europe/London": 0,
  "Asia/Tokyo": 9,
  "Australia/Sydney": 11,
  "America/Los_Angeles": -8,
  "Europe/Paris": 1,
  "Asia/Shanghai": 8,
  "Asia/Singapore": 8,
};

// Element relationships
const ELEMENT_RELATIONSHIPS = {
  generating: {
    fire: "earth", // Fire generates Earth
    earth: "metal", // Earth generates Metal
    metal: "water", // Metal generates Water
    water: "wood", // Water generates Wood
    wood: "fire", // Wood generates Fire
  },
  overcoming: {
    fire: "metal", // Fire overcomes Metal
    metal: "wood", // Metal overcomes Wood
    wood: "earth", // Wood overcomes Earth
    earth: "water", // Earth overcomes Water
    water: "fire", // Water overcomes Fire
  },
};

// Heavenly Stems to Element mapping
const STEMS_TO_ELEMENTS: Record<string, Element> = {
  甲: "wood",
  乙: "wood",
  丙: "fire",
  丁: "fire",
  戊: "earth",
  己: "earth",
  庚: "metal",
  辛: "metal",
  壬: "water",
  癸: "water",
};

// Earthly Branches to Element mapping
const BRANCHES_TO_ELEMENTS: Record<string, Element> = {
  子: "water",
  丑: "earth",
  寅: "wood",
  卯: "wood",
  辰: "earth",
  巳: "fire",
  午: "fire",
  未: "earth",
  申: "metal",
  酉: "metal",
  戌: "earth",
  亥: "water",
};

// Calculate BaZi components from birth data
export function calculateBaZi(birthData: BirthData): BaZiData {
  const { date, timezone } = birthData;

  // Adjust for timezone
  const utcOffset = TIMEZONE_OFFSETS[timezone] || 0;
  const localDate = new Date(date.getTime() + utcOffset * 60 * 60 * 1000);

  const year = localDate.getFullYear();
  const month = localDate.getMonth() + 1;
  const day = localDate.getDate();
  const hour = localDate.getHours();

  // Calculate Heavenly Stems and Earthly Branches
  const heavenlyStems = calculateHeavenlyStems(year, month, day, hour);
  const earthlyBranches = calculateEarthlyBranches(year, month, day, hour);

  // Calculate element balance
  const elements = calculateElementBalance(heavenlyStems, earthlyBranches);

  // Generate mystic tags
  const mysticTags = generateMysticTags(
    elements,
    heavenlyStems,
    earthlyBranches
  );

  return {
    heavenlyStems,
    earthlyBranches,
    elements,
    mysticTags,
    birthYear: year,
    birthMonth: month,
    birthDay: day,
    birthHour: hour,
  };
}

// Calculate Heavenly Stems
function calculateHeavenlyStems(
  year: number,
  month: number,
  day: number,
  hour: number
): string[] {
  const stems: string[] = [];

  // Year Stem (天干)
  const yearStemIndex = (year - 4) % 10;
  stems.push(
    HEAVENLY_STEMS[yearStemIndex < 0 ? yearStemIndex + 10 : yearStemIndex]
  );

  // Month Stem (月干)
  const monthStemIndex = ((year - 4) * 2 + month) % 10;
  stems.push(
    HEAVENLY_STEMS[monthStemIndex < 0 ? monthStemIndex + 10 : monthStemIndex]
  );

  // Day Stem (日干)
  const dayStemIndex = (day - 1) % 10;
  stems.push(
    HEAVENLY_STEMS[dayStemIndex < 0 ? dayStemIndex + 10 : dayStemIndex]
  );

  // Hour Stem (时干)
  const hourStemIndex = (hour * 2) % 10;
  stems.push(
    HEAVENLY_STEMS[hourStemIndex < 0 ? hourStemIndex + 10 : hourStemIndex]
  );

  return stems;
}

// Calculate Earthly Branches
function calculateEarthlyBranches(
  year: number,
  month: number,
  day: number,
  hour: number
): string[] {
  const branches: string[] = [];

  // Year Branch (地支)
  const yearBranchIndex = (year - 4) % 12;
  branches.push(
    EARTHLY_BRANCHES[
      yearBranchIndex < 0 ? yearBranchIndex + 12 : yearBranchIndex
    ]
  );

  // Month Branch (月支)
  const monthBranchIndex = (month - 1) % 12;
  branches.push(EARTHLY_BRANCHES[monthBranchIndex]);

  // Day Branch (日支)
  const dayBranchIndex = (day - 1) % 12;
  branches.push(EARTHLY_BRANCHES[dayBranchIndex]);

  // Hour Branch (时支)
  const hourBranchIndex = Math.floor(hour / 2) % 12;
  branches.push(EARTHLY_BRANCHES[hourBranchIndex]);

  return branches;
}

// Calculate element balance
function calculateElementBalance(
  heavenlyStems: string[],
  earthlyBranches: string[]
): ElementBalance {
  const balance: ElementBalance = {
    fire: 0,
    earth: 0,
    metal: 0,
    water: 0,
    wood: 0,
  };

  // Count elements from heavenly stems
  heavenlyStems.forEach((stem) => {
    const element = STEMS_TO_ELEMENTS[stem];
    if (element) balance[element]++;
  });

  // Count elements from earthly branches
  earthlyBranches.forEach((branch) => {
    const element = BRANCHES_TO_ELEMENTS[branch];
    if (element) balance[element]++;
  });

  return balance;
}

// Generate mystic tags based on BaZi data
export function generateMysticTags(
  elements: ElementBalance,
  heavenlyStems: string[],
  earthlyBranches: string[]
): MysticTag[] {
  const selectedTags: MysticTag[] = [];

  // Find dominant element
  const dominantElement = Object.entries(elements).reduce((a, b) =>
    elements[a[0] as Element] > elements[b[0] as Element] ? a : b
  )[0] as Element;

  // Find secondary element
  const secondaryElements = Object.entries(elements)
    .filter(([element, count]) => element !== dominantElement && count > 0)
    .sort((a, b) => b[1] - a[1]);

  // Select tags based on dominant element
  const elementTags = MYSTIC_TAGS.filter(
    (tag) => tag.element === dominantElement
  );
  if (elementTags.length > 0) {
    const randomTag =
      elementTags[Math.floor(Math.random() * elementTags.length)];
    selectedTags.push({
      ...randomTag,
      compatibility: {},
    } as MysticTag);
  }

  // Select tags based on secondary elements
  secondaryElements.slice(0, 2).forEach(([element]) => {
    const secondaryTags = MYSTIC_TAGS.filter(
      (tag) =>
        tag.element === element && !selectedTags.some((t) => t.id === tag.id)
    );
    if (secondaryTags.length > 0) {
      const randomTag =
        secondaryTags[Math.floor(Math.random() * secondaryTags.length)];
      selectedTags.push({
        ...randomTag,
        compatibility: {},
      } as MysticTag);
    }
  });

  // Add celestial tag based on year stem
  const celestialTags = MYSTIC_TAGS.filter((tag) => tag.type === "celestial");
  if (celestialTags.length > 0 && selectedTags.length < 3) {
    const randomTag =
      celestialTags[Math.floor(Math.random() * celestialTags.length)];
    selectedTags.push({
      ...randomTag,
      compatibility: {},
    } as MysticTag);
  }

  // Calculate compatibility scores
  return selectedTags.map((tag) => ({
    ...tag,
    compatibility: calculateTagCompatibility(
      tag,
      selectedTags.filter((t) => t.id !== tag.id)
    ),
  }));
}

// Calculate compatibility between tags
function calculateTagCompatibility(
  tag: MysticTag,
  otherTags: MysticTag[]
): Record<string, number> {
  const compatibility: Record<string, number> = {};

  otherTags.forEach((otherTag) => {
    let score = 50; // Base compatibility

    // Same element bonus
    if (tag.element === otherTag.element) {
      score += 30;
    }

    // Element generation bonus
    if (ELEMENT_RELATIONSHIPS.generating[tag.element] === otherTag.element) {
      score += 20;
    }

    // Element overcoming bonus
    if (ELEMENT_RELATIONSHIPS.overcoming[tag.element] === otherTag.element) {
      score += 10;
    }

    // Same type bonus
    if (tag.type === otherTag.type) {
      score += 15;
    }

    compatibility[otherTag.id] = Math.min(100, Math.max(0, score));
  });

  return compatibility;
}

// Generate deterministic tag ID based on birth data hash
export function generateTagHash(birthData: BirthData): string {
  const data = `${birthData.date.toISOString()}-${birthData.timezone}`;
  let hash = 0;

  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

// Validate birth data
export function validateBirthData(birthData: BirthData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!birthData.date || isNaN(birthData.date.getTime())) {
    errors.push("Invalid birth date");
  }

  if (!birthData.timezone || !TIMEZONE_OFFSETS[birthData.timezone]) {
    errors.push("Invalid timezone");
  }

  // Check if birth date is not in the future
  if (birthData.date > new Date()) {
    errors.push("Birth date cannot be in the future");
  }

  // Check if birth date is not too far in the past (e.g., more than 120 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);
  if (birthData.date < minDate) {
    errors.push("Birth date cannot be more than 120 years ago");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get timezone options
export function getTimezoneOptions(): Array<{
  value: string;
  label: string;
  offset: string;
}> {
  return Object.entries(TIMEZONE_OFFSETS).map(([timezone, offset]) => ({
    value: timezone,
    label: timezone,
    offset: offset >= 0 ? `UTC+${offset}` : `UTC${offset}`,
  }));
}

// Get element color mapping
export function getElementColor(element: Element): string {
  const colors = {
    fire: "#ef4444", // red
    earth: "#f59e0b", // amber
    metal: "#6b7280", // gray
    water: "#3b82f6", // blue
    wood: "#10b981", // emerald
  };
  return colors[element];
}

// Get element emoji mapping
export function getElementEmoji(element: Element): string {
  const emojis = {
    fire: "🔥",
    earth: "🌍",
    metal: "⚡",
    water: "💧",
    wood: "🌱",
  };
  return emojis[element];
}
