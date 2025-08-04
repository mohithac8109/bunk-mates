// themeColors.js

export const themeColors = {
  light: {
    palette: {
      mode: "light",
      background: { default: "#f1f1f1", paper: "#FFF", main: "#ffffffbc", card: "#cbcbcb" },
      primary: { main: "#f9971f", contrastText: "#000", bg: "#ffdeb6ff", mainbg: "#f9971f60", bgr: "#ffeed9ff", card: "#d7c7b4ff" },
      secondary: { main: "#e0e0e0" },
      text: { primary: "#18191A", secondary: "#555", disabled: "#aaa" },
      action: {
        hover: "#bababaff",
        selected: "#e0ffe0",
        disabledBackground: "#e0e0e0",
        disabled: "#aaa",
      },
      divider: "rgb(240,240,240)",
    },
    // Additional special colors as needed
  },
  dark: {
    palette: {
      mode: "dark",
      background: { default: "#0c0c0c", paper: "#0c0c0c", main: "#00000001", card: "#262626" },
      primary: { main: "#f9971f", contrastText: "#000", bg: "#ffdeb6ff", mainbg: "#f9971f60", bgr: "#ffeed9ff", card: "#d7c7b4ff" },
      secondary: { main: "#444444ea" },
      text: { primary: "#FFF", secondary: "#BDBDBD", disabled: "#f0f0f0" },
      action: {
        hover: "#dcdcdcff",
        selected: "#131313",
        disabledBackground: "#1c1c1c29",
        disabled: "#BDBDBD",
      },
      divider: "rgb(24,24,24)",
    },
    // Additional special colors as needed
  },
};
