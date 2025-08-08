"use client";

import { usePWA } from "@/lib/pwa";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X } from "lucide-react";

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installPWA } = usePWA();

  if (!isInstallable || isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    const success = await installPWA();
    if (!success) {
      console.log("User dismissed the install prompt");
    }
  };

  const handleClose = () => {
    const prompt = document.querySelector(".pwa-install-prompt");
    if (prompt) {
      prompt.remove();
    }
  };

  return (
    <div className="pwa-install-prompt fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Install Aurum Circle</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <CardDescription>
            Install Aurum Circle on your device for a better experience with
            offline access and push notifications.
          </CardDescription>
          <div className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1">
              Install App
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
