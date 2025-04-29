import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../firebase"; // Ensure db is imported to interact with Firestore
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore"; // Firestore functions
import { Box, TextField, Button, Typography, Container, Stack, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [openUsernameDialog, setOpenUsernameDialog] = useState(false); // Manage dialog state
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const checkUsernameExists = async (username) => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // Returns true if username exists, false if it doesn't
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Check if username already exists
    const usernameExists = await checkUsernameExists(formData.username);
    if (usernameExists) {
      setErrorMessage("Username is already taken, please choose another one.");
      setOpenUsernameDialog(true); // Show dialog to create a new username
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCredential.user, {
        displayName: formData.name,
        photoURL: "", // Default empty photoURL, will be handled separately
      });

      // Save user data to Firestore, including a dummy profile pic if no Google account
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: formData.name,
        username: formData.username,
        mobile: formData.mobile,
        email: formData.email,
        photoURL: userCredential.user.photoURL || "https://via.placeholder.com/150", // Use dummy pic if no photoURL
      });

      navigate("/home");
      alert("Signup successful!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if username exists
      const usernameExists = await checkUsernameExists(user.displayName);
      if (usernameExists) {
        navigate("/home");
        alert("Signed up with Google!");
        return;
      }

      setErrorMessage("Username is already taken, please choose another one.");
      setOpenUsernameDialog(true); // Show dialog to create a new username
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCloseDialog = () => {
    setOpenUsernameDialog(false);
  };

  const handleCreateUsername = async (newUsername) => {
    // Update Firestore document with the new username
    const user = auth.currentUser;
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      username: newUsername,
      mobile: formData.mobile,
      email: formData.email,
      photoURL: user.photoURL || "https://via.placeholder.com/150", // Ensure fallback photoURL
    });
    setOpenUsernameDialog(false);
    navigate("/");
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>
        <Box component="form" onSubmit={handleSignup} noValidate sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <TextField name="name" label="Name" fullWidth onChange={handleChange} required />
            <TextField name="username" label="Username" fullWidth onChange={handleChange} required />
            <TextField name="mobile" label="Mobile No." fullWidth onChange={handleChange} required />
            <TextField name="email" label="Email" type="email" fullWidth onChange={handleChange} required />
            <TextField name="password" label="Password" type="password" fullWidth onChange={handleChange} required />
            <TextField name="confirmPassword" label="Confirm Password" type="password" fullWidth onChange={handleChange} required />
            <Button type="submit" variant="contained" fullWidth>
              Sign Up
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignup}
            >
              Sign up with Google
            </Button>
          </Stack>
          
          <p>Already have an account <a href="/login">Login</a>?</p>
        </Box>
      </Box>

      {/* Dialog for Username Creation */}
      <Dialog open={openUsernameDialog} onClose={handleCloseDialog}>
        <DialogTitle>{errorMessage}</DialogTitle>
        <DialogContent>
          <TextField
            label="Enter a New Username"
            fullWidth
            variant="outlined"
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => handleCreateUsername(formData.username)}
            color="primary"
          >
            Create Username
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Signup;
