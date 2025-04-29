import { useState, useEffect } from "react"; // Remove the React import
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../firebase"; // Ensure db is imported to interact with Firestore
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Box, TextField, Button, Typography, Container, Stack } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState(null); // This state will store user data

  // Check if the user is already logged in using Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If the user is already logged in, save user data to localStorage
        saveUserDataToLocalStorage(user);
        setUser(user); // Set user state to render appropriate content
        navigate("/"); // Redirect to home page
      }
    });
    return unsubscribe;
  }, [navigate]);

  const saveUserDataToLocalStorage = (user) => {
    const userData = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL || "",
    };
    // Save to localStorage
    localStorage.setItem("bunkmateuser", JSON.stringify(userData));
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
        saveUserDataToLocalStorage(userCredential.user); // Save user data to localStorage
        setUser(userCredential.user);
        navigate("/"); // Navigate to home if the user exists
      } else {
        setErrorMessage("User not found, please sign up.");
      }
    } catch (error) {
      setErrorMessage(error.message); // Display error message
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if the username exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        saveUserDataToLocalStorage(user); // Save user data to localStorage
        setUser(user);
        navigate("/"); // Navigate to home if the user exists
      } else {
        setErrorMessage("User not found, please sign up.");
      }
    } catch (error) {
      setErrorMessage(error.message); // Display error message
    }
  };

  const handleLogout = () => {
    auth.signOut(); // Sign out from Firebase
    localStorage.removeItem("bunkmateuser"); // Remove user data from localStorage
    setUser(null); // Reset user state
    navigate("/login"); // Navigate to login page
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {user ? (
          <div>
            <Typography variant="h5">Welcome back, {user.displayName}</Typography>
            <Button variant="contained" onClick={handleLogout}>Logout</Button>
          </div>
        ) : (
          <>
            <Typography component="h1" variant="h5">Login</Typography>
            <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 3 }}>
              <Stack spacing={2}>
                <TextField name="email" label="Email" type="email" fullWidth onChange={handleChange} required />
                <TextField name="password" label="Password" type="password" fullWidth onChange={handleChange} required />
                <Button type="submit" variant="contained" fullWidth>Login</Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleLogin}
                >
                  Login with Google
                </Button>
              </Stack>
              <p>Don't have an account <a href="/signup">Signup</a>?</p>
            </Box>
            {errorMessage && <Typography color="error">{errorMessage}</Typography>}
          </>
        )}
      </Box>
    </Container>
  );
};

export default Login;
