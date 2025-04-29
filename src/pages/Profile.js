import React, { useState, useEffect } from "react";
import { auth, firestore } from "../firebase"; // Firebase auth and firestore
import { TextField, Button, Container, Box, Avatar, Typography, CircularProgress, Skeleton } from "@mui/material";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore"; // Use getDoc instead of get()
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    mobile: "",
    photoURL: "",
  });
  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState(null); // For storing the selected image file
  const [isSaving, setIsSaving] = useState(false);
  const [firestoreDataLoaded, setFirestoreDataLoaded] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        // Fetch from Firebase Authentication
        const { displayName, email, photoURL, phoneNumber, uid } = user;
        
        // Fetch user details from Firestore
        const userDocRef = doc(firestore, "users", uid);
        try {
          const userDoc = await getDoc(userDocRef); // Use getDoc() here
          const userDocData = userDoc.data();

          setUserData({
            name: displayName || userDocData?.name || "",
            username: userDocData?.username || "",
            email: email || "",
            mobile: phoneNumber || userDocData?.mobile || "Not provided",
            photoURL: photoURL || userDocData?.photoURL || "",
          });

          setFirestoreDataLoaded(true);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        navigate("/login");
      }
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhotoFile(file);

      // Convert the image file to a base64 string (Data URI format)
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData({
          ...userData,
          photoURL: reader.result, // Store the base64 string (Data URI)
        });
      };
      reader.readAsDataURL(file); // Convert the image to base64 format
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save changes to Firestore (including base64 image)
      const userRef = doc(firestore, "users", auth.currentUser.uid);
      await setDoc(userRef, {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        mobile: userData.mobile,
        photoURL: userData.photoURL, // Save the base64 image string (Data URI)
      });

      // If there's a photoURL, update Firebase Authentication
      if (userData.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: userData.name,
          photoURL: userData.photoURL, // Set the base64 photoURL to Firebase Auth
        });
      } else {
        // If no photoURL, just update the displayName
        await updateProfile(auth.currentUser, {
          displayName: userData.name,
        });
      }

      setIsSaving(false);
      alert("Profile updated successfully!");
    } catch (error) {
      setIsSaving(false);
      console.error("Error saving profile", error);
      alert("Failed to update profile");
    }
  };

  return (
    <Container>
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            Edit Profile
          </Typography>

          {/* Profile Picture */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Avatar
              alt={userData.name}
              src={userData.photoURL || ""}
              sx={{ width: 100, height: 100, mr: 2 }}
            />
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: "none" }}
              id="profile-picture-upload"
            />
            <label htmlFor="profile-picture-upload">
              <Button variant="contained" component="span" color="primary">
                Upload Profile Picture
              </Button>
            </label>
          </Box>

          {/* Name */}
          <TextField
            fullWidth
            label="Name"
            value={userData.name}
            onChange={(e) =>
              setUserData({ ...userData, name: e.target.value })
            }
            margin="normal"
            disabled={isSaving}
          />

          {/* Username */}
          <TextField
            fullWidth
            label="Username"
            value={userData.username}
            onChange={(e) =>
              setUserData({ ...userData, username: e.target.value })
            }
            margin="normal"
            disabled={isSaving}
          />

          {/* Email */}
          <TextField
            fullWidth
            label="Email"
            value={userData.email}
            disabled
            margin="normal"
          />

          {/* Mobile */}
          <TextField
            fullWidth
            label="Mobile"
            value={userData.mobile}
            onChange={(e) =>
              setUserData({ ...userData, mobile: e.target.value })
            }
            margin="normal"
            disabled={isSaving}
          />

          {/* Show Skeleton loaders while data from Firestore is loading */}
          {!firestoreDataLoaded && (
            <>
              <Skeleton variant="text" width="80%" height={40} />
              <Skeleton variant="text" width="80%" height={40} />
              <Skeleton variant="text" width="80%" height={40} />
              <Skeleton variant="text" width="80%" height={40} />
            </>
          )}

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSaving || !firestoreDataLoaded}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default Profile;
