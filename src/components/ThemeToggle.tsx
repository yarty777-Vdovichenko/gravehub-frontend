import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { applyTheme, getInitialTheme, type Theme } from "../theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <button
      className="icon-button theme-toggle"
      type="button"
      title={theme === "light" ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
      aria-label={theme === "light" ? "Увімкнути темну тему" : "Увімкнути світлу тему"}
      aria-pressed={theme === "dark"}
      onClick={toggleTheme}
    >
      {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
