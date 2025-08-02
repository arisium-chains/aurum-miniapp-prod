/**
 * Vibe Clustering System
 * Generates personality/aesthetic tags based on facial embeddings using clustering
 */

import { ProcessedFace } from "./face-embeddings";

export interface VibeProfile {
  primary: string;
  secondary: string;
  traits: string[];
  aesthetic: string;
  energy: string;
}

/**
 * Vibe tag generator using PCA + K-means style clustering
 */
export class VibeClusterer {
  private readonly VIBE_DIMENSIONS = 8; // Reduced dimensionality for vibe analysis

  // Predefined vibe categories
  private readonly VIBE_CATEGORIES = {
    aesthetic: {
      classic: ["Timeless", "Elegant", "Refined"],
      modern: ["Contemporary", "Sleek", "Edgy"],
      natural: ["Organic", "Fresh", "Authentic"],
      bold: ["Striking", "Dramatic", "Intense"],
      soft: ["Gentle", "Delicate", "Ethereal"],
      artistic: ["Creative", "Unique", "Expressive"],
    },
    energy: {
      warm: ["Inviting", "Approachable", "Friendly"],
      cool: ["Sophisticated", "Reserved", "Mysterious"],
      vibrant: ["Dynamic", "Energetic", "Lively"],
      serene: ["Peaceful", "Calm", "Balanced"],
      intense: ["Powerful", "Commanding", "Magnetic"],
      playful: ["Fun", "Spirited", "Charming"],
    },
    personality: {
      confident: ["Bold", "Self-Assured", "Strong"],
      gentle: ["Kind", "Compassionate", "Tender"],
      mysterious: ["Enigmatic", "Intriguing", "Deep"],
      radiant: ["Bright", "Glowing", "Luminous"],
      sophisticated: ["Cultured", "Polished", "Refined"],
      authentic: ["Genuine", "Real", "Honest"],
    },
  };

  // Signature vibe combinations
  private readonly SIGNATURE_VIBES = [
    {
      name: "Mystic",
      traits: ["mysterious", "sophisticated", "cool"],
      rarity: 0.05,
    },
    { name: "Radiant", traits: ["confident", "vibrant", "warm"], rarity: 0.08 },
    { name: "Ethereal", traits: ["soft", "serene", "natural"], rarity: 0.06 },
    { name: "Bold", traits: ["intense", "modern", "confident"], rarity: 0.07 },
    {
      name: "Classic",
      traits: ["elegant", "sophisticated", "timeless"],
      rarity: 0.09,
    },
    {
      name: "Artistic",
      traits: ["creative", "unique", "authentic"],
      rarity: 0.08,
    },
    {
      name: "Luminous",
      traits: ["radiant", "bright", "energetic"],
      rarity: 0.06,
    },
    {
      name: "Refined",
      traits: ["polished", "cultured", "classic"],
      rarity: 0.07,
    },
    {
      name: "Magnetic",
      traits: ["powerful", "commanding", "intense"],
      rarity: 0.05,
    },
    { name: "Gentle", traits: ["kind", "tender", "soft"], rarity: 0.1 },
    {
      name: "Enigmatic",
      traits: ["intriguing", "deep", "mysterious"],
      rarity: 0.06,
    },
    { name: "Spirited", traits: ["fun", "charming", "playful"], rarity: 0.09 },
    { name: "Serene", traits: ["peaceful", "balanced", "calm"], rarity: 0.08 },
    {
      name: "Dynamic",
      traits: ["energetic", "lively", "vibrant"],
      rarity: 0.07,
    },
  ];

  /**
   * Generate vibe tags for a face embedding
   */
  async generateVibeTags(
    embedding: number[],
    _face: ProcessedFace
  ): Promise<string[]> {
    try {
      // Reduce embedding to vibe dimensions using simulated PCA
      const vibeVector = this.extractVibeFeatures(embedding, _face);

      // Calculate distances to vibe clusters
      const vibeScores = this.calculateVibeAffinities(vibeVector, _face);

      // Select primary and secondary vibes
      const selectedVibes = this.selectVibes(vibeScores, _face);

      // Add signature vibe if applicable
      const signatureVibe = this.detectSignatureVibe(vibeScores, _face);
      if (signatureVibe) {
        selectedVibes.unshift(signatureVibe);
      }

      // Ensure uniqueness and limit count
      const uniqueVibes = [...new Set(selectedVibes)];

      return uniqueVibes.slice(0, 3); // Maximum 3 vibes
    } catch (_error) {
      console.error("Vibe generation failed");
      return ["Authentic"]; // Fallback vibe
    }
  }

  /**
   * Extract vibe-relevant features from full embedding
   */
  private extractVibeFeatures(
    embedding: number[],
    face: ProcessedFace
  ): number[] {
    const vibeFeatures = new Array(this.VIBE_DIMENSIONS);

    // Simulate PCA by creating meaningful feature combinations
    for (let i = 0; i < this.VIBE_DIMENSIONS; i++) {
      let feature = 0;

      // Extract different aspects of the face for different vibe dimensions
      switch (i) {
        case 0: // Intensity/Drama
          feature = this.extractIntensityFeature(embedding, face);
          break;
        case 1: // Warmth/Coolness
          feature = this.extractWarmthFeature(embedding, face);
          break;
        case 2: // Softness/Hardness
          feature = this.extractSoftnessFeature(embedding, face);
          break;
        case 3: // Classic/Modern
          feature = this.extractStyleFeature(embedding, face);
          break;
        case 4: // Energy Level
          feature = this.extractEnergyFeature(embedding, face);
          break;
        case 5: // Sophistication
          feature = this.extractSophisticationFeature(embedding, face);
          break;
        case 6: // Naturalness
          feature = this.extractNaturalnessFeature(embedding, face);
          break;
        case 7: // Uniqueness
          feature = this.extractUniquenessFeature(embedding, face);
          break;
      }

      vibeFeatures[i] = feature;
    }

    return vibeFeatures;
  }

  /**
   * Extract intensity/drama from facial features
   */
  private extractIntensityFeature(
    embedding: number[],
    face: ProcessedFace
  ): number {
    // Use embedding dimensions that correlate with eye/eyebrow intensity
    const eyeRegion = embedding.slice(0, 100);
    const intensity =
      eyeRegion.reduce((sum, val, idx) => {
        return sum + Math.abs(val) * (idx % 2 === 0 ? 1 : -1);
      }, 0) / 100;

    // Boost with symmetry (asymmetry can indicate intensity)
    const asymmetryBoost = (1 - face.symmetry) * 0.3;

    return Math.tanh(intensity + asymmetryBoost); // Normalize to [-1, 1]
  }

  /**
   * Extract warmth/coolness from facial features
   */
  private extractWarmthFeature(
    embedding: number[],
    face: ProcessedFace
  ): number {
    // Use mouth region embeddings for warmth detection
    const mouthRegion = embedding.slice(200, 300);
    const warmth = mouthRegion.reduce((sum, val) => sum + val, 0) / 100;

    // Face quality can indicate warmth (approachability)
    const qualityBoost = (face.quality - 0.5) * 0.4;

    return Math.tanh(warmth + qualityBoost);
  }

  /**
   * Extract softness/hardness from facial structure
   */
  private extractSoftnessFeature(
    embedding: number[],
    face: ProcessedFace
  ): number {
    // Use face shape features for softness
    const faceShape = embedding.slice(300, 400);
    const softness =
      faceShape.reduce((sum, val, idx) => {
        return sum + val * Math.sin(idx * 0.1); // Create soft wave pattern
      }, 0) / 100;

    // High frontality often correlates with softer appearance
    const frontalityBoost = face.frontality * 0.2;

    return Math.tanh(softness + frontalityBoost);
  }

  /**
   * Extract classic/modern style indicator
   */
  private extractStyleFeature(
    embedding: number[],
    face: ProcessedFace
  ): number {
    // Use general features for style detection
    const generalFeatures = embedding.slice(400, 512);
    const modernity =
      generalFeatures.reduce((sum, val, idx) => {
        return sum + val * (idx % 3 === 0 ? 1 : -0.5); // Create style pattern
      }, 0) / 112;

    // High resolution might indicate modern photography/style
    const resolutionBoost = (face.resolution - 0.5) * 0.3;

    return Math.tanh(modernity + resolutionBoost);
  }

  /**
   * Extract energy level from facial features
   */
  private extractEnergyFeature(
    embedding: number[],
    face: ProcessedFace
  ): number {
    // Combine multiple regions for energy detection
    const eyeEnergy =
      embedding.slice(0, 100).reduce((sum, val) => sum + Math.abs(val), 0) /
      100;
    const mouthEnergy =
      embedding.slice(200, 300).reduce((sum, val) => sum + Math.abs(val), 0) /
      100;

    const combinedEnergy = (eyeEnergy + mouthEnergy) / 2;

    // High quality and frontality often indicate more energetic presentation
    const presentationBoost = (face.quality + face.frontality) * 0.15;

    return Math.tanh(combinedEnergy + presentationBoost);
  }

  /**
   * Extract sophistication level
   */
  private extractSophisticationFeature(
    embedding: number[],
    face: ProcessedFace
  ): number {
    // Use nose and overall face features for sophistication
    const noseRegion = embedding.slice(100, 200);
    const sophistication =
      noseRegion.reduce((sum, val, idx) => {
        return sum + val * Math.cos(idx * 0.05); // Refined pattern
      }, 0) / 100;

    // High symmetry often correlates with sophistication
    const symmetryBoost = face.symmetry * 0.4;

    return Math.tanh(sophistication + symmetryBoost);
  }

  /**
   * Extract naturalness indicator
   */
  private extractNaturalnessFeature(
    embedding: number[],
    face: ProcessedFace
  ): number {
    // Look for balanced, non-extreme features
    const balance =
      embedding.reduce((sum, val) => sum + Math.abs(val), 0) / embedding.length;
    const naturalness = 1 - Math.min(1, balance * 2); // Lower variance = more natural

    // Moderate quality scores might indicate more natural photos
    const qualityNaturalness = 1 - Math.abs(face.quality - 0.7) * 2;

    return Math.tanh(naturalness + qualityNaturalness * 0.3);
  }

  /**
   * Extract uniqueness/distinctiveness
   */
  private extractUniquenessFeature(
    embedding: number[],
    face: ProcessedFace
  ): number {
    // Look for distinctive feature combinations
    const variance =
      embedding.reduce((sum, val, idx, arr) => {
        const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
        return sum + Math.pow(val - mean, 2);
      }, 0) / embedding.length;

    const uniqueness = Math.min(1, variance * 10);

    // Asymmetry can indicate uniqueness
    const asymmetryBoost = (1 - face.symmetry) * 0.2;

    return Math.tanh(uniqueness + asymmetryBoost);
  }

  /**
   * Calculate affinities to different vibe clusters
   */
  private calculateVibeAffinities(
    vibeVector: number[],
    _face: ProcessedFace
  ): Map<string, number> {
    const affinities = new Map<string, number>();

    // Define vibe cluster centers in the reduced space
    const vibeCenters = {
      mysterious: [0.3, -0.4, 0.2, -0.1, -0.2, 0.6, 0.1, 0.4],
      confident: [0.6, 0.2, -0.3, 0.1, 0.5, 0.3, -0.1, 0.2],
      gentle: [-0.4, 0.5, 0.6, -0.2, -0.3, 0.1, 0.4, -0.2],
      sophisticated: [0.1, -0.2, -0.1, -0.4, 0.2, 0.7, -0.3, 0.1],
      natural: [-0.2, 0.3, 0.4, 0.0, 0.1, -0.1, 0.8, -0.3],
      artistic: [0.2, 0.0, 0.1, 0.5, 0.3, 0.2, 0.1, 0.7],
      radiant: [0.4, 0.6, -0.2, 0.2, 0.7, 0.1, 0.2, 0.0],
      serene: [-0.5, 0.1, 0.5, -0.3, -0.4, 0.2, 0.6, -0.1],
      intense: [0.8, -0.3, -0.4, 0.1, 0.4, 0.2, -0.2, 0.3],
      playful: [0.1, 0.4, 0.3, 0.3, 0.6, -0.2, 0.2, 0.1],
    };

    // Calculate distances to each vibe center
    for (const [vibe, center] of Object.entries(vibeCenters)) {
      const distance = this.euclideanDistance(vibeVector, center);
      const affinity = Math.exp(-distance * 2); // Convert distance to affinity
      affinities.set(vibe, affinity);
    }

    return affinities;
  }

  /**
   * Select vibes based on affinities and face characteristics
   */
  private selectVibes(
    affinities: Map<string, number>,
    _face: ProcessedFace
  ): string[] {
    // Sort vibes by affinity
    const sortedVibes = Array.from(affinities.entries()).sort(
      ([, a], [, b]) => b - a
    );

    const selectedVibes: string[] = [];

    // Always include the top vibe
    if (sortedVibes.length > 0) {
      selectedVibes.push(this.capitalizeVibe(sortedVibes[0][0]));
    }

    // Add second vibe if significantly different and above threshold
    if (sortedVibes.length > 1 && sortedVibes[1][1] > 0.3) {
      const secondVibe = sortedVibes[1][0];
      if (!this.areVibesConflicting(sortedVibes[0][0], secondVibe)) {
        selectedVibes.push(this.capitalizeVibe(secondVibe));
      }
    }

    return selectedVibes;
  }

  /**
   * Detect signature vibe combinations
   */
  private detectSignatureVibe(
    affinities: Map<string, number>,
    _face: ProcessedFace
  ): string | null {
    for (const signature of this.SIGNATURE_VIBES) {
      let matchScore = 0;
      let matchCount = 0;

      for (const trait of signature.traits) {
        const affinity = affinities.get(trait) || 0;
        if (affinity > 0.4) {
          matchScore += affinity;
          matchCount++;
        }
      }

      // Check if enough traits match and total score is high
      const avgMatch = matchCount > 0 ? matchScore / matchCount : 0;
      const coverageRatio = matchCount / signature.traits.length;

      if (avgMatch > 0.5 && coverageRatio >= 0.6) {
        // Add some randomness based on rarity
        if (Math.random() < signature.rarity * 10) {
          // Boost probability for demo
          return signature.name;
        }
      }
    }

    return null;
  }

  /**
   * Check if two vibes are conflicting
   */
  private areVibesConflicting(vibe1: string, vibe2: string): boolean {
    const conflicts = [
      ["gentle", "intense"],
      ["mysterious", "radiant"],
      ["serene", "playful"],
      ["sophisticated", "natural"],
    ];

    for (const [a, b] of conflicts) {
      if ((vibe1 === a && vibe2 === b) || (vibe1 === b && vibe2 === a)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate Euclidean distance between two vectors
   */
  private euclideanDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error("Vector dimensions must match");
    }

    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      sum += Math.pow(vec1[i] - vec2[i], 2);
    }

    return Math.sqrt(sum);
  }

  /**
   * Capitalize vibe name
   */
  private capitalizeVibe(vibe: string): string {
    return vibe.charAt(0).toUpperCase() + vibe.slice(1);
  }

  /**
   * Get vibe rarity information
   */
  getVibeRarity(vibeName: string): number {
    const signature = this.SIGNATURE_VIBES.find((v) => v.name === vibeName);
    return signature ? signature.rarity : 0.15; // Default rarity for regular vibes
  }

  /**
   * Get all available signature vibes
   */
  getSignatureVibes(): string[] {
    return this.SIGNATURE_VIBES.map((v) => v.name);
  }
}
