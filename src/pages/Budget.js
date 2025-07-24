import React, { useEffect, useState, useMemo } from "react";
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import {
  Avatar,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonBase,
  Drawer,
  Fab,
  Grid,
  Chip,
  Stack,
  IconButton,
  ThemeProvider,
  useTheme,
  keyframes,
  createTheme,
  InputAdornment,
  MenuItem,
  Menu,
  SwipeableDrawer
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Card from "@mui/material/Card";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';
import ViewModuleIcon from '@mui/icons-material/ViewModuleOutlined';
import ViewListIcon from '@mui/icons-material/ViewListOutlined';

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
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';


import { useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "../firebase"; // Your Firebase config export
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../contexts/SettingsContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

import ProfilePic from "../components/Profile";
import BetaAccessGuard from "../components/BetaAccessGuard";
import DeviceGuard from "../components/DeviceGuard";

function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie =
    name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
}

function getCookie(name) {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
}


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



const PREDEFINED_CATEGORIES = [
  "Food",
  "Tour",
  "Rent",
  "Utilities",
  "Shopping",
  "Fun",
  "Hospital",
  "Education",
  "Other"
];

const EXP_PREDEFINED_CATEGORIES = [
  "Food",
  "Travel",
  "Fuel",
  "Bills",
  "Utilities",
  "Shopping",
  "Entertainment",
  "Medical",
  "Other"
];

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
    fcolor: " #bf360c"     // deepOrange[900]
  },
  Entertainment: {
    icon: <MovieOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f3e5f50f",   // purple[50]
    bgcolor: "#f3e5f530",   // purple[50]
    mcolor: "#9c27b0",    // purple[500]
    fcolor: " #4a148c"     // purple[900]
  },
  Bills: {
    icon: <LocalAtmOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e0f2f10f",   // teal[50]
    bgcolor: "#e0f2f130",   // teal[50]
    mcolor: "#009688",    // teal[500]
    fcolor: " #004d40"     // teal[900]
  },
  Travel: {
    icon: <TravelExploreOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#e1f5fe0f",   // lightBlue[50]
    bgcolor: "#e1f5fe",   // lightBlue[50]
    mcolor: "#03a9f4",    // lightBlue[500]
    fcolor: " #01579b"     // lightBlue[900]
  },
  Medical: {
    icon: <LocalHospitalOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#fce4ec0f",   // pink[50]
    bgcolor: "#fce4ec",   // pink[50]
    mcolor: "#e91e63",    // pink[500]
    fcolor: " #880e4f"     // pink[900]
  },
  Other: {
    icon: <CategoryOutlinedIcon sx={{ fontSize: "large" }} />,
    listbgcolor: "#f5f5f50f",   // grey[50]
    bgcolor: "#f5f5f530",   // grey[100]
    mcolor: "#bdbdbd5e",    // grey[400]
    fcolor: " #a4a4a4"     // grey[900]
  },
};

const WEATHER_STORAGE_KEY = "bunkmate_weather";

function setViewType(type) {
  try {
    localStorage.setItem("bunkmate_viewtype", type);
    setCookie("bunkmate_viewtype", type, 30);
  } catch {}
}
function getViewType() {
  try {
    return localStorage.getItem("bunkmate_viewtype") || getCookie("bunkmate_viewtype") || "grid";
  } catch {
    return "grid";
  }
}

// Helper for long-press
function useLongPress(callback = () => {}, ms = 600) {
  const [startLongPress, setStartLongPress] = useState(false);

  useEffect(() => {
    let timerId;
    if (startLongPress) {
      timerId = setTimeout(callback, ms);
    } else {
      clearTimeout(timerId);
    }
    return () => {
      clearTimeout(timerId);
    };
  }, [startLongPress, callback, ms]);

  const start = () => setStartLongPress(true);
  const stop = () => setStartLongPress(false);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
  };
}

// --- BudgetGridCard Component ---
function BudgetGridCard({
  item,
  itemIndex,
  handleMenuOpen,
  history,
  getCurrentBalance,
  CATEGORY_ICONS,
  buttonWeatherBg,
}) {
  const balance = getCurrentBalance(item);
  const isOver = Number(balance) > Number(item.amount);

  // Store the last pointer event for menu positioning
  const lastPointerEvent = React.useRef(null);

  const onLongPress = React.useCallback(
    () => {
      if (lastPointerEvent.current) {
        handleMenuOpen(lastPointerEvent.current, itemIndex);
      } else {
        handleMenuOpen({ currentTarget: null, clientX: window.innerWidth/2, clientY: window.innerHeight/2 }, itemIndex);
      }
    },
    [handleMenuOpen, itemIndex]
  );

  // Custom handlers to capture pointer position
  const longPressHandlers = useLongPress(onLongPress, 600);

  // Attach pointer position to the ref
  const attachTarget = (handler) => (e) => {
    if (e && (e.touches?.[0] || e.changedTouches?.[0])) {
      // Touch event
      const touch = e.touches?.[0] || e.changedTouches?.[0];
      lastPointerEvent.current = {
        currentTarget: e.currentTarget,
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
      };
    } else if (e && (typeof e.clientX === "number")) {
      // Mouse event
      lastPointerEvent.current = {
        currentTarget: e.currentTarget,
        clientX: e.clientX,
        clientY: e.clientY,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
      };
    }
    handler && handler(e);
  };

  return (
    <Grid
      item
      xs={1}
      key={itemIndex}
      sx={{
        display: "flex",
        flex: 1,
        minWidth: "30vw",
      }}
    >
      <Paper
        {...Object.fromEntries(
          Object.entries(longPressHandlers).map(([k, v]) => [k, attachTarget(v)])
        )}
        onClick={() => history(`/budget-mngr?index=${itemIndex}&expdrawer=true`)}
        elevation={1}
        sx={{
          width: "100%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          p: 1.9,
          borderRadius: "15px",
          userSelect: "none",
          bgcolor: isOver
            ? "#ff000033"
            : CATEGORY_ICONS[item.category]?.listbgcolor || "background.paper",
          color: isOver ? "#ff4444" : "text.primary",
          boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.08)",
          transition: "all 0.2s ease-in-out",
          cursor: "pointer",
          gap: 1.2,
          "&:hover": {
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            marginBottom={1}
          >
            <Typography variant="h6" fontWeight={600} pr={2}>
              {item.name}
            </Typography>
            {/* Removed MoreVertIcon */}
          </Box>
        </Box>
        <Box
          display={"flex"}
          flexDirection={"row"}
          alignItems="center"
          gap={1}
        >
          <Typography
            sx={{
              backgroundColor:
                CATEGORY_ICONS[item.category]?.bgcolor || "#f1f1f111",
              py: 0.4,
              px: 1,
              width: "auto",
              borderRadius: 0.4,
              fontWeight: "bolder",
              mt: 0,
              color: CATEGORY_ICONS[item.category]?.fcolor || "#000",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
            variant="bodySmall"
            color="text.secondary"
          >
            <Avatar
              sx={{
                bgcolor: CATEGORY_ICONS[item.category]?.mcolor || "#333",
                color: CATEGORY_ICONS[item.category]?.fcolor || "#000",
                width: "auto",
                height: "auto",
                fontSize: 1,
                ml: "-6px",
                alignSelf: "center",
              }}
              variant="bodySmall"
            >
              {CATEGORY_ICONS[item.category]?.icon || <CategoryOutlinedIcon />}
            </Avatar>
            {item.category}
          </Typography>
          {/* Contributors */}
          {item.contributors?.length > 0 && (
            <Box mt={0}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {item.contributors.length > 3 && (
                  <Chip
                    label={`+${item.contributors.length - 3} more`}
                    size="small"
                    variant="outlined"
                    sx={{
                      fontSize: "0.7rem",
                      borderRadius: "10px",
                      borderColor: buttonWeatherBg,
                      color: "text.secondary",
                      mb: 0,
                    }}
                  />
                )}
              </Stack>
              <Typography
                variant="caption"
                sx={{
                  backgroundColor: "#f1f1f111",
                  color: "#aaa",
                  py: 0.5,
                  px: 1,
                  borderRadius: 0.4,
                  mt: 0,
                  fontWeight: "bolder",
                }}
              >
                {item.contributors.length}
              </Typography>
            </Box>
          )}
        </Box>
        {/* Total Amount */}
        <Typography variant="bodyMedium">
          <Typography
            variant="bodyMedium"
            fontWeight={600}
            color={isOver ? "#ff4444" : "success.main"}
          >
            ₹{balance.toFixed(2)}
          </Typography>
          <br />/ ₹{item.amount}
        </Typography>
      </Paper>
    </Grid>
  );
}

// --- BudgetListCard Component ---
function BudgetListCard({
  item,
  itemIndex,
  handleMenuOpen,
  history,
  getCurrentBalance,
  CATEGORY_ICONS,
  buttonWeatherBg,
}) {
  const balance = getCurrentBalance(item);
  const isOver = Number(balance) > Number(item.amount);

  const lastPointerEvent = React.useRef(null);

  const onLongPress = React.useCallback(
    () => {
      if (lastPointerEvent.current) {
        handleMenuOpen(lastPointerEvent.current, itemIndex);
      } else {
        handleMenuOpen({ currentTarget: null, clientX: window.innerWidth/2, clientY: window.innerHeight/2 }, itemIndex);
      }
    },
    [handleMenuOpen, itemIndex]
  );

  const longPressHandlers = useLongPress(onLongPress, 600);

  const attachTarget = (handler) => (e) => {
    if (e && (e.touches?.[0] || e.changedTouches?.[0])) {
      const touch = e.touches?.[0] || e.changedTouches?.[0];
      lastPointerEvent.current = {
        currentTarget: e.currentTarget,
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
      };
    } else if (e && (typeof e.clientX === "number")) {
      lastPointerEvent.current = {
        currentTarget: e.currentTarget,
        clientX: e.clientX,
        clientY: e.clientY,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
      };
    }
    handler && handler(e);
  };

  return (
    <Paper
      {...Object.fromEntries(
        Object.entries(longPressHandlers).map(([k, v]) => [k, attachTarget(v)])
      )}
      key={itemIndex}
      onClick={() => history(`/budget-mngr?index=${itemIndex}&expdrawer=true`)}
      elevation={1}
      sx={{
        width: "100%",
        minWidth: 0,
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        p: 2,
        borderRadius: "30px",
        userSelect: "none",
        bgcolor: isOver
          ? "#ff000033"
          : CATEGORY_ICONS[item.category]?.listbgcolor || "background.paper",
        color: isOver ? "#ff4444" : "text.primary",
        boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.08)",
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
        gap: 0.3,
        "&:hover": {
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: CATEGORY_ICONS[item.category]?.mcolor || "#333",
          color: CATEGORY_ICONS[item.category]?.fcolor || "#000",
          width: 48,
          height: 48,
          fontSize: 48,
          mr: 2,
          borderRadius: "40%",
        }}
      >
        {CATEGORY_ICONS[item.category]?.icon || <CategoryOutlinedIcon />}
      </Avatar>
      <Box sx={{ flex: 1, m: 0 }}>
        <Box
          display={"flex"}
          flexDirection={"row"}
          justifyContent="space-between"
          alignItems="center"
          gap={1}
        >
          <Typography variant="h6" fontWeight={100}>
            {item.name}
          </Typography>
          <Box
            display={"flex"}
            flexDirection={"row"}
            alignItems="center"
            gap={1}
          >
            <Typography
              sx={{
                backgroundColor:
                  CATEGORY_ICONS[item.category]?.bgcolor || "#f1f1f111",
                py: 0.4,
                px: 1,
                width: "auto",
                borderRadius: 0.4,
                fontWeight: "bolder",
                mt: 0,
                color: CATEGORY_ICONS[item.category]?.fcolor || "#000",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
              variant="bodySmall"
              color="text.secondary"
            >
              {item.category}
            </Typography>
            {/* Contributors */}
            {item.contributors?.length > 0 && (
              <Box mt={0}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {item.contributors.length > 3 && (
                    <Chip
                      label={`+${item.contributors.length - 3} more`}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: "0.7rem",
                        borderRadius: "10px",
                        borderColor: buttonWeatherBg,
                        color: "text.secondary",
                        mb: 0,
                      }}
                    />
                  )}
                </Stack>
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: "#f1f1f111",
                    color: "#aaa",
                    py: 0.5,
                    px: 1,
                    borderRadius: 0.4,
                    mt: 0,
                    fontWeight: "bolder",
                  }}
                >
                  {item.contributors.length}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Typography variant="bodyMedium" sx={{ mt: 0.5 }}>
          <Typography
            variant="bodyMedium"
            fontWeight={"bolder"}
            color={isOver ? "#ff4444" : "success.main"}
          >
            ₹{balance.toFixed(2)}
          </Typography>{" "}
          / ₹{item.amount}
        </Typography>
      </Box>
    </Paper>
  );
}

const BudgetManager = () => {
  const [userId, setUserId] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const history = useNavigate();
  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const [customCategory, setCustomCategory] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuIndex, setMenuIndex] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // Whether drawer is in edit mode
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cardView, setCardViewState] = useState(getViewType());
  // Drawer states
  const [budgets, setBudgets] = useState([]); // Main state
  const [editData, setEditData] = useState({ name: "", category: "", amount: 0 }); // initial empty
  const [aboutDrawerOpen, setAboutDrawerOpen] = useState(false);
  const [selectedBudgetIndex, setSelectedBudgetIndex] = useState(null);
  const { settings } = useSettings();

  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const [ExpdrawerOpen, setExpDrawerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const selectedIndex = parseInt(params.get("index"), 10);
  
const selectedBudget = selectedIndex !== null && !isNaN(selectedIndex)
  ? budgetItems[selectedIndex]
  : null;

  const isOwner = selectedBudget && userId && selectedBudget.contributors?.[0]?.uid === userId;
const expdrawerFlag = params.get("expdrawer") === "true";

  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();

  const accentColor = settings.autoAccent && weather
  ? (weatherColors[weather.main] || weatherColors.Default)
  : (settings.accent === "default" ? "#f9971f" : settings.accent);

const dynamicTheme = createTheme({
  palette: {
    mode: settings.theme,
    primary: {
      main: accentColor,
      contrastText: "#000",
    },
    // ...rest of your palette
  },
  // ...rest of your theme
});

  const buttonWeatherBg =
  weather && weatherColors[weather.main]
    ? weatherColors[weather.main]
    : weatherColors.Default;

  const WeatherBgdrop =
  weather && weatherbgColors[weather.main]
    ? weatherbgColors[weather.main]
    : weatherbgColors.Default;

  useEffect(() => {
  if (!weather) {
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
    }
  }
}, [weather, setWeather]);

  const getContributorRole = (c, idx) => {
    if (idx === 0) return "admin";
   return c.role || "editor";
  };

  const setCardView = (type) => {
    setCardViewState(type);
    setViewType(type); // Save to localStorage/cookie
  };

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    amount: "",
    contributor: "",
    contributors: [],
  });

const [addDrawerOpen, setAddDrawerOpen] = useState(false);
const [newExpense, setNewExpense] = useState({
  amount: "",
  name: "",
  category: "",
  date: new Date().toISOString().slice(0, 10), // default today
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
});
const [addError, setAddError] = useState("");


const totalBudget = selectedBudget?.amount ?? 0;

const totalExpense = selectedBudget?.expenses?.reduce(
  (sum, exp) => sum + Number(exp.amount),
  0
) ?? 0;

const currentBudget = totalBudget - totalExpense;

useEffect(() => {
  if (expdrawerFlag && selectedIndex !== null && !isNaN(selectedIndex)) {
    setExpDrawerOpen(true);
  }
}, [expdrawerFlag, selectedIndex]);

  // On auth state change, save user info in localStorage & cookies as "bunkmateuser"
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const userData = JSON.stringify({ uid: user.uid, email: user.email });
        localStorage.setItem("bunkmateuser", userData);
        setCookie("bunkmateuser", userData, 7);
      } else {
        setUserId(null);
        setBudgetItems([]);
        setError("Please log in to manage your budget.");
        localStorage.removeItem("bunkmateuser");
        setCookie("bunkmateuser", "", -1);
      }
    });
    return () => unsubscribe();
  }, []);



  useEffect(() => {
    if (!userId) {
      const storedUser = localStorage.getItem("bunkmateuser");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.uid) {
            setUserId(parsed.uid);
            setError("");
            return;
          }
        } catch {}
      }
      const cookieUser = getCookie("bunkmateuser");
      if (cookieUser) {
        try {
          const parsed = JSON.parse(cookieUser);
          if (parsed?.uid) {
            setUserId(parsed.uid);
            setError("");
            return;
          }
        } catch {}
      }
      setLoading(false);
      setError("No logged in user found.");
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadBudget = async () => {
      setLoading(true);
      setError("");
      try {
        const docRef = doc(db, "budgets", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBudgetItems(docSnap.data().items || []);
        } else {
          setBudgetItems([]);
        }
      } catch (err) {
        setError("Failed to load budget data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [userId]);

  const saveBudget = async (items) => {
    if (!userId) return;
    setSaving(true);
    setError("");
    try {
      const docRef = doc(db, "budgets", userId);
      await setDoc(docRef, { items }, { merge: true });
      setBudgetItems(items);
    } catch (err) {
      setError("Failed to save budget data.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };



  const handleEditSave = () => {
    if (!editCategory.trim() || !editAmount.trim() || isNaN(Number(editAmount))) {
      setError("Please enter a valid category and numeric amount.");
      return;
    }
    const updatedItems = [...budgetItems];
    updatedItems[editIndex] = {
      ...updatedItems[editIndex],
      category: editCategory.trim(),
      amount: parseFloat(editAmount),
    };
    saveBudget(updatedItems);
    setDialogOpen(false);
    setEditIndex(null);
    setEditCategory("");
    setEditAmount("");
    setError("");
  };


const handleOpenExpDrawer = (index) => {
  setAddDrawerOpen(false);
  setExpDrawerOpen(true);
  // Update the URL query params for index and expdrawer
  const params = new URLSearchParams(window.location.search);
  params.set("index", index);
  params.set("expdrawer", "true");
  window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
};


  // Calculate current balance for selected budget item
  const getCurrentBalance = (item) => {
    const totalExpenses = item.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    return item.amount - totalExpenses;
  };


const handleAddExpense = async () => {
  const amountNum = parseFloat(newExpense.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    setAddError("Enter a valid positive amount.");
    return;
  }

  const updatedItems = [...budgetItems];
  const selected = updatedItems[selectedIndex];

  const expenseData = {
    ...newExpense,
    amount: amountNum,
    date: new Date(`${newExpense.date}T${newExpense.time}`).toISOString(),
  };

  if (!selected.expenses) selected.expenses = [];

  if (isEditMode && editIndex !== null) {
    selected.expenses[editIndex] = expenseData;
  } else {
    selected.expenses.push(expenseData);
  }

  // --- SYNC EXPENSE TO ALL CONTRIBUTORS ---
  if (selected.contributors && Array.isArray(selected.contributors)) {
    for (const c of selected.contributors) {
      if (c.uid) {
        const docRef = doc(db, "budgets", c.uid);
        const docSnap = await getDoc(docRef);
        let userItems = [];
        if (docSnap.exists()) {
          userItems = docSnap.data().items || [];
          // Find the matching budget by name and category
          const idx = userItems.findIndex(
            b => b.name === selected.name && b.category === selected.category
          );
          if (idx !== -1) {
            // Update expenses for this budget
            userItems[idx] = {
              ...userItems[idx],
              expenses: [...selected.expenses],
            };
          } else {
            // If not found, add the whole budget
            userItems.push({ ...selected, expenses: [...selected.expenses] });
          }
        } else {
          userItems = [{ ...selected, expenses: [...selected.expenses] }];
        }
        await setDoc(docRef, { items: userItems }, { merge: true });
      }
    }
  }

  setBudgetItems(updatedItems);

  // Reset form
  setNewExpense({
    amount: "",
    name: "",
    category: "",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  setEditIndex(null);
  setIsEditMode(false);
  setAddError("");
};


const handleEditExpense = (index) => {
  const exp = budgetItems[selectedIndex]?.expenses?.[index];
  if (!exp) return;

  setNewExpense({
    amount: exp.amount,
    name: exp.name || "",
    category: exp.category || "",
    date: exp.date ? exp.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    time: exp.date
      ? new Date(exp.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  setEditIndex(index);
  setIsEditMode(true);
  setAddDrawerOpen(true);
};


const handleDeleteExpense = (index) => {
  const updatedItems = [...budgetItems];
  updatedItems[selectedIndex].expenses.splice(index, 1);
  saveBudget(updatedItems);
};

  const goBack = () => {
    history("/");
  };

  // Extract all unique categories for filter dropdown
  const categories = useMemo(() => {
    const all = budgetItems.map(item => item.category);
    return [...new Set(all)];
  }, [budgetItems]);

// Filtered budget list based on search and selected category
const filteredBudgets = useMemo(() => {
  // Ensure item.name is a string before calling toLowerCase
  const nameMatches = (item) =>
    typeof item.name === "string" &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase());
  const categoryMatches = (item) =>
    selectedCategory ? item.category === selectedCategory : true;

  // Sort by createdAt (newest first)
  return budgetItems
    .filter(item => nameMatches(item) && categoryMatches(item))
    .sort((a, b) => {
      // If createdAt is missing, treat as oldest
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
}, [budgetItems, searchTerm, selectedCategory]);

  const handleMenuOpen = (event, index) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuIndex(index);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuIndex(null);
  };

const handleDelete = (indexToDelete) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this budget?");
  if (confirmDelete) {
    const updatedItems = budgetItems.filter((_, index) => index !== indexToDelete);
    saveBudget(updatedItems);
  }
};

const handleEdit = (index) => {
  const item = budgetItems[index];
  setFormData({
    name: item.name,
    category: item.category,
    amount: item.amount.toString(),
    contributor: "",
    contributors: item.contributors || [],
  });
  setEditIndex(index); // Set current index
  setDrawerOpen(true);
};

const resolveUsernameToUID = async (username) => {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const userDoc = snapshot.docs[0];
    return { username, uid: userDoc.id };
  }
  return null;
};

useEffect(() => {
  if (!userId) return;
  // Listen for changes in this user's budgets
  const docRef = doc(db, "budgets", userId);
  const unsubscribe = getDoc(docRef).then(docSnap => {
    if (docSnap.exists()) {
      setBudgetItems(docSnap.data().items || []);
    }
  });
  return () => {
    if (typeof unsubscribe === "function") unsubscribe();
  };
}, [userId]);

const canEditExpenses = (() => {
  if (!selectedBudget || !userId) return false;
  const userIdx = selectedBudget.contributors?.findIndex(c => c.uid === userId);
  if (userIdx === 0) return true; // owner
  const role = selectedBudget.contributors?.[userIdx]?.role || "editor";
  return role === "admin" || role === "editor";
})();


  return (
    <ThemeProvider theme={theme}>
      <DeviceGuard>
              <BetaAccessGuard>
      <Box
        sx={{
          p: 3,
          color: theme.palette.text.primary,
          minHeight: "100vh",
          maxWidth: 600,
          mx: "auto",
          borderRadius: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 3,
              justifyContent: "space-between"
            }}
          >
            <Button onClick={goBack} sx={{ mr: 2, width: '30px', fontSize: 3, borderRadius: 8, height: '50px', color: theme.palette.text.primary, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0", }}>
              <ArrowBackIcon />
            </Button>
            <ProfilePic />
          </Box>
          <Typography variant="h4" sx={{ mb: 0, fontWeight: "bold" }}>
            Budget Manager
          </Typography>
        </Box>
        <Box 
          display="flex" 
          gap={2} 
          flexWrap="wrap" 
          mb={2} 
          sx={{ 
            position: "sticky", 
            top: 0,
            paddingTop: "25px", 
            zIndex: 1,
            pb: 3,
            background: `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.default}, ${theme.palette.background.default}, ${theme.palette.background.default}, ${theme.palette.background.default}90, ${theme.palette.background.default}00)`,
          }}
        >
          <TextField
            size="small"
            placeholder="Search by name..."
            variant="outlined"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: buttonWeatherBg }} />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 200, backdropFilter: "blur(80px)", }}
          />

          <TextField
            select
            size="small"
            label="Filter by Category"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            sx={{ width: 200, backdropFilter: "blur(80px)" }}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat, i) => (
              <MenuItem key={i} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

                    {/* View Switcher */}

<Box sx={{ display: "flex", alignItems: "center", ml: "auto", gap: 1 }}>
  <IconButton
    aria-label={cardView === "grid" ? "List view" : "Grid view"}
    color="#000"
    onClick={() => setCardView(cardView === "grid" ? "list" : "grid")}
    sx={{
      borderRadius: 1,
      background: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
      transition: "all 0.2s",
      backdropFilter: "blur(80px)",
      p: 1.2,
      // Make it look sunken/submerged always
    }}
  >
    {cardView === "grid" ? (
      <ViewListIcon sx={{ color: theme.palette.text.primary }} />
    ) : (
      <ViewModuleIcon sx={{ color: theme.palette.text.primary }} />
    )}
  </IconButton>
</Box>
</Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
            <CircularProgress color={buttonWeatherBg} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        ) : (
          <>

            {/* Grid Display */}
            {filteredBudgets.length === 0 ? (
              <Typography sx={{ fontStyle: "italic" }}>
                No budget items match your search or filter.
              </Typography>
            ) : cardView === "grid" ? (
<Grid
  container
  spacing={2}
  columns={2}
  sx={{
    width: "100%",
    margin: 0,
  }}
>
          {filteredBudgets.map((item, idx) => {
            const itemIndex = budgetItems.findIndex(
              (b) => b.name === item.name && b.category === item.category
            );
            return (
              <BudgetGridCard
                key={itemIndex}
                item={item}
                itemIndex={itemIndex}
                handleMenuOpen={handleMenuOpen}
                history={history}
                getCurrentBalance={getCurrentBalance}
                CATEGORY_ICONS={CATEGORY_ICONS}
                buttonWeatherBg={buttonWeatherBg}
              />
            );
          })}
          {/* If odd number of cards, add an empty card to complete the row */}
          {filteredBudgets.length % 2 === 1 && (
            <Grid item xs={1} sx={{ display: "flex", flex: 1, minWidth: 0 }}>
              <Box sx={{ width: "100%", minWidth: 0, background: "transparent" }} />
            </Grid>
          )}
        </Grid>
      ) : (
        <Stack spacing={2} width={"77vw"} sx={{ mt: 2 }}>
          {filteredBudgets.map((item, idx) => {
            const itemIndex = budgetItems.findIndex(
              (b) => b.name === item.name && b.category === item.category
            );
            return (
              <BudgetListCard
                key={itemIndex}
                item={item}
                itemIndex={itemIndex}
                handleMenuOpen={handleMenuOpen}
                history={history}
                getCurrentBalance={getCurrentBalance}
                CATEGORY_ICONS={CATEGORY_ICONS}
                buttonWeatherBg={buttonWeatherBg}
              />
            );
          })}
        </Stack>
      )}

            {/* Shared Menu Component */}
            <Menu
              sx={{ padding: "14px" }}
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              onClick={(e) => e.stopPropagation()} // Prevent triggering card click
            >
              <MenuItem
                sx={{ borderRadius: 0.5, mx: 1, my: 0, pl: 0, display: "flex", alignItems: "center" }}
                onClick={() => {
                  handleEdit(menuIndex);
                  handleMenuClose();
                }}
              >
                <IconButton size="small" sx={{ color: "#fff", pr: 1, pl: "-10px" }}>
                  <EditOutlinedIcon />
                </IconButton>
                Edit
              </MenuItem>
              <MenuItem
                sx={{ color: "#f44336", backgroundColor: "#ff000019", borderRadius: 0.5, m: 1, my: 0, pl: 0, display: "flex", alignItems: "center" }}
                onClick={() => {
                  handleDelete(menuIndex);
                  handleMenuClose();
                }}
              >
                <IconButton size="small" sx={{ color: "#f44336", pr: 1, pl: "-40px" }}>
                  <DeleteOutlineIcon />
                </IconButton>
                Delete
              </MenuItem>
            </Menu>

            {/* Edit Dialog */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
              <DialogTitle>Edit Budget Item</DialogTitle>
              <DialogContent sx={{ pt: 1 }}>
                <TextField
                  label="Category"
                  fullWidth
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ style: { color: "#00ff00" } }}
                  variant="outlined"
                />
                <TextField
                  label="Amount"
                  fullWidth
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  InputProps={{ style: { color: "#00ff00" } }}
                  variant="outlined"
                />
                {error && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    {error}
                  </Typography>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button variant="contained" color="success" onClick={handleEditSave}>
                  Save
                </Button>
              </DialogActions>
            </Dialog>

            {/* Expense Drawer */}
            {ExpdrawerOpen && selectedIndex !== null && (
              <>
                <Box
                  sx={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    height: "100vh",
                    bgcolor: "#f1f1f100",
                    backdropFilter: "blur(80px)",
                    p: 3,
                    pr: 0,
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 999,
                    overflowY: "auto",
                  }}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="expense-drawer-title"
                >
                  <Box sx={{ display: "flex", flexDirection: "column", mb: 2, ml: 4, gap: 3 }}>
<Button
  onClick={() => {
    setExpDrawerOpen(false);
    // Remove 'index' and 'expdrawer' from URL query params
    const params = new URLSearchParams(window.location.search);
    params.delete("index");
    params.delete("expdrawer");

    // Construct the new URL – omit ? if no params remain
    const newSearch = params.toString();
    const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;

    // Replace the current history state without reloading the page
    window.history.replaceState({}, "", newUrl);
  }}
  sx={{
    mr: 2,
    width: "30px",
    fontSize: 3,
    borderRadius: 2,
    height: "50px",
    color: "#fff",
    backgroundColor: "#f1f1f111",
  }}
>
  <ArrowBackIcon />
</Button>


                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                    <Typography variant="h4" sx={{ color: "#fff", fontWeight: "bold" }}>
                      {selectedBudget?.name || "Unnamed Budget"}
                    </Typography>
                      <Tooltip title="About this budget">
                        <IconButton
                          size="small"
                          sx={{ color: "#fff" }}
                          onClick={() => setAboutDrawerOpen(true)}
                        >
                          <InfoOutlinedIcon />
                        </IconButton>
                      </Tooltip>
                  </Box>
                  </Box>

                  {/* Main Budget Overview Section */}
                  <Box sx={{ p: 2, width: "92vw" }}>
                    {selectedBudget ? (
                      <Box sx={{ p: 2 }}>
                        {/* Current Budget Left Section */}
                        <Card sx={{ mb: 2, p: 2, backgroundColor: "#b4ffa621", color: "#c2ffca", borderRadius: 2, border: "none", boxShadow: "none" }}>
                          <Typography variant="title" color="#a2cba7">
                            Current Budget Left
                          </Typography>
                          <Typography variant="h4">
                            ₹{currentBudget.toFixed(2)}
                          </Typography>
                        </Card>
                        {/* Row: Total Expense & Total Budget */}
                        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                          <Card sx={{ flex: 1, p: 2, backgroundColor: "#ff000019", color: "#ffd2d2", borderRadius: 2, border: "none", boxShadow: "none" }}>
                            <Typography variant="title">Total Expenses</Typography>
                            <Typography variant="h6">₹{totalExpense.toFixed(2)}</Typography>
                          </Card>
                          {selectedBudget && (
                            <Card sx={{ p: 2, backgroundColor: "#f1f1f111", color: "#fff", borderRadius: 2, border: "none", boxShadow: "none" }}>
                              <Typography variant="title" color="#d1d1d1">
                                Current Budget
                              </Typography>
                              <Typography variant="h4">
                                ₹{selectedBudget.amount.toFixed(2)}
                              </Typography>
                            </Card>
                          )}
                        </Box>

  {selectedBudget?.contributors?.length > 0 && (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
        {selectedBudget.contributors.map((c, i) => (
          <Chip
            key={i}
            label={
              typeof c === "object" && c !== null
                ? (c.username || c.uid || JSON.stringify(c))
                : c
            }
            size="small"
            variant="outlined"
            sx={{
              fontSize: "0.8rem",
              borderRadius: '10px',
              borderColor: buttonWeatherBg,
              color: 'text.secondary',
              mb: 0.5,
              backgroundColor: "#222",
            }}
          />
        ))}
      </Stack>
      <Typography variant="caption" sx={{ color: "#aaa", mt: 0.5 }}>
        {selectedBudget.contributors.length} contributor{selectedBudget.contributors.length > 1 ? "s" : ""}
      </Typography>
    </>
  )}
        
                        <Typography variant="h5" sx={{ mt: 4, mb: 1, color: "#fff" }}>
                          Existing Expenses
                        </Typography>
{selectedBudget?.expenses?.length > 0 ? (
  selectedBudget.expenses.map((expense, expIndex) => (
    <Box
      key={expIndex}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1,
        p: 1,
        border: "1px solid #333",
        borderRadius: 2,
        color: "#fff",
      }}
    >
      <Box sx={{ pl: 2, pr: 2 }}>
        <Typography variant="body1" sx={{ color: "#fff" }}>₹{expense.amount}</Typography>
        <Typography variant="caption" sx={{ color: "#999" }}>
          <strong color="#fff">{expense.name || "Unnamed"}</strong> | {expense.category || "No Category"} <br />
          {new Date(expense.date).toLocaleDateString()}{" "}
          {new Date(expense.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <IconButton
          size="small"
          onClick={() => canEditExpenses && handleEditExpense(expIndex)}
          sx={{ 
            color: "#fff", 
            backgroundColor: "#f1f1f111", 
            p: 1.2,
            display: canEditExpenses ? "flex" : "none"
          }}
          disabled={!canEditExpenses}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => canEditExpenses && handleDeleteExpense(expIndex)}
          sx={{ 
            color: "#ff0000", 
            backgroundColor: "#ff000011", 
            p: 1.2,
            display: canEditExpenses ? "flex" : "none"
          }}
          disabled={!canEditExpenses}
        >
          <DeleteOutlineIcon />
        </IconButton>
      </Box>
    </Box>
  ))
) : (
  <Typography variant="body2" sx={{ color: "#888" }}>
    No expenses recorded for this budget.
  </Typography>
)}


                      </Box>
                    ) : (
                      <Typography sx={{ color: "#ccc", textAlign: "center", mt: 4 }}>
                        Please select a budget to view details.
                      </Typography>
                    )}

<Grid
  justifyContent={"right"}
  container
  sx={{
    position: "sticky",
    bottom: 20,
    right: 20,
  }}
>
<Fab
  color="success"
  sx={{
    mb: 2.5,
    mr: 0.5,
    width: '70px',
    height: '70px',
    bgcolor: buttonWeatherBg,
    borderRadius: '15px',
    fontSize: '38px',
    color: '#000',
    zIndex: 1000,
    '&:hover': { bgcolor: buttonWeatherBg },
    opacity: canEditExpenses ? 1 : 0.5,
    display: canEditExpenses ? 'flex' : 'none',
    pointerEvents: canEditExpenses ? "auto" : "none"
  }}
  onClick={() => canEditExpenses && setAddDrawerOpen(true)}
  aria-label="Add Expense"
>
  <AddIcon />
</Fab>
</Grid>
                  </Box>
                </Box>


                <SwipeableDrawer
  anchor="right"
  open={aboutDrawerOpen}
  onClose={() => setAboutDrawerOpen(false)}
  PaperProps={{
    sx: {
      backgroundColor: "#00000000",
      backdropFilter: "blur(80px)",
      color: "#fff",
      p: 3,
      width: "90vw"
    },
  }}
>
  <Box sx={{ p: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
      <Button onClick={() => setAboutDrawerOpen(false)} sx={{ mr: 2, width: '30px', fontSize: 3, borderRadius: 2, height: '50px', color: "#fff", backgroundColor: "#f1f1f111", }}>
        <ArrowBackIcon />
      </Button>
    <Typography variant="h5" fontWeight="bold">
      Budget Info
    </Typography>
    </Box>
    <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
       {selectedBudget?.name}
    </Typography>
    <Typography variant="body1" sx={{ mb: 1 }}>
      <strong>Created By:</strong> @{selectedBudget?.contributors?.[0]?.username || "Unknown"}
    </Typography>
    <Typography variant="body1" sx={{ mb: 1 }}>
      <strong>Contributors:</strong>
    </Typography>
    <Stack spacing={1} sx={{ mb: 2 }}>
      {selectedBudget?.contributors?.map((c, idx) => (
        <Box
          key={c.uid || c.username || idx}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f1f1f111",
            borderRadius: 2,
            px: 2,
            py: 1,
          }}
        >
          <Typography>
            {c.username || c.uid || "Unknown"}
            <span style={{
              fontSize: "0.8em",
              backgroundColor: "#333",
              borderRadius: "5px",
              padding: "2px 4px",
              color: "#aaa",
              marginLeft: 8,
              textTransform: "capitalize",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}>
              {getContributorRole(c, idx)}
            </span>
          </Typography>
          {isOwner && idx !== 0 && (
            <TextField
              select
              size="small"
              value={getContributorRole(c, idx)}
              onChange={e => {
                // Update role for this contributor
                const updated = [...selectedBudget.contributors];
                updated[idx] = { ...updated[idx], role: e.target.value };
                // Save to Firestore for all contributors
                for (const user of updated) {
                  if (user.uid) {
                    const docRef = doc(db, "budgets", user.uid);
                    getDoc(docRef).then(docSnap => {
                      let userItems = [];
                      if (docSnap.exists()) {
                        userItems = docSnap.data().items || [];
                        const bIdx = userItems.findIndex(
                          b => b.name === selectedBudget.name && b.category === selectedBudget.category
                        );
                        if (bIdx !== -1) {
                          userItems[bIdx] = { ...userItems[bIdx], contributors: updated };
                          setDoc(docRef, { items: userItems }, { merge: true });
                        }
                      }
                    });
                  }
                }
                // Update local state
                const updatedItems = [...budgetItems];
                updatedItems[selectedIndex].contributors = updated;
                setBudgetItems(updatedItems);
              }}
              sx={{ minWidth: 90, ml: 1, background: "#111", borderRadius: 1, position: "absolute", right: 40 }}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="viewer">Viewer</MenuItem>
            </TextField>
          )}
        </Box>
      ))}
    </Stack>
    <Typography variant="caption" sx={{ color: "#aaa" }}>
      Only the owner (admin) can manage contributor roles and permissions.
    </Typography>
  </Box>
                </SwipeableDrawer>
              </>
            )}

            

            <AnimatePresence>
              {addDrawerOpen && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    width: "100%",
                    zIndex: 1100,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#0c0c0c10",
                      backdropFilter: "blur(180px)",
                      p: 3,
                      mx: "auto",
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <Typography variant="h6" sx={{ color: "#fff", fontWeight: "bold" }}>
                        Add New Expense
                      </Typography>
                      <ButtonBase
                        onClick={() => setAddDrawerOpen(false)}
                        sx={{ color: "#fff", backgroundColor: "f1f1f111", fontSize: 24, p: 1 }}
                      >
                        &times;
                      </ButtonBase>
                    </Box>
                    {/* Your Input Fields Here */}
                    <TextField
                      label="Amount"
                      type="number"
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2, color: "#fff", borderRadius: 2, border: "2px solid #f1f1f111" }}
                      value={newExpense.amount}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: e.target.value })
                      }
                      InputLabelProps={{ style: { color: "#fff" } }}
                      InputProps={{ style: { color: "#fff" } }}
                    />
                    <TextField
                      label="Name"
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2, borderRadius: 2, border: "2px solid #f1f1f111" }}
                      value={newExpense.name}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, name: e.target.value })
                      }
                      InputLabelProps={{ style: { color: "#fff" } }}
                      InputProps={{ style: { color: "#fff" } }}
                    />
<TextField
  select
  label="Category"
  value={newExpense.category}
  onChange={(e) => {
    if (e.target.value === "__custom__") {
      setNewExpense({ ...newExpense, category: "" });
    } else {
      setNewExpense({ ...newExpense, category: e.target.value });
      setCustomCategory("");
    }
  }}
  fullWidth
  variant="outlined"
  size="small"
  sx={{ mb: newExpense.category === "" ? 0 : 2, borderRadius: 2, border: "2px solid #f1f1f111" }}
  InputLabelProps={{ style: { color: "#fff" } }}
  InputProps={{ style: { color: "#fff" } }}
>
  {EXP_PREDEFINED_CATEGORIES.map((cat) => (
    <MenuItem key={cat} value={cat}>
      <span style={{ marginRight: 8, display: "inline-flex", alignItems: "center" }}>
        {CATEGORY_ICONS[cat]?.icon || <CategoryOutlinedIcon />}
      </span>
      {cat}
    </MenuItem>
  ))}
</TextField>
                    <TextField
                      label="Date"
                      type="date"
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2, borderRadius: 2, border: "2px solid #f1f1f111" }}
                      value={newExpense.date}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, date: e.target.value })
                      }
                      InputLabelProps={{ shrink: true, style: { color: "#fff" } }}
                      InputProps={{ style: { color: "#00ff00" } }}
                    />
                    <TextField
                      label="Time"
                      type="time"
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ mb: 2, borderRadius: 2, border: "2px solid #f1f1f111" }}
                      value={newExpense.time}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, time: e.target.value })
                      }
                      InputLabelProps={{ shrink: true, style: { color: "#fff" } }}
                      InputProps={{ style: { color: "#00ff00" } }}
                    />
                    {addError && (
                      <Typography sx={{ color: "#ff4444", mb: 2 }}>{addError}</Typography>
                    )}
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      sx={{ color: "#000", backgroundColor: buttonWeatherBg, mb: 2, p: 1, borderRadius: 20 }}
                      onClick={() => {
                        handleAddExpense();
                        setAddDrawerOpen(false);
                      }}
                    >
                      Add Expense
                    </Button>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {saving && (
          <Box
            sx={{
              position: "fixed",
              top: 16,
              right: 16,
              backgroundColor: WeatherBgdrop,
              borderRadius: 4,
              px: 2,
              py: 2,
              color: buttonWeatherBg,
              fontWeight: "bold",
              userSelect: "none",
            }}
          >
            Saving...
          </Box>
        )}



        <Drawer
          anchor="bottom"
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setFormData({ name: "", category: "", amount: "", contributor: "", contributors: [] });
          }}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              backgroundColor: "#00000000",
              backdropFilter: "blur(180px)",
              padding: 3,
            },
          }}
        >
          <Typography variant="h6" gutterBottom>
            Add New Budget
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Budget Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: "#fff" } }}
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
            <TextField
  select
  label="Category"
  value={formData.category}
  onChange={(e) => {
    if (e.target.value === "__custom__") {
      setFormData({ ...formData, category: "" });
    } else {
      setFormData({ ...formData, category: e.target.value });
      setCustomCategory("");
    }
  }}
  fullWidth
  variant="outlined"
  InputProps={{ style: { color: "#fff" } }}
  InputLabelProps={{ style: { color: "#aaa" } }}
  sx={{ mb: customCategory ? 0 : 2 }}
>
  {PREDEFINED_CATEGORIES.map((cat) => (
    <MenuItem key={cat} value={cat}>
      <span style={{ marginRight: 8, display: "inline-flex", alignItems: "center" }}>
        {CATEGORY_ICONS[cat]?.icon || <CategoryOutlinedIcon />}
      </span>
      {cat}
    </MenuItem>
  ))}
</TextField>

            <TextField
              label="Amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              type="number"
              variant="outlined"
              InputProps={{ style: { color: "#fff" } }}
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
<TextField
  label="Add Contributor"
  value={formData.contributor}
  onChange={(e) =>
    setFormData({ ...formData, contributor: e.target.value })
  }
  onKeyDown={async (e) => {
    if (e.key === "Enter" && formData.contributor.trim()) {
      const contributor = await resolveUsernameToUID(formData.contributor.trim());
      if (contributor) {
        // Prevent duplicates
        if (!formData.contributors.some(c => c.uid === contributor.uid)) {
          setFormData({
            ...formData,
            contributors: [...formData.contributors, contributor],
            contributor: "",
          });
        } else {
          setFormData({ ...formData, contributor: "" });
        }
      } else {
        alert("Username not found!");
      }
    }
  }}
  fullWidth
  variant="outlined"
  InputProps={{ style: { color: "#fff" } }}
  InputLabelProps={{ style: { color: "#aaa" } }}
/>
<Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
  {formData.contributors.map((c, i) => (
    <Chip
      key={i}
      label={typeof c === "object" && c !== null ? (c.username || c.uid || JSON.stringify(c)) : c}
      size="small"
      variant="outlined"
      sx={{
        fontSize: "0.7rem",
        borderRadius: '10px',
        borderColor: buttonWeatherBg,
        color: 'text.secondary',
      }}
      onDelete={() => {
        setFormData({
          ...formData,
          contributors: formData.contributors.filter((_, idx) => idx !== i),
        });
      }}
    />
  ))}
</Stack>


<Button
  variant="contained"
  color="success"
  sx={{
    backgroundColor: buttonWeatherBg,
    borderRadius: 4,
    px: 2,
    py: 2,
    color: "#000",
    fontWeight: "bold",
  }}
  onClick={async () => {
    const { name, category, amount, contributors } = formData;
    if (!name || !category || isNaN(Number(amount))) return;
    // Add current user as contributor if not already
    const auth = getAuth();
    const user = auth.currentUser;
    let allContributors = [...contributors];
    if (user && !allContributors.some(c => c.uid === user.uid)) {
      allContributors.push({ uid: user.uid, username: user.email });
    }
    const now = new Date();
    const updatedItem = {
      name,
      category,
      amount: parseFloat(amount),
      contributors: allContributors,
      expenses: editIndex !== null ? budgetItems[editIndex]?.expenses || [] : [],
      createdAt: editIndex !== null
        ? (budgetItems[editIndex]?.createdAt || now)
        : now, // <-- Add createdAt field
    };
    let updatedItems = [...budgetItems];
    if (editIndex !== null) {
      // Edit mode: replace item at editIndex
      updatedItems[editIndex] = updatedItem;
    } else {
      // Add mode: push new item
      updatedItems.push({ ...updatedItem, expenses: [] });
    }
    // --- SYNC TO ALL CONTRIBUTORS ---
    // Save to each contributor's budgets collection
    for (const c of allContributors) {
      if (c.uid) {
        const docRef = doc(db, "budgets", c.uid);
        // Merge with existing items for that user
        const docSnap = await getDoc(docRef);
        let userItems = [];
        if (docSnap.exists()) {
          userItems = docSnap.data().items || [];
          // If editing, replace; if adding, push if not exists
          const idx = userItems.findIndex(
            b => b.name === updatedItem.name && b.category === updatedItem.category
          );
          if (idx !== -1) {
            userItems[idx] = updatedItem;
          } else {
            userItems.push(updatedItem);
          }
        } else {
          userItems = [updatedItem];
        }
        await setDoc(docRef, { items: userItems }, { merge: true });
      }
    }
    setBudgetItems(updatedItems);
    setDrawerOpen(false);
    setEditIndex(null); // reset edit mode
    setFormData({ name: "", category: "", amount: "", contributor: "", contributors: [] });
  }}
>
  Save Budget
</Button>
          </Stack>
        </Drawer>
      </Box>
<Grid
  justifyContent={"right"}
  container
  sx={{
    position: "sticky",
    bottom: 20,
    right: 20,
    mr: 1.5,
    mt: 2
  }}
>
        <Fab
          color="success"
          onClick={() => setDrawerOpen(true)}
          sx={{
            width: '70px',
            height: '70px',
            bgcolor: buttonWeatherBg,
            borderRadius: '15px',
            fontSize: '38px',
            color: '#000',
            zIndex: 998,
            '&:hover': { bgcolor: '#00f721' }
          }}
        >
          <AddIcon />
        </Fab>
</Grid>      
      </BetaAccessGuard>
      </DeviceGuard>
    </ThemeProvider>
  );
};

export default BudgetManager;
