"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { verifyWorldID } from "@/lib/minikit";
import { useMiniKit } from "@/components/providers/minikit-provider";

interface WorldIDButtonProps {
  onSuccess?: (result: unknown) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function WorldIDButton({
  onSuccess,
  onError,
  disabled = false,
  children = "Connect World ID",
}: WorldIDButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();
  const { isInstalled, isInitialized } = useMiniKit();

  const handleVerify = async () => {
    if (!isInstalled) {
      const error = new Error(
        "Please open this app in World App to verify your World ID"
      );
      onError?.(error);
      return;
    }

    setIsVerifying(true);

    try {
      // Use MiniKit to verify World ID
      const result = await verifyWorldID("verify-human");

      // Verify the proof server-side
      const response = await fetch("/api/auth/worldid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merkle_root: result.merkle_root,
          nullifier_hash: result.nullifier_hash,
          proof: result.proof,
          verification_level: result.verification_level,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess?.(result);
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

  // Show instructions if not in World App
  if (!isInstalled) {
    return (
      <div className="text-center">
        <Button disabled variant="outline" className="w-full mb-4" size="lg">
          World App Required
        </Button>
        <p className="text-text-muted text-sm">
          Please open this link in the World App to verify your World ID
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={handleVerify}
      disabled={disabled || isVerifying || !isInitialized}
      className="w-full"
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
