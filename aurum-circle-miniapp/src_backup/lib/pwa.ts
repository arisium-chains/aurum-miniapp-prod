import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if the app is already installed
    const isAppInstalled = () => {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        document.referrer.includes("android-app://") ||
        // @ts-expect-error - navigator.standalone may not exist on all browsers
        navigator.standalone === true
      );
    };

    setIsInstalled(isAppInstalled());

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Listen for display mode change
    const handleDisplayModeChange = () => {
      setIsInstalled(isAppInstalled());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("displaymodechange", handleDisplayModeChange);

    // Check if the app is running in standalone mode
    const checkStandaloneMode = () => {
      setIsInstalled(isAppInstalled());
    };

    checkStandaloneMode();

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("displaymodechange", handleDisplayModeChange);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);

      return outcome === "accepted";
    } catch (error) {
      console.error("Error installing PWA:", error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  };

  const subscribeToPushNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications not supported");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
          ? urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
          : undefined,
      });

      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return null;
    }
  };

  return {
    isInstallable,
    isInstalled,
    installPWA,
    requestNotificationPermission,
    subscribeToPushNotifications,
  };
};

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
