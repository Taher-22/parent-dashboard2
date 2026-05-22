import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// Allowed theme IDs — keep in sync with the [data-theme="..."] blocks in index.css.
const THEMES = ["light", "dark", "special"];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored && THEMES.includes(stored)) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // On phones we don't expose Dark mode — only Light + Special. If the
  // saved theme is "dark" and we're on a phone-sized viewport, flip to
  // Special on mount so the user lands in a theme that's actually toggle-able.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isPhone = window.matchMedia("(max-width: 767px)").matches;
    if (isPhone && theme === "dark") {
      setThemeState("special");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setTheme(next) {
    if (THEMES.includes(next)) setThemeState(next);
  }

  function cycleTheme() {
    setThemeState((prev) => THEMES[(THEMES.indexOf(prev) + 1) % THEMES.length]);
  }

  // Backwards-compat for components that still consume isDark / toggleTheme.
  // Treat 'special' as a dark variant so any existing dark/light styling stays sensible.
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
