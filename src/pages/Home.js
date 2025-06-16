import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getAuth } from "firebase/auth";
import { useWeather } from "../contexts/WeatherContext";

import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  ThemeProvider,
  createTheme,
  keyframes,
} from "@mui/material"; 
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useTheme, useMediaQuery, Fab, Zoom } from "@mui/material";
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import ProfilePic from "../components/Profile";


import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import TravelExploreOutlinedIcon from '@mui/icons-material/TravelExploreOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined';
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';
import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import AlarmOutlinedIcon from '@mui/icons-material/AlarmOutlined';

const CATEGORY_ICONS = {
  Food: {
    icon: <RestaurantOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff9c000f",   // orange[50]
    bgcolor: "#ff9c0030",   // orange[50]
    mcolor: "#ff98005e",    // orange[500]
    fcolor: "#e3aa8b"     // orange[900]
  },
  Tour: {
    icon: <TravelExploreOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#0093ff0f",   // blue[50]
    bgcolor: "#0093ff30",   // blue[50]
    mcolor: "#2196f35e",    // blue[500]
    fcolor: "#92b6ef"     // blue[900]
  },
  Rent: {
    icon: <HomeOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#88ff000f",   // lightGreen[50]
    bgcolor: "#88ff0030",   // lightGreen[50]
    mcolor: "#8bc34a5e",    // lightGreen[500]
    fcolor: "#8dc378"     // lightGreen[900]
  },
  Utilities: {
    icon: <LocalAtmOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#8ad0ff0f",   // blueGrey[50]
    bgcolor: "#8ad0ff30",   // blueGrey[50]
    mcolor: "#607d8b5e",    // blueGrey[500]
    fcolor: "#8e9ba1"     // blueGrey[900]
  },
  Shopping: {
    icon: <LocalMallOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff00550f",   // pink[50]
    bgcolor: "#ff005530",   // pink[50]
    mcolor: "#e91e635e",    // pink[500]
    fcolor: "#ffbce0"     // pink[900]
  },
  Fun: {
    icon: <EmojiEventsOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f5e7480f",   // yellow[50]
    bgcolor: "#f5e74830",   // yellow[50]
    mcolor: "#c3b6415e",    // yellow[500]
    fcolor: "#ddca15"     // yellow[900]
  },
  Hospital: {
    icon: <LocalHospitalOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff00260f",   // red[50]
    bgcolor: "#ff002630",   // red[50]
    mcolor: "#f443365e",    // red[500]
    fcolor: "#efa4a4"     // red[900]
  },
  Education: {
    icon: <SchoolOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#0093ff0f",   // blue[50]
    bgcolor: "#0093ff30",   // blue[50]
    mcolor: "#2196f35e",    // blue[500]
    fcolor: "#92b6ef"      // indigo[900]
  },
  Fuel: {
    icon: <LocalGasStationOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#fbe9e70f",   // deepOrange[50]
    bgcolor: "#fbe9e730",   // deepOrange[50]
    mcolor: "#ff5722",    // deepOrange[500]
    fcolor: "#bf360c"     // deepOrange[900]
  },
  Entertainment: {
    icon: <MovieOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f3e5f50f",   // purple[50]
    bgcolor: "#f3e5f530",   // purple[50]
    mcolor: "#9c27b0",    // purple[500]
    fcolor: "#4a148c"     // purple[900]
  },
  Bills: {
    icon: <LocalAtmOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e0f2f10f",   // teal[50]
    bgcolor: "#e0f2f130",   // teal[50]
    mcolor: "#009688",    // teal[500]
    fcolor: "#004d40"     // teal[900]
  },
  Travel: {
    icon: <TravelExploreOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e1f5fe0f",   // lightBlue[50]
    bgcolor: "#e1f5fe",   // lightBlue[50]
    mcolor: "#03a9f4",    // lightBlue[500]
    fcolor: "#01579b"     // lightBlue[900]
  },
  Medical: {
    icon: <LocalHospitalOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#fce4ec0f",   // pink[50]
    bgcolor: "#fce4ec",   // pink[50]
    mcolor: "#e91e63",    // pink[500]
    fcolor: "#880e4f"     // pink[900]
  },
  Other: {
    icon: <CategoryOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f5f5f50f",   // grey[50]
    bgcolor: "#f5f5f530",   // grey[100]
    mcolor: "#bdbdbd5e",    // grey[400]
    fcolor: "#a4a4a4"     // grey[900]
  },
};

const WEATHER_API_KEY = "c5298240cb3e71775b479a32329803ab"; // <-- Replace with your API key


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

const SESSION_KEY = "bunkmate_session";
const WEATHER_STORAGE_KEY = "bunkmate_weather";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const [budgets, setBudgets] = useState([]);

  // User data states
  const [userData, setUserData] = useState({
    name: "",
    username: "",
    email: "",
    mobile: "",
    photoURL: "",
    bio: "",
  });

  const [userType, setUserType] = useState(""); // BETA or DEV BETA label

  const gotoBudgetMngr = () => {
    navigate("/budget-mngr");
  };

  useEffect(() => {
  // Try to load weather from localStorage/cookie first
  let cachedWeather = null;
  try {
    const local = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (local) cachedWeather = JSON.parse(local);
    if (!cachedWeather) {
      const cookieWeather = document.cookie
        .split("; ")
        .find((row) => row.startsWith(WEATHER_STORAGE_KEY + "="))
        ?.split("=")[1];
      if (cookieWeather) cachedWeather = JSON.parse(decodeURIComponent(cookieWeather));
    }
  } catch {}
  if (cachedWeather) {
    setWeather(cachedWeather);
    setWeatherLoading(false);
  }

  if (!navigator.geolocation) {
    setWeatherLoading(false);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const data = await res.json();
        const weatherObj = {
          main: data.weather?.[0]?.main || "Default",
          desc: data.weather?.[0]?.description || "",
          temp: Math.round(data.main?.temp),
          city: data.name
        };
        setWeather(weatherObj);
        // Save to localStorage and cookie for sync/offline
        localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(weatherObj));
        document.cookie = `${WEATHER_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(weatherObj))}; path=/; max-age=1800`; // 30 min
      } catch {
        setWeather(null);
      }
      setWeatherLoading(false);
    },
    () => setWeatherLoading(false),
    { timeout: 10000 }
  );
}, [setWeather, setWeatherLoading]);

  useEffect(() => {
    // Try to get userId from localStorage/cookie (like Budget.js)
    let userId = null;
    try {
      const storedUser = localStorage.getItem("bunkmateuser");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.uid) userId = parsed.uid;
      }
      if (!userId) {
        // Try cookie
        const cookieUser = document.cookie
          .split("; ")
          .find((row) => row.startsWith("bunkmateuser="))
          ?.split("=")[1];
        if (cookieUser) {
          const parsed = JSON.parse(decodeURIComponent(cookieUser));
          if (parsed?.uid) userId = parsed.uid;
        }
      }
    } catch {}
    if (!userId) {
      setBudgets([]);
      return;
    }

        import("../firebase").then(({ db }) => {
      import("firebase/firestore").then(({ doc, getDoc }) => {
        const docRef = doc(db, "budgets", userId);
        getDoc(docRef).then((docSnap) => {
          if (docSnap.exists()) {
            setBudgets(docSnap.data().items || []);
          } else {
            setBudgets([]);
          }
        });
      });
    });
  }, []);

    const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [budgets]);

    useEffect(() => {
    if (!navigator.geolocation) {
      setWeatherLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
          );
          const data = await res.json();
          setWeather({
            main: data.weather?.[0]?.main || "Default",
            desc: data.weather?.[0]?.description || "",
            temp: Math.round(data.main?.temp),
            city: data.name
          });
        } catch {
          setWeather(null);
        }
        setWeatherLoading(false);
      },
      () => setWeatherLoading(false),
      { timeout: 10000 }
    );
  }, []);

  // Pick gradient based on weather
  const weatherBg =
  weather && weatherGradients[weather.main]
  ? weatherGradients[weather.main]
  : weatherGradients.Default;
  
  const buttonWeatherBg =
  weather && weatherColors[weather.main]
    ? weatherColors[weather.main]
    : weatherColors.Default;
  
    
  const WeatherBgdrop =
  weather && weatherbgColors[weather.main]
    ? weatherbgColors[weather.main]
    : weatherbgColors.Default;
  
        useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY) || document.cookie.split('; ').find(row => row.startsWith(SESSION_KEY + '='))?.split('=')[1];
    if (!session) {
      setLoading(true);
      // No session, check for user in localStorage
      const storedUser = localStorage.getItem("bunkmateuser");
      if (!storedUser) {
        navigate("/login");
        return;
      }
    } else {
      setLoading(false);
    }
  }, [navigate]);

  // Save session on successful login/fetch
  useEffect(() => {
    if (userData && userData.email) {
      localStorage.setItem(SESSION_KEY, "active");
      document.cookie = `${SESSION_KEY}=active; path=/; max-age=604800`; // 7 days
    }
  }, [userData]);


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

    const { displayName, email, photoURL, phoneNumber, userBio, uid } = user;
    const newUserData = {
      name: displayName || "User",
      email: email || "",
      mobile: phoneNumber || "Not provided",
      photoURL: photoURL || "",
      bio: userBio || "",
      uid: uid || "", // <-- Add uid here
    };

      setUserData(newUserData);
      localStorage.setItem("bunkmateuser", JSON.stringify(newUserData));
      localStorage.setItem(SESSION_KEY, "active");
      document.cookie = `${SESSION_KEY}=active; path=/; max-age=604800`;
      // Get user type from Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.type === "Beta" || data?.type === "Dev Beta") {
          setUserType(data.type.toUpperCase());
        }
      }
      setLoading(false);
    };
    // Only fetch if not already loaded
  if (!userData.email || !userData.uid) {
    fetchUserData();
  }
}, [navigate, userData.email, userData.uid]);

    const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    localStorage.removeItem("bunkmateuser");
    navigate("/login");
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
        <AppBar position="fixed" elevation={0} backgroundColor="transparent">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: 3, backgroundColor: 'transparent' }}>
            <Typography variant="h6" sx={{ userSelect: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
              BunkMate 🏖️
              {userType && (
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: '#f1f1f131',
                    color: '#fff',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 0.5,
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                  }}
                >
                  {userType}
                </Typography>
              )}
            </Typography>
            <ProfilePic />
          </Toolbar>
        </AppBar>
<Box sx={{ height: { xs: 86, sm: 77 } }} />
        {/* Weather Gradient Greetings Section */}
        <Box
          sx={{
            width: "100%",
            position: "relative",
            zIndex: 1,
            mb: 4,
            borderTopLeftRadius: "2.5rem",
            borderTopRightRadius: "2.5rem",
            background: weatherBg,
            transition: "background 0.8s cubic-bezier(.4,2,.6,1)",
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              pt: 5,
              pb: 2,
              position: "relative",
              zIndex: 3,
              // Add blend/fade effect at the bottom of the container
              "&:after": {
                content: '""',
                display: "block",
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: { xs: 60, md: 90 },
                background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${theme.palette.background.default} 100%)`,
                pointerEvents: "none",
                zIndex: 2,
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
                borderRadius: 3,
                p: 3,
                transition: "background 0.8s cubic-bezier(.4,2,.6,1)",
                animation: `${fadeIn} 0.7s`,
                zIndex: 3,
                position: "relative",
              }}
            >
              <Typography variant="h5" sx={{ color: "text.primary" }}>
                {getGreeting()},<br /><Typography variant="title" style={{ fontWeight: "bold", fontSize: "1.8rem" }}>{userData.name}!</Typography>
              </Typography>
              {/* Weather Widget */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  background: "#222c",
                  minWidth: 170,
                  minHeight: 56,
                  animation: `${fadeIn} 0.7s`,
                }}
              >
                {weatherLoading ? (
                  <CircularProgress size={24} color="white" />
                ) : weather ? (
                  <>
                    {weatherIcons[weather.main] || weatherIcons.Default}
                    <Box>
                      <Typography variant="body1" sx={{ color: "#fff", fontWeight: 600 }}>
                        {weather.temp}°C {weather.city && `in ${weather.city}`}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
                        {weather.desc.charAt(0).toUpperCase() + weather.desc.slice(1)}
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
                    Weather unavailable
                  </Typography>
                )}
              </Box>
            </Box>
          </Container>

        <Container maxWidth="lg" sx={{ mb: 3, padding: 0 }}>
          <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="stretch"
          >
            {[
              {
                label: "Add Notes",
                icon: <StickyNote2OutlinedIcon />,
                onClick: () => navigate("/notes"),
              },
              {
                label: "Reminder",
                icon: <AlarmOutlinedIcon />,
                onClick: () => navigate("/reminders"),
              },
              {
                label: "Trip",
                icon: <ExploreOutlinedIcon />,
                onClick: () => navigate("/trips"),
              },
              {
                label: "Budget",
                icon: <AccountBalanceWalletOutlinedIcon />,
                onClick: () => navigate("/budget-mngr"),
              },
            ].map((tile) => (
              <Grid
                item
                xs={3}
                sm={3}
                md={3}
                lg={3}
                key={tile.label}
                sx={{ display: "flex" }}
              >
                <Card
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 120,
                    width: "85px",
                    aspectRatio: "1 / 1",
                    cursor: "pointer",
                    background: "#f1f1f111",
                    backdropFilter: "blur(80px)",
                    boxShadow: "none",
                    "&:hover": { background: "#232526" },
                    transition: "background 0.2s",
                  }}
                  onClick={tile.onClick}
                >
                  <Box sx={{ mb: 1, fontSize: 38, px: 2, py: 0.5, borderRadius: 4, backgroundColor: WeatherBgdrop, color: buttonWeatherBg }}>
                    {tile.icon}
                  </Box>
                  <Typography
                    variant="subtitle6"
                    sx={{ color: "text.primary", fontSize: "12px" }}
                  >
                    {tile.label}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
        </Box>


        {/* Main Content */}
        <Box sx={{ display: "flex", flexGrow: 1 }}>
          {!isSmallScreen && <Sidebar />}
          <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 2, position: "relative" }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "60vh",
                }}
              >
                <CircularProgress color="white" />
              </Box>
            ) : (
    <Grid container spacing={3}>
      {/* Budgets Display Card */}
<Grid item xs={12} md={6} lg={4}>
  <Box>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6" sx={{ color: "text.primary" }}>
          Your Budgets
        </Typography>
        {budgets.length > 0 && (
          <Box
            component="button"
            onClick={() => navigate("/budget-mngr")}
            sx={{
              display: "flex",
              alignItems: "center",
              background: "none",
              border: "none",
              color: buttonWeatherBg,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              px: 1,
              py: 0.5,
              borderRadius: 1,
              transition: "background 0.2s",
              "&:hover": {
                background: "#232526",
              },
            }}
          >
            View More <ChevronRightIcon />
          </Box>
        )}
      </Box>
      {budgets.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 1,
            overflowX: "auto",
            maxWidth: "100%",
            px: 1,
            py: 0.5,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": {
              display: "none",
              height: 6,
            },
            "&::-webkit-scrollbar-thumb": {
              display: "none",
              borderRadius: 4,
            },
          }}
        >
{sortedBudgets.slice(0, 5).map((b, idx) => {
  // Match Budget.js logic for category and icon
  const category =
    b.category || (Array.isArray(b.items) && b.items[0]?.category) || "Other";
  const cat = CATEGORY_ICONS[category] || CATEGORY_ICONS.Other;

  // Budget name: Prefer b.name, fallback to b.title, fallback to first item name, fallback to "Untitled"
  const budgetName =
    b.name || b.title || (Array.isArray(b.items) && b.items[0]?.name) || "Untitled";

  // Total budgeted amount (Budget.js: item.amount)
  const totalBudget = Number(b.amount || b.total || 0);

  // Expenses array (Budget.js: item.expenses)
  const expenses = Array.isArray(b.expenses)
    ? b.expenses
    : Array.isArray(b.items)
      ? b.items.flatMap(i => i.expenses || [])
      : [];

  // Current spent amount: sum of all expense amounts (Budget.js: totalExpense)
  const totalExpense = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  // Current budget left (Budget.js: balance)
  const balance = totalBudget - totalExpense;

  // Contributors: Budget.js usually has a contributors array or users array
  const contributors = Array.isArray(b.contributors)
    ? b.contributors
    : Array.isArray(b.users)
      ? b.users
      : [];

  const budgetIndex = sortedBudgets.findIndex(budget => budget === b);

  return (
    <Box
      key={b.id || b.name || idx}
      sx={{
        background: cat.listbgcolor,
        borderRadius: 2,
        px: 1,
        py: 1,
        minWidth: 120,
        maxWidth: 180,
        fontSize: 13,
        color: "#fff",
        textAlign: "left",
        boxShadow: "0 1px 4px #0003",
        flex: "0 0 auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        "&:hover": {
          boxShadow: "0 4px 16px #0006",
        },
      }}
      onClick={() => navigate(`/budget-mngr?index=${budgetIndex}&expdrawer=true`)}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 0 }}>
        <Box
          sx={{
            background: cat.mcolor,
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1,
          }}
        >
          {React.cloneElement(
            cat.icon,
            { sx: { fontSize: 22, color: cat.fcolor } }
          )}
        </Box>
        <Box>
          <Box display={"flex"} flexDirection={"row"} justifyContent={"space-between"} alignItems="center" gap={1}>
            <Typography style={{ fontSize: 15 }}>
              {budgetName}
            </Typography>
            <Typography variant="caption" style={{ backgroundColor: "#f1f1f111", color: "#aaa", padding: "1px 6px", borderRadius: "20px", mt: 0, fontWeight: "bolder" }}>
              {contributors.length > 0
                ? `${contributors.length}`
                : "0"}
            </Typography>
          </Box>
          <div style={{ color: cat.fcolor, fontWeight: 600 }}>
            ₹{balance.toFixed(2)}
            {totalBudget > 0 && (
              <span style={{ color: "#BDBDBD", fontWeight: 400, fontSize: 12, marginLeft: 4 }}>
                / ₹{totalBudget}
              </span>
            )}
          </div>
        </Box>
      </Box>
    </Box>
  );
})}

          {budgets.length > 5 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2,
                color: "#BDBDBD",
                fontSize: 13,
                fontWeight: 500,
                minWidth: 60,
              }}
            >
              +{budgets.length - 5} more...
            </Box>
          )}
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
          No budgets found.
        </Typography>
      )}
    </CardContent>
  </Box>
</Grid>

      {/* Example Card */}
      <Grid item xs={12} md={6} lg={4}>
        <Card>
          <CardMedia
            component="img"
            height="140"
            image="data:image/png;base64,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"
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
            background: buttonWeatherBg,
            color: "#000",
            "&:hover": {
              background: buttonWeatherBg,
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