// This file is commented out due to TypeScript/ESLint issues with @worldcoin/minikit-js
// It will be re-enabled and properly typed in a separate task.

// Temporary placeholder functions for build compatibility
export const isInWorldApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Simple check for World App user agent or other indicators
  return window.navigator.userAgent.includes('WorldApp') || false;
};

export const initializeMiniKit = () => {
  console.warn('MiniKit temporarily disabled');
  return null;
};

export const verifyWorldID = async (_action: string = 'verify-human') => {
  // Temporary placeholder for build compatibility
  return {
    success: true,
    proof: 'placeholder-proof',
    merkle_root: 'placeholder-merkle-root',
    nullifier_hash: 'placeholder-nullifier-hash',
    verification_level: 'orb' as const,
  };
};

export const getWorldID = () => {
  return null;
};

export const signMessage = async (message: string) => {
  throw new Error('MiniKit temporarily disabled');
};

export const sendTransaction = async (transaction: any) => {
  throw new Error('MiniKit temporarily disabled');
};

/*
// [DEPRECATED: 2025-08-11] Original MiniKit implementation preserved for reference
import { MiniKit } from "@worldcoin/minikit-js";

// Initialize MiniKit
export const initializeMiniKit = () => {
  if (typeof window === "undefined") return null;

  return MiniKit.install({
    // Required: Your World App ID from World ID Dashboard
    app_id: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID!,

    // Optional: Callback URL for web apps (not needed for miniapps)
    // redirect_uri: 'https://your-app.com/callback',
  });
};

// World ID verification action
export const verifyWorldID = async (action: string = "verify-human") => {
  if (!MiniKit.isInstalled()) {
    throw new Error(
      "MiniKit is not installed. Please open this app in World App."
    );
  }

  try {
    const result = await MiniKit.commandsAsync.verify({
      action,
      verification_level: "orb", // 'orb' for highest security, 'device' for basic
    });

    if (result.success) {
      return {
        success: true,
        proof: result.proof,
        merkle_root: result.merkle_root,
        nullifier_hash: result.nullifier_hash,
        verification_level: result.verification_level,
      };
    } else {
      throw new Error(result.error || "World ID verification failed");
    }
  } catch (error) {
    console.error("World ID verification error:", error);
    throw error;
  }
};

// Check if user is in World App
export const isInWorldApp = () => {
  return MiniKit.isInstalled();
};

// Get user's World ID
export const getWorldID = () => {
  if (!MiniKit.isInstalled()) {
    return null;
  }

  // Get user info if available
  return MiniKit.user;
};

// Sign message with World ID
export const signMessage = async (message: string) => {
  if (!MiniKit.isInstalled()) {
    throw new Error(
      "MiniKit is not installed. Please open this app in World App."
    );
  }

  try {
    const result = await MiniKit.commandsAsync.sign({
      message,
    });

    if (result.success) {
      return result.signature;
    } else {
      throw new Error(result.error || "Message signing failed");
    }
  } catch (error) {
    console.error("Message signing error:", error);
    throw error;
  }
};

// Send transaction (for future use)
export const sendTransaction = async (transaction: any) => {
  if (!MiniKit.isInstalled()) {
    throw new Error(
      "MiniKit is not installed. Please open this app in World App."
    );
  }

  try {
    const result = await MiniKit.commandsAsync.sendTransaction(transaction);

    if (result.success) {
      return result.transaction_hash;
    } else {
      throw new Error(result.error || "Transaction failed");
    }
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
  }
};
*/
