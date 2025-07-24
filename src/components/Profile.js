import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, firestore } from "../firebase";
import packageJson from '../../package.json'; 
import {
  Typography,
  Container,
  Box,
  Avatar,
  Card,
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
  FormControlLabel,
  Stack,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'; 
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';   
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { useTheme, useMediaQuery, Fab, Zoom } from "@mui/material";
import { weatherColors } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import { useSettings } from "../contexts/SettingsContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

const SESSION_KEY = "bunkmate_session";
const WEATHER_STORAGE_KEY = "bunkmate_weather";

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



const ProfilePic = () => {
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
    type: "",
  });

  const [editedData, setEditedData] = useState({
    name: userData.name || "",
    email: userData.email || "",
  });
  const [userType, setUserType] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [firestoreDataLoaded, setFirestoreDataLoaded] = useState(false);
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const { settings, setSettings } = useSettings();

  const themeOptions = ["dark", "light"];
  const accentOptions = ["default", "blue", "green", "red", "purple"];

  const handleThemeChange = (theme) => setSettings(s => ({ ...s, theme }));
  const handleAccentChange = (accent) => setSettings(s => ({ ...s, accent, autoAccent: false }));
  const handleAutoAccentChange = (e) => setSettings(s => ({ ...s, autoAccent: e.target.checked }));
  const handleLocationModeChange = (e) => setSettings(s => ({ ...s, locationMode: e.target.checked ? "auto" : "manual" }));
  const handleManualLocationChange = (e) => setSettings(s => ({ ...s, manualLocation: e.target.value }));
  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);

  const buttonWeatherBg =
  weather && weatherColors[weather.main]
    ? weatherColors[weather.main]
    : weatherColors.Default;
    
  const updateUserData = (newData) => {
    // update userData state with newData
    setUserData(prev => ({ ...prev, ...newData }));
  };

const [features] = useState([
  {
    name: "Trip Creation",
    detail: "Create new trips with names, dates, destinations, and invite members by email or username."
  },
  {
    name: "Trip Dashboard",
    detail: "View trip summary including destination, dates, group icon, checklist, members, and budget."
  },
  {
    name: "Checklist Manager",
    detail: "Add, edit, and mark tasks as complete using a swipeable drawer UI for trip planning."
  },
  {
    name: "Group Chat per Trip",
    detail: "Real-time chat with trip members powered by Firestore, automatically created with each trip."
  },
  {
    name: "Standalone Group Chats",
    detail: "Create custom group chats with friends, add emoji/icon, and manage members in a drawer UI."
  },
  {
    name: "Notes and Media",
    detail: "Add text notes with optional media to your trips; keep private or share with group."
  },
  {
    name: "Reminders & Notifications",
    detail: "Set and manage reminders linked to tasks or notes with local notifications support."
  },
  {
    name: "Trip Budgeting",
    detail: "Assign individual contributions, auto-calculate total budget, and sync with all contributors."
  },
  {
    name: "Expense Tracking",
    detail: "Log and categorize expenses for each trip, view real-time updates on usage."
  },
  {
    name: "Join via Invite Link",
    detail: "Accept or reject invites to trips or groups using a preview-based JoinTrip page."
  },
  {
    name: "Profile Management",
    detail: "Update your username, avatar, and contact info via a swipeable profile drawer."
  },
  {
    name: "Authentication",
    detail: "Secure login and registration using Supabase with persistent sessions."
  },
  {
    name: "Trip Weather Forecast",
    detail: "View current and upcoming weather for your trip location directly on the Trips screen."
  },
  {
    name: "Google Maps Integration",
    detail: "View trip route with full navigation support using external Google Maps link."
  },
  {
    name: "Dark Mode UI",
    detail: "Sleek, minimal dark-themed interface for chats, JoinTrip screen, and core UI."
  }
]);



    const changelogs = [
{
  version: "2.1.14.0.07(Beta1)",
  date: "2025-07-20",
  changes: [
    "Initial beta release of BunkMate",
    "User authentication using Supabase",
    "Create and manage trips with members",
    "Trip dashboard with weather, route link, and checklist",
    "Real-time group chat per trip with Firestore",
    "Custom group chat creation with emoji/icon support",
    "Notes system with text and media attachments",
    "Reminders with local notification support",
    "Per-member budget contribution and auto-calculated totals",
    "Expense tracking system per trip",
    "Invite members via email or join link with preview screen",
    "User profile management with swipeable drawer",
    "Google Maps redirection for trip routes",
    "Current weather display on Trips page",
    "Dark mode interface for main screens",
    "Firestore-based real-time syncing of trips, budgets, and chats"
  ]
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
              type: userDocData?.type || "",
            });

            setUserType(userDocData?.type || "");
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

  // Shorten the photoURL if needed (only if it's a link)

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

    await updateProfile(auth.currentUser, {
      displayName: userData.name,
      photoURL: userData.photoURL || undefined,
    });

    setIsSaving(false);
    alert("Profile updated successfully!");
    setDrawerPage("main");
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
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
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
<>
  <Box
sx={{
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  borderRadius: "12px",
  p: 1,
  color: theme.palette.text.primary,
  transition: "background-color 0.3s ease",
  mr: isSmallScreen ? 0 : 1,
  ...(isSmallScreen
    ? {}
    : {
        backgroundColor: "#101010",
        "&:hover": {
          backgroundColor: "#2c2c2c",
        },
      }),
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
        mx: "auto",
        maxWidth: 450,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        backgroundColor: theme.palette.background.main,
        backdropFilter: 'blur(80px)',
        backgroundImage: 'none',
        color: theme.palette.text.primary,
        px: 2,
        pb: 3,
      },
    }}
  >
    {/* Drawer drag indicator */}
    <Slide direction="down" in={true} timeout={200}>
      <Box
        sx={{ width: 40, height: 5, backgroundColor: "#666", borderRadius: 8,  my: 1, mx: "auto" }}
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
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {userData.email || "Email"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "#333" }} />

        {/* Menu List */}
        <List sx={{ my: 0, gap: 0.5, display: "flex", flexDirection: "column" }}>
          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("editProfile")} 
                sx={{ 
                  backgroundColor: mode === "dark" ? "#f1f1f111" : "#c1c1c195", 
                  borderRadius: 5, 
                  py: 2,
                  '&:hover': { bgcolor: '#f1f1f121'}

                  }}>
              <ListItemIcon>
                <PersonOutlineIcon sx={{ color: theme.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText primary="Edit Profile" />
            </ListItemButton>
          </ListItem>

          <ListItem sx={{ pb: 0 }}>
            <ListItemButton
              onClick={() => setDrawerPage("generalSettings")}
              sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#c1c1c195",  borderRadius: 5,  py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}
            >
              <ListItemIcon>
                <SettingsOutlinedIcon sx={{ color: theme.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText primary="General Settings" />
            </ListItemButton>
          </ListItem>


          {/* New: App Version & About */}
          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("about")} sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#c1c1c195",  borderRadius: 5,  py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <InfoOutlinedIcon sx={{ color: theme.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText primary="App Version & About" />
            </ListItemButton>
          </ListItem>

          {/* New: Support / Help */}
          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("support")} sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#c1c1c195",  borderRadius: 5,  py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <HelpOutlineIcon sx={{ color: theme.palette.text.primary }} />
              </ListItemIcon>
              <ListItemText primary="Support / Help" />
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton onClick={() => setConfirmLogout(true)} sx={{ backgroundColor: mode === "dark" ? "#ff191982" : "#ff8e8e82", borderRadius: 5,  py: 2.2, '&:hover': { bgcolor: '#ff000086', color: '#ff000046'}}}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: mode === "dark" ? "#ffd4d4" : "#ff0000ff" }} />
              </ListItemIcon>
              <Typography sx={{ color: mode === "dark" ? "#ffd4d4" : "#ff0000ff" }}>Logout</Typography>
            </ListItemButton>
          </ListItem>
        </List>
      </>
    )}

    {/* Edit Profile Page */}
    {drawerPage === "editProfile" && (
      <Container sx={{ mt: 1, mb: 2, color: theme.palette.text.primary }}>

        {/* Your edit profile form here */}
        {/* ... */}
      </Container>
    )}

{drawerPage === "generalSettings" && (
  <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{
        mb: 2,
        borderRadius: 8,
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

        {/* Header */}
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
      General Settings
    </Typography>

    {/* THEME MODE: "Dark" / "Light" pill toggle group */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Who can use dark mode?</Typography>
      {/* Really, it's just the theme mode selector */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          onClick={() => { setMode("dark"); }}
          variant={mode === "dark" ? "contained" : "outlined"}
          sx={{
            borderRadius: 999,
            px: 3, py: 0.5,
            fontWeight: 600,
            fontSize: "1rem",
            backgroundColor: mode === "dark" ? "#000000ff" : "transparent",
            color: mode === "dark" ? "#fff" : theme.palette.text.primary,
            borderColor: "#aaa",
            boxShadow: "none",
          }}
        >Dark Mode</Button>
        <Button
          onClick={() => { setMode("light"); }}
          variant={mode === "light" ? "contained" : "outlined"}
          sx={{
            borderRadius: 999,
            px: 3, py: 0.5,
            fontWeight: 600,
            fontSize: "1rem",
            backgroundColor: mode === "light" ? "#fff" : "transparent",
            color: mode === "light" ? "#222" : theme.palette.text.primary,
            borderColor: "#aaa",
            boxShadow: "none",
            '&:hover': { backgroundColor: "#f7f7f7", color: "#222" },
          }}
        >Light Mode</Button>
      </Box>
    </Box>

    {/* ACCENT COLOR: group of pill/toggle buttons, like image */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Accent Color</Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {[
          { opt: "default", label: "", bg: theme.palette.primary.bg , color: theme.palette.text.primary },
        ].map(({ opt, label, bg, color }) => (
          <Button
            key={opt}
            onClick={() => setAccent(opt)}
            variant={"contained"}
            fullWidth
            sx={{
              borderRadius: 4,
              px: 3, py: 1.2,
              fontWeight: 600,
              fontSize: "1rem",
              height: 50,
              backgroundColor: bg,
              boxShadow: "none",
              mb: 3,
              color: accent === opt ? color : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: bg,
                color: color
              }
            }}
          >This is the Accent Preview</Button>
        ))}
      </Box>

<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", width: 240, mx: "auto", }}>
  {[
    { opt: "blue", label: "Blue", bg: "#bbdefb", color: "#fff" },
    { opt: "green", label: "Green", bg: "#c8e6c9", color: "#fff" },
    { opt: "red", label: "Red", bg: "#EF5350", color: "#fff" },
    { opt: "orange", label: "Orange", bg: "#FFCC80", color: "#fff" },
    { opt: "yellow", label: "Yellow", bg: "#FFEB3B", color: "#000" },
    { opt: "turquoise", label: "Turquoise", bg: "#b6f6ffff", color: "#fff" },
    { opt: "lime", label: "Lime", bg: "#DCE775", color: "#000" },
    { opt: "purple", label: "Purple", bg: "#f4b8ffff", color: "#fff" },
    { opt: "skyblue", label: "Sky Blue", bg: "#81D4FA", color: "#fff" },
    { opt: "mint", label: "Mint", bg: "#A5D6A7", color: "#fff" },
  ].map(({ opt, label, bg, color }) => (
    <Button
      key={opt}
      onClick={() => setAccent(opt)}
      variant={"contained"}
      sx={{
        borderRadius: 999,
        fontWeight: 600,
        fontSize: "0.875rem",
        minWidth: 35,
        minHeight: 35,
        backgroundColor: bg,
        color: accent === opt ? color : theme.palette.text.primary,
        border: accent === opt ? "2px solid" : "2px solid",
        borderColor: accent === opt ? theme.palette.text.primary : "#aaa",
        textTransform: "none",
        boxShadow: "none",
        '&:hover': {
          backgroundColor: bg,
          color: color
        }
      }}
    />
  ))}
</Box>

    </Box>

    {/* LOCATION: Allow pill-style toggle for auto/manual */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>Location</Typography>
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button
          variant={settings.locationMode === "auto" ? "contained" : "outlined"}
          onClick={() => handleLocationModeChange({ target: { checked: true } })}
          sx={{
            borderRadius: 999,
            px: 3, py: 1.2,
            fontWeight: 600,
            backgroundColor: settings.locationMode === "auto" ? theme.palette.primary.main : "transparent",
            color: settings.locationMode === "auto" ? "#fff" : "#333",
            minWidth: 96,
            boxShadow: "none",
          }}
        >Auto</Button>
        <Button
          variant={settings.locationMode === "manual" ? "contained" : "outlined"}
          onClick={() => handleLocationModeChange({ target: { checked: false } })}
          sx={{
            borderRadius: 999,
            px: 3, py: 1.2,
            fontWeight: 600,
            backgroundColor: settings.locationMode !== "auto" ? theme.palette.primary.main : "transparent",
            color: settings.locationMode !== "auto" ? "#fff" : "#333",
            borderColor: settings.locationMode !== "auto" ? theme.palette.primary.main : "#aaa",
            minWidth: 96,
            boxShadow: "none",
          }}
        >Manual</Button>
      </Box>
      {settings.locationMode !== "auto" && (
        <TextField
          label="Set Location Manually"
          value={settings.manualLocation}
          onChange={handleManualLocationChange}
          fullWidth
          sx={{ mt: 2 }}
        />
      )}
    </Box>
  </Container>
)}


{drawerPage === "about" && (
  <Container sx={{ mt: 2, mb: 4 }}>
    {/* Back Button */}
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{
        mb: 2,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    {/* Header */}
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
      App Version & About
    </Typography>

    {/* Version Card */}
    <Box
      sx={{
        backgroundColor: mode === "dark" ? "#1e1e1e71" : "#cccccc81",
        p: 2,
        borderRadius: 5, 
        mb: 3,
        mt: 3,
        boxShadow: "none",
      }}
      onClick={() => setDrawerPage("featuresChangelog")}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        Version
      </Typography>
      <Typography variant="body2" sx={{ color: mode === "dark" ? "#ccc" : "#555" }}>
        {packageJson.version || "N/A"}
      </Typography>
    </Box>

    {/* About Text */}
    <Typography variant="body1" sx={{ mb: 3, color: mode === "dark" ? "#aaa" : "#333" }}>
      This app is designed to simplify your group trip planning experience — chat, split expenses, manage tasks, and discover places together. 
      Built with ❤️ in India.
    </Typography>

    {/* Credits / Licenses */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>Licenses & Credits</Typography>
        <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", lineHeight: 1.8 }}>
          • React.js — MIT License<br />
          • Firebase (Auth, Firestore, Messaging) — Apache License 2.0<br />
          • Material UI (v5) — MIT License<br />
          • OpenWeatherMap API — CC BY-SA 4.0 (Attribution Required)<br />
          • Google Fonts — SIL Open Font License 1.1<br />
          • Material Icons — Apache License 2.0<br />
          • Additional Libraries — MIT/Apache Licensed Open Source
        </Typography>
    </Box>

    {/* Policy Links */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Legal & Policy</Typography>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mb: 2, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  color: theme.palette.text.primary, border: "1px solid #ccc", borderRadius: 3 }}
        onClick={() => window.open('/privacy-policy', '_blank')}
      >
        Privacy Policy
      </Button>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mb: 2, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  color: theme.palette.text.primary, border: "1px solid #ccc", borderRadius: 3 }}
        onClick={() => window.open('/terms', '_blank')}
      >
        Terms of Service
      </Button>
    </Box>

    {/* Contact / Social */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Connect With Us</Typography>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          sx={{ backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  color: theme.palette.text.primary, minWidth: 48, boxShadow: "none" }}
          onClick={() => window.open('mailto:jayendrachoudhary.am@gmail.com')}
        >
          <MailOutlinedIcon />
        </Button>
        {/* Add social buttons here if needed */}
      </Stack>
    </Box>

    {/* Open Source Link */}
    <Box sx={{ mt: 4, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  px: 3, py: 3, borderRadius: 6 }}>
      <Typography variant="h6" gutterBottom>Open Source</Typography>
      <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", mb: 2 }}>
        Our source code is available on GitHub. Feel free to contribute, report issues, or fork it.
      </Typography>
      <Button
        variant="outlined"
        fullWidth
        sx={{ color: "#000", borderColor: "#555", borderRadius: 3 }}
      >
        Providing Soon...
      </Button>
      {/* <Button
        variant="outlined"
        fullWidth
        onClick={() => window.open('https://github.com/yourapp', '_blank')}
        sx={{ color: "#000", borderColor: "#555" }}
      >
        View on GitHub
      </Button> */}
    </Box>
  </Container>
)}


      {drawerPage === "featuresChangelog" && (
        <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("about")}
      sx={{
        mb: 2,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>
          <Typography variant="h5" gutterBottom><h2>Features & Changelog</h2></Typography>

          {/* Features Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>Features</Typography>
            {features.map(({ name, detail }, idx) => (
              <Box key={idx} sx={{ mb: 2, ml: 2 }}>
                <Typography variant="subtitle1" component="div" fontWeight="bold">{name}</Typography>
                <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>{detail}</Typography>
              </Box>
            ))}
          </Box>

          {/* Changelog Section */}
          <Box>
            <Typography variant="h6" gutterBottom>Changelog</Typography>
{changelogs.map(({ version, date, changes }) => (
  <Card sx={{ my: 2, p: 2, boxShadow: "none", backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", borderRadius: 5 }} key={version}>
    <Typography variant="subtitle1" fontWeight="bold">
      Version {version} – <span style={{ color: mode === "dark" ? "#aaa" : "#333" }}>{date}</span>
    </Typography>
    <ul style={{ paddingLeft: 20 }}>
      {changes.map((c, i) => <li key={i}><Typography variant="body2">{c}</Typography></li>)}
    </ul>
  </Card>
))}

          </Box>
        </Container>
      )}

{drawerPage === "support" && (
  <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{
        mb: 1,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>
    <Typography variant="h5" gutterBottom><h2>Support & Help</h2></Typography>

    <Typography variant="body1" sx={{ mb: 3 }}>
      We're here to help you! If you encounter any issues, have questions, or need assistance, please explore the following resources or get in touch with us directly.
    </Typography>

    <Stack spacing={2} sx={{ mb: 4 }}>
    {/* <Card sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none" }}>
      <ListItemText
        primary="Support & Help"
        secondary="Support for any issues or questions"
      />
    </Card> */}
    <Card
      onClick={() => window.open("/terms-and-conditions", "_blank")}
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none", borderRadius: 5 }}
    >
      <ListItemText
        primary="Terms & Conditions"
        secondary="Terms of service and usage policies"
      />
    </Card>
    {/* <Card
      onClick={() => window.open("/faq", "_blank")}
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none" }}
    >
      <ListItemText
        primary="Frequently Asked Questions"
        secondary="Find answers to common questions"
      />
    </Card> */}
    <Card
      onClick={() => window.open("mailto:jayendrachoudhary.am@gmail.com")} 
      sx={{ px: 2, py: 1, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",  boxShadow: "none", borderRadius: 5  }}
    >
      <ListItemText
        primary="Contact Support"
        secondary="Email us at jayendrachoudhary.am@gmail.com"
      />
    </Card>
</Stack>

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
  <Container sx={{ mt: 2, mb: 4 }}>
    {/* Back Button */}
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{
        mb: 3,
        borderRadius: 8, 
        color: theme.palette.text.primary,
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    {/* Header */}
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
      Edit Profile
    </Typography>

    {loading || !firestoreDataLoaded ? (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    ) : (
      <>
        {/* Avatar */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Avatar
            src={userData.photoURL || ""}
            alt={userData.name}
            sx={{ width: 120, height: 120 }}
          />
        </Box>

        {/* Grouped Fields */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Full Name"
            value={userData.name}
            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
            disabled={isSaving}
          />
          <TextField
            fullWidth
            label="Username"
            value={userData.username}
            onChange={(e) => setUserData({ ...userData, username: e.target.value })}
            disabled={isSaving}
          />
          <TextField
            fullWidth
            label="Email"
            value={userData.email}
            disabled
          />
          <TextField
            fullWidth
            label="Mobile Number"
            value={userData.mobile}
            onChange={(e) => setUserData({ ...userData, mobile: e.target.value })}
            disabled={isSaving}
          />
          <TextField
            fullWidth
            label="Bio"
            value={userData.bio}
            onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
            multiline
            minRows={3}
            disabled={isSaving}
          />
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            onClick={() => setDrawerPage("main")}
            sx={{
              backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071", 
              color: theme.palette.text.primary,
              borderColor: "#555",
              borderRadius: 5,
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            sx={{ backgroundColor: theme.palette.primary.main, borderRadius: 5, color: "#fff", boxShadow: "none", '&:hover': { backgroundColor: theme.palette.primary.dark } }}
          >
            {isSaving ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </Box>
      </>
    )}
  </Container>
)}


  </SwipeableDrawer>



{/* Logout Confirm Dialog */}
<Dialog
  open={confirmLogout}
  onClose={() => setConfirmLogout(false)}
  PaperProps={{
    sx: {
      backgroundColor: mode === "dark" ? "#00000000" : "#ffffff91",
      backdropFilter: 'blur(10px)',
      boxShadow: 'none',
      borderRadius: 6,
    }
  }}
>
  <DialogTitle sx={{ px: 3, py: 3, color: mode === "dark" ? "#fff" : "#000" }}>
    Are you sure you want to logout?
  </DialogTitle>
  
  <DialogActions sx={{ px: 3, py: 3 }}>
    <Button
      variant="outlined"
      sx={{
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
        color: mode === "dark" ? "#fff" : "#000",
        p: 1.5,
        borderColor: '#ffffff33',
        borderRadius: 5,
      }}
      onClick={() => setConfirmLogout(false)}
    >
      Cancel
    </Button>
    
    <Button
      variant="contained"
      sx={{
        backgroundColor:  mode === "dark" ? "#700000ff" : "#ffd4d4",
        color:  mode === "dark" ? "#ffd4d4" : "#ff0000ff",
        p: 1.5,
        borderRadius: 5,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: '#ff000088',
        }
      }}
      onClick={() => {
        handleLogout();
        setConfirmLogout(false);
      }}
    >
      Logout
    </Button>
  </DialogActions>
</Dialog>
</>
</ThemeProvider>
    );
};

export default ProfilePic;
