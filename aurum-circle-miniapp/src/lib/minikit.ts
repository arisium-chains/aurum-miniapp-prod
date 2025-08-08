// MiniKit implementation - temporary mock version
// This will be replaced with the actual @worldcoin/minikit-js implementation when available

// Type definitions for mock MiniKit
interface MockMiniKitCommands {
  verify: (params: { action: string; verification_level: string }) => Promise<{
    success: boolean;
    proof?: string;
    merkle_root?: string;
    nullifier_hash?: string;
    verification_level?: string;
    error?: string;
  }>;
  sign: (params: {
    message: string;
  }) => Promise<{ success: boolean; signature?: string; error?: string }>;
  sendTransaction: (params: {
    action: string;
    verification_level?: string;
    message?: string;
    transaction?: any;
  }) => Promise<{
    success: boolean;
    transaction_hash?: string;
    error?: string;
  }>;
}

interface MockMiniKit {
  isInstalled: () => boolean;
  user: {
    address?: string;
    world_id?: string;
    [key: string]: unknown;
  } | null;
  commandsAsync: MockMiniKitCommands;
}

// Mock MiniKit implementation for development
const mockMiniKit: MockMiniKit = {
  isInstalled: () => {
    // Check if we're in World App environment
    return (
      typeof window !== "undefined" &&
      window.navigator?.userAgent?.includes("WorldApp")
    );
  },
  user: null,
  commandsAsync: {
    verify: async ({ action, verification_level }) => ({
      success: false,
      error: "Not implemented",
    }),
    sign: async ({ message }) => ({
      success: false,
      error: "Not implemented",
    }),
    sendTransaction: async (transaction) => ({
      success: false,
      error: "Not implemented",
    }),
  },
};

// Initialize MiniKit
export const initializeMiniKit = () => {
  if (typeof window === "undefined") return null;

  try {
    // For now, return mock implementation
    // In production, this would use the actual MiniKit from @worldcoin/minikit-js
    return mockMiniKit;
  } catch (error) {
    console.error("Failed to initialize MiniKit:", error);
    return null;
  }
};

// World ID verification action
export const verifyWorldID = async (action: string = "verify-human") => {
  const minikit = initializeMiniKit();

  if (!minikit || !minikit.isInstalled()) {
    throw new Error(
      "MiniKit is not installed. Please open this app in World App."
    );
  }

  try {
    const result = await minikit.commandsAsync.verify({
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
  const minikit = initializeMiniKit();
  return minikit ? minikit.isInstalled() : false;
};

// Get user's World ID
export const getWorldID = () => {
  const minikit = initializeMiniKit();
  if (!minikit || !minikit.isInstalled()) {
    return null;
  }

  // Get user info if available
  return minikit.user;
};

// Sign message with World ID
export const signMessage = async (message: string) => {
  const minikit = initializeMiniKit();

  if (!minikit || !minikit.isInstalled()) {
    throw new Error(
      "MiniKit is not installed. Please open this app in World App."
    );
  }

  try {
    const result = await minikit.commandsAsync.sign({
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
export const sendTransaction = async (transaction: {
  action: string;
  verification_level?: string;
  [key: string]: unknown;
}) => {
  const minikit = initializeMiniKit();

  if (!minikit || !minikit.isInstalled()) {
    throw new Error(
      "MiniKit is not installed. Please open this app in World App."
    );
  }

  try {
    const result = await minikit.commandsAsync.sendTransaction(transaction);

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
