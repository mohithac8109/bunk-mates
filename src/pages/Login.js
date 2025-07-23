import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Stack,
  Checkbox,
  FormControlLabel,
  Link,
  Fade,
  Drawer,
  Paper,
  Card,
  Avatar,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { auth, googleProvider, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Dark mode theme configuration
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ffffff" },
    background: {
      default: "#121212",
      paper: "#1F1F1F",
    },
    text: {
      primary: "#E0E0E0",
      secondary: "#AAAAAA",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

// Utility function to set cookie
function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Working late?";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

const Login = () => {
  const navigate = useNavigate();

  // Component state
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  // Listen for auth state changes on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (loggedInUser) => {
      if (loggedInUser) {
        saveUserData(loggedInUser);
        setUser(loggedInUser);
        setShowDrawer(true);
      }
    });
    setFadeIn(true);
    return unsubscribe; // cleanup listener on unmount
  }, []);

  // Save user to localStorage if Remember Me is checked
  const saveUserData = (user) => {
    const userData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL || "",
    };
    if (rememberMe) {
      localStorage.setItem("bunkmateuser", JSON.stringify(userData));
    }
  };

  // Form input change handler
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Email/password login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const userDoc = await getDoc(doc(db, "users", credential.user.uid));
      if (userDoc.exists()) {
        const userType = userDoc.data().type || "";
        setCookie("bunkmate_usertype", userType, 30);
        saveUserData(credential.user);
        setUser(credential.user);
        setShowDrawer(true);
      } else {
        setErrorMessage("User not found, please sign up.");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Google login handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userType = userDoc.data().type || "";
        setCookie("bunkmate_usertype", userType, 30);
        saveUserData(user);
        setUser(user);
        setShowDrawer(true);
      } else {
        setErrorMessage("User not found, please sign up.");
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Continue button after login drawer
  const handleContinue = () => {
    setShowDrawer(false);
    navigate("/");
  };

  // Logout handler
  const handleLogout = () => {
    auth.signOut();
    localStorage.removeItem("bunkmateuser");
    setUser(null);
    navigate("/login");
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
          minHeight: "90vh",
        }}
      >
        <Fade in={fadeIn} timeout={100}>
          <Container maxWidth="xs">
            <Stack spacing={4} sx={{ mt: "35vh" }}>
              <Typography
                variant="h4"
                fontWeight="bold"
                color="primary"
                align="left"
              >
                Login
              </Typography>

              {!user && (
                <>
                  <form onSubmit={handleLogin} style={{ width: "100%" }}>
                    <Stack spacing={2}>
                      <TextField
                        name="email"
                        label="Email"
                        type="email"
                        fullWidth
                        required
                        onChange={handleChange}
                        sx={{ borderRadius: 3 }}
                      />
                      <TextField
                        name="password"
                        label="Password"
                        type="password"
                        fullWidth
                        required
                        onChange={handleChange}
                      />
                      <Box display={"flex"} justifyContent="space-between" alignItems="center">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={rememberMe}
                            onChange={(e) =>
                              setRememberMe(e.target.checked)
                            }
                            sx={{ color: "#fff" }}
                          />
                        }
                        label="Remember Me"
                        sx={{
                          color: "#B0BEC5",
                          letterSpacing: "0.05em",
                        }}
                      />
                    <Link href="/forgot-password" underline="hover" color="#ffffff">
                      Forgot password?
                    </Link>
                    </Box>
                      <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{
                          backgroundColor: "#ffffffba",
                          py: 1,
                          fontSize: "1.2rem",
                          borderRadius: 14,
                        }}
                        disabled={loading}
                      >
                        {loading ? "Logging in..." : "Login"}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        onClick={handleGoogleLogin}
                        fullWidth
                        sx={{ py: 1, fontSize: "1.2rem", borderRadius: 14 }}
                        disabled={loading}
                      >
                        Login with Google
                      </Button>
                    </Stack>
                  </form>

                  <Stack
                    direction="row"
                    justifyContent="center"
                    width="100%"
                  >
                    <Link href="/signup" underline="hover" color="primary">
                      Don’t have an account? Sign Up
                    </Link>
                  </Stack>

                  {errorMessage && (
                    <Typography color="error" mt={1}>
                      {errorMessage}
                    </Typography>
                  )}
                </>
              )}
            </Stack>
          </Container>
        </Fade>
      </Box>

      {/* Fullscreen Drawer after successful login */}
<Drawer anchor="bottom" open={showDrawer} onClose={() => {}} hideBackdrop
  sx={{
    boxShadow: "none",
  }}>
<Box
    sx={{
      background: "url('/assets/images/bg.png') center/cover no-repeat",
      height: "100vh",
    }}
>

<Card
  sx={{
    position: "absolute",
      bottom: "0",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      boxShadow: "none",
      px: 3,
      py: 4,
      borderRadius: "16px 16px 0 0",
      backdropFilter: "blur(40px)",
      backgroundColor: "#0c0c0c95"
  }}
>
  <Box
        sx={{
          width: 100,
          height: 100,
          mb: 2,
          p: 0.3,
          borderRadius: "50%",
          border: "4px solid #303030ff",
        }}>
        <Avatar
        src={user?.photoURL}
        sx={{
          width: 100,
          height: 100,
          mb: 2,
        }}
      />
  </Box>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {getGreeting()}, {user?.displayName?.split(" ")[0] || "Explorer"}!
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        You've successfully logged into <b>BunkMate</b>
      </Typography>

      <Box sx={{ my: 3, textAlign: "center", backgroundColor: "#f1f1f111", p: 1, maxWidth: 400, width: "100%", borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
          <strong>Email:</strong> {user?.email}
        </Typography>
        <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
          <strong>Login Time:</strong>{" "}
          {new Date().toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        onClick={handleContinue}
        sx={{
          borderRadius: 50,
          px: 5,
          py: 1.5,
          fontSize: "1rem",
          boxShadow: "none",
        }}
      >
        Continue
      </Button>
</Card>

    </Box>
</Drawer>
    </ThemeProvider>
  );
};

export default Login;
