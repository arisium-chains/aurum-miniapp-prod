# Final Score Calculation API

This API endpoint calculates a user's final score based on their facial attractiveness score, university ranking, and NFT tier (for male users only).

## Endpoint

```
POST /api/score
```

## Request Body

```json
{
  "userId": "string",           // Required: User ID
  "gender": "male" | "female",  // Required: User's gender
  "facialScore": number,        // Required: Facial attractiveness score (0-100)
  "university": "string",       // Required: User's university
  "nftTier": "string"           // Optional: NFT tier (only for male users)
}
```

## Response

```json
{
  "success": true,
  "data": {
    "userId": "u12345",
    "gender": "male",
    "facialScore": 84.3,
    "university": "Thammasat Rangsit",
    "nftTier": "elite",
    "finalScore": 114
  },
  "message": "Final score calculated successfully"
}
```

## Scoring Rules

1. **Facial Score**: Directly used as provided (0-100 scale)
2. **University Score**: Based on a predefined ranking table:
   - Top tier (20 points): Chulalongkorn University, Mahidol International College, Thammasat Rangsit, Siriraj Hospital (Mahidol)
   - Mid tier (10 points): Kasetsart University, KMUTT, Srinakharinwirot University, Silpakorn University, TU Tha Prachan
   - Lower tier (5 points): Bangkok University, Rangsit University, Sripatum University, Assumption University (ABAC)
   - All others: 0 points
3. **NFT Tier Bonus** (male users only):
   - None: 0 points
   - Basic: 3 points
   - Rare: 5 points
   - Elite: 10 points
   - Legendary: 15 points
4. **Final Score**: Rounded to the nearest integer after summing all components.

## Error Responses

- 400 Bad Request: Missing required fields or invalid values
- 500 Internal Server Error: Processing error