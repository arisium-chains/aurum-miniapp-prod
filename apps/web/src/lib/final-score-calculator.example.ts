// Example usage of the final score calculator
import { calculateFinalScore } from './final-score-calculator';

// Example 1: Male user with elite NFT tier
const maleUser = {
  userId: 'u12345',
  gender: 'male' as const,
  facialScore: 84.3,
  university: 'Thammasat Rangsit',
  nftTier: 'elite' as const,
};

console.log('Male user with elite NFT:');
console.log(calculateFinalScore(maleUser));
// Expected output: finalScore = 84.3 + 20 + 10 = 114.3 -> 114

// Example 2: Female user (no NFT tier)
const femaleUser = {
  userId: 'u67890',
  gender: 'female' as const,
  facialScore: 75.8,
  university: 'Chulalongkorn University',
};

console.log('\nFemale user:');
console.log(calculateFinalScore(femaleUser));
// Expected output: finalScore = 75.8 + 20 + 0 = 95.8 -> 96

// Example 3: Male user with unknown university
const unknownUniversityUser = {
  userId: 'u11111',
  gender: 'male' as const,
  facialScore: 60.5,
  university: 'Unknown University',
  nftTier: 'rare' as const,
};

console.log('\nMale user with unknown university:');
console.log(calculateFinalScore(unknownUniversityUser));
// Expected output: finalScore = 60.5 + 0 + 5 = 65.5 -> 66
