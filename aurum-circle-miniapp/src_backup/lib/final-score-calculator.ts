/**
 * Final Score Calculator
 * Calculates user's final score based on facial attractiveness, university ranking, and NFT tier (for males)
 */

// University Score Map (Bangkok only)
const universityScoreMap: Record<string, number> = {
  "Chulalongkorn University": 20,
  "Mahidol International College": 20,
  "Thammasat Rangsit": 20,
  "Siriraj Hospital (Mahidol)": 20,
  "Kasetsart University": 10,
  "KMUTT": 10,
  "Srinakharinwirot University": 10,
  "Silpakorn University": 10,
  "TU Tha Prachan": 10,
  "Bangkok University": 5,
  "Rangsit University": 5,
  "Sripatum University": 5,
  "Assumption University (ABAC)": 5
  // All others default to 0
}

// NFT Tier Score Table (for Male only)
const nftScoreMap: Record<string, number> = {
  "none": 0,
  "basic": 3,
  "rare": 5,
  "elite": 10,
  "legendary": 15
}

export interface UserProfile {
  userId: string;
  gender: "male" | "female";
  facialScore: number;
  university: string;
  nftTier?: "none" | "basic" | "rare" | "elite" | "legendary";
  finalScore?: number;
  scoreExpiry?: string; // ISO timestamp (30 days from now)
}

/**
 * Calculate the final score based on facial score, university ranking, and NFT tier (for males)
 * @param userProfile The user profile with required fields
 * @returns The user profile with the finalScore field added
 */
export function calculateFinalScore(userProfile: UserProfile): UserProfile {
  // Validate required fields
  if (!userProfile.userId) {
    throw new Error("User ID is required");
  }
  
  if (userProfile.facialScore === undefined || userProfile.facialScore === null) {
    throw new Error("Facial score is required");
  }
  
  if (!userProfile.university) {
    throw new Error("University is required");
  }
  
  if (!userProfile.gender || (userProfile.gender !== "male" && userProfile.gender !== "female")) {
    throw new Error("Gender must be 'male' or 'female'");
  }
  
  // Get university score (default to 0 for unknown universities)
  const universityScore = universityScoreMap[userProfile.university] || 0;
  
  // Initialize NFT score to 0
  let nftScore = 0;
  
  // Only apply NFT score for male users
  if (userProfile.gender === "male") {
    // Default to "none" if not provided
    const tier = userProfile.nftTier || "none";
    
    // Validate tier value
    if (!Object.keys(nftScoreMap).includes(tier)) {
      throw new Error(`Invalid NFT tier: ${tier}`);
    }
    
    nftScore = nftScoreMap[tier];
  }
  
  // Calculate final score: facial score + university score + NFT score (for males)
  const finalScore = Math.round(userProfile.facialScore + universityScore + nftScore);
  
  // Set expiry date (30 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  // Return the user profile with the final score and expiry
  return {
    ...userProfile,
    finalScore,
    scoreExpiry: expiryDate.toISOString()
  };
}