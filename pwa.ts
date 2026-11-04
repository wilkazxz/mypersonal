import { useCallback, useEffect, useState } from "react";

export function useInstall() {
  const [evt, setEvt] = useState<any>(null);
  const [installed, setInstalled] = useState(
    typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as any).standalone === true)
  );
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const install = useCallback(async () => {
    if (evt) {
      evt.prompt();
      await evt.userChoice;
      setEvt(null);
    } else if (ios) {
      window.alert('Di iPhone/iPad: ketuk tombol Share (kotak dengan panah), lalu pilih "Add to Home Screen".');
    }
  }, [evt, ios]);
  return { canInstall: !installed && (!!evt || ios), installed, install };
}
