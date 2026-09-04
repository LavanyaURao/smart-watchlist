"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sw-theme") as Theme | null;
    const preferred =
      stored ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setThemeState(preferred);
    document.documentElement.classList.toggle("dark", preferred === "dark");
    setMounted(true);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("sw-theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  // Avoid flash: render children only after mount so class is correct
  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0b0f14]" suppressHydrationWarning />
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
