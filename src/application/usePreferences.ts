import { useEffect, useLayoutEffect, useState } from "react";
import {
  loadPreferences,
  preferencesKey,
  savePreferences,
  type Preferences,
} from "../repositories/localPreferences";

export function createCustomSheet(css: string): CSSStyleSheet {
  if (
    typeof CSSStyleSheet === "undefined" ||
    !CSSStyleSheet.prototype.replaceSync ||
    !("adoptedStyleSheets" in document)
  ) {
    throw new Error("Este navegador não oferece suporte ao CSS personalizado.");
  }
  const sheet = new CSSStyleSheet();
  // Constructed sheets use the browser parser and ignore external @import rules.
  sheet.replaceSync(css);
  if (!sheet.cssRules.length)
    throw new Error("Nenhuma regra CSS reconhecida. Confira o código.");
  return sheet;
}

export function usePreferences(safeMode: boolean) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const {
    theme,
    accent,
    textSize,
    highContrast,
    reduceMotion,
    css,
    cssEnabled,
  } = preferences;

  useLayoutEffect(() => {
    const { dataset } = document.documentElement;
    dataset.theme = theme;
    dataset.accent = accent;
    dataset.textSize = textSize;
    dataset.highContrast = String(highContrast);
    dataset.reduceMotion = String(reduceMotion);
  }, [theme, accent, textSize, highContrast, reduceMotion]);

  useLayoutEffect(() => {
    if (!cssEnabled || safeMode) return;
    let sheet: CSSStyleSheet;
    try {
      sheet = createCustomSheet(css);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    } catch {
      return;
    }
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (current) => current !== sheet,
      );
    };
  }, [css, cssEnabled, safeMode]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === preferencesKey || event.key === null)
        setPreferences(loadPreferences());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function updatePreferences(patch: Partial<Preferences>) {
    try {
      setPreferences(savePreferences(patch));
      return true;
    } catch {
      return false;
    }
  }

  return { preferences, updatePreferences };
}

export function prefersReducedMotion() {
  return (
    document.documentElement.dataset.reduceMotion === "true" ||
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}
