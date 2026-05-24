import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { STRINGS } from "./dict.js";

const LangContext = createContext(null);

const LANGS = ["en", "ar"];

// Auto-detect from the saved preference, else browser, else English.
function detectInitialLang() {
  try {
    const stored = localStorage.getItem("lang");
    if (stored && LANGS.includes(stored)) return stored;
  } catch {}
  if (typeof navigator !== "undefined") {
    const n = (navigator.language || "").toLowerCase();
    if (n.startsWith("ar")) return "ar";
  }
  return "en";
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  // Keep <html lang> + <html dir> in sync with the active language so CSS
  // RTL rules and browser defaults (text selection direction, autosuggest,
  // etc.) all work correctly.
  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    try { localStorage.setItem("lang", lang); } catch {}
  }, [lang]);

  const setLang = useCallback((next) => {
    if (LANGS.includes(next)) setLangState(next);
  }, []);

  const t = useCallback((key) => {
    const dict = STRINGS[lang] || STRINGS.en;
    return dict[key] ?? STRINGS.en[key] ?? key;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, isRTL: lang === "ar" }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Safe fallback for any component rendered outside the provider —
    // unlikely but cheap to defend against.
    return { lang: "en", setLang: () => {}, t: (k) => STRINGS.en[k] ?? k, isRTL: false };
  }
  return ctx;
}
