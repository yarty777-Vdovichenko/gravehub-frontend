export type Theme = "light" | "dark";

export function getInitialTheme(): Theme {
  const saved = localStorage.getItem("gravehub-theme");
  return saved === "dark" ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.body.dataset.theme = theme;
  document.body.style.background =
    theme === "dark" ? "#111713" : "#f7f8fa";
  document.body.style.color =
    theme === "dark" ? "#dde7df" : "#263c32";
  localStorage.setItem("gravehub-theme", theme);
}
