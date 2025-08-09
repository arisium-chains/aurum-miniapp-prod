import { calculateFinalScore } from '@/lib/final-score-calculator'

// Test the function with the example from the requirements
const testUserProfile = {
  userId: "u12345",
  gender: "male",
  facialScore: 84.3,
  university: "Thammasat Rangsit",
  nftTier: "elite"
}

try {
  const result = calculateFinalScore(testUserProfile)
  console.log("Test Result:", result)
  
  // Expected: finalScore = 84.3 + 20 + 10 = 114.3 -> 114 (rounded)
  if (result.finalScore === 114) {
    console.log("✅ Test PASSED")
  } else {
    console.log("❌ Test FAILED - Expected 114, got", result.finalScore)
  }
} catch (error) {
  console.error("❌ Test FAILED with error:", error)
}

// Test with female user (no NFT tier)
const testFemaleProfile = {
  userId: "u67890",
  gender: "female",
  facialScore: 75.8,
  university: "Chulalongkorn University"
}

try {
  const result = calculateFinalScore(testFemaleProfile)
  console.log("Female Test Result:", result)
  
  // Expected: finalScore = 75.8 + 20 + 0 = 95.8 -> 96 (rounded)
  if (result.finalScore === 96) {
    console.log("✅ Female Test PASSED")
  } else {
    console.log("❌ Female Test FAILED - Expected 96, got", result.finalScore)
  }
} catch (error) {
  console.error("❌ Female Test FAILED with error:", error)
}

// Test with unknown university
const testUnknownUniversityProfile = {
  userId: "u11111",
  gender: "male",
  facialScore: 60.5,
  university: "Unknown University",
  nftTier: "rare"
}

try {
  const result = calculateFinalScore(testUnknownUniversityProfile)
  console.log("Unknown University Test Result:", result)
  
  // Expected: finalScore = 60.5 + 0 + 5 = 65.5 -> 66 (rounded)
  if (result.finalScore === 66) {
    console.log("✅ Unknown University Test PASSED")
  } else {
    console.log("❌ Unknown University Test FAILED - Expected 66, got", result.finalScore)
  }
} catch (error) {
  console.error("❌ Unknown University Test FAILED with error:", error)
}