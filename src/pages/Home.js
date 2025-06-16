import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getAuth } from "firebase/auth";

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
import ProfilePic from "../components/Profile";
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CloudIcon from '@mui/icons-material/Cloud';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import OpacityIcon from '@mui/icons-material/Opacity';

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

const weatherGradients = {
  Clear: "linear-gradient(360deg, #00000000 4%,  #232526 40%, #00f721 100%)",
  Clouds: "linear-gradient(360deg, #00000000 4%, #232526 40%, #444444 100%)",
  Rain: "linear-gradient(360deg, #00000000 4%, #232526 40%, #00b4d8 100%)",
  Thunderstorm: "linear-gradient(360deg, #00000000 4%, #232526 40%, #6366f1 100%)",
  Snow: "linear-gradient(360deg, #00000000 4%, #232526 40%, #b3c6ff 100%)",
  Drizzle: "linear-gradient(360deg, #00000000 4%, #232526 40%, #48cae4 100%)",
  Mist: "linear-gradient(360deg, #00000000 4%, #232526 40%, #bdbdbd 100%)",
  Default: "linear-gradient(360deg, #00000000 4%, #232526 40%,#2c2c2c 100%)"
};

const weatherIcons = {
  Clear: <WbSunnyIcon sx={{ color: "#ffe066" }} />,
  Clouds: <CloudIcon sx={{ color: "#bdbdbd" }} />,
  Rain: <OpacityIcon sx={{ color: "#00b4d8" }} />,
  Thunderstorm: <ThunderstormIcon sx={{ color: "#6366f1" }} />,
  Snow: <AcUnitIcon sx={{ color: "#b3c6ff" }} />,
  Drizzle: <OpacityIcon sx={{ color: "#48cae4" }} />,
  Mist: <CloudIcon sx={{ color: "#bdbdbd" }} />,
  Default: <CloudIcon sx={{ color: "#bdbdbd" }} />
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
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
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
            borderTopLeftRadius: "2rem",
            borderTopRightRadius: "2rem",
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
        </Box>

        <Container maxWidth="lg" sx={{ mb: 3 }}>
          <Grid
            container
            spacing={2}
            justifyContent="center"
            alignItems="stretch"
          >
            {[
              {
                label: "Add Notes",
                icon: "📝",
                onClick: () => navigate("/notes"),
              },
              {
                label: "Reminder",
                icon: "⏰",
                onClick: () => navigate("/reminders"),
              },
              {
                label: "Trip",
                icon: "🌍",
                onClick: () => navigate("/trips"),
              },
              {
                label: "Budget",
                icon: "💸",
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
                    aspectRatio: "1 / 1",
                    cursor: "pointer",
                    background: "#181818",
                    boxShadow: "0 2px 8px #0004",
                    "&:hover": { background: "#232526" },
                    transition: "background 0.2s",
                  }}
                  onClick={tile.onClick}
                >
                  <Box sx={{ mb: 1, fontSize: 32, color: "#00f721" }}>
                    {tile.icon}
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: "text.primary", fontWeight: 600 }}
                  >
                    {tile.label}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

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
              background: "none",
              border: "none",
              color: "#00f721",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              px: 1,
              py: 0.5,
              borderRadius: 1,
              transition: "background 0.2s",
              "&:hover": {
                background: "#232526",
                textDecoration: "underline",
              },
            }}
          >
            View More
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
          <div style={{ color: "#00f721", fontWeight: 600 }}>
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
            backgroundColor: "#00f721",
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