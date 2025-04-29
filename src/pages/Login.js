import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../firebase"; // Ensure db is imported to interact with Firestore
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Box, TextField, Button, Typography, Container, Stack } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");

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
        navigate("/"); // Navigate to home if the user exists
      } else {
        setErrorMessage("User not found, please sign up.");
      }
    } catch (error) {
      setErrorMessage(error.message); // Display error message
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
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
      </Box>
    </Container>
  );
};

export default Login;
