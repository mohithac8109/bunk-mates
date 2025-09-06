import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AppBar, Toolbar, Typography, Container, Box, Grid, Card, CardContent, CircularProgress,
  ThemeProvider, Button, LinearProgress, AvatarGroup, Avatar, Tooltip, useTheme, useMediaQuery, Fab, Zoom
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, orderBy, getDocs, doc, onSnapshot, where, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useWeather } from "../contexts/WeatherContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import ProfilePic from "../components/Profile";
import Sidebar from "../components/Sidebar";
import Reminders from "./Reminders";
import packageJson from '../../package.json';
// Icon imports...
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import AlarmOutlinedIcon from '@mui/icons-material/AlarmOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Configuration for tiles: you can extend this!
const DASHBOARD_TILES = [
  { label: "Notes", icon: <StickyNote2OutlinedIcon />, path: "/notes" },
  { label: "Reminders", icon: <AlarmOutlinedIcon />, onClick: (openDrawer) => openDrawer() },
  { label: "Trips", icon: <ExploreOutlinedIcon />, path: "/trips" },
  { label: "Budgets", icon: <AccountBalanceWalletOutlinedIcon />, path: "/budget-mngr" },
];

function useAuthUser(setUser, setUserData, setUserType, setLoading, setNotLoggedIn) {
  // Auth logic extracted for clarity
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setNotLoggedIn(true);
        setLoading(false);
        return;
      }
      setUser(firebaseUser);
      setNotLoggedIn(false);
      setLoading(true);
      // Firestore realtime user profile
      const userDocRef = doc(db, "users", firebaseUser.uid);
      return onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
          setUserType(docSnap.data().type || "");
        }
        setLoading(false);
      });
    });
    return () => unsubscribe();
  }, []);
}

// Generic list fetchers can be created for budgets, reminders, etc.

const HomeAlternative = () => {
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));
  const remindersRef = useRef();

  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [userType, setUserType] = useState("");
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  // Custom auth hook
  useAuthUser(setUser, setUserData, setUserType, setLoading, setNotLoggedIn);

  // Weather, Budgets/Reminders/Trips: You can use your context/hooks here as in original code
  const { weather, weatherLoading } = useWeather();
  const [budgets, setBudgets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [myTrips, setMyTrips] = useState([]);

  // Simpler fetchers for brevity:
  useEffect(() => {
    // Budgets fetch
    if (!user?.uid) return setBudgets([]);
    const budgetsDocRef = doc(db, "budgets", user.uid);
    return onSnapshot(budgetsDocRef, (docSnap) => {
      setBudgets(docSnap.exists() ? docSnap.data().items || [] : []);
    });
  }, [user]);

  useEffect(() => {
    // Reminders fetch
    if (!user?.uid) return setReminders([]);
    const q = query(collection(db, "reminders"), where("uid", "==", user.uid), orderBy("createdAt", "desc"));
    getDocs(q).then(qs => {
      const data = [];
      qs.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      setReminders(data);
    });
  }, [user]);

  useEffect(() => {
    // My Trips fetch
    if (!user?.uid) return setMyTrips([]);
    const tripsQuery = query(collection(db, "trips"), where("members", "array-contains", user.uid));
    return onSnapshot(tripsQuery, qs => {
      const trips = [];
      qs.forEach(doc => trips.push({ id: doc.id, ...doc.data() }));
      setMyTrips(trips);
    });
  }, [user]);

  // Loopable tile logic
  const handleTileClick = (tile) => {
    if (tile.path) return navigate(tile.path);
    if (tile.onClick) return tile.onClick(() => remindersRef.current?.openAddReminderDrawer());
  };

  // Dashboard section configuration - extendable and loopable!
  const DASH_SECTIONS = [
    {
      label: "Your Trips", items: myTrips, loading,
      emptyMsg: "No trips found.", onViewMore: () => navigate("/trips"),
      render: trip => (
        <Card key={trip.id} sx={{ my: 1, p: 1 }}>
          <Typography variant="subtitle1">{trip.name || "Unnamed Trip"}</Typography>
          <Typography variant="caption">{trip.from} → {trip.location}</Typography>
        </Card>
      )
    },
    {
      label: "Your Budgets", items: budgets, loading,
      emptyMsg: "No budgets found.", onViewMore: () => navigate("/budget-mngr"),
      render: budget => (
        <Card key={budget.id} sx={{ my: 1, p: 1 }}>
          <Typography variant="subtitle1">{budget.name || "Untitled"}</Typography>
          <Typography variant="caption">₹{budget.amount || 0}</Typography>
        </Card>
      )
    },
    {
      label: "Reminders", items: reminders.filter(r => !r.completed), loading,
      emptyMsg: "No reminders yet.", onViewMore: () => remindersRef.current?.openAddReminderDrawer(),
      render: reminder => (
        <Card key={reminder.id} sx={{ my: 1, p: 1 }}>
          <Typography variant="body2">{reminder.text}</Typography>
        </Card>
      )
    },
  ];

  if (!user && loading) {
    return <Box display="flex" minHeight="100vh" alignItems="center" justifyContent="center"><CircularProgress /></Box>;
  }
  if (notLoggedIn) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="fixed" elevation={0}><Toolbar>
        <Typography variant="h6">BunkMate 🏖️ {userType && <span style={{ fontSize: 14, background: "#eee" }}>{userType}</span>}</Typography>
        <ProfilePic />
      </Toolbar></AppBar>
      <Box height={77} />
      <Container maxWidth="lg" sx={{ pt: 2 }}>
        {/* Tiles Grid Loop */}
        <Grid container spacing={2}>
          {DASHBOARD_TILES.map(tile => (
            <Grid item xs={3} key={tile.label}>
              <Card
                onClick={() => handleTileClick(tile)}
                sx={{ textAlign: "center", p: 2, cursor: "pointer" }}
              >
                <Box mb={1}>{tile.icon}</Box>
                <Typography variant="subtitle2">{tile.label}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
        {/* Content Sections Loop */}
        <Grid container spacing={2} sx={{ mt: 3 }}>
          {DASH_SECTIONS.map(section => (
            <Grid item xs={12} md={4} key={section.label}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="h6">{section.label}</Typography>
                    <Button size="small" onClick={section.onViewMore}>View More <ChevronRightIcon /></Button>
                  </Box>
                  {section.loading ? <CircularProgress size={24} /> :
                    section.items.length === 0 ? <Typography>{section.emptyMsg}</Typography> :
                      section.items.slice(0, 3).map(section.render)}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
      {/* Responsive float chat */}
      {isSmallScreen && <Zoom in>
        <Fab color="primary" sx={{ position: 'fixed', bottom: 30, right: 30 }} onClick={() => navigate("/chats")}>
          <ChatBubbleOutlineIcon />
        </Fab>
      </Zoom>}
      <Reminders ref={remindersRef} open={false} onClose={() => {}} asDrawer />
      <Box textAlign="center" mt={4} opacity={0.5}>
        <Typography variant="caption">BunkMate v{packageJson.version} — Made with ❤️</Typography>
      </Box>
    </ThemeProvider>
  );
};

export default HomeAlternative;
