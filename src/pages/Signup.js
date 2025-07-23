import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Slide,
  IconButton,
  InputAdornment,
  Snackbar,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import GoogleIcon from "@mui/icons-material/Google";
import { auth, googleProvider, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

const transition = (props) => <Slide direction="up" {...props} />;

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    mobile: "",
    email: "",
    type: "Regular",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const checkUsernameExists = async (username) => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setSnackbar({ open: true, message: "Passwords do not match", severity: "error" });
      return;
    }

    const usernameExists = await checkUsernameExists(formData.username);
    if (usernameExists) {
      setErrorMessage("Username already taken. Try another.");
      setOpenDialog(true);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      await updateProfile(userCred.user, { displayName: formData.name });

      await setDoc(doc(db, "users", userCred.user.uid), {
        name: formData.name,
        username: formData.username,
        mobile: formData.mobile,
        email: formData.email,
        type: "Regular",
        photoURL: userCred.user.photoURL || "https://via.placeholder.com/150",
      });

      setSnackbar({ open: true, message: "Signup successful!", severity: "success" });
      setTimeout(() => window.location.href = "/", 1200);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const usernameExists = await checkUsernameExists(user.displayName);

      if (!usernameExists) {
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName,
          username: user.displayName,
          mobile: "",
          email: user.email,
          type: "Regular",
          photoURL: user.photoURL || "https://via.placeholder.com/150",
        });
        setSnackbar({ open: true, message: "Signed up with Google!", severity: "success" });
        setTimeout(() => window.location.href = "/", 1200);
      } else {
        setErrorMessage("Username already taken. Try another.");
        setOpenDialog(true);
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: "error" });
    }
  };

  const handleCreateUsername = async (newUsername) => {
    const user = auth.currentUser;
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      username: newUsername,
      mobile: "",
      email: user.email,
      type: "Regular",
      photoURL: user.photoURL || "https://via.placeholder.com/150",
    });
    setOpenDialog(false);
    window.location.href = "/";
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        mt: 8,
        p: 4,
        animation: "fadeSlideIn 0.6s ease-out",
        "@keyframes fadeSlideIn": {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Typography variant="h4" align="center" sx={{ color: "#fff", fontWeight: 600, mb: 3 }}>
        Create Account
      </Typography>

      <Box component="form" onSubmit={handleSignup}>
        <Stack spacing={2}>
          {["name", "username", "mobile", "email"].map((field) => (
            <TextField
              key={field}
              name={field}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              fullWidth
              required
              onChange={handleChange}
              variant="outlined"
              InputProps={{
                style: { color: "#fff", borderRadius: '12px', border: '2px solid #6f6f6f' },
              }}
              InputLabelProps={{
                style: { color: "#B0BEC5", letterSpacing: "0.05em" },
              }}
            />
          ))}

          {/* Password Fields */}
          <TextField
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              style: { color: "#fff", borderRadius: '12px', border: '2px solid #6f6f6f' },
            }}
            InputLabelProps={{
              style: { color: "#B0BEC5", letterSpacing: "0.05em" },
            }}
          />
          <TextField
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            required
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm((prev) => !prev)} edge="end">
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              style: { color: "#fff", borderRadius: '12px', border: '2px solid #6f6f6f' },
            }}
            InputLabelProps={{
              style: { color: "#B0BEC5", letterSpacing: "0.05em" },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#ffffffba",
              color: "#000",
              borderRadius: 14,
              fontWeight: 500,
              py: 1.5,
              "&:hover": {
                backgroundColor: "#ffffffff",
                transform: "scale(1.03)",
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            Sign Up
          </Button>

          <Button
            fullWidth
            onClick={handleGoogleSignup}
            startIcon={<GoogleIcon />}
            sx={{
              border: "1px solid #696969ff",
              color: "#fff",
              backgroundColor: "#1e1e1e00",
              borderRadius: 14,
              py: 1.5,
              "&:hover": {
                backgroundColor: "#2C2C2C",
                transform: "scale(1.03)",
              },
            }}
          >
            Continue with Google
          </Button>

          <Typography variant="body2" align="center" sx={{ color: "#ffffffff", mt: 2 }}>
            Already have an account?{" "}
            <Link href="/login" underline="hover" color="#00BFA6">
              Login
            </Link>
          </Typography>
        </Stack>
      </Box>

      {/* Username Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} TransitionComponent={transition}>
        <DialogTitle>{errorMessage}</DialogTitle>
        <DialogContent>
          <TextField
            label="Enter New Username"
            fullWidth
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={() => handleCreateUsername(formData.username)} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Container>
  );
};

export default Signup;
