// ThemeToggleContext.js
import React, { createContext, useState, useMemo, useContext, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "../theme"; // Adjust relative path as needed

const ThemeToggleContext = createContext();

export const ThemeToggleProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem("theme") || "dark");
  const [accent, setAccent] = useState(() => localStorage.getItem("accent") || "default");

  useEffect(() => {
    localStorage.setItem("theme", mode);
    localStorage.setItem("accent", accent);
  }, [mode, accent]);

  const toggleTheme = () => setMode((prev) => (prev === "dark" ? "light" : "dark"));

  const theme = useMemo(() => getTheme(mode, accent), [mode, accent]);

  return (
    <ThemeToggleContext.Provider value={{ mode, setMode, accent, setAccent, toggleTheme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeToggleContext.Provider>
  );
};

export const useThemeToggle = () => {
  const context = useContext(ThemeToggleContext);
  if (context === undefined) {
    throw new Error("useThemeToggle must be used within a ThemeToggleProvider");
  }
  return context;
};
