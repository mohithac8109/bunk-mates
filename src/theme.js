// theme.js
import { createTheme } from "@mui/material/styles";
import { themeColors } from "./elements/themeColors";

export function getTheme(mode = "dark", accent = "default") {
  let base = { ...themeColors[mode] };

  // Apply accent color to primary if not default
  if (accent !== "default" && base.palette) {
    base.palette.primary = {
      ...base.palette.primary,
      main:
        accent === "blue"
          ? "#1976d2"
          : accent === "green"
          ? "#43a047"
          : accent === "red"
          ? "#e53935"
          : accent === "orange"
          ? "#f9971fff"
          : base.palette.primary.main,
      bg: 
        accent === "blue"
          ? "#bbdefb"
          : accent === "green"
          ? "#c8e6c9ff"
          : accent === "red"
          ? "#ffcdd2"
          : accent === "orange"
          ? "#ffdeb6ff"
          : base.palette.primary.bg,

      bgr: 
        accent === "blue"
          ? "#bbdefb73"
          : accent === "green"
          ? "#c8e6c973"
          : accent === "red"
          ? "#ffcdd273"
          : accent === "orange"
          ? "#ffeed9ff"
          : base.palette.primary.bg,
      
      card: 
        accent === "blue"
          ? "#e3f2fd"
          : accent === "green"
          ? "#f1f8e9"
          : accent === "red"
          ? "#ffebee"
          : accent === "orange"
          ? "#d7c7b4ff"
          : base.palette.primary.card,
    };
  }

  return createTheme(base);
}
