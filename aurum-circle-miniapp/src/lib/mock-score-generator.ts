/**
 * Mock Score Generator Service
 * Provides deterministic mock scoring for production deployment
 */

import { createHash } from "crypto";

export interface MockScoreComponents {
  symmetry: number;
  vibe: number;
  mystique: number;
}

export interface MockScoreResult {
  totalScore: number;
  components: MockScoreComponents;
  processingTime: number;
  timestamp: string;
}

/**
 * Generate a deterministic hash from user and image data
 */
function generateDeterministicSeed(userId: string, imageData: string): string {
  const combined = `${userId}:${imageData}`;
  return createHash("sha256").update(combined).digest("hex");
}

/**
 * Generate a deterministic number in a range using a seed
 */
function deterministicRandom(seed: string, min: number, max: number): number {
  // Use a simple hash function to get a consistent number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Normalize to 0-1 range
  const normalized = (Math.abs(hash) % 1000000) / 1000000;

  // Scale to desired range
  return Math.floor(normalized * (max - min + 1)) + min;
}

/**
 * Generate realistic component scores that add up to a reasonable total
 */
function generateComponentScores(seed: string): MockScoreComponents {
  const baseSymmetry = deterministicRandom(seed + "symmetry", 60, 95);
  const baseVibe = deterministicRandom(seed + "vibe", 55, 90);
  const baseMystique = deterministicRandom(seed + "mystique", 50, 85);

  // Normalize to ensure realistic distribution
  const symmetry = Math.round(baseSymmetry * 0.35); // 35% weight
  const vibe = Math.round(baseVibe * 0.4); // 40% weight
  const mystique = Math.round(baseMystique * 0.25); // 25% weight

  return {
    symmetry,
    vibe,
    mystique,
  };
}

/**
 * Calculate total score from components with realistic bounds
 */
function calculateTotalScore(components: MockScoreComponents): number {
  const total = components.symmetry + components.vibe + components.mystique;

  // Ensure total is within realistic range (55-95)
  const clampedTotal = Math.max(55, Math.min(95, total));

  // Add slight randomization for realism while maintaining determinism
  const seed = components.symmetry + components.vibe + components.mystique;
  const adjustment = deterministicRandom(seed.toString(), -2, 2);

  return Math.max(55, Math.min(95, clampedTotal + adjustment));
}

/**
 * Generate a mock score with realistic processing delay
 */
export async function generateMockScore(
  userId: string,
  imageData: string,
  processingDelay: boolean = true
): Promise<MockScoreResult> {
  const startTime = Date.now();

  // Simulate processing delay (2-4 seconds)
  if (processingDelay) {
    const delay = deterministicRandom(userId + imageData + "delay", 2000, 4000);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // Generate deterministic seed
  const seed = generateDeterministicSeed(userId, imageData);

  // Generate component scores
  const components = generateComponentScores(seed);

  // Calculate total score
  const totalScore = calculateTotalScore(components);

  const endTime = Date.now();
  const processingTime = endTime - startTime;

  return {
    totalScore,
    components,
    processingTime,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a mock score without processing delay (for testing/internal use)
 */
export function generateMockScoreInstant(
  userId: string,
  imageData: string
): MockScoreResult {
  const startTime = Date.now();

  // Generate deterministic seed
  const seed = generateDeterministicSeed(userId, imageData);

  // Generate component scores
  const components = generateComponentScores(seed);

  // Calculate total score
  const totalScore = calculateTotalScore(components);

  const endTime = Date.now();
  const processingTime = endTime - startTime;

  return {
    totalScore,
    components,
    processingTime,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate mock score result
 */
export function validateMockScore(result: MockScoreResult): boolean {
  return (
    result.totalScore >= 55 &&
    result.totalScore <= 95 &&
    result.components.symmetry >= 0 &&
    result.components.symmetry <= 35 &&
    result.components.vibe >= 0 &&
    result.components.vibe <= 40 &&
    result.components.mystique >= 0 &&
    result.components.mystique <= 25 &&
    result.processingTime >= 0 &&
    !!result.timestamp
  );
}
