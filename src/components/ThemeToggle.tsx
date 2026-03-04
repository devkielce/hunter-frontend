"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "hunter-theme";

function getTheme(): "light" | "dark" | null {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem(STORAGE_KEY);
  if (t === "dark" || t === "light") return t;
  return null;
}

function applyTheme(theme: "light" | "dark" | null) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  }
  // else: leave class as-is (follow system from CSS media)
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark" | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getTheme();
    setThemeState(stored);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const setTheme = useCallback((value: "light" | "dark") => {
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
    setThemeState(value);
    setIsDark(value === "dark");
  }, []);

  const toggle = useCallback(() => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
  }, [isDark, setTheme]);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Przełącz motyw"
        className="h-9 w-9 rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] opacity-50"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Włącz jasny motyw" : "Włącz ciemny motyw"}
      className="h-9 w-9 rounded-lg border border-[hsl(var(--card-border))] bg-[hsl(var(--card-bg))] flex items-center justify-center text-foreground hover:opacity-90 transition-opacity"
    >
      {isDark ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}
