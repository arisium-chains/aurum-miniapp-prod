"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { WORLD_ID_CONFIG, verifyWorldIDProof } from "@/lib/world-id";
import { isWorldIDAvailable } from "@/lib/world-id";

interface WorldIDButtonProps {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export function WorldIDButtonProduction({
  onSuccess,
  onError,
  disabled = false,
  children = "Verify World ID",
  className = "",
}: WorldIDButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (!isWorldIDAvailable()) {
      const error = new Error("World ID is not configured properly");
      onError?.(error);
      return;
    }

    setIsVerifying(true);

    try {
      // For production, we'll use the IDKit widget
      // This is a simplified implementation - in a real app you'd use the IDKit React component
      const proof = await simulateWorldIDVerification();

      // Verify the proof server-side
      const response = await fetch("/api/auth/worldid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merkle_root: (proof as any).merkle_root,
          nullifier_hash: (proof as any).nullifier_hash,
          proof: (proof as any).proof,
          verification_level: (proof as any).verification_level,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(proof);
        // Redirect to wallet connection or next step
        router.push("/auth/wallet");
      } else {
        throw new Error(data.message || "World ID verification failed");
      }
    } catch (error) {
      console.error("World ID verification error:", error);
      onError?.(error as Error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Simulate World ID verification for production
  // In a real implementation, you'd use the actual IDKit widget
  const simulateWorldIDVerification = async () => {
    // This is a placeholder - in production you'd use the actual IDKit widget
    // For now, we'll simulate the verification process
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          merkle_root: "0x1234567890abcdef1234567890abcdef12345678",
          nullifier_hash: "0xabcdef1234567890abcdef1234567890abcdef",
          proof: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
          verification_level: "orb",
        });
      }, 2000);
    });
  };

  return (
    <Button
      onClick={handleVerify}
      disabled={disabled || isVerifying || !isWorldIDAvailable()}
      className={`w-full ${className}`}
      size="lg"
    >
      {isVerifying ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          Verifying...
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
