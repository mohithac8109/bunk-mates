import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  FormControlLabel,
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
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
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
  });

  const [editedData, setEditedData] = useState({
    name: userData.name || "",
    email: userData.email || "",
  });

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
        <List sx={{ my: 2, gap: 0.5, display: "flex", flexDirection: "column" }}>
          <ListItem>
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

          <ListItem>
            <ListItemButton
              onClick={() => setDrawerPage("generalSettings")}
              sx={{ backgroundColor: "#f1f1f111", borderRadius: 1.7, py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}
            >
              <ListItemIcon>
                <SettingsOutlinedIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="General Settings" />
            </ListItemButton>
          </ListItem>


          {/* New: App Version & About */}
          <ListItem>
            <ListItemButton onClick={() => setDrawerPage("about")} sx={{ backgroundColor: "#f1f1f111", borderRadius: 1.7, py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <InfoOutlinedIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="App Version & About" />
            </ListItemButton>
          </ListItem>

          {/* New: Support / Help */}
          <ListItem>
            <ListItemButton onClick={() => setDrawerPage("support")} sx={{ backgroundColor: "#f1f1f111", borderRadius: 1.7, py: 2, '&:hover': { bgcolor: '#f1f1f121'}}}>
              <ListItemIcon>
                <HelpOutlineIcon sx={{ color: "#fff" }} />
              </ListItemIcon>
              <ListItemText primary="Support / Help" />
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton onClick={() => setConfirmLogout(true)} sx={{ backgroundColor: "#ff000036", borderRadius: 1.7, py: 2.2, '&:hover': { bgcolor: '#ff000086', color: '#ff000046'}}}>
              <ListItemIcon>
                <LogoutIcon sx={{ color: "#ff0000" }} />
              </ListItemIcon>
              <Typography sx={{ color: "#ff0000" }}>Logout</Typography>
            </ListItemButton>
          </ListItem>
        </List>
      </>
    )}

    {/* Edit Profile Page */}
    {drawerPage === "editProfile" && (
      <Container sx={{ mt: 1, mb: 2, color: "#fff" }}>
        <Typography variant="h5" gutterBottom>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => setDrawerPage("main")}
            sx={{ mr: 2, width: '65px', fontSize: 3, borderRadius: 2, height: '50px', color: "#fff", backgroundColor: "#f1f1f111", }}
          />
          <h2>Edit Profile</h2>
        </Typography>
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
  <Container sx={{ mt: 1, mb: 2 }}>
    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setDrawerPage("main")}
      sx={{ mr: 2, width: '65px', fontSize: 3, borderRadius: 2, height: '50px', color: "#fff", backgroundColor: "#f1f1f111", }}
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
      sx={{ mr: 2, width: '65px', fontSize: 3, borderRadius: 2, height: '50px', color: "#fff", backgroundColor: "#f1f1f111", }}
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
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5, color: buttonWeatherBg }}>
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
                multiline
                rows={4}
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
        backgroundColor: '#ff000056',
        color: '#ff1b1bff',
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
