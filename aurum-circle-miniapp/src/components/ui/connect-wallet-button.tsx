"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useMiniKit } from "@/components/providers/minikit-provider";
import { useRouter } from "next/navigation";

interface ConnectWalletButtonProps {
  onSuccess?: (address: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function ConnectWalletButton({
  onSuccess,
  onError,
  disabled = false,
  children = "Connect Wallet",
}: ConnectWalletButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { isInstalled, isInitialized } = useMiniKit();
  const router = useRouter();

  // Check if already connected on mount
  useEffect(() => {
    // In a real implementation, you would check for existing connection
    // For now, we'll just simulate this
    const storedAddress = localStorage.getItem("walletAddress");
    if (storedAddress) {
      setIsConnected(true);
      setWalletAddress(storedAddress);
    }
  }, []);

  const handleConnect = async () => {
    if (!isInstalled) {
      const error = new Error(
        "Please open this app in World App to connect your wallet"
      );
      onError?.(error);
      setConnectionError("World App required");
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      // In a real implementation, you would use MiniKit to connect wallet
      // For now, we'll simulate the connection process
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate successful connection
      const mockAddress = "0x742d35Cc6634C0532925a3b8D4C9db4C4C4C4C4C";
      setWalletAddress(mockAddress);
      setIsConnected(true);
      localStorage.setItem("walletAddress", mockAddress);

      onSuccess?.(mockAddress);

      // Redirect to next step
      router.push("/auth/nft-gate");
    } catch (error) {
      console.error("Wallet connection error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect wallet";
      setConnectionError(errorMessage);
      onError?.(error as Error);
    } finally {
      setIsConnecting(false);
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
          Please open this link in the World App to connect your wallet
        </p>
      </div>
    );
  }

  // Show connected state
  if (isConnected && walletAddress) {
    return (
      <div className="w-full">
        <Button variant="gold" className="w-full mb-2" size="lg" disabled>
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Connected
          </div>
        </Button>
        <p className="text-text-muted text-sm text-center truncate">
          {walletAddress.substring(0, 6)}...
          {walletAddress.substring(walletAddress.length - 4)}
        </p>
      </div>
    );
  }

  // Show error state
  if (connectionError) {
    return (
      <div className="w-full">
        <Button
          variant="outline"
          className="w-full mb-2 border-primary text-primary"
          size="lg"
          onClick={handleConnect}
        >
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Try Again
          </div>
        </Button>
        <p className="text-primary text-sm text-center">{connectionError}</p>
      </div>
    );
  }

  // Show default/connecting state
  return (
    <Button
      onClick={handleConnect}
      disabled={disabled || isConnecting || !isInitialized}
      variant="gold"
      className="w-full"
      size="lg"
    >
      {isConnecting ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-bg-primary/20 border-t-bg-primary rounded-full animate-spin" />
          Connecting Wallet...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
              clipRule="evenodd"
            />
          </svg>
          {children}
        </div>
      )}
    </Button>
  );
}
