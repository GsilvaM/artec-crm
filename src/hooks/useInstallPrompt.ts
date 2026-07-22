import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_STORAGE_KEY = "artec-crm-install-prompt-dismissed";

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function useInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "true";
  });

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredEvent(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const alreadyInstalled = isStandaloneDisplay();
  const showAndroidPrompt = Boolean(deferredEvent) && !alreadyInstalled && !isDismissed;
  const showIosInstructions = isIos() && !alreadyInstalled && !isDismissed;

  async function promptInstall() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }

  function dismiss() {
    setIsDismissed(true);
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
  }

  return { showAndroidPrompt, showIosInstructions, promptInstall, dismiss };
}
