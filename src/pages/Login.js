import { useState, useEffect } from "react";
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
  Paper,
  Fade,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { auth, googleProvider, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// ✅ Custom dark theme matching Chats/Home UI
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#fff",
    },
    background: {
      default: "#121212",
      paper: "#1F1F1F",
    },
    text: {
      primary: "#E0E0E0",
      secondary: "#AAAAAA",
    },
    error: {
      main: "#ff0000",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        saveUserDataToLocalStorage(user);
        setUser(user);
        navigate("/");
      }
    });
    setFadeIn(true);
    return unsubscribe;
  }, [navigate]);

  const saveUserDataToLocalStorage = (user) => {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (userDoc.exists()) {
  const userType = userDoc.data().type || "";
        setCookie("bunkmate_usertype", userType, 30);
        saveUserDataToLocalStorage(userCredential.user);
        setUser(userCredential.user);
        navigate("/");
      } else {
        setErrorMessage("User not found, please sign up.");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userType = userDoc.data().type || "";
        setCookie("bunkmate_usertype", userType, 30);
        saveUserDataToLocalStorage(user);
        setUser(user);
        navigate("/");
      } else {
        setErrorMessage("User not found, please sign up.");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

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
          background: 'transparent',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Fade in={fadeIn} timeout={800}>
          <Container maxWidth="xs">
              <Stack spacing={3} alignItems="left" marginTop="35vh">
                <Typography variant="h5" fontWeight="bold" color="primary">
                  <h2>Login</h2>
                </Typography>

                {user ? (
                  <>
                    <Typography variant="body1" sx={{ color: '#fff' }}>
                      Logged in as {user.displayName || user.email}
                    </Typography>
                    <Button variant="contained" sx={{ p: 1, borderRadius: 14 }} fullWidth onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <form style={{ width: "100%" }} onSubmit={handleLogin}>
                      <Stack spacing={2}>
                        <TextField
                          sx={{ borderRadius: 3 }}
                          name="email"
                          label="Email"
                          type="email"
                          fullWidth
                          required
                          onChange={handleChange}
                        />
                        <TextField
                          name="password"
                          label="Password"
                          type="password"
                          fullWidth
                          required
                          onChange={handleChange}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              sx={{ color: "#fff" }}
                            />
                          }
                          label="Remember Me"
                          sx={{
                            color: "#B0BEC5",
                            letterSpacing: "0.05em",
                          }}
                        />
                        <Button sx={{ backgroundColor: "#00f721ba", py: 1, fontSize: '1.2rem', borderRadius: 14 }} type="submit" variant="contained" fullWidth>
                          Login
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<GoogleIcon />}
                          onClick={handleGoogleLogin}
                          fullWidth
                          sx={{ py: 1, fontSize: '1.2rem', borderRadius: 14 }}
                        >
                          Login with Google
                        </Button>
                      </Stack>
                    </form>

                    <Stack direction="row" justifyContent="space-between" width="100%">
                      <Link href="/forgot-password" onClick="disabled" underline="hover" color="primary">
                        Forgot password?
                      </Link>
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
    </ThemeProvider>
  );
};

export default Login;
