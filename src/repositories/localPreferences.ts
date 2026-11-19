export const preferencesKey = "symos-preferences-v1";
export const cssLimit = 20000;

export const themeOptions = {
  system: "Do sistema",
  light: "Claro",
  dark: "Escuro",
};
export const accentOptions = {
  blue: "Azul",
  teal: "Verde-petróleo",
  violet: "Violeta",
};
export const textOptions = {
  standard: "Padrão (100%)",
  large: "Grande (112,5%)",
  larger: "Maior (125%)",
};

export type Preferences = {
  theme: keyof typeof themeOptions;
  accent: keyof typeof accentOptions;
  textSize: keyof typeof textOptions;
  highContrast: boolean;
  reduceMotion: boolean;
  css: string;
  cssEnabled: boolean;
};

export const displayDefaults = {
  theme: "system",
  accent: "blue",
  textSize: "standard",
  highContrast: false,
  reduceMotion: false,
} satisfies Partial<Preferences>;

const defaults: Preferences = {
  ...displayDefaults,
  css: "",
  cssEnabled: false,
};

function option<Value extends string>(
  value: unknown,
  options: Record<Value, string>,
  fallback: Value,
): Value {
  return typeof value === "string" && Object.hasOwn(options, value)
    ? (value as Value)
    : fallback;
}

export function loadPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(preferencesKey) ?? "null");
    if (!saved || typeof saved !== "object") return defaults;
    const css =
      typeof saved.css === "string" && saved.css.length <= cssLimit
        ? saved.css
        : "";
    return {
      theme: option(saved.theme, themeOptions, defaults.theme),
      accent: option(saved.accent, accentOptions, defaults.accent),
      textSize: option(saved.textSize, textOptions, defaults.textSize),
      highContrast: saved.highContrast === true,
      reduceMotion: saved.reduceMotion === true,
      css,
      cssEnabled: !!css.trim() && saved.cssEnabled === true,
    };
  } catch {
    return defaults;
  }
}

export function savePreferences(patch: Partial<Preferences>): Preferences {
  const next = { ...loadPreferences(), ...patch };
  localStorage.setItem(preferencesKey, JSON.stringify(next));
  return next;
}
