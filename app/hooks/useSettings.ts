import { useState, useEffect } from "react";

export interface Settings {
  theme: "dark" | "light";
  accentColor: string;
  defaultMultiplier: number;
  defaultCommission: number;
  defaultFees: number;
  currencyFormat: "USD" | "EUR" | "GBP" | "CAD" | "AUD";
}

const DEFAULTS: Settings = {
  theme: "dark",
  accentColor: "#00e57a",
  defaultMultiplier: 100,
  defaultCommission: 0,
  defaultFees: 0,
  currencyFormat: "USD",
};

const STORAGE_KEY = "journedge_settings";

const COLOR_MAP: Record<string, { dim: string }> = {
  "#00e57a": { dim: "rgba(0,229,122,0.12)" },
  "#4d9fff": { dim: "rgba(77,159,255,0.12)" },
  "#a78bfa": { dim: "rgba(167,139,250,0.12)" },
  "#fb923c": { dim: "rgba(251,146,60,0.12)" },
  "#f472b6": { dim: "rgba(244,114,182,0.12)" },
};

function applyAccentColor(value: string) {
  const color = COLOR_MAP[value];
  if (!color) return;
  const root = document.documentElement;
  root.style.setProperty("--accent-green", value);
  root.style.setProperty("--accent-dim", color.dim);
  root.style.setProperty("--accent-green-dim", color.dim);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Settings = { ...DEFAULTS, ...JSON.parse(stored) };
        setSettings(parsed);
        if (parsed.accentColor) applyAccentColor(parsed.accentColor);
      }
    } catch {}
  }, []);

  const updateSettings = (partial: Partial<Settings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (partial.accentColor) applyAccentColor(partial.accentColor);
  };

  const resetSettings = () => {
    setSettings(DEFAULTS);
    localStorage.removeItem(STORAGE_KEY);
    applyAccentColor(DEFAULTS.accentColor);
  };

  return { settings, updateSettings, resetSettings };
}