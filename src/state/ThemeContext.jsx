import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// Allowed theme IDs — Dark mode was removed; only Light + Special remain.
const THEMES = ["light", "special"];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem("theme");
    // Migrate any pre-removal "dark" preference to "special" (the closest match).
    if (stored === "dark") return "special";
    if (stored && THEMES.includes(stored)) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "special" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function setTheme(next) {
    if (next === "dark") next = "special"; // safety net for any leftover callers
    if (THEMES.includes(next)) setThemeState(next);
  }

  function cycleTheme() {
    setThemeState((prev) => THEMES[(THEMES.indexOf(prev) + 1) % THEMES.length]);
  }

  // Backwards-compat for components that still consume isDark / toggleTheme.
  const isDark = theme !== "light";
  const toggleTheme = cycleTheme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
