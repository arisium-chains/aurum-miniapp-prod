import { VerificationLevel } from "@worldcoin/idkit";

// World ID configuration for production
export const WORLD_ID_CONFIG = {
  app_id: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID!,
  action: "verify-human",
  verification_level: VerificationLevel.Orb, // Highest security level
  signal: "", // Optional signal for custom actions
};

// Initialize IDKit for production (client-side)
export const initializeWorldID = () => {
  if (typeof window === "undefined") return null;

  try {
    // For production, we'll use the IDKit widget approach
    // The actual initialization will happen in the React component
    return true;
  } catch (error) {
    console.error("Failed to initialize World ID:", error);
    return null;
  }
};

// Verify World ID proof server-side
export const verifyWorldIDProof = async (proof: {
  nullifier_hash: string;
  merkle_root: string;
  proof: string;
  verification_level: string;
}) => {
  try {
    console.log("🔍 Verifying World ID proof:", {
      app_id: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID,
      nullifier_hash: proof.nullifier_hash.substring(0, 10) + "...",
      verification_level: proof.verification_level,
    });

    // Verify the World ID proof with Worldcoin's API
    const verificationPayload = {
      nullifier_hash: proof.nullifier_hash,
      merkle_root: proof.merkle_root,
      proof: proof.proof,
      verification_level: proof.verification_level,
      action: "verify-human",
    };

    const response = await fetch(
      `https://developer.worldcoin.org/api/v1/verify/${process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.WORLDCOIN_APP_SECRET}`,
        },
        body: JSON.stringify(verificationPayload),
      }
    );

    const verificationResult = await response.json();

    console.log("📡 World ID API response:", {
      status: response.status,
      success: verificationResult.success,
      detail: verificationResult.detail,
    });

    if (!response.ok || !verificationResult.success) {
      throw new Error(
        verificationResult.detail || "World ID verification failed"
      );
    }

    return {
      success: true,
      data: verificationResult,
    };
  } catch (error) {
    console.error("💥 World ID verification error:", error);
    throw error;
  }
};

// Check if World ID is available in the current environment
export const isWorldIDAvailable = () => {
  if (typeof window === "undefined") return false;
  return !!process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID;
};

// Get World ID verification configuration
export const getWorldIDConfig = () => {
  return {
    app_id: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID,
    action: "verify-human",
    verification_level: VerificationLevel.Orb,
    signal: "",
  };
};

// Validate World ID environment variables
export const validateWorldIDConfig = () => {
  const requiredVars = ["NEXT_PUBLIC_WORLDCOIN_APP_ID", "WORLDCOIN_APP_SECRET"];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required World ID environment variables: ${missingVars.join(
        ", "
      )}`
    );
  }

  return true;
};
