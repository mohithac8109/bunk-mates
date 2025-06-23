import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Fade,
  Slide,
  Stack,
  GlobalStyles,
} from "@mui/material";
import { Smartphone, LaptopMac } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Inject Nunito font from Google Fonts
const nunitoFontUrl =
  "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap";

// Material 3 expressive dark theme with Nunito
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#D0BCFF" },
    secondary: { main: "#CCC2DC" },
    background: { default: "#18122B", paper: "#1E1B2E" },
    surface: { main: "#1E1B2E" },
    error: { main: "#F2B8B5" },
    info: { main: "#80BFFF" },
    success: { main: "#00A36C" },
    warning: { main: "#FFD600" },
    divider: "#2A2740",
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: "Nunito, Roboto, 'Google Sans', Arial, sans-serif",
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, letterSpacing: 0.5 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          boxShadow: "none",
        },
      },
    },
  },
});

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export default function DeviceGuard({ children }) {
  const [isMobile, setIsMobile] = useState(null);

  // Inject Nunito font
  useEffect(() => {
    if (!document.getElementById("nunito-font-link")) {
      const link = document.createElement("link");
      link.id = "nunito-font-link";
      link.rel = "stylesheet";
      link.href = nunitoFontUrl;
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  if (isMobile === false) {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyles styles={{ body: { fontFamily: "Nunito, Roboto, Arial, sans-serif" } }} />
        <Fade in>
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <Slide in direction="down" timeout={600}>
              <Paper
                elevation={4}
                sx={{
                  p: { xs: 3, sm: 5 },
                  maxWidth: 420,
                  width: "100%",
                  textAlign: "center",
                  borderRadius: 5,
                  boxShadow: "0 8px 32px 0 #d0bcff00",
                  background: "#1E1B2E00",
                }}
              >
                <Stack alignItems="center" spacing={2}>
                  <LaptopMac
                    sx={{
                      fontSize: 80,
                      color: "#fff",
                      background: "#f1f1f141",
                      borderRadius: "50%",
                      p: 2,
                      boxShadow: "0 2px 8px 0 rgba(208,188,255,0.10)",
                    }}
                  />
                  <Typography variant="h4" color="#fff" sx={{ fontWeight: 700 }}>
                    Mobile Only
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    This web application is currently available for <b>mobile devices</b> only.<br />
                    Please access BunkMate from your phone or tablet for the best experience.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      mt: 2,
                      borderRadius: 1,
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      boxShadow: "0 2px 8px 0 rgba(208,188,255,0)",
                      px: 4,
                      py: 1.5,
                      letterSpacing: 0.5,
                      backgroundColor: "#f1f1f111",
                      color: "#fff"
                    }}
                    startIcon={<Smartphone />}
                    href="https://bunkmate.app"
                  >
                    Learn More
                  </Button>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
                    Already on mobile? Try refreshing or using a different browser.
                  </Typography>
                </Stack>
              </Paper>
            </Slide>
          </Box>
        </Fade>
      </ThemeProvider>
    );
  }
  return <>{children}</>;
}