import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth, db, firestore } from "../firebase";
import packageJson from '../../package.json'; 
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  ThemeProvider,
  createTheme,
  keyframes,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Slide,
  TextField,
  Switch,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
  Backdrop,
  Skeleton,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'; 
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';   
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { useTheme, useMediaQuery, Fab, Zoom } from "@mui/material";

// Fade-in animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Custom dark theme based on your detailed colors
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#02020200", // almost transparent black for main background
      paper: "#0c0c0c", // deep black for dialogs/paper
    },
    primary: {
      main: "#00f721", // bright green solid for buttons and accents
      contrastText: "#000000", // black text on bright green buttons
    },
    secondary: {
      main: "#444444ea", // dark grey with transparency for popups or secondary backgrounds
    },
    text: {
      primary: "#FFFFFF", // pure white for main text
      secondary: "#BDBDBD", // light grey for secondary text
      disabled: "#f0f0f0", // off-white for less prominent text or backgrounds
    },
    action: {
      hover: "#00f721", // bright green hover for interactive elements
      selected: "#131313", // dark black for selected states
      disabledBackground: "rgba(0,155,89,0.16)", // dark green transparent backgrounds for outlines
      disabled: "#BDBDBD",
    },
    divider: "rgb(24, 24, 24)", // very dark grey for borders
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h6: {
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: "1.5",
      color: "#FFFFFF",
    },
    body2: {
      fontSize: "0.875rem",
      color: "#BDBDBD",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0c0c0c", // dark grey/black for app bar background
          boxShadow: "none",
          borderBottom: "1px solid rgb(24, 24, 24)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#2c2c2c", // dark grey card background
          color: "#FFFFFF",
          boxShadow:
            "0 4px 12px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.6)",
          borderRadius: 16,
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-4px)",
            backgroundColor: "#131313",
          },
          animation: `${fadeIn} 0.6s ease forwards`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "12px",
          transition: "background-color 0.3s ease, box-shadow 0.3s ease",
          color: "#000",
          backgroundColor: "#fff",
          "&:hover": {
            backgroundColor: "#000",
            color: "#fff",
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: "#f0f0f0", // off-white avatar background
          color: "#000",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#0c0c0c", // deep black menu background
          color: "#FFFFFF",
          borderRadius: 8,
          border: "1px solid rgb(24, 24, 24)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#2c2c2c", // translucent dark green hover
          },
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          // General box overrides if needed
        },
      },
    },
  },
});

const Home = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState("main");
  const [showIndicator, setShowIndicator] = useState(false);
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  // User data states
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    mobile: "",
    photoURL: "",
    bio: "",
  });

  const [editedData, setEditedData] = useState({
    name: userData.name || "",
    email: userData.email || "",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [firestoreDataLoaded, setFirestoreDataLoaded] = useState(false);

  const updateUserData = (newData) => {
    // update userData state with newData
    setUserData(prev => ({ ...prev, ...newData }));
  };

  const gotoBudgetMngr = () => {
    navigate("/budget-mngr");
  }

  const [features] = useState([
    {
      name: "User Authentication",
      detail: "Secure login and registration system with email/password and OAuth support."
    },
    {
      name: "Edit Profile",
      detail: "Update your profile details including avatar, display name, and contact info."
    },
    {
      name: "Real-time Chat",
      detail: "Send and receive instant messages with friends or groups with online presence."
    },
    {
      name: "Push Notifications",
      detail: "Receive timely notifications about new messages, mentions, and app updates."
    },
    {
      name: "Dark Mode",
      detail: "Switch between light and dark themes to reduce eye strain and save battery."
    },
    {
      name: "Group Chats",
      detail: "Create and manage group conversations with multiple participants."
    },
    {
      name: "Message Reactions",
      detail: "React to messages with emojis to express your feelings quickly."
    },
    {
      name: "File Sharing",
      detail: "Send images, documents, and other files seamlessly in chats."
    },
    {
      name: "Search Messages",
      detail: "Easily search through your chat history to find important messages."
    },
    {
      name: "Custom Status",
      detail: "Set a custom status message to let others know what you're up to."
    }
  ]);


    const changelogs = [
    {
      version: "1.0.0",
      date: "2025-06-01",
      changes: [
        "Initial public release",
        "User authentication implemented",
        "Real-time chat with groups and file sharing",
        "Dark mode support",
      ],
    },
    {
      version: "1.1.0",
      date: "2025-06-05",
      changes: [
        "Added message reactions",
        "Improved search messages feature",
        "Bug fixes and performance improvements",
      ],
    }
  ];

  // Fetch user data on drawer open or when editProfile page is shown
  useEffect(() => {
    if (drawerOpen && drawerPage === "editProfile") {
      const fetchUserData = async () => {
        setLoading(true);
        const user = auth.currentUser;
        if (user) {
          const { displayName, email, photoURL, phoneNumber, userBio, uid } = user;
          const userDocRef = doc(firestore, "users", uid);
          try {
            const userDoc = await getDoc(userDocRef);
            const userDocData = userDoc.data();

            setUserData({
              name: displayName || userDocData?.name || "",
              username: userDocData?.username || "",
              email: email || "",
              mobile: phoneNumber || userDocData?.mobile || "Not provided",
              photoURL: photoURL || userDocData?.photoURL || "",
              bio: userBio || userDocData?.bio || "",
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
    }
  }, [drawerOpen, drawerPage, navigate]);


  // Save profile changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(firestore, "users", auth.currentUser.uid);
      await setDoc(userRef, {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        mobile: userData.mobile,
        photoURL: userData.photoURL,
        bio: userData.bio,
      });

      if (userData.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: userData.name,
          photoURL: userData.photoURL,
        });
      } else {
        await updateProfile(auth.currentUser, {
          displayName: userData.name,
        });
      }

      setIsSaving(false);
      alert("Profile updated successfully!");
      setDrawerPage("main"); // Return to main drawer page after save
    } catch (error) {
      setIsSaving(false);
      console.error("Error saving profile", error);
      alert("Failed to update profile");
    }
  };

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
    setTimeout(() => setShowIndicator(true), 100);
  };

  const handleDrawerClose = () => {
    setShowIndicator(false);
    setTimeout(() => {
      setDrawerOpen(false);
      setShowProfileEdit(false);
    }, 200);
  };

  const handleProfileSave = async () => {
    const userRef = doc(db, "users", userData.uid);
    await updateDoc(userRef, editedData);
    updateUserData(editedData);
    setShowProfileEdit(false);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      let user = auth.currentUser;

      if (!user) {
        const storedUser = localStorage.getItem("bunkmateuser");
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
          setLoading(false);
          return;
        } else {
          navigate("/login");
          return;
        }
      }

      const { displayName, email, photoURL, phoneNumber, userBio } = user;
      const newUserData = {
        name: displayName || "User",
        email: email || "",
        mobile: phoneNumber || "Not provided",
        photoURL: photoURL || "",
        bio: userBio || "",
      };

      setUserData(newUserData);
      localStorage.setItem("bunkmateuser", JSON.stringify(newUserData));
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("bunkmateuser");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
        }}
      >
        {/* AppBar */}
        <AppBar position="static" elevation={0}>
          <Toolbar sx={{ justifyContent: "space-between", px: 3, backgroundColor: 'transparent' }}>
            <Typography variant="h6" sx={{ userSelect: "none" }}>
              BunkMate 🏖️
            </Typography>
<>
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      borderRadius: "12px",
      p: 1,
      backgroundColor: "#101010",
      transition: "background-color 0.3s ease",
      "&:hover": {
        backgroundColor: "#2c2c2c",
      },
    }}
    onClick={handleDrawerOpen}
  >
    <Avatar src={userData.photoURL || ""} sx={{ width: 40, height: 40, mr: isSmallScreen ? 0 : 1 }} />
    {!isSmallScreen && (
      <>
        <Box sx={{ textAlign: "right", mr: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: "bold", color: "text.primary" }}>
            {userData.name || "Username"}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
            {userData.email || "Email"}
          </Typography>
        </Box>
        <ArrowDropDownIcon sx={{ color: "text.primary" }} />
      </>
    )}
  </Box>

  {/* Bottom Drawer */}
  <SwipeableDrawer
    anchor="bottom"
    open={drawerOpen}
    onClose={handleDrawerClose}
    PaperProps={{
      sx: {
        height: '90vh',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: "#0c0c0c00",
        backdropFilter: 'blur(80px)',
        backgroundImage: 'none',
        color: "#fff",
        px: 2,
        pb: 3,
      },
    }}
  >
    {/* Drawer drag indicator */}
    <Slide direction="down" in={true} timeout={200}>
      <Box
        sx={{ width: 40, height: 5, backgroundColor: "#666", borderRadius: 3, my: 1, mx: "auto" }}
      />
    </Slide>

    {/* Main Settings Page */}
    {drawerPage === "main" && (
      <>
        {/* User info */}
        <Box sx={{ display: "flex", alignItems: "left", my: 2, mx: 2 }}>
          <Typography sx={{ fontSize: '1.5rem' }}><h2>Settings</h2></Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 2, mx: 2 }}>
          <Avatar src={userData.photoURL || ""} sx={{ width: 50, height: 50 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {userData.name || "Username"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#aaa" }}>
              {userData.email || "Email"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "#333" }} />

        {/* Menu List */}
        <List sx={{ my: 2, gap: 0.5, display: "flex", flexDirection: "column" }}>
          <ListItem>
            <ListItemButton onClick={() => setDrawerPage("editProfile")} 
                sx={{ 
                  backgroundColor: "#f1f1f111", 
                  borderRadius: 1.6, 
                  py: 2,
                  '&:hover': { bgcolor: '#f1f1f121'}

                  }}>
              <ListItemIcon>
                <PersonOutlineIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="Edit Profile" />
            </ListItemButton>
          </ListItem>

          {/* New: App Version & About */}
          <ListItem>
            <ListItemButton onClick={() => setDrawerPage("about")} sx={{ backgroundColor: "#f1f1f111", borderRadius: 1.6, py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <InfoOutlinedIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="App Version & About" />
            </ListItemButton>
          </ListItem>

          {/* New: Support / Help */}
          <ListItem>
            <ListItemButton onClick={() => setDrawerPage("support")} sx={{ backgroundColor: "#f1f1f111", borderRadius: 1.6, py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <HelpOutlineIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="Support / Help" />
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton onClick={() => setConfirmLogout(true)} sx={{ backgroundColor: "#ff000036", borderRadius: 1.6, py: 2.2, '&:hover': { bgcolor: '#ff000086', color: '#ff000046'}}}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: "#ff1b1bcc" }} />
              </ListItemIcon>
              <Typography sx={{ color: "#ff1b1bcc" }}>Logout</Typography>
            </ListItemButton>
          </ListItem>
        </List>
      </>
    )}

    {/* Edit Profile Page */}
    {drawerPage === "editProfile" && (
      <Container sx={{ mt: 1, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setDrawerPage("main")}
            sx={{ mr: 2, width: '30px', fontSize: 3, borderRadius: 1.5, height: '50px', color: "#fff", backgroundColor: "#f1f1f111", }}
          />
          <h2>Edit Profile</h2>
        </Typography>
        {/* Your edit profile form here */}
        {/* ... */}
      </Container>
    )}

{drawerPage === "about" && (
  <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{ mr: 2, width: '30px', fontSize: 3, borderRadius: 1.5, height: '50px', color: "#fff", backgroundColor: "#f1f1f111" }}
    />
    <Typography variant="h5" gutterBottom><h2>App Version & About</h2></Typography>

          <Typography
            variant="body1"
            sx={{ mb: 2, backgroundColor: '#f1f1f111', fontSize: 18, py: 1, px: 2, borderRadius: 1, cursor: "pointer" }}
            onClick={() => setDrawerPage("featuresChangelog")}
          >
            Version: <strong>{packageJson.version || "N/A"}</strong>
          </Typography>

    <Typography variant="body2" sx={{ mb: 2, color: "#aaa" }}>
      Made with ❤️ In India!
    </Typography>

    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>Licenses & Credits</Typography>
    <Typography variant="body2" sx={{ mb: 1 }}>
      - React.js: MIT License<br />
      - Material-UI: MIT License<br />
      - Firebase: Apache 2.0 License<br />
      {/* Add more licenses as relevant */}
    </Typography>

    <Typography variant="body2" sx={{ mb: 1 }}>
      Special thanks to all contributors and open-source projects that made this app possible.
    </Typography>

    {/* --- New Features to Add --- */}

    {/* 2. Privacy Policy */}
    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Privacy Policy</Typography>
    <Typography variant="body2" sx={{ mb: 2, color: "#aaa" }}>
      Learn how we collect, use, and protect your data.
    </Typography>
    <Button
      variant="outlined"
      onClick={() => window.open('https://yourapp.com/privacy-policy', '_blank')}
      sx={{ mb: 3, backgroundColor: '#f1f1f111', color: '#fff', border: 'transparent' }}
    >
      Read Privacy Policy
    </Button>

    {/* 3. Terms of Service */}
    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Terms of Service</Typography>
    <Typography variant="body2" sx={{ mb: 2, color: "#aaa" }}>
      Review the rules and guidelines for using this app.
    </Typography>
    <Button
      variant="outlined"
      onClick={() => window.open('https://yourapp.com/terms', '_blank')}
      sx={{ mb: 3, backgroundColor: '#f1f1f111', color: '#fff', border: 'transparent' }}
    >
      View Terms
    </Button>

    {/* 4. Contact Info / Social Links */}
    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Contact & Social</Typography>
    <Typography variant="body2" sx={{ mb: 1, color: "#aaa" }}>
      Have questions or want to follow us? Connect via:
    </Typography>
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Button
        variant="contained"
        sx={{ mb: 3, backgroundColor: '#f1f1f111', color: '#fff', border: 'transparent', boxShadow: 'none' }}
        onClick={() => window.open('mailto:support@yourapp.com')}
      >
        <MailOutlinedIcon />
      </Button>
      {/* <Button
        variant="contained"
        color="secondary"
        onClick={() => window.open('https://twitter.com/yourapp')}
      >
        Twitter
      </Button>
      <Button
        variant="contained"
        sx={{ backgroundColor: '#0077b5', '&:hover': { backgroundColor: '#005582' } }}
        onClick={() => window.open('https://linkedin.com/company/yourapp')}
      >
        LinkedIn
      </Button> */}
    </Box>

    {/* 5. Open Source Link (if applicable) */}
    <Box sx={{ backgroundColor: '#f1f1f111', px: 3, py: 1, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Open Source</Typography>
    <Typography variant="body2" sx={{ mb: 2, color: "#aaa" }}>
      Our source code is available on GitHub for transparency and contributions.
    </Typography>
    <Button
      variant="outlined"
      onClick={() => window.open('https://github.com/yourapp', '_blank')}
      sx={{ mb: 3, backgroundColor: '#f1f1f111', color: '#fff', border: 'transparent' }}
    >
      View on GitHub
    </Button>
    </Box>
  </Container>
)}

      {drawerPage === "featuresChangelog" && (
        <Container sx={{ mt: 1, mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setDrawerPage("about")}
            sx={{ mr: 2, width: '30px', fontSize: 3, borderRadius: 1.5, height: '50px', color: "#fff", backgroundColor: "#f1f1f111" }}
          />
          <Typography variant="h5" gutterBottom><h2>Features & Changelog</h2></Typography>

          {/* Features Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Features</Typography>
            {features.map(({ name, detail }, idx) => (
              <Box key={idx} sx={{ mb: 2, ml: 2 }}>
                <Typography variant="subtitle1" component="div" fontWeight="bold">{name}</Typography>
                <Typography variant="body2" sx={{ color: "#aaa" }}>{detail}</Typography>
              </Box>
            ))}
          </Box>

          {/* Changelog Section */}
          <Box>
            <Typography variant="h6" gutterBottom>Changelog</Typography>
            {changelogs.map(({ version, date, changes }, idx) => (
              <Box key={idx} sx={{ mb: 3, pl: 2, borderLeft: '3px solid rgba(0, 122, 0, 0.79)' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Version {version} <Typography component="span" variant="body2" color="text.secondary">({date})</Typography>
                </Typography>
                <ul>
                  {changes.map((change, cidx) => (
                    <li key={cidx}><Typography variant="body2">{change}</Typography></li>
                  ))}
                </ul>
              </Box>
            ))}
          </Box>
        </Container>
      )}

{drawerPage === "support" && (
  <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{ mr: 2, width: '30px', fontSize: 3, borderRadius: 1.5, height: '50px', color: "#fff", backgroundColor: "#f1f1f111" }}
    />
    <Typography variant="h5" gutterBottom><h2>Support & Help</h2></Typography>

    <Typography variant="body1" sx={{ mb: 3 }}>
      We're here to help you! If you encounter any issues, have questions, or need assistance, please explore the following resources or get in touch with us directly.
    </Typography>

    <List sx={{ mb: 3 }}>
      <ListItem>
        <ListItemText
          primary={
            <a href="/faq" style={{ color: "#00f721", textDecoration: "none" }} target="_blank" rel="noopener noreferrer">
              Support & Help
            </a>
          }
        />
        </ListItem>
        <ListItem>
        <ListItemText
          primary={
            <a href="/faq" style={{ color: "#00f721", textDecoration: "none" }} target="_blank" rel="noopener noreferrer">
              Frequently Asked Questions (FAQ)
            </a>
          }
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary={
            <a href="mailto:support@example.com" style={{ color: "#00f721", textDecoration: "none" }}>
              Contact Us: support@example.com
            </a>
          }
        />
      </ListItem>
      <ListItem>
        <ListItemText
          primary={
            <a href="/terms-and-conditions" style={{ color: "#00f721", textDecoration: "none" }} target="_blank" rel="noopener noreferrer">
              Terms & Conditions
            </a>
          }
        />
      </ListItem>
    </List>

    <Button
      variant="contained"
      color="success"
      fullWidth
      onClick={() => {
        // Navigate to community page (adjust if using react-router or other navigation)
        window.open("/community", "_blank");
      }}
      sx={{ fontWeight: "bold", textTransform: "none", mb: 3, backgroundColor: '#f1f1f131', color: '#fff', border: 'transparent', boxShadow: 'none' }}
    >
      Visit Our Community
    </Button>
  </Container>
)}


      {drawerPage === "editProfile" && (
        <Container sx={{ mt: 1, mb: 2 }}>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Profile Picture */}
              <Box sx={{ display: "flex", alignItems: "center",justifyContent: "center", mb: 3 }}>
                <Avatar
                  alt={userData.name}
                  src={userData.photoURL || ""}
                  sx={{ width: 140, height: 140, mr: 2 }}
                />
              </Box>

              {/* Name */}
              <TextField
                fullWidth
                label="Name"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                margin="normal"
                disabled={isSaving}
              />

              {/* Username */}
              <TextField
                fullWidth
                label="Username"
                value={userData.username}
                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                margin="normal"
                disabled={isSaving}
              />

              {/* Email */}
              <TextField fullWidth label="Email" value={userData.email} disabled margin="normal" />

              {/* Mobile */}
              <TextField
                fullWidth
                label="Mobile"
                value={userData.mobile}
                onChange={(e) => setUserData({ ...userData, mobile: e.target.value })}
                margin="normal"
                disabled={isSaving}
              />
              
              {/* Bio */}
              <TextField
                fullWidth
                label="Bio"
                value={userData.bio}
                onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
                margin="normal"
                disabled={isSaving}
              />

              {/* Skeleton loaders while Firestore data is loading */}
              {!firestoreDataLoaded && (
                <>
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="80%" height={40} />
                  <Skeleton variant="text" width="80%" height={40} />
                </>
              )}

              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={() => setDrawerPage("main")}
                  sx={{ mr: 1, backgroundColor: '#f1f1f111', color: '#fff', border: 'transparent' }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={isSaving || !firestoreDataLoaded}
                  sx={{ backgroundColor: '#00f721ba' }}
                >
                  {isSaving ? <CircularProgress size={24} /> : "Save Changes"}
                </Button>
              </Box>
            </>
          )}
        </Container>
      )}

  </SwipeableDrawer>
</>


      {/* Logout Confirm Dialog */}
      <Dialog sx={{ backgroundColor: 'transparent', backdropFilter: 'blur(10px)' }} open={confirmLogout} onClose={() => setConfirmLogout(false)}>
        <DialogTitle sx={{ backgroundColor: 'transparent', px: 3, py: 3 }}>Are you sure you want to logout?</DialogTitle>
        <DialogActions sx={{ backgroundColor: 'transparent', px: 3, py: 3 }}>
          <Button sx={{ backgroundColor: '#f1f1f111', color: '#fff', p: 1.5 }} onClick={() => setConfirmLogout(false)}>Cancel</Button>
          <Button sx={{ backgroundColor: '#ff000056', color: '#ff1b1bff', p: 1.5 }} onClick={() => { handleLogout(); setConfirmLogout(false); }}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ display: "flex", flexGrow: 1 }}>
        {!isSmallScreen && <Sidebar />}
          <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 5, position: "relative" }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "60vh",
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <>
                <Typography variant="h5" gutterBottom sx={{ mb: 4, color: "text.primary" }}>
                  Welcome,<br></br>{userData.name}!
                </Typography>

                <Grid container spacing={3}>
                  {/* Example Cards */}
                  <Grid item xs={12} md={6} lg={4} sx={{ backgroundColor: 'transparent' }}>
                    <Card onClick={gotoBudgetMngr}>
                      <CardMedia
                        component="img"
                        height="140"
                        image="data:image/jpeg;base64,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"
                        alt="Sample 1"
                      />
                      <CardContent sx={{ m: 1, backgroundColor: '#00000000' }}>
                        <Typography variant="h6" sx={{ color: "text.primary" }}>
                          Expenses Tracker
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          Keep track of all your trip expenses, split costs with friends, and stay within budget.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6} lg={4}>
                    <Card>
                      <CardMedia
                        component="img"
                        height="140"
                        image="data:image/jpeg;base64,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"
                        alt="Sample 2"
                      />
                      <CardContent>
                        <Typography variant="h6" sx={{ color: "text.primary" }}>
                          Collaborate with Friends
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          Easily collaborate with your friends, share ideas, track expenses, and more.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  {/* Add more cards as needed */}
                </Grid>
              </>
            )}
                {/* Floating Chat Button on Mobile */}
    {isSmallScreen && (
      <Zoom in>
        <Fab
          color="primary"
          aria-label="chat"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 999,
            width: '70px',
            height: '70px',
            borderRadius: 1.5,
            backgroundColor: "#00f721ba",
            color: "#000",
            "&:hover": {
              backgroundColor: "#00cc1a",
            },
          }}
          onClick={() => navigate("/chats")} // Or your chat route
        >
          <ChatBubbleOutlineIcon />
        </Fab>
      </Zoom>
    )}

          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Home;
