"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 glass-card rounded-xl transition-all duration-300 hover:scale-105 cursor-pointer"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-yellow-400 transition-transform duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600 transition-transform duration-300" />
      )}
    </button>
  );
}
