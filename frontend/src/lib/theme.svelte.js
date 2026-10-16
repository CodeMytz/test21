const KEY = "reach21:theme";

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch (_) {}
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export const theme = $state({ mode: "dark" });

export function initTheme() {
  theme.mode = document.documentElement.dataset.theme || initial();
  document.documentElement.dataset.theme = theme.mode;
}

export function toggleTheme() {
  theme.mode = theme.mode === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme.mode;
  try {
    localStorage.setItem(KEY, theme.mode);
  } catch (_) {}
}
