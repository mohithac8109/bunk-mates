import React, { createContext, useContext, useState, useEffect } from "react";

const SETTINGS_KEY = "bunkmate_settings";
const defaultSettings = {
  theme: "dark", // or "light"
  accent: "default", // or "blue", "green", etc.
  autoAccent: true,
  locationMode: "auto", // "auto" or "manual"
  manualLocation: "",
};

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  // Load from localStorage/cookie on mount
  useEffect(() => {
    let loaded = null;
    try {
      const local = localStorage.getItem(SETTINGS_KEY);
      if (local) loaded = JSON.parse(local);
      if (!loaded) {
        const cookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith(SETTINGS_KEY + "="))
          ?.split("=")[1];
        if (cookie) loaded = JSON.parse(decodeURIComponent(cookie));
      }
    } catch {}
    if (loaded) setSettings({ ...defaultSettings, ...loaded });
  }, []);

  // Save to localStorage/cookie on change
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.cookie = `${SETTINGS_KEY}=${encodeURIComponent(JSON.stringify(settings))}; path=/; max-age=31536000`;
  }, [settings]);

  // Actions
  const setTheme = (theme) => setSettings((s) => ({ ...s, theme }));
  const setAccent = (accent) => setSettings((s) => ({ ...s, accent }));
  const setAutoAccent = (autoAccent) => setSettings((s) => ({ ...s, autoAccent }));

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,    // <-- expose setSettings for direct use
        setTheme,
        setAccent,
        setAutoAccent,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);