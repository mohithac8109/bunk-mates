// theme.js
import { createTheme } from "@mui/material/styles";
import { themeColors } from "./elements/themeColors";

export function getTheme(mode = "dark", accent = "default") {
  let base = { ...themeColors[mode] };

  const accents = {
    blue: {
      main: "#1976d2",
      mainbg: "#1976d260",
      bg: "#bbdefb",
      bgr: "#bbdefb",
      card: "#e3f2fd",
      shades: ["#E3F2FD", "#90CAF9", "#42A5F5", "#1976D2", "#0D47A1"],
    },
    green: {
      main: "#43a047",
      mainbg: "#43a04760",
      bg: "#c8e6c9ff",
      bgr: "#c8e6c9",
      card: "#f1f8e9",
      shades: ["#E8F5E9", "#A5D6A7", "#66BB6A", "#43A047", "#1B5E20"],
    },
    red: {
      main: "#e53935",
      mainbg: "#e5393560",
      bg: "#ffcdd2",
      bgr: "#ffd2d6ff",
      card: "#ffebee",
      shades: ["#FFEBEE", "#EF9A9A", "#EF5350", "#E53935", "#B71C1C"],
    },
    orange: {
      main: "#f9971f",
      mainbg: "#f9971f60",
      bg: "#ffdeb6ff",
      bgr: "#ffeed9ff",
      card: "#d7c7b4ff",
      shades: ["#FFF3E0", "#FFCC80", "#FFA726", "#FB8C00", "#E65100"],
    },
    yellow: {
      main: "#c8b402ff",
      mainbg: "#FFF9C470",
      bg: "#fef8ceff",
      bgr: "#fef8ceff",
      card: "#FFFDE7",
      shades: ["#FFFDE7", "#FFF176", "#FFEB3B", "#FDD835", "#FBC02D"],
    },
    turquoise: {
      main: "#0098adff",
      mainbg: "#B2EBF270",
      bg: "#b6f6ffff",
      bgr: "#c0f7ffec",
      card: "#E0F7FA",
      shades: ["#E0F7FA", "#80DEEA", "#26C6DA", "#00ACC1", "#006064"],
    },
    lime: {
      main: "#738000ff",
      mainbg: "#F9FBE770",
      bg: "#DCE775",
      bgr: "#f8ffb8ff",
      card: "#F9FBE7",
      shades: ["#F9FBE7", "#DCE775", "#CDDC39", "#AFB42B", "#827717"],
    },
    purple: {
      main: "#c205e3ff",
      mainbg: "#E1BEE770",
      bg: "#f4b8ffff",
      bgr: "#d9badeff",
      card: "#F3E5F5",
      shades: ["#F3E5F5", "#CE93D8", "#AB47BC", "#8E24AA", "#6A1B9A"],
    },
    skyblue: {
      main: "#009de6ff",
      mainbg: "#81D4FA70",
      bg: "#ace5ffff",
      bgr: "#caeeffff",
      card: "#E1F5FE",
      shades: ["#E1F5FE", "#81D4FA", "#29B6F6", "#039BE5", "#01579B"],
    },
    mint: {
      main: "#2E7D32",
      mainbg: "#A5D6A770",
      bg: "#A5D6A7",
      bgr: "#d3ffd6ff",
      card: "#E8F5E9",
      shades: ["#e2ffe4ff", "#A5D6A7", "#66BB6A", "#4CAF50", "#2E7D32"],
    },
  };

  if (accent !== "default" && base.palette && accents[accent]) {
    const accentColors = accents[accent];
    base.palette.primary = {
      ...base.palette.primary,
      ...accentColors,
    };
  }

  return createTheme(base);
}
