import { useEffect } from "react";

export function useContentProtection() {
  useEffect(() => {
    // 1. Blokada menu kontekstowego (Prawy Przycisk Myszy)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Blokada skrótów klawiszowych (F12, Ctrl+Shift+I, Ctrl+U itp.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
      }
      
      // Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
      }

      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
      }
    };

    // 3. Pułapka "Debugger" - To zamraża stronę po otwarciu DevTools
    const antiDebug = () => {
      const start = Date.now();
      // eslint-disable-next-line
      debugger; // To polecenie zatrzymuje kod, jeśli DevTools jest otwarte
      if (Date.now() - start > 100) {
        // Wykryto otwarcie narzędzi - można np. przekierować użytkownika lub wyczyścić ekran
        document.body.innerHTML = '<div style="background:black;color:red;height:100vh;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:bold;text-align:center;">Naruszenie bezpieczeństwa.<br>Wyłącz narzędzia deweloperskie, aby korzystać ze strony.</div>';
      }
    };

    // Uruchomienie pułapki w pętli
    const interval = setInterval(antiDebug, 1000);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, []);
}