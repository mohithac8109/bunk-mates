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

import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { useTheme, useMediaQuery, Fab, Zoom } from "@mui/material";
import { weatherColors } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import { useSettings } from "../contexts/SettingsContext";

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
  color: "#fff",
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
        backgroundColor: "#00000000",
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
        sx={{ width: 40, height: 5, backgroundColor: "#666", borderRadius: 2, my: 1, mx: "auto" }}
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
        <List sx={{ my: 0, gap: 0.5, display: "flex", flexDirection: "column" }}>
          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("editProfile")} 
                sx={{ 
                  backgroundColor: "#f1f1f111", 
                  borderRadius: 1.7, 
                  py: 2,
                  '&:hover': { bgcolor: '#f1f1f121'}

                  }}>
              <ListItemIcon>
                <PersonOutlineIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="Edit Profile" />
            </ListItemButton>
          </ListItem>

          {/* <ListItem>
            <ListItemButton
              onClick={() => setDrawerPage("generalSettings")}
              sx={{ backgroundColor: "#f1f1f111", borderRadius: 1.7, py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}
            >
              <ListItemIcon>
                <SettingsOutlinedIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="General Settings" />
            </ListItemButton>
          </ListItem> */}


          {/* New: App Version & About */}
          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("about")} sx={{ backgroundColor: "#f1f1f111", borderRadius: 1.7, py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <InfoOutlinedIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="App Version & About" />
            </ListItemButton>
          </ListItem>

          {/* New: Support / Help */}
          <ListItem sx={{ pb: 0 }}>
            <ListItemButton onClick={() => setDrawerPage("support")} sx={{ backgroundColor: "#f1f1f111", borderRadius: 1.7, py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <HelpOutlineIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="Support / Help" />
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton onClick={() => setConfirmLogout(true)} sx={{ backgroundColor: "#ff191982", borderRadius: 1.7, py: 2.2, '&:hover': { bgcolor: '#ff000086', color: '#ff000046'}}}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: "#ffd4d4" }} />
              </ListItemIcon>
              <Typography sx={{ color: "#ffd4d4" }}>Logout</Typography>
            </ListItemButton>
          </ListItem>
        </List>
      </>
    )}

    {/* Edit Profile Page */}
    {drawerPage === "editProfile" && (
      <Container sx={{ mt: 1, mb: 2, color: "#fff" }}>

        {/* Your edit profile form here */}
        {/* ... */}
      </Container>
    )}

    {drawerPage === "generalSettings" && (
<Container sx={{ mt: 1, mb: 2 }}>
  <Button
    startIcon={<ArrowBackIcon />}
    onClick={() => setDrawerPage("main")}
    sx={{ mr: 2, width: '65px', fontSize: 3, borderRadius: 2, height: '50px', color: "#fff", backgroundColor: "#f1f1f111", }}
  />
  <Typography variant="h5" gutterBottom>
    <h2>General Settings</h2>
  </Typography>

  {/* Theme Section */}
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle1" sx={{ mb: 1 }}>Theme</Typography>
    {themeOptions.map(opt => (
      <Button
        key={opt}
        variant={settings.theme === opt ? "contained" : "outlined"}
        sx={{ mr: 2, mb: 1 }}
        onClick={() => handleThemeChange(opt)}
      >
        {opt.charAt(0).toUpperCase() + opt.slice(1)}
      </Button>
    ))}
    <Typography variant="subtitle2" sx={{ mt: 2 }}>Accent Color</Typography>
    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
      {accentOptions.map(opt => (
        <Button
          key={opt}
          variant={settings.accent === opt && !settings.autoAccent ? "contained" : "outlined"}
          sx={{ backgroundColor: opt !== "default" ? opt : undefined, color: "#fff" }}
          onClick={() => handleAccentChange(opt)}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </Button>
      ))}
    </Box>
    <FormControlLabel
      control={<Switch checked={settings.autoAccent} onChange={handleAutoAccentChange} />}
      label="Auto-change accent with weather"
      sx={{ mt: 1 }}
    />
  </Box>

  {/* Location Section */}
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle1" sx={{ mb: 1 }}>Location</Typography>
    <FormControlLabel
      control={
        <Switch
          checked={settings.locationMode === "auto"}
          onChange={handleLocationModeChange}
        />
      }
      label="Use my current location automatically"
    />
    {settings.locationMode !== "auto" && (
      <TextField
        label="Set Location Manually"
        value={settings.manualLocation}
        onChange={handleManualLocationChange}
        fullWidth
        sx={{ mt: 1 }}
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
        borderRadius: 2,
        color: "#fff",
        backgroundColor: "#f1f1f111",
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
        backgroundColor: "#1e1e1e71",
        p: 2,
        borderRadius: 2,
        mb: 3,
        mt: 3,
        boxShadow: "none",
      }}
      onClick={() => setDrawerPage("featuresChangelog")}
    >
      <Typography variant="subtitle1" fontWeight="bold">
        Version
      </Typography>
      <Typography variant="body2" sx={{ color: "#ccc" }}>
        {packageJson.version || "N/A"}
      </Typography>
    </Box>

    {/* About Text */}
    <Typography variant="body1" sx={{ mb: 3, color: "#aaa" }}>
      This app is designed to simplify your group trip planning experience — chat, split expenses, manage tasks, and discover places together. 
      Built with ❤️ in India.
    </Typography>

    {/* Credits / Licenses */}
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>Licenses & Credits</Typography>
        <Typography variant="body2" sx={{ color: "#bbb", lineHeight: 1.8 }}>
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
        sx={{ mb: 2, backgroundColor: "#f1f1f111", color: "#fff", border: "1px solid #333" }}
        onClick={() => window.open('/privacy-policy', '_blank')}
      >
        Privacy Policy
      </Button>

      <Button
        fullWidth
        variant="outlined"
        sx={{ mb: 2, backgroundColor: "#f1f1f111", color: "#fff", border: "1px solid #333" }}
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
          sx={{ backgroundColor: "#f1f1f111", color: "#fff", minWidth: 48 }}
          onClick={() => window.open('mailto:jayendrachoudhary.am@gmail.com')}
        >
          <MailOutlinedIcon />
        </Button>
        {/* Add social buttons here if needed */}
      </Stack>
    </Box>

    {/* Open Source Link */}
    <Box sx={{ mt: 4, backgroundColor: "#f1f1f111", px: 3, py: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Open Source</Typography>
      <Typography variant="body2" sx={{ color: "#aaa", mb: 2 }}>
        Our source code is available on GitHub. Feel free to contribute, report issues, or fork it.
      </Typography>
      <Button
        variant="outlined"
        fullWidth
        sx={{ color: "#000", borderColor: "#555" }}
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
            sx={{ mr: 2, width: '65px', fontSize: 3, borderRadius: 2, height: '50px', color: "#fff", backgroundColor: "#f1f1f111", }}
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
{changelogs.map(({ version, date, changes }) => (
  <Card sx={{ my: 2, p: 2, boxShadow: "none", backgroundColor: "#f1f1f111" }}>
    <Typography variant="subtitle1" fontWeight="bold">
      Version {version} – <span style={{ color: "#aaa" }}>{date}</span>
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
        borderRadius: 2,
        color: "#fff",
        backgroundColor: "#f1f1f111",
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
    {/* <Card sx={{ px: 2, py: 1, backgroundColor: "#f1f1f111", boxShadow: "none" }}>
      <ListItemText
        primary="Support & Help"
        secondary="Support for any issues or questions"
      />
    </Card> */}
    <Card
      onClick={() => window.open("/terms-and-conditions", "_blank")}
      sx={{ px: 2, py: 1, backgroundColor: "#f1f1f111", boxShadow: "none" }}
    >
      <ListItemText
        primary="Terms & Conditions"
        secondary="Terms of service and usage policies"
      />
    </Card>
    {/* <Card
      onClick={() => window.open("/faq", "_blank")}
      sx={{ px: 2, py: 1, backgroundColor: "#f1f1f111", boxShadow: "none" }}
    >
      <ListItemText
        primary="Frequently Asked Questions"
        secondary="Find answers to common questions"
      />
    </Card> */}
    <Card
      onClick={() => window.open("mailto:jayendrachoudhary.am@gmail.com")} 
      sx={{ px: 2, py: 1, backgroundColor: "#f1f1f111", boxShadow: "none" }}
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
        borderRadius: 2,
        color: "#fff",
        backgroundColor: "#f1f1f111",
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
              backgroundColor: "#f1f1f111",
              color: "#fff",
              borderColor: "#555",
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
            sx={{ backgroundColor: buttonWeatherBg }}
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
      backgroundColor: '#00000000',
      backdropFilter: 'blur(20px)',
      boxShadow: 'none',
    }
  }}
>
  <DialogTitle sx={{ px: 3, py: 3, color: '#fff' }}>
    Are you sure you want to logout?
  </DialogTitle>
  
  <DialogActions sx={{ px: 3, py: 3 }}>
    <Button
      variant="outlined"
      sx={{
        backgroundColor: '#f1f1f111',
        color: '#fff',
        p: 1.5,
        borderColor: '#ffffff33'
      }}
      onClick={() => setConfirmLogout(false)}
    >
      Cancel
    </Button>
    
    <Button
      variant="contained"
      sx={{
        backgroundColor: '#ff000046',
        color: '#ffbfbfff',
        p: 1.5,
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
