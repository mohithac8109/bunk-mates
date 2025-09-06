import React, { useRef, useState } from "react";
import {
  AppBar, Toolbar, Typography, Container, Box, Grid, Card, CardContent,
  CircularProgress, ThemeProvider, Button, useTheme, useMediaQuery, Fab, Zoom
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useWeather } from "../contexts/WeatherContext"; // Optional, can remove if not needed
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import ProfilePic from "../components/Profile";
import Reminders from "./Reminders";
import packageJson from '../../package.json';

// Icons
import StickyNote2OutlinedIcon from '@mui/icons-material/StickyNote2Outlined';
import AlarmOutlinedIcon from '@mui/icons-material/AlarmOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const DASHBOARD_TILES = [
  { label: "Notes", icon: <StickyNote2OutlinedIcon />, path: "/notes" },
  { label: "Reminders", icon: <AlarmOutlinedIcon /> },
  { label: "Trips", icon: <ExploreOutlinedIcon />, path: "/trips" },
  { label: "Budgets", icon: <AccountBalanceWalletOutlinedIcon />, path: "/budget-mngr" },
];

const Homepage = () => {
  const navigate = useNavigate();
  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const muiTheme = useTheme();
  const isSmallScreen = useMediaQuery(muiTheme.breakpoints.down("md"));
  const remindersRef = useRef();

  // Dummy user
  const [user] = useState({ uid: "dummyUser123", displayName: "John Doe" });
  const [userType] = useState("Traveler");

  // Dummy data instead of Firebase
  const [budgets] = useState([
    { id: "b1", name: "Goa Trip Budget", amount: 12000 },
    { id: "b2", name: "College Expenses", amount: 5000 },
  ]);
  const [reminders] = useState([
    { id: "r1", text: "Pack clothes", completed: false },
    { id: "r2", text: "Book tickets", completed: false },
  ]);
  const [myTrips] = useState([
    { id: "t1", name: "Goa Trip", from: "Jaipur", location: "Goa" },
    { id: "t2", name: "Manali Trek", from: "Delhi", location: "Manali" },
  ]);

  const handleTileClick = (tile) => {
    if (tile.path) return navigate(tile.path);
    if (tile.label === "Reminders") {
      remindersRef.current?.openAddReminderDrawer?.();
    }
  };

  const DASH_SECTIONS = [
    {
      label: "Your Trips", items: myTrips,
      emptyMsg: "No trips found.", onViewMore: () => navigate("/trips"),
      render: trip => (
        <Card key={trip.id} sx={{ my: 1, p: 1 }}>
          <Typography variant="subtitle1">{trip.name}</Typography>
          <Typography variant="caption">{trip.from} → {trip.location}</Typography>
        </Card>
      )
    },
    {
      label: "Your Budgets", items: budgets,
      emptyMsg: "No budgets found.", onViewMore: () => navigate("/budget-mngr"),
      render: budget => (
        <Card key={budget.id} sx={{ my: 1, p: 1 }}>
          <Typography variant="subtitle1">{budget.name}</Typography>
          <Typography variant="caption">₹{budget.amount}</Typography>
        </Card>
      )
    },
    {
      label: "Reminders", items: reminders.filter(r => !r.completed),
      emptyMsg: "No reminders yet.", onViewMore: () => remindersRef.current?.openAddReminderDrawer?.(),
      render: reminder => (
        <Card key={reminder.id} sx={{ my: 1, p: 1 }}>
          <Typography variant="body2">{reminder.text}</Typography>
        </Card>
      )
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <Typography variant="h6">
            BunkMates {userType && <span style={{ fontSize: 14, background: "#eee", marginLeft: 8 }}>{userType}</span>}
          </Typography>
          <ProfilePic />
        </Toolbar>
      </AppBar>
      <Box height={77} />
      <Container maxWidth="lg" sx={{ pt: 2 }}>
        {/* Tiles Grid */}
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
        {/* Sections */}
        <Grid container spacing={2} sx={{ mt: 3 }}>
          {DASH_SECTIONS.map(section => (
            <Grid item xs={12} md={4} key={section.label}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="h6">{section.label}</Typography>
                    <Button size="small" onClick={section.onViewMore}>
                      View More <ChevronRightIcon />
                    </Button>
                  </Box>
                  {section.items.length === 0
                    ? <Typography>{section.emptyMsg}</Typography>
                    : section.items.slice(0, 3).map(section.render)}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Floating Chat Icon for small screens */}
      {isSmallScreen && <Zoom in>
        <Fab color="primary" sx={{ position: 'fixed', bottom: 30, right: 30 }} onClick={() => navigate("/chats")}>
          <ChatBubbleOutlineIcon />
        </Fab>
      </Zoom>}

      {/* Dummy Reminders Drawer */}
      <Reminders ref={remindersRef} open={false} onClose={() => {}} asDrawer />

      <Box textAlign="center" mt={4} opacity={0.5}>
        <Typography variant="caption">BunkMate v{packageJson.version} — Dummy Mode</Typography>
      </Box>
    </ThemeProvider>
  );
};

export default Homepage;
