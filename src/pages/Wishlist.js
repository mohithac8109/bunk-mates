import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Snackbar,
  Slide,
  Fade,
  GlobalStyles,
} from "@mui/material";
import { RocketLaunch, Person, Email, EditNote } from "@mui/icons-material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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

const transition = (props) => <Slide direction="up" {...props} />;

const Wishlist = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    // Dynamically inject Nunito font link
    if (!document.getElementById("nunito-font-link")) {
      const link = document.createElement("link");
      link.id = "nunito-font-link";
      link.rel = "stylesheet";
      link.href = nunitoFontUrl;
      document.head.appendChild(link);
    }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.reason) {
      setSnackbar({ open: true, message: "Please fill all fields.", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "waitlist"), {
        ...form,
        createdAt: serverTimestamp(),
      });
      setSnackbar({ open: true, message: "Application submitted! We'll contact you if selected.", severity: "success" });
      setForm({ name: "", email: "", reason: "" });
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to submit. Try again.", severity: "error" });
    }
    setLoading(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={{ body: { fontFamily: "Nunito, Roboto, Arial, sans-serif" } }} />
      <Fade in>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
            alignContent: "center"
          }}
        >
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
                  <RocketLaunch
                    sx={{
                      fontSize: 80,
                      color: "#fff",
                      background: "#f1f1f111",
                      borderRadius: "50%",
                      p: 2,
                      boxShadow: "0 2px 8px 0 rgba(208, 188, 255, 0)",
                    }}
                  />
                </Box>
                <Typography variant="h4" color="#fff" sx={{ fontWeight: 700 }}>
                  Join Beta Waitlist
                </Typography>
                <Typography variant="body1" color="#696969" sx={{ mb: 1 }}>
                  Apply to become a <b>Beta Tester</b> for BunkMate!<br />
                  Fill in your details and why you want to join.
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%", mt: 4 }}>
                  <Stack spacing={2}>
                    <TextField
                      name="name"
                      label="Full Name"
                      value={form.name}
                      onChange={handleChange}
                      fullWidth
                      required
                      autoFocus
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: "#fff" }} />,
                        sx: { borderRadius: 1, background: "#f1f1f101", color: "#fff" },
                      }}
                      InputLabelProps={{ style: { color: "#fff" } }}
                    />
                    <TextField
                      name="email"
                      label="Email"
                      value={form.email}
                      onChange={handleChange}
                      type="email"
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: "#fff" }} />,
                        sx: { borderRadius: 1, background: "#f1f1f101", color: "#fff" },
                      }}
                      InputLabelProps={{ style: { color: "#fff" } }}
                    />
                    <TextField
                      name="reason"
                      label="Why do you want to join?"
                      value={form.reason}
                      onChange={handleChange}
                      fullWidth
                      required
                      multiline
                      minRows={3}
                      InputProps={{
                        sx: { borderRadius: 1, background: "#f1f1f101", color: "#fff" },
                      }}
                      InputLabelProps={{ style: { color: "#fff" } }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      sx={{
                        mt: 1,
                        py: 1.2,
                        fontWeight: 600,
                        backgroundColor: "#fff",
                        color: "#000",
                        fontSize: "1.1rem",
                        letterSpacing: 0.5,
                        borderRadius: 1,
                        boxShadow: "0 2px 8px 0 rgba(208, 188, 255, 0)",
                      }}
                      disabled={loading}
                      endIcon={<RocketLaunch />}
                    >
                      {loading ? "Submitting..." : "Apply"}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
              <Snackbar
                open={snackbar.open}
                autoHideDuration={3500}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                TransitionComponent={transition}
              />
            </Paper>
          </Slide>
        </Box>
      </Fade>
    </ThemeProvider>
  );
};

export default Wishlist;