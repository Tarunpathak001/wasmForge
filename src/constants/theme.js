export const APP_THEME_STORAGE_KEY = "wasmforge:theme";
export const LEGACY_LANDING_THEME_STORAGE_KEY = "wasmforge:landing-theme";

export function normalizeAppTheme(value) {
  return value === "inverted" ? "inverted" : "default";
}

export function readStoredAppTheme() {
  if (typeof window === "undefined") {
    return "default";
  }

  try {
    const storedTheme =
      window.localStorage.getItem(APP_THEME_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_LANDING_THEME_STORAGE_KEY);

    return normalizeAppTheme(storedTheme);
  } catch {
    return "default";
  }
}

export function persistAppTheme(theme) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedTheme = normalizeAppTheme(theme);
  window.localStorage.setItem(APP_THEME_STORAGE_KEY, normalizedTheme);
  window.localStorage.setItem(LEGACY_LANDING_THEME_STORAGE_KEY, normalizedTheme);
  window.dispatchEvent(
    new CustomEvent("wasmforge-theme-change", {
      detail: { theme: normalizedTheme },
    }),
  );
}
