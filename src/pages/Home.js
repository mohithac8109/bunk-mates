import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { doc, collection, query, where, orderBy, getDoc, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useWeather } from "../contexts/WeatherContext";
import { Chats } from "./Chats";
import packageJson from '../../package.json';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  ThemeProvider,
  keyframes,
  Button,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
} from "@mui/material";
import {
  LocationOn,
  AccessTime,
} from "@mui/icons-material";
import ProfilePic from "../components/Profile";
import Reminders from "./Reminders";
import DeviceGuard from "../components/DeviceGuard";
import BetaAccessGuard from "../components/BetaAccessGuard";
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
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

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

const CATEGORY_ICONS = {
  Food: {
    icon: <RestaurantOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff9c000f",
    bgcolor: "#ff9c0030",
    mcolor: "#ff98005e",
    fcolor: "#e3aa8b"
  },
  Tour: {
    icon: <TravelExploreOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#0093ff0f",
    bgcolor: "#0093ff30",
    mcolor: "#2196f35e",
    fcolor: "#92b6ef"
  },
  Rent: {
    icon: <HomeOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#88ff000f",
    bgcolor: "#88ff0030",
    mcolor: "#8bc34a5e",
    fcolor: "#8dc378"
  },
  Utilities: {
    icon: <LocalAtmOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#8ad0ff0f",
    bgcolor: "#8ad0ff30",
    mcolor: "#607d8b5e",
    fcolor: "#8e9ba1"
  },
  Shopping: {
    icon: <LocalMallOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff00550f",
    bgcolor: "#ff005530",
    mcolor: "#e91e635e",
    fcolor: "#ffbce0"
  },
  Fun: {
    icon: <EmojiEventsOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f5e7480f",
    bgcolor: "#f5e74830",
    mcolor: "#c3b6415e",
    fcolor: "#ddca15"
  },
  Hospital: {
    icon: <LocalHospitalOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#ff00260f",
    bgcolor: "#ff002630",
    mcolor: "#f443365e",
    fcolor: "#efa4a4"
  },
  Education: {
    icon: <SchoolOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#0093ff0f",
    bgcolor: "#0093ff30",
    mcolor: "#2196f35e",
    fcolor: "#92b6ef"
  },
  Fuel: {
    icon: <LocalGasStationOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#fbe9e70f",
    bgcolor: "#fbe9e730",
    mcolor: "#ff5722",
    fcolor: "#bf360c"
  },
  Entertainment: {
    icon: <MovieOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f3e5f50f",
    bgcolor: "#f3e5f530",
    mcolor: "#9c27b0",
    fcolor: "#4a148c"
  },
  Bills: {
    icon: <LocalAtmOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e0f2f10f",
    bgcolor: "#e0f2f130",
    mcolor: "#009688",
    fcolor: "#004d40"
  },
  Travel: {
    icon: <TravelExploreOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e1f5fe0f",
    bgcolor: "#e1f5fe",
    mcolor: "#03a9f4",
    fcolor: "#01579b"
  },
  Medical: {
    icon: <LocalHospitalOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#fce4ec0f",
    bgcolor: "#fce4ec",
    mcolor: "#e91e63",
    fcolor: "#880e4f"
  },
  Other: {
    icon: <CategoryOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f5f5f50f",
    bgcolor: "#f5f5f530",
    mcolor: "#bdbdbd5e",
    fcolor: "#a4a4a4"
  }
};

const quickTiles = [
  {
    label: "Add Notes",
    icon: <StickyNote2OutlinedIcon />,
    onClick: navigate => navigate("/notes"),
  },
  {
    label: "Reminder",
    icon: <AlarmOutlinedIcon />,
    onClick: (navigate, setRemindersDrawerOpen) => setRemindersDrawerOpen(true),
  },
  {
    label: "Trip",
    icon: <ExploreOutlinedIcon />,
    onClick: navigate => navigate("/trips"),
  },
  {
    label: "Budget",
    icon: <AccountBalanceWalletOutlinedIcon />,
    onClick: navigate => navigate("/budget-mngr"),
  },
];

const SESSION_KEY = "bunkmate_session";
const WEATHER_STORAGE_KEY = "bunkmate_weather";
const WEATHER_API_KEY = "c5298240cb3e71775b479a32329803ab";

// --- Helper Functions ---
function getUserFromStorage() {
  try {
    const storedUser = localStorage.getItem("bunkmateuser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.uid) return parsed;
    }
    const cookieUser = document.cookie
      .split("; ")
      .find(row => row.startsWith("bunkmateuser="))
      ?.split("=")[1];
    if (cookieUser) {
      const parsed = JSON.parse(decodeURIComponent(cookieUser));
      if (parsed?.uid) return parsed;
    }
  } catch {}
  return null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function getDefaultTripIndex(trips) {
  const now = new Date();
  let ongoing = null, upcoming = null, upcomingDate = null;
  trips.forEach((trip, idx) => {
    const start = new Date(trip.startDate || trip.date);
    const end = new Date(trip.endDate || trip.date);
    if (start <= now && now <= end) ongoing = idx;
    else if (start > now && (!upcomingDate || start < upcomingDate)) {
      upcoming = idx;
      upcomingDate = start;
    }
  });
  if (ongoing !== null) return ongoing;
  if (upcoming !== null) return upcoming;
  return 0;
}

const sliderSettings = {
  dots: true,
  dotsClass: "slick-dots slick-thumb",
  infinite: false,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  swipeToSlide: true,
  adaptiveHeight: true,
  arrows: false,
};

const Home = () => {
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));

  const [authInitialized, setAuthInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [userData, setUserData] = useState({});
  const [userType, setUserType] = useState("");
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const [budgets, setBudgets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersDrawerOpen, setRemindersDrawerOpen] = useState(false);
  const remindersRef = useRef();

  const [myTrips, setMyTrips] = useState([]);
  const [tripMembersMap, setTripMembersMap] = useState({});
  const [timelineStatsMap, setTimelineStatsMap] = useState({});
  const [tripGroupsMap, setTripGroupsMap] = useState({});
  const [sliderIndex, setSliderIndex] = useState(0);

  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthInitialized(true);
      if (!firebaseUser) {
        setUser(null);
        setNotLoggedIn(true);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);

      // Fetch user data realtime listener
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setUserType(data.type || "");
        }
        setNotLoggedIn(false);
        setLoading(false);
      }, () => {
        setUserData({});
        setUserType("");
        setLoading(false);
      });

      // Cleanup on unmount
      return () => unsubscribeUser();
    });

    return () => unsubscribe();
  }, []);

  // Weather with cache
  useEffect(() => {
    let cachedWeather = null;
    try {
      const local = localStorage.getItem(WEATHER_STORAGE_KEY);
      if (local) cachedWeather = JSON.parse(local);
      if (!cachedWeather) {
        const cookieWeather = document.cookie
          .split("; ")
          .find(row => row.startsWith(WEATHER_STORAGE_KEY + "="))
          ?.split("=")[1];
        if (cookieWeather) cachedWeather = JSON.parse(decodeURIComponent(cookieWeather));
      }
    } catch {}
    if (cachedWeather) {
      setWeather(cachedWeather);
      setWeatherLoading(false);
    } else {
      setWeatherLoading(true);
      if (!navigator.geolocation) {
        setWeatherLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(async (position) => {
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
            city: data.name,
          };
          setWeather(weatherObj);
          localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(weatherObj));
          document.cookie = `${WEATHER_STORAGE_KEY}=${encodeURIComponent(
            JSON.stringify(weatherObj)
          )}; path=/; max-age=1800`;
        } catch {
          setWeather(null);
        }
        setWeatherLoading(false);
      }, () => setWeatherLoading(false), { timeout: 10000 });
    }
  }, []);

  useEffect(() => {
    const fetchReminders = async () => {
      setRemindersLoading(true);
      try {
        const user = getUserFromStorage();
        if (!user || !user.uid) {
          setReminders([]);
          setRemindersLoading(false);
          return;
        }
        const q = query(
          collection(db, "reminders"),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => {
          const reminder = { id: doc.id, ...doc.data() };
          if (reminder.uid && reminder.uid === user.uid) {
            data.push(reminder);
          }
        });
        setReminders(data);
      } catch (err) {
        setReminders([]);
      }
      setRemindersLoading(false);
    };
    fetchReminders();
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setBudgets([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const budgetsDocRef = doc(db, "budgets", user.uid);

    const unsubscribeBudgets = onSnapshot(budgetsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setBudgets(docSnap.data().items || []);
      } else {
        setBudgets([]);
      }
      setLoading(false);
    }, () => {
      setBudgets([]);
      setLoading(false);
    });

    return () => unsubscribeBudgets();
  }, [user]);

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

  const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [budgets]);

  // Real-time trips listener + timelines + trip member fetch (one-time per trip)
  useEffect(() => {
    if (!user?.uid) {
      setMyTrips([]);
      setTripMembersMap({});
      setTimelineStatsMap({});
      setTripGroupsMap({});
      return;
    }

    const tripsQuery = query(
      collection(db, "trips"),
      where("members", "array-contains", user.uid)
    );

    const unsubscribeTrips = onSnapshot(tripsQuery, (querySnapshot) => {
      const tripsList = [];
      querySnapshot.forEach(doc => tripsList.push({ id: doc.id, ...doc.data() }));
      setMyTrips(tripsList);

      tripsList.forEach(async (trip) => {
        if (trip.members && Array.isArray(trip.members)) {
          const membersData = await Promise.all(
            trip.members.map(uid =>
              getDoc(doc(db, "users", uid)).then(d => d.exists() ? { uid: d.id, ...d.data() } : null)
            )
          );
          setTripMembersMap(prev => ({ ...prev, [trip.id]: membersData.filter(Boolean) }));
        }
      });

      let timelineUnsubs = [];
      timelineUnsubs.forEach(unsub => unsub && unsub());
      timelineUnsubs = tripsList.map(trip => {
        const timelineCol = collection(db, "trips", trip.id, "timeline");
        const unsub = onSnapshot(timelineCol, snap => {
          const events = snap.docs.map(d => d.data());
          const total = events.length || 1;
          const completed = events.filter(e => e.completed === true).length;
          setTimelineStatsMap(prev => ({
            ...prev,
            [trip.id]: { completed, total, percent: Math.round((completed / total) * 100) }
          }));
        });
        return unsub;
      });

      return () => timelineUnsubs.forEach(unsub => unsub && unsub());
    });

    return () => unsubscribeTrips();
  }, [user]);

  useEffect(() => {
    if (myTrips && myTrips.length > 0) {
      setSliderIndex(getDefaultTripIndex(myTrips));
    }
  }, [myTrips]);

  useEffect(() => {
    if (!myTrips.length) {
      setTripGroupsMap({});
      return;
    }

    const fetchGroupsForTrips = async () => {
      const groupMap = {};
      await Promise.all(
        myTrips.map(async trip => {
          const groupSnap = await getDoc(doc(db, "groupChats", trip.id));
          if (groupSnap.exists()) {
            groupMap[trip.id] = groupSnap.data();
          }
        })
      );
      setTripGroupsMap(groupMap);
    };

    fetchGroupsForTrips();
  }, [myTrips]);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    document.cookie = `${SESSION_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    localStorage.removeItem("bunkmateuser");
    auth.signOut().then(() => navigate("/login"));
  };

  if (!authInitialized) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notLoggedIn) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
  <ThemeProvider theme={theme}>
    <DeviceGuard>
      <BetaAccessGuard>
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            bgcolor: mode === "dark" ? "#0c0c0c" : "#f1f1f1",
            color: mode === "dark" ? "#fff" : "#000",
          }}
        >
          {/* HEADER */}
          <AppBar position="fixed" elevation={0} sx={{
            backgroundColor: "transparent",
            backdropFilter: "blur(10px)",
            boxShadow: "none"
          }}>
            <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: 3 }}>
              <Typography variant="h6" sx={{
                userSelect: 'none', display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold',
                color: mode === "dark" ? "#f1f1f1" : "#333"
              }}>
                BunkMate 🏖️
                {userType && (
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: mode === "dark" ? "#f1f1f141" : "#4848484d",
                      color: mode === "dark" ? "#fff" : "#000",
                      px: 1.5, py: 0.2, borderRadius: 2.5, fontWeight: 'bold', fontSize: '0.7rem',
                    }}
                  >
                    {userType}
                  </Typography>
                )}
              </Typography>
              <ProfilePic />
            </Toolbar>
          </AppBar>
          <Box sx={{ height: { xs: 0, sm: 77 } }} />

          {/* LOADING & AUTH STATES */}
          {loading ? (
            <Box sx={{
              display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", zIndex: 1500
            }}>
              <CircularProgress color="white" />
            </Box>
          ) : notLoggedIn ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <Typography variant="h5" color="text.secondary">
                Please log in to use BunkMate.
              </Typography>
            </Box>
          ) : (
            <>
              {/* HERO/GREETING SECTION */}
              <Box
                sx={{
                  zIndex: 1, mb: 4,
                  background: `linear-gradient(to top, rgba(0,0,0,0) 0%, #00000000 1%, ${theme.palette.primary.mainbg} 100%)`,
                  transition: "background 0.8s cubic-bezier(.4,2,.6,1)"
                }}>
                <Container maxWidth="lg" sx={{
                  pt: 5, pb: 2, position: "relative", zIndex: 3,
                }}>
                  <Box sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 2,
                    borderRadius: 3,
                    py: 12,
                    px: 1
                  }}>
                    <Typography variant="h5" sx={{ color: "text.primary" }}>
                      {getGreeting()},<br />
                      <Typography component="span" sx={{ fontWeight: "bold", fontSize: "1.8rem" }}>
                        {userData.name || "user"}!
                      </Typography>
                    </Typography>
                    {/* Weather Widget */}
                    <Box sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 2, py: 1,
                      borderRadius: 5,
                      bgcolor: mode === "dark" ? "#0c0c0c5a" : "#f1f1f19a",
                      minWidth: 170, minHeight: 56,
                    }}>
                      {weatherLoading ? (
                        <CircularProgress size={24} color={theme.palette.background.primary} />
                      ) : weather ? (
                        <>
                          {weatherIcons[weather.main] || weatherIcons.Default}
                          <Box>
                            <Typography variant="body1"
                              sx={{ color: mode === "dark" ? "#fff" : "#000", fontWeight: 600 }}>
                              {weather.temp}°C {weather.city && `in ${weather.city}`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              {weather.desc.charAt(0).toUpperCase() + weather.desc.slice(1)}
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Weather unavailable
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Container>

                {/* TILES */}
                <Container maxWidth="lg" sx={{ mb: 3, p: 0 }}>
                  <Grid container spacing={1.2} justifyContent="center" alignItems="stretch">
                    {quickTiles.map((tile) => (
                      <Grid item xs={3} key={tile.label} sx={{ display: "flex" }}>
                        <Card
                          sx={{
                            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            minHeight: 105, width: "21vw", aspectRatio: "1 / 1", cursor: "pointer",
                            background: mode === "dark" ? "#f1f1f111" : "#0c0c0c07", borderRadius: 5, boxShadow: "none"
                          }}
                          onClick={() =>
                            (tile.label === "Reminder"
                              ? tile.onClick(null, setRemindersDrawerOpen)
                              : tile.onClick(navigate))
                          }
                        >
                          <Box sx={{ mb: 1, fontSize: 34, px: 1.5, py: 0.5, borderRadius: 6, bgcolor: theme.palette.primary.bgr, color: theme.palette.primary.main }}>
                            {tile.icon}
                          </Box>
                          <Typography variant="subtitle6" sx={{ color: "text.primary", fontSize: "10.5px" }}>
                            {tile.label}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Container>
              </Box>
              {/* MAIN CONTENT */}
              <Box sx={{ display: "flex", flexGrow: 1 }}>
                {!isSmallScreen && <Sidebar />}
                <Container maxWidth="lg" sx={{ flexGrow: 1, pt: 2, position: "relative" }}>
                  {/** ...leave unchanged... */}
                  {/** Your main content cards, trips, budgets, reminders... */}
                </Container>
              </Box>
              {/* FLOATING CHAT BUTTON */}
              <Grid
                justifyContent={"right"}
                container
                sx={{
                  position: "sticky",
                  bottom: 20,
                  right: 20,
                  mr: 1.5
                }}
              >
                {isSmallScreen && (
                  <Zoom in>
                    <Fab
                      color="primary"
                      aria-label="chat"
                      sx={{
                        zIndex: 999,
                        width: '70px',
                        height: '70px',
                        background: theme.palette.primary.bg,
                        color: theme.palette.primary.main,
                        boxShadow: "none",
                        borderRadius: 5,
                        "&:hover": {
                          background: theme.palette.primary.bg,
                        },
                      }}
                      onClick={() => navigate("/chats")}
                    >
                      <ChatBubbleOutlineIcon />
                    </Fab>
                  </Zoom>
                )}
              </Grid>
            </>
          )}
        </Box>
      </BetaAccessGuard>
    </DeviceGuard>
  </ThemeProvider>
  );
};

export default Home;
