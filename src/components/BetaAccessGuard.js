import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Paper,
  Fade,
  Slide,
  Stack,
  SvgIcon,
  GlobalStyles,
} from "@mui/material";
import { LockOutlined, RocketLaunch, HourglassBottom } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { getCookie } from "../utils/cookies"; // ✅ Import from your cookies.js utility

const ALLOWED_USER_TYPES = ["Beta", "Dev Beta"];

// Theme definition
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

// Simple SVG
function BetaIllustration(props) {
  return (
    <SvgIcon viewBox="0 0 120 120" {...props} sx={{ fontSize: 120 }}>
      <circle cx="60" cy="60" r="56" fill="#2A2740" />
      <RocketLaunch sx={{ fontSize: 64, color: "#D0BCFF", position: "absolute", left: 28, top: 28 }} />
      <HourglassBottom sx={{ fontSize: 40, color: "#CCC2DC", position: "absolute", left: 60, top: 60 }} />
    </SvgIcon>
  );
}

export default function BetaAccessGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = () => {
      const rawUserType = getCookie("bunkmate_usertype") ||
                       JSON.parse(localStorage.getItem("bunkmateuser") || "{}")?.type;

      const userType = decodeURIComponent(rawUserType || "").trim();

      if (ALLOWED_USER_TYPES.includes((userType || "").trim())) {
        setAccessDenied(false);
      } else {
        setAccessDenied(true);
      }
      setLoading(false);
    };

    checkAccess();
  }, []);

  useEffect(() => {
    // Inject Nunito font
    if (!document.getElementById("nunito-font-link")) {
      const link = document.createElement("link");
      link.id = "nunito-font-link";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyles styles={{ body: { fontFamily: "Nunito, Roboto, Arial, sans-serif" } }} />
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
          <CircularProgress color="primary" size={48} />
        </Box>
      </ThemeProvider>
    );
  }

  if (accessDenied) {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyles styles={{ body: { fontFamily: "Nunito, Roboto, Arial, sans-serif" } }} />
        <Fade in>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 4, minHeight: "91vh" }}>
            <Slide in direction="up" timeout={600}>
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
                  <Box sx={{ position: "relative", width: 120, height: 120 }}>
                    <LockOutlined
                      sx={{
                        bottom: 8,
                        right: 8,
                        fontSize: 72,
                        color: "#fff",
                        background: "#f1f1f111",
                        borderRadius: "50%",
                        p: 2,
                        boxShadow: "0 2px 8px 0 rgba(208, 188, 255, 0)",
                      }}
                    />
                  </Box>
                  <Typography variant="h4" color="#fff" sx={{ fontWeight: 700 }}>
                    Beta Access Only
                  </Typography>
                  <Typography variant="body1" color="#696969" sx={{ mb: 1 }}>
                    This app is only available to <b>Beta</b> and <b>Dev Beta</b> users.<br />
                    Want to join the Beta program?
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/waitlist")}
                    sx={{
                      mt: 2,
                      borderRadius: 1,
                      fontWeight: 600,
                      fontSize: "1.1rem",
                      px: 4,
                      py: 1.5,
                      letterSpacing: 0.5,
                      backgroundColor: "#f1f1f131",
                      color: "#fff",
                    }}
                    startIcon={<RocketLaunch />}
                  >
                    Apply for Beta Access
                  </Button>
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 2 }}>
                    Already applied? We’ll notify you by email if selected.
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
