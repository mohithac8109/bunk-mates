import { createTheme, ThemeProvider } from "@mui/material/styles";
import { purple, indigo, teal, grey, blue, orange } from "@mui/material/colors";

// Create a custom Material UI theme
const theme = createTheme({
  palette: {
    mode: 'light', // You can switch to 'dark' mode if preferred
    primary: {
      main: grey[500], // Minimal and soft color for the primary action
    },
    secondary: {
      main: indigo[500], // Secondary action color
    },
    background: {
      default: grey[50], // Light background for minimal look
      paper: grey[100], // Slightly darker paper background
    },
    text: {
      primary: grey[900], // Dark text for high contrast
      secondary: grey[600], // Lighter text
    },
    action: {
      active: grey[700],
      hover: grey[300],
      selected: grey[500],
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h6: {
      fontWeight: 600, // Bold typography for headings
    },
    body1: {
      fontWeight: 400, // Regular body text
    },
    body2: {
      fontWeight: 300, // Light secondary text
    },
  },
});
