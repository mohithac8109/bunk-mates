import React, { useState, useEffect, useImperativeHandle, forwardRef, useMemo, useRef } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Fab,
  Drawer,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Tooltip,
  ThemeProvider,
  createTheme,
  keyframes,
  InputAdornment,
  Container,
  Collapse,
  SwipeableDrawer,
  ExpandMore as ExpandMoreIcon,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMore from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { useWeather } from "../contexts/WeatherContext";
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import { db, messaging } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";

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

// Custom dark theme (swap for light if needed)
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#18191A",
      paper: "#232526",
    },
    primary: {
      main: "#00f721",
      contrastText: "#000",
    },
    secondary: {
      main: "#444444ea",
    },
    text: {
      primary: "#fff",
      secondary: "#BDBDBD",
      disabled: "#f0f0f0",
    },
    action: {
      hover: "#00f721",
      selected: "#131313",
      disabledBackground: "rgba(0,155,89,0.16)",
      disabled: "#BDBDBD",
    },
    divider: "rgb(24, 24, 24)",
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#232526",
          color: "#fff",
          boxShadow: "none",
          borderRadius: 16,
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
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          backgroundColor: "#00f721",
          color: "#000",
          "&:hover": {
            backgroundColor: "#00f721",
            color: "#000",
          },
        },
      },
    },
  },
});

function getUserFromStorage() {
  try {
    const storedUser = localStorage.getItem("bunkmateuser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.uid) return parsed;
    }
    const cookieUser = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bunkmateuser="))
      ?.split("=")[1];
    if (cookieUser) {
      const parsed = JSON.parse(decodeURIComponent(cookieUser));
      if (parsed?.uid) return parsed;
    }
  } catch {}
  return null;
}

// Helper to request notification permission and get FCM token
async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, { vapidKey: "BA3kLicUjBzLvrGk71laA_pRVYsf6LsGczyAzF-NTBWEmOE3r4_OT9YiVt_Mvzqm7dZCoPnht84wfX-WRzlaSLs" });
      console.log("FCM Token:", token);
      return token;
    }
  } catch (err) {
    console.error("Notification permission error:", err);
  }
  return null;
}

// Helper to show a local notification
function showLocalNotification(title, options) {
  if (Notification.permission === "granted") {
    if (document.hasFocus()) {
      new Notification(title, options);
    } else if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    }
  }
}

function getTodayStr() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

const Reminders = forwardRef(({ open, onClose }, ref) => {
  const [reminders, setReminders] = useState([]);
  const [reminderText, setReminderText] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editReminder, setEditReminder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuIndex, setMenuIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [notifAllowed, setNotifAllowed] = useState(Notification.permission === "granted");
  const [reminderDate, setReminderDate] = useState("");
  const [notifiedIds, setNotifiedIds] = useState({});
  const [completedOpen, setCompletedOpen] = useState(false);
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  

  // Drag-to-close
  const dragStartY = useRef(null);
  const dragDeltaY = useRef(0);
  const [drawerTranslate, setDrawerTranslate] = useState(0);
  const handleRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

useImperativeHandle(ref, () => ({
  openAddReminderDrawer: () => setDrawerOpen(true),
  markReminderComplete: async (reminderId) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder && !reminder.completed) {
      await handleToggleComplete(reminder);
    }
  }
}));


  const handleToggleComplete = async (reminder) => {
    try {
      const completed = !reminder.completed;
      const completedAt = completed ? new Date() : null;
      await updateDoc(doc(db, "reminders", reminder.id), {
        completed,
        completedAt,
      });
      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminder.id ? { ...r, completed, completedAt } : r
        )
      );
    } catch (err) {}
  };

  // Auto-delete completed reminders after 1 day
  useEffect(() => {
    const now = new Date();
    reminders.forEach((rem) => {
      if (
        rem.completed &&
        rem.completedAt &&
        now - rem.completedAt.toDate?.() > 24 * 60 * 60 * 1000 // Firestore Timestamp
      ) {
        deleteDoc(doc(db, "reminders", rem.id));
        setReminders((prev) => prev.filter((r) => r.id !== rem.id));
      }
      if (
        rem.completed &&
        rem.completedAt &&
        typeof rem.completedAt === "string" &&
        new Date(now) - new Date(rem.completedAt) > 24 * 60 * 60 * 1000 // string fallback
      ) {
        deleteDoc(doc(db, "reminders", rem.id));
        setReminders((prev) => prev.filter((r) => r.id !== rem.id));
      }
    });
    // eslint-disable-next-line
  }, [reminders]);

  // Separate active and completed reminders
  const filteredReminders = useMemo(() => {
    return reminders.filter(
      (rem) =>
        !rem.completed &&
        rem.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reminders, searchTerm]);

  const completedReminders = useMemo(() => {
    return reminders.filter(
      (rem) =>
        rem.completed &&
        rem.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reminders, searchTerm]);

  useEffect(() => {
    if (Notification.permission !== "granted") {
      requestNotificationPermission().then(() => {
        setNotifAllowed(Notification.permission === "granted");
      });
    }
    const unsubscribe = onMessage(messaging, (payload) => {
      showLocalNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/logo192.png",
      });
    });
    return () => {};
  }, []);

  useEffect(() => {
    if (!notifAllowed) return;
    const interval = setInterval(() => {
      const now = new Date();
      reminders.forEach(rem => {
        if (rem.time && rem.date) {
          const [h, m] = rem.time.split(":").map(Number);
          const reminderDateTime = new Date(rem.date + "T" + rem.time + ":00");
          if (
            Math.abs(reminderDateTime - now) < 60000 &&
            (!notifiedIds[rem.id] || notifiedIds[rem.id] !== getTodayStr())
          ) {
            showLocalNotification("Reminder", {
              body: rem.text,
              icon: "/logo192.png",
            });
            setNotifiedIds(prev => ({ ...prev, [rem.id]: getTodayStr() }));
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [reminders, notifAllowed, notifiedIds]);

  useEffect(() => {
    const u = getUserFromStorage();
    setUser(u);
  }, []);

  const fetchReminders = async (currentUser) => {
    setLoading(true);
    try {
      if (!currentUser) {
        setReminders([]);
        setLoading(false);
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
        if (reminder.uid && currentUser.uid && reminder.uid === currentUser.uid) {
          data.push(reminder);
        }
      });
      setReminders(data);
    } catch (err) {
      setReminders([]);
      console.error("Error fetching reminders:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.uid) {
      fetchReminders(user);
    } else {
      setReminders([]);
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [user]);

  const handleAddReminder = async () => {
    if (!reminderText.trim() || !user) return;
    setSaving(true);
    await addDoc(collection(db, "reminders"), {
      uid: user.uid,
      text: reminderText,
      time: reminderTime,
      date: reminderDate,
      createdAt: new Date(),
    });
    setReminderText("");
    setReminderTime("");
    setReminderDate("");
    setDrawerOpen(false);
    setSaving(false);
    fetchReminders(user);
  };

  const handleDeleteReminder = async (id) => {
    await deleteDoc(doc(db, "reminders", id));
    fetchReminders(user);
  };

  const handleEditOpen = (reminder) => {
    setEditReminder(reminder);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editReminder.text.trim()) return;
    setSaving(true);
    await updateDoc(doc(db, "reminders", editReminder.id), {
      text: editReminder.text,
      time: editReminder.time || "",
      date: editReminder.date || "",
    });
    setEditDialogOpen(false);
    setEditReminder(null);
    setSaving(false);
    fetchReminders(user);
  };

  const handleMenuOpen = (event, index) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuIndex(index);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuIndex(null);
  };


  // Drag-to-close handlers
  const handleTouchStart = (e) => {
    if (
      e.touches &&
      e.touches.length === 1 &&
      handleRef.current &&
      handleRef.current.contains(e.target)
    ) {
      dragStartY.current = e.touches[0].clientY;
      dragDeltaY.current = 0;
      setDrawerTranslate(0);
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    if (
      isDragging &&
      dragStartY.current !== null &&
      e.touches &&
      e.touches.length === 1
    ) {
      const currentY = e.touches[0].clientY;
      dragDeltaY.current = currentY - dragStartY.current;
      if (dragDeltaY.current > 0) {
        setDrawerTranslate(dragDeltaY.current);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      if (dragDeltaY.current > 80) {
        setDrawerTranslate(0);
        if (onClose) onClose();
      } else {
        setDrawerTranslate(0);
      }
      dragStartY.current = null;
      dragDeltaY.current = 0;
      setIsDragging(false);
    }
  };

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

  return (
    <ThemeProvider theme={theme}>
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={() => {}}
        disableSwipeToOpen={true}
        disableDiscovery={true}
        PaperProps={{
          sx: {
            width: "100vw",
            maxWidth: 480,
            mx: "auto",
            height: "92vh",
            background: "#00000010",
            backdropFilter: "blur(80px)",
            color: "#fff",
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            p: 0,
            boxShadow: 8,
            touchAction: "none",
            transition: drawerTranslate
              ? "transform 0s"
              : "transform 0.3s cubic-bezier(.4,2,.6,1)",
          },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Box
          sx={{ height: "100vh", overflowY: "auto" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag handle visual */}
          <Box
            ref={handleRef}
            sx={{
              width: 40,
              height: 5,
              background: "#444",
              borderRadius: 3,
              mx: "auto",
              my: 1,
              opacity: 0.5,
              touchAction: "pan-y",
            }}
          />
          {/* Close button and Reminders content */}
          <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
            <Button
              onClick={onClose}
              sx={{
                mr: 2,
                width: 36,
                height: 36,
                minWidth: 0,
                borderRadius: 2,
                color: "#fff",
                backgroundColor: "#232526",
              }}
            >
              <ArrowBackIcon />
            </Button>
            <Typography variant="h4" fontWeight="bold" sx={{ flex: 1 }}>
              Reminders
            </Typography>
          </Box>
          <Container maxWidth="sm" sx={{ pt: 2, pb: 8 }}>
            {!notifAllowed && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  onClick={async () => {
                    await requestNotificationPermission();
                    setNotifAllowed(Notification.permission === "granted");
                  }}
                >
                  Enable Push Notifications
                </Button>
              </Box>
            )}

            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ flex: 1 }}>
                Your Reminders
              </Typography>
              <Tooltip title="Add Reminder">
                <Button
                  size="medium"
                  sx={{ ml: 2, boxShadow: "none", background: buttonWeatherBg, color: "#000", borderRadius: 4, width: "40px" }}
                  onClick={() => setDrawerOpen(true)}
                >
                  <AddIcon />
                </Button>
              </Tooltip>
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search reminders..."
                variant="outlined"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#aaa" }} />
                    </InputAdornment>
                  ),
                  style: { color: "#fff" },
                }}
                sx={{
                  width: "100%",
                  mb: 2,
                  borderRadius: 2,
                  input: { color: "#fff" },
                }}
              />
            </Box>

            <Card sx={{ mb: 2, backgroundColor: "transparent" }}>
              <CardContent sx={{ mb: 2, backgroundColor: "transparent" }}>
                <Typography variant="h6" fontSize={16} sx={{ mb: 2 }}>
                  Active Reminders ({filteredReminders.length})
                </Typography>
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                    <CircularProgress color="inherit" />
                  </Box>
                ) : filteredReminders.length === 0 ? (
                  <Typography color="text.secondary" display={"flex"} alignItems={"center"} justifyContent={"center"} fontSize={16}>
                    No reminders yet.
                  </Typography>
                ) : (
<List>
  {filteredReminders.map((rem, idx) => (
    <ListItem
      key={rem.id}
      sx={{
        borderRadius: 4,
        mb: 1,
        background: "#f1f1f111",
        color: "#fff",
        opacity: rem.completed ? 0.5 : 1,
        textDecoration: rem.completed ? "line-through" : "none",
      }}
      secondaryAction={
        <>
          <IconButton
            edge="end"
            onClick={(e) => handleMenuOpen(e, idx)}
            sx={{ color: "#fff" }}
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={menuIndex === idx}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <MenuItem
              onClick={() => {
                handleEditOpen(rem);
                handleMenuClose();
              }}
            >
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleDeleteReminder(rem.id);
                handleMenuClose();
              }}
              sx={{ color: "#f44336" }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </>
      }
    >
      <IconButton
        onClick={() => handleToggleComplete(rem)}
        sx={{
          color: rem.completed ? "#00f721" : "#aaa",
          mr: 1,
          p: 0.5,
        }}
      >
        {rem.completed ? (
          <CheckCircleIcon sx={{ fontSize: 28, color: "#00f721" }} />
        ) : (
          <NotificationsActiveIcon sx={{ fontSize: 28, color: buttonWeatherBg }} />
        )}
      </IconButton>
      <ListItemText
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.3,
          backgroundColor: "transparent",
        }}
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontSize: 16,
                fontWeight: rem.completed ? "normal" : "bold",
                color: "#fff",
                textDecoration: rem.completed ? "line-through" : "none",
                opacity: rem.completed ? 0.9 : 1,
              }}
            >
              {rem.text}
            </Typography>
          </Box>
        }
        secondary={
          rem.time ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="caption" sx={{ color: "#BDBDBD" }}>
                {rem.date} {rem.time}
              </Typography>
            </Box>
          ) : null
        }
      />
    </ListItem>
  ))}
</List>
                )}
              </CardContent>
            </Card>

                        <Card sx={{ mb: 2, backgroundColor: "transparent" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  px: 2,
                  py: 1,
                  userSelect: "none",
                }}
                onClick={() => setCompletedOpen((prev) => !prev)}
              >
                <ExpandMore
                  sx={{
                    transform: completedOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
                <Typography variant="subtitle1" sx={{ ml: 1 }}>
                  Completed ({completedReminders.length})
                </Typography>
              </Box>
              <Collapse in={completedOpen} timeout="auto" unmountOnExit>
                <CardContent sx={{ background: "transparent", pt: 0 }}>
                  {completedReminders.length === 0 ? (
                    <Typography color="text.secondary" fontSize={15}>
                      No completed reminders.
                    </Typography>
                  ) : (
<List>
  {completedReminders.map((rem, idx) => (
    <ListItem
      key={rem.id}
      sx={{
        borderRadius: 2,
        mb: 1,
        background: "#88888822",
        color: "#fff",
        opacity: 0.5,
      }}
    >
      <IconButton
        onClick={() => handleToggleComplete(rem)}
        sx={{
          color: "#00f721",
          mr: 1,
          p: 0.5,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 28, color: "#00f721" }} />
      </IconButton>
      <ListItemText
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.3,
          backgroundColor: "transparent",
        }}
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>  
            <Typography
              variant="body1"
              sx={{
                color: "#fff",
                textDecoration: "line-through",
                opacity: 0.7,
              }}
            >
              {rem.text}
            </Typography>
          </Box>
        }
        secondary={
          rem.time ? (
            <Box sx={{ display: "flex", flexDirection: "column", mr: 2, gap: 0.1 }}>
              <Typography variant="caption" sx={{ color: "#BDBDBD" }}>
                {rem.time}
              </Typography>
            </Box>
          ) : null
        }
      />
              <IconButton
                size="small"
                onClick={() => handleDeleteReminder(rem.id)}
                sx={{ 
                  color: "#fd7373", 
                  backgroundColor: "#ff000081", 
                  p: 1.2,
                }}
              >
                <DeleteOutlineIcon />
              </IconButton>
    </ListItem>
  ))}
</List>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          </Container>

          {/* Add/Edit Drawer */}
          <Drawer
            anchor="bottom"
            open={drawerOpen}
            onClose={() => {
              setDrawerOpen(false);
              setReminderText("");
              setReminderTime("");
              setReminderDate("");
              setError("");
            }}
            PaperProps={{
              sx: {
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                backgroundColor: "#23252620",
                backdropFilter: "blur(80px)",
                p: 3,
              },
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Add New Reminder
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Reminder"
                value={reminderText}
                onChange={e => setReminderText(e.target.value)}
                fullWidth
                variant="outlined"
                InputProps={{ style: { color: "#fff" } }}
                InputLabelProps={{ style: { color: "#aaa" } }}
              />
              <TextField
                label="Remind Date"
                type="date"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                fullWidth
                variant="outlined"
                InputProps={{ style: { color: "#fff" } }}
                InputLabelProps={{ style: { color: "#aaa" } }}
              />
              <TextField
                label="Remind At"
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                fullWidth
                variant="outlined"
                InputProps={{ style: { color: "#fff" } }}
                InputLabelProps={{ style: { color: "#aaa" } }}
              />
              {error && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
              <Button
                variant="contained"
                sx={{
                  borderRadius: 4,
                  px: 2,
                  py: 1,
                  color: "#000",
                  backgroundColor: buttonWeatherBg,
                  fontWeight: "bold",
                }}
                onClick={handleAddReminder}
                disabled={saving}
              >
                {saving ? "Saving..." : "Add Reminder"}
              </Button>
            </Stack>
          </Drawer>

          {/* Edit Dialog */}
          <Dialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
                backgroundColor: "#23252620",
                backdropFilter: "blur(80px)",
                p: 2,
              },
            }}
          >
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <TextField
                label="Reminder"
                fullWidth
                value={editReminder?.text || ""}
                onChange={e =>
                  setEditReminder({ ...editReminder, text: e.target.value })
                }
                sx={{ mb: 2 }}
                variant="outlined"
              />
              <TextField
                label="Remind Date"
                type="date"
                fullWidth
                value={editReminder?.date || ""}
                onChange={e =>
                  setEditReminder({ ...editReminder, date: e.target.value })
                }
                sx={{ mb: 2 }}
                variant="outlined"
              />
              <TextField
                label="Remind At"
                type="time"
                fullWidth
                value={editReminder?.time || ""}
                onChange={e =>
                  setEditReminder({ ...editReminder, time: e.target.value })
                }
                variant="outlined"
              />
            </DialogContent>
            <DialogActions>
              <Button sx={{ borderRadius: 4, px: 2, py: 1, color: buttonWeatherBg, backgroundColor: WeatherBgdrop, fontWeight: "bold" }} onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                sx={{
                  borderRadius: 4,
                  px: 2,
                  py: 1,
                  color: "#000",
                  backgroundColor: buttonWeatherBg,
                  fontWeight: "bold",
                }}
                onClick={handleEditSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
        <style>
          {`
            @keyframes slideUpDrawer {
              from {
                transform: translateY(100%);
                opacity: 0.7;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}
        </style>
      </SwipeableDrawer>
    </ThemeProvider>
  );
});

export default Reminders;   