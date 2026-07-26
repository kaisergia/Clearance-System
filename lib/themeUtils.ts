/**
 * Dynamically applies entity theme color to document CSS variables.
 */
export function applyThemeColor(hexColor?: string | null) {
  if (typeof document === "undefined") return;
  const primary = hexColor || "#b51b15";
  document.documentElement.style.setProperty("--primary", primary);
  document.documentElement.style.setProperty("--primary-container", `${primary}dd`);
}
