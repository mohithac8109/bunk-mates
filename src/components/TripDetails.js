import React, { useEffect, useState } from "react";
import {
  Box, Typography, Container, AvatarGroup, Avatar, LinearProgress,
  Button, Card, CardContent, List, ListItem, ListItemIcon, ListItemText,
  Divider, IconButton, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Snackbar, InputAdornment, Drawer,
  SwipeableDrawer, Paper, Checkbox, Tooltip,
} from "@mui/material";
import {
  LocationOn, AccessTime, CheckCircle, Cancel, Edit, Add, ContentCopy
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDoc, doc, updateDoc, collection, addDoc, onSnapshot,
  query, getDocs, deleteDoc, setDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { QRCodeSVG } from "qrcode.react";
import ShareIcon from "@mui/icons-material/Share";
import DirectionsIcon from "@mui/icons-material/Directions";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupIcon from "@mui/icons-material/Group";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useWeather } from "../contexts/WeatherContext";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";


export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUseruid = currentUser ? currentUser.uid : null;

  const [trip, setTrip] = useState(null);
  const [coverImage, setCoverImage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editTrip, setEditTrip] = useState({});
  const [checklist, setChecklist] = useState([]);
  const [checklistDrawerOpen, setChecklistDrawerOpen] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [budget, setBudget] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [timelineDrawerOpen, setTimelineDrawerOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", time: "", note: "" });
  const [budgetDrawerOpen, setBudgetDrawerOpen] = useState(false);
  const [editBudget, setEditBudget] = useState({ total: "", contributors: [] });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { getWeather } = useWeather();
  const [weather, setWeather] = useState(null);

  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);

  // New states for expenses drawer
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    category: "",
    date: "",
    time: "",
  });

  const [showAllExpenses, setShowAllExpenses] = useState(false);
const visibleExpenses = showAllExpenses
  ? budget?.expenses || []
  : (budget?.expenses || []).slice(0, 4);

  const history = useNavigate();

  const [memberDetails, setMemberDetails] = useState([]);

  useEffect(() => {
    if (!id) return;

    fetchTripData();

    const unsubChecklist = onSnapshot(collection(db, `trips/${id}/checklist`), (snapshot) => {
      setChecklist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPhotos = onSnapshot(collection(db, `trips/${id}/photos`), (snap) => {
      setPhotos(snap.docs.map(doc => doc.data().url));
    });

    const unsubTimeline = onSnapshot(collection(db, `trips/${id}/timeline`), (snap) => {
      const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = events.sort((a, b) => new Date(a.time) - new Date(b.time));
      setTimeline(sorted);
    });

    return () => {
      unsubChecklist();
      unsubPhotos();
      unsubTimeline();
    };
  }, [id]);

  
  

const fetchTripData = async () => {
  if (!id) return;

  // Fetch trip details
  const docRef = doc(db, "trips", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const tripData = docSnap.data();

  // Fetch group chat iconURL
  const groupChatRef = doc(db, "groupChats", id);
  const groupChatSnap = await getDoc(groupChatRef);
  const groupChatData = groupChatSnap.exists() ? groupChatSnap.data() : null;

  const iconURL = groupChatData?.iconURL || null;

  // Combine trip data with iconURL
  const combinedData = {
    ...tripData,
    iconURL
  };

  // Set full trip state
  setTrip(combinedData);
  setEditTrip(tripData); // preserve separate edit state

  // Load members
  if (tripData.members?.length) {
    loadMemberDetails(tripData.members);
  }

  // Fallback image if no icon
  const imageQuery = tripData.name || tripData.location || "travel";
  const imageUrl = await fetchCoverImage(imageQuery);
  setCoverImage(imageUrl);

  // Fetch personal budget
  fetchBudget(tripData.name);

  // Fetch weather
  if (tripData.location) {
    try {
      const weatherData = await getWeather(tripData.location); // From WeatherContext
      setWeather(weatherData); // assume you have `const [weather, setWeather] = useState(null)`
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    }
  }
};



  const loadMemberDetails = async (uids) => {
    const usersRef = collection(db, "users");
    const snapshots = await Promise.all(
      uids.map(uid => getDoc(doc(usersRef, uid)))
    );

    const details = snapshots
      .filter(snap => snap.exists())
      .map(snap => ({ uid: snap.id, ...snap.data() }));

    setMemberDetails(details);
  };

  // Fetch budget & expenses for this trip from budgets collection (budgets/{userUid} document)
  const fetchBudget = async (tripName) => {
    if (!currentUseruid) return;

    const budgetDocRef = doc(db, "budgets", currentUseruid);
    const budgetSnap = await getDoc(budgetDocRef);

    if (budgetSnap.exists()) {
      const data = budgetSnap.data();
      const items = data.items || [];

      // Find budget item matching current tripId
      const tripBudget = items.find(item => item.tripId === id);

      if (tripBudget) {
        // Calculate total used amount by summing expenses amount
        const totalUsed = (tripBudget.expenses || []).reduce(
          (sum, exp) => sum + (exp.amount || 0),
          0
        );

        setBudget({
          total: tripBudget.amount,
          used: totalUsed,
          contributors: tripBudget.contributors || [],
          expenses: tripBudget.expenses || []
        });

        // Also initialize editBudget so user can edit it in budget drawer
        setEditBudget({
          total: tripBudget.amount,
          contributors: tripBudget.contributors || []
        });
      } else {
        setBudget(null);
        setEditBudget({ total: "", contributors: [] });
      }
    }
  };

  const handleSaveEdit = async () => {
  if (!trip || !id) return;

  try {
    const tripRef = doc(db, "trips", id);
    await updateDoc(tripRef, {
      name: editTrip.name,
      location: editTrip.location,
      date: editTrip.startDate,
      date: editTrip.endDate,
      from: editTrip.from || "",
      to: editTrip.to || ""
    });

    setTrip(prev => ({
      ...prev,
      name: editTrip.name,
      location: editTrip.location,
      date: editTrip.date,
      from: editTrip.from,
      to: editTrip.to
    }));

    setSnackbar({ open: true, message: "Trip updated successfully!" });
    setEditMode(false);
  } catch (err) {
    console.error("Error updating trip:", err);
    setSnackbar({ open: true, message: "Failed to save changes." });
  }
};

const handleDeleteTrip = async () => {
  try {
    setConfirmDeleteOpen(false);

    // Delete trip document
    await deleteDoc(doc(db, "trips", id));

    // Delete group chat
    await deleteDoc(doc(db, "groupChats", id));

    // Remove from all users' budgets
    const budgetDocs = await getDocs(collection(db, "budgets"));
    await Promise.all(
      budgetDocs.docs.map(async (snap) => {
        const data = snap.data();
        const updatedItems = (data.items || []).filter(item => item.tripId !== id);
        if (updatedItems.length !== (data.items || []).length) {
          await updateDoc(doc(db, "budgets", snap.id), { items: updatedItems });
        }
      })
    );

    setSnackbar({ open: true, message: "Trip deleted successfully!" });
    setTimeout(() => navigate("/"), 1500);
  } catch (err) {
    console.error("Failed to delete trip:", err);
    setSnackbar({ open: true, message: "Error deleting trip." });
  }
};



  const handleEditSave = async () => {
    if (!currentUseruid) return;

    try {
      const budgetDocRef = doc(db, "budgets", currentUseruid);
      const budgetSnap = await getDoc(budgetDocRef);
      if (!budgetSnap.exists()) {
        setSnackbar({ open: true, message: "Budget document not found." });
        return;
      }
      const data = budgetSnap.data();
      const items = data.items || [];

      const tripBudgetIndex = items.findIndex(item => item.tripId === id);

      const updatedItem = {
        name: trip?.name || "",
        amount: parseInt(editBudget.total),
        category: "General",
        contributors: editBudget.contributors,
        expenses: items[tripBudgetIndex]?.expenses || [],
        tripId: id,
      };

      if (tripBudgetIndex !== -1) {
        items[tripBudgetIndex] = updatedItem;
      } else {
        items.push(updatedItem);
      }

      await updateDoc(budgetDocRef, { items });

      setBudget({
        total: updatedItem.amount,
        used: updatedItem.expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        contributors: updatedItem.contributors,
        expenses: updatedItem.expenses
      });

      setBudgetDrawerOpen(false);
      setSnackbar({ open: true, message: "Budget updated successfully!" });
    } catch (error) {
      console.error("Error updating budget:", error);
      setSnackbar({ open: true, message: "Failed to update budget." });
    }
  };

    // Timeline handlers
const addTimelineEvent = async () => {
  if (!newEvent.title || !newEvent.time) return;

  try {
    await addDoc(collection(db, `trips/${id}/timeline`), {
      ...newEvent,
      completed: false, // Default to incomplete
    });
    setNewEvent({ title: "", time: "", note: "" });
    setTimelineDrawerOpen(false);
  } catch (error) {
    console.error("Error adding timeline event:", error);
  }
};

const deleteTimelineEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, `trips/${id}/timeline`, eventId));
  } catch (error) {
    console.error("Error deleting timeline event:", error);
  }
};

// ✅ Toggle event completion manually by admin
const toggleEventCompleted = async (event) => {
  try {
    const eventRef = doc(db, `trips/${id}/timeline`, event.id);
    await updateDoc(eventRef, {
      completed: !event.completed,
    });
  } catch (error) {
    console.error("Failed to toggle event completion:", error);
  }
};


      const saveBudget = async () => {
        if (!trip) return;
    
        const userBudgetRef = doc(db, "budgets", currentUseruid);
        const userBudgetSnap = await getDoc(userBudgetRef);
    
        let existingData = { items: [] };
        if (userBudgetSnap.exists()) {
          existingData = userBudgetSnap.data();
          if (!Array.isArray(existingData.items)) existingData.items = [];
        }
    
        const updatedItems = [...existingData.items];
        const index = updatedItems.findIndex((item) => item.tripId === id);
    
        const newItem = {
          name: trip.name,
          amount: Number(editBudget.total),
          category: "General",
          contributors: editBudget.contributors.map((c) => ({
            name: c.name,
            amount: Number(c.amount),
            uid: c.uid || "",
          })),
          expenses: budget?.expenses || [],
          tripId: id,
        };
    
        if (index !== -1) {
          updatedItems[index] = newItem;
        } else {
          updatedItems.push(newItem);
        }
    
        await setDoc(userBudgetRef, { items: updatedItems }, { merge: true });
    
        setBudgetDrawerOpen(false);
        await fetchBudget(id);
        setSnackbar({ open: true, message: "Budget saved successfully!" });
      };

  // Expense adding function - saves expense to Firestore budget doc
  const addExpense = async () => {
    if (!currentUseruid) {
      setSnackbar({ open: true, message: "User not authenticated." });
      return;
    }
    if (!newExpense.name || !newExpense.amount || !newExpense.date || !newExpense.time) {
      setSnackbar({ open: true, message: "Please fill all fields." });
      return;
    }

    try {
      const budgetDocRef = doc(db, "budgets", currentUseruid);
      const budgetSnap = await getDoc(budgetDocRef);

      if (!budgetSnap.exists()) {
        setSnackbar({ open: true, message: "Budget document not found." });
        return;
      }

      const data = budgetSnap.data();
      const items = data.items || [];

      const tripBudgetIndex = items.findIndex(item => item.tripId === id);

      if (tripBudgetIndex === -1) {
        setSnackbar({ open: true, message: "Budget for this trip not found." });
        return;
      }

      const expenseDateTime = new Date(`${newExpense.date}T${newExpense.time}`).toISOString();

      const expenseItem = {
        name: newExpense.name,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category || "General",
        date: newExpense.date,
        time: newExpense.time,
        dateTime: expenseDateTime,
      };

      items[tripBudgetIndex].expenses = items[tripBudgetIndex].expenses || [];
      items[tripBudgetIndex].expenses.push(expenseItem);

      await updateDoc(budgetDocRef, { items });

      // Update local budget state immediately
      const totalUsed = items[tripBudgetIndex].expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      setBudget(prev => ({
        ...prev,
        expenses: items[tripBudgetIndex].expenses,
        used: totalUsed,
      }));

      setSnackbar({ open: true, message: "Expense added successfully!" });
      setExpenseDrawerOpen(false);
      setNewExpense({ name: "", amount: "", category: "", date: "", time: "" });
    } catch (error) {
      console.error("Error adding expense:", error);
      setSnackbar({ open: true, message: "Failed to add expense." });
    }
  };

  const addTask = async () => {
    if (!newTask) return;
    await addDoc(collection(db, `trips/${id}/checklist`), {
      text: newTask,
      completed: false,
    });
    setNewTask("");
  };

  const toggleTask = async (task) => {
    await updateDoc(doc(db, `trips/${id}/checklist`, task.id), {
      completed: !task.completed
    });
  };

const fetchCoverImage = async (location) => {
  // Combine 'travel' + location for the search query
  const query = location ? `travel ${trip?.location}` : "travel";

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=MGCA3bsEUNBsSG6XbcqnJXckFB4dDyN5ZPKVBrD0FeQ`
    );
    const data = await response.json();
    return data?.urls?.regular || "";
  } catch (error) {
    console.error("Failed to fetch cover image:", error);
    return "";
  }
};


  const inviteLink = `${window.location.origin}/join?trip=${id}`;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    trip?.from || ""
  )}&destination=${encodeURIComponent(trip?.to || "")}`;

  const goBack = () => {
    history("/trips");  
  };

  const now = new Date();
  const upcomingIndex = timeline.findIndex(item => new Date(item.time) > now);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ color: mode === "dark" ? "#fff" : "#000", minHeight: "100vh" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={goBack}
          sx={{
            mb: 2,
            borderRadius: 8,
            color: mode === "dark" ? "#fff" : "#000",
            position: "absolute",
            top: 16,
            left: 16,
            backgroundColor: mode === "dark" ? "#00000047" : "#ffffff47",
            backdropFilter: "blur(180px)",
          }}
        >
          Back
        </Button>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1,
              position: "absolute",
              top: 16,
              right: 16,
            }}
          >
            <Button
              onClick={() => setShareDrawerOpen(true)}
              sx={{
                mb: 2,
                borderRadius: 8,
                color: mode === "dark" ? "#fff" : "#000",
                backgroundColor: mode === "dark" ? "#00000047" : "#ffffff47",
                backdropFilter: "blur(180px)",
                border: "none",
              }}
            >
              <ShareIcon />
            </Button>

            <Button
              onClick={() => navigate(`/group/${id}`)}
              sx={{
                mb: 2,
                borderRadius: 8,
                color: mode === "dark" ? "#fff" : "#000",
                backgroundColor: mode === "dark" ? "#00000047" : "#ffffff47",
                backdropFilter: "blur(180px)",
                border: "none",
              }}
            >
              <GroupIcon />
            </Button>
          </Box>

        <Box
          sx={{
            backgroundImage: `url(${trip?.iconURL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: mode === "dark" ? "#1d1d1dff" : "#ffffff",
            height: { xs: 470, sm: 320 },
            boxShadow: "none",
          }}
        />


        <Container sx={{ py: 0, px: 0, position: "absolute", top: 250}}>

          {weather && (
  <Box m={1} sx={{ backgroundColor: mode === "dark" ? "#27272773" : "#ffffffa3", py: 1, px: 2, width: 220, borderRadius: 3, backdropFilter: "blur(30px)" }}>
    <Typography variant="subtitle2" color="text.secondary">
      Weather in {trip?.location}:
    </Typography> 
    <Box display="flex" alignItems="center" gap={1}>
      <img src={weather.icon} alt="weather" width={32} height={32} />
      <Typography variant="body2">
        {weather.temp}°C — {weather.description}
      </Typography>
    </Box>
  </Box>
)}

          <Container sx={{ borderRadius: 5, backgroundColor: mode === "dark" ? "#00000000" : "#ffffffa3", backdropFilter: "blur(80px)", py: 2 }}>
            
          {/* Title + Edit */}
          <Box display="flex" flexDirection="column" gap={1} px={3} py={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              {editMode ? (
                <TextField
                  value={editTrip.name}
                  onChange={e => setEditTrip({ ...editTrip, name: e.target.value })}
                  fullWidth
                  sx={{ mr: 2 }}
                />
              ) : (
                <Typography variant="h3" fontWeight="bold">{trip?.name}</Typography>
              )}
{trip?.createdBy === currentUseruid && (
  <IconButton onClick={() => setEditMode(!editMode)} size="small">
    <Edit fontSize="small" />
  </IconButton>
)}

            </Box>

            <Typography sx={{ mt: 1 }}>
              {editMode ? (
                <TextField
                  value={editTrip.location}
                  onChange={e => setEditTrip({ ...editTrip, location: e.target.value })}
                  variant="standard"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  <LocationOn sx={{ fontSize: 16, mr: 0.5, color: mode === "dark" ? "#fff" : "#333" }} /> {trip?.location}
                </Typography>
              )}
            </Typography>
            <Typography>
<Box>
  {editMode ? (
    <Box display="flex" gap={2}>
      <TextField
        type="date"
        label="Start Date"
        value={editTrip.startDate || ""}
        onChange={(e) =>
          setEditTrip({ ...editTrip, startDate: e.target.value })
        }
        variant="standard"
      />
      <TextField
        type="date"
        label="End Date"
        value={editTrip.endDate || ""}
        onChange={(e) =>
          setEditTrip({ ...editTrip, endDate: e.target.value })
        }
        variant="standard"
      />
    </Box>
  ) : (
    <Typography variant="body2" color="text.secondary">
      <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
      {trip?.startDate && trip?.endDate
        ? `${new Date(trip.startDate).toDateString()} → ${new Date(
            trip.endDate
          ).toDateString()}`
        : "Date not set"}
    </Typography>
  )}
</Box>

            </Typography>

            {trip?.from && trip?.to && (
              <Box mt={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Route:
                </Typography>
                <Box display="flex" gap={1} mt={0.5} justifyContent={"space-between"}>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>
                    {trip.from} → {trip.to}
                  </Typography>
                  <Button
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      backgroundColor: "#ffffff11",
                      width: 40,
                      height: 40,
                      borderRadius: 3,
                      color: mode === "dark" ? "#fff" : "#333",
                    }}
                  >
                    <DirectionsIcon />
                  </Button>
                </Box>
              </Box>
            )}

{editMode && (
  <Button variant="contained" onClick={handleSaveEdit} sx={{ mt: 2, backgroundColor: mode === "dark" ? "#fff" : "#000", color: mode === "dark" ? "#000" : "#fff", borderRadius: 8 }}>
    Save Changes
  </Button>
)}

          </Box>

          {/* Snackbar */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            message={snackbar.message}
          />

          <Container sx={{ mb: 4 }}>
            {/* Budget */}
            <Box sx={{ mt: 0, p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Budget</Typography>
                <Box>
                  <>
                  {trip?.createdBy === currentUseruid && (
                    <Button size="small" color={theme.palette.text.primary} onClick={() => setBudgetDrawerOpen(true)}>Edit</Button>
                  )}
                  <Button size="small" color={theme.palette.text.primary} onClick={() => setExpenseDrawerOpen(true)} sx={{ ml: 1 }}>
                    Add Expense
                  </Button>
                  </>
                </Box>
              </Box>

              <Typography variant="body2" sx={{ mt: 1 }}>
                ₹{budget?.used || 0} used of ₹{budget?.total || 0}
              </Typography>

              <LinearProgress
                value={budget?.total ? (budget.used / budget.total) * 100 : 0}
                variant="determinate"
                sx={{
                  mt: 0.5,
                  borderRadius: 20,
                  height: 7,
                  bgcolor: mode === "dark" ? "#ffffff36" : "#00000018",
                  "& .MuiLinearProgress-bar": { bgcolor: mode === "dark" ? "#ffffff" : "#3d3d3dff" },
                }}
              />

              {(budget?.contributors?.length > 0 || budget?.expenses?.length > 0) && (
                <Box mt={2}>
                  {/* Contributors */}
                  {budget?.contributors?.length > 0 && (
                    <>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Contributors
                      </Typography>
                      {budget.contributors.map((c, i) => (
                        <Typography key={i} variant="body2">
                          {c.name || "Anonymous"} — ₹{c.amount}
                        </Typography>
                      ))}
                    </>
                  )}
                  {/* Expenses */}
                  {budget.expenses?.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />

<Box mt={2}>
  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
    Expenses
  </Typography>

  {visibleExpenses.length ? (
    visibleExpenses.map((exp, idx) => (
                        <Typography key={idx} variant="body2" justifyContent={"space-between"} display="flex" mb={0.2}>
                          <Typography variant="body2" fontWeight="bold">
                            {exp.name || "Unnamed"} — ₹{exp.amount}
                          </Typography>

                          <Typography variant="caption" color="text.secondary" backgroundColor="#ffffff11" px={1} py={0.2} borderRadius={1} sx={{ ml: 1 }}>
                            {exp.category}
                          </Typography>
                        </Typography>
    ))
  ) : (
    <Typography color="text.secondary">No expenses added yet.</Typography>
  )}

  {budget.expenses.length > 4 && (
    <Button
      onClick={() => setShowAllExpenses(!showAllExpenses)}
      size="small"
      variant="text"
      sx={{ mt: 1, color: "#90caf9" }}
    >
      {showAllExpenses ? "Hide" : "View More"}
    </Button>
  )}
</Box>


                    </>
                  )}

                </Box>
              )}

            </Box>

            {/* Checklist */}
          <Box sx={{ mt: 4, p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h5" gutterBottom>
                Checklist
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setChecklistDrawerOpen(true)}
                sx={{ px: 2, color: theme.palette.text.primary, borderColor: mode === "dark" ? "#fff" : "#000", borderRadius: 3 }}
              >
                + Add
              </Button>
            </Box>

<Box sx={{ position: "relative" }}>
  <List
    sx={{
      maxHeight: "200px",
      overflowY: "auto",
      scrollbarWidth: "none",
      pb: 4,
    }}
  >
    {checklist.map((task) => (
      <ListItem
        key={task.id}
        disableGutters
        secondaryAction={
          <IconButton onClick={() => toggleTask(task)}>
            {task.completed ? (
              <CheckCircle color="success" />
            ) : (
              <Cancel color="disabled" />
            )}
          </IconButton>
        }
      >
        <ListItemText
          primary={task.text}
          primaryTypographyProps={{
            sx: {
              textDecoration: task.completed ? "line-through" : "none",
              color: task.completed ? "#888" : theme.palette.text.primary,
            },
          }}
        />
      </ListItem>
    ))}
  </List>


  <Box
    sx={{
      position: "absolute",
      bottom: "-2px",
      left: "-2px",
      right: "-2px",
      height: 60,
      background: mode === "dark" ? 'linear-gradient(to top, #0c0c0c, #0c0c0cd9, #0c0c0cc9, #0c0c0c90, #0c0c0c00)' : 'linear-gradient(to top, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
      pointerEvents: "none", // allows interaction with list behind
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    }}
  />
</Box>

          </Box>


<Divider sx={{ my: 2 }} />

            {/* Timeline */}
<Box sx={{ mt: 4, px: 2, py: 1 }}>
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
  <Typography variant="h5" gutterBottom>
    Trip Timeline
  </Typography>
  
  <Button
    variant="outlined"
    onClick={() => setTimelineDrawerOpen(true)}
    sx={{ px: 2, color: theme.palette.text.primary, borderColor: mode === "dark" ? "#fff" : "#000", borderRadius: 3 }}
  >
    + Add
  </Button>
  </Box>
  
<Box sx={{ position: "relative" }}>
  {timeline.length === 0 ? (
    <Typography variant="body2" color="text.secondary">
      No events added yet.
    </Typography>
  ) : (
    <List
      sx={{
        maxHeight: "300px",
        overflowY: "auto",
        scrollbarWidth: "none",
        pb: 5,
        mb: 1
      }}
    >
      {timeline.map((item, index) => {
        const itemTime = new Date(item.time);
        const isCompleted = item.completed;
        const isUpcoming = !isCompleted && itemTime > new Date() &&
          timeline.findIndex((e) => new Date(e.time) > new Date() && !e.completed) === index;

        return (
          <ListItem
            key={item.id}
            sx={{
              backgroundColor: isUpcoming
                ? "#bc751835" // Indigo for upcoming
                : isCompleted
                ? mode === "dark" ? "#000000" : "#ffffff"
                : mode === "dark" ? "#1c1c1c" : "#f0f0f0ff",
              borderRadius: 3,
              mb: 1,
              px: 2,
              py: 0.1,
              border: isUpcoming ? "2px solid #bc7518ff" : "none",
              boxShadow: isUpcoming ? "0 0 10px #bc751880" : "none",
            }}
            secondaryAction={
              isCompleted &&
              trip?.createdBy === currentUseruid && (
                <IconButton onClick={() => deleteTimelineEvent(item.id)}>
                  <Cancel color="error" />
                </IconButton>
              )
            }
          >
            <ListItemIcon>
              <Checkbox
                checked={isCompleted}
                onChange={() => toggleEventCompleted(item)}
                sx={{ color: "#999" }}
              />
            </ListItemIcon>

            <ListItemText
              primary={
                <Typography
                  variant="body1"
                  fontWeight={isUpcoming ? "bold" : isCompleted ? "normal" : "medium"}
                  color={isCompleted ? "#888" : isUpcoming ? theme.palette.text.primary : theme.palette.text.primary}
                  sx={{
                    textDecoration: isCompleted ? "line-through" : "none",
                  }}
                >
                  {item.title}
                </Typography>
              }
              secondary={
                <Typography variant="caption" color="text.secondary">
                  {itemTime.toLocaleString()}
                  {item.note && ` — ${item.note}`}
                </Typography>
              }
            />
          </ListItem>
        );
      })}
    </List>
  )}
    <Box
    sx={{
      position: "absolute",
      bottom: "-2px",
      left: "-2px",
      right: "-2px",
      height: 60,
      background: mode === "dark" ? 'linear-gradient(to top, #0c0c0c, #0c0c0cd9, #0c0c0cc9, #0c0c0c90, #0c0c0c00)' : 'linear-gradient(to top, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
      pointerEvents: "none", // allows interaction with list behind
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    }}
  />
</Box>
</Box>


<Divider sx={{ my: 2 }} />

            {/* Chat Button */}
          <Box mt={4} mx={2}>
            <Typography variant="h6" gutterBottom>
              Members
            </Typography>
            <List dense>
              {memberDetails.map((user) => (
                <ListItem key={user.uid} disableGutters onClick={() => navigate(`/chat/${user.uid}`)} sx={{ cursor: "pointer" }}>
                  <Avatar src={user.photoURL} sx={{ mr: 2 }} />
                  <Box>
                    <Typography fontWeight="medium">{user.name || "Unknown"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>

            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2, color: theme.palette.text.primary, borderColor: mode === "dark" ? "#fff" : "#000", borderRadius: 3 }}
              onClick={() => setShareDrawerOpen(true)}
            >
              Invite Members
            </Button>

<Divider sx={{ my: 2 }} />

{trip?.createdBy === currentUseruid && (
  <Button
    variant="outlined"
    fullWidth
    startIcon={<DeleteOutlineIcon />}
    color="error"
    sx={{ mt: 1, borderRadius: 3, backgroundColor: "#ff000010" }}
    onClick={() => setConfirmDeleteOpen(true)} // ✅ Corrected here
  >
    Delete Trip
  </Button>
)}


          </Box>


          </Container>
          </Container>
        </Container>


                  {/* Invite Drawer */}
<SwipeableDrawer
  anchor="bottom"
  open={shareDrawerOpen}
  onClose={() => setShareDrawerOpen(false)}
  PaperProps={{
    sx: {
      p: 3,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      backgroundColor: mode === "dark" ? "#1E1E1E" : "#f1f1f1",
    },
  }}
>

  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
    <Typography variant="h6">
      Invite Members via Link
    </Typography>

    <Button
      onClick={() => setShareDrawerOpen(false)}
    >
      Close
    </Button>
  </Box>

  {/* QR Code */}
  <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
    <Box
      sx={{
        width: 180,
        height: 180,
        backgroundColor: "#fff",
        padding: 2,
        borderRadius: 3,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <QRCodeSVG value={inviteLink} size={180} bgColor="#fff" fgColor="#000000" p={3} />
    </Box>
  </Box>

    <TextField
    fullWidth
    multiline
    value={inviteLink}
    InputProps={{
      readOnly: true,
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              setSnackbar({ open: true, message: "Copied invite link!" });
            }}
          >
            <ContentCopy />
          </IconButton>
        </InputAdornment>
      ),
    }}
    sx={{ mb: 2 }}
  />


  {/* MUI Social Icons */}
  <Box display="flex" justifyContent="center" gap={3} mb={2}>
    <Tooltip title="Share on WhatsApp">
      <IconButton
        component="a"
        href={`https://wa.me/?text=${encodeURIComponent(
          `You're invited to join our trip "${trip?.name}" on BunkMate! 🚀\nClick to join: ${inviteLink}`
        )}`}
        target="_blank"
        sx={{ color: mode === "dark" ? "#fff" : "#000", p: 1.5, backgroundColor: "#25D366" }}
      >
        <WhatsAppIcon />
      </IconButton>
    </Tooltip>

    <Tooltip title="Share on Telegram">
      <IconButton
        component="a"
        href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(
          `Join our "${trip?.name}" trip on BunkMate! 🚀`
        )}`}
        target="_blank"
        sx={{ color: mode === "dark" ? "#fff" : "#000", p: 1.5, backgroundColor: "#229ED9" }}
      >
        <TelegramIcon />
      </IconButton>
    </Tooltip>

    <Tooltip title="Copy for Instagram Story">
      <IconButton
        onClick={() => {
          navigator.clipboard.writeText(inviteLink);
          setSnackbar({ open: true, message: "Copied! Share it on Instagram." });
        }}
        sx={{ color: mode === "dark" ? "#fff" : "#000", p: 1.5, backgroundColor: "#E1306C" }}
      >
        <InstagramIcon />
      </IconButton>
    </Tooltip>

    <Tooltip title="Share on Twitter / X">
      <IconButton
        component="a"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `Join my trip "${trip?.name}" on BunkMate! ${inviteLink}`
        )}`}
        target="_blank"
        sx={{ color: "#1DA1F2", p: 1.5, backgroundColor: mode === "dark" ? "white" : "#d5d5d5ff" }}
      >
        <TwitterIcon />
      </IconButton>
    </Tooltip>
  </Box>

  {/* Native Share API */}
  {navigator.share && (
    <Button
      fullWidth
      variant="contained"
      startIcon={<ShareIcon />}
      sx={{ mb: 1, borderRadius: 8, py: 1.5, backgroundColor: theme.palette.text.primary, color: mode === "dark" ? "#000" : "#fff" }}
      onClick={() =>
        navigator.share({
          title: `Join our trip on BunkMate`,
          text: `You're invited to join "${trip?.name}" on BunkMate! 🚀\nTap to accept the invite.`,
          url: inviteLink,
        })
      }
    >
      Share via Device…
    </Button>
  )}

</SwipeableDrawer>

        
                  {/* Checklist Drawer */}
                  <Drawer
                    anchor="bottom"
                    open={checklistDrawerOpen}
                    onClose={() => setChecklistDrawerOpen(false)}
                    PaperProps={{
                      sx: {
                        p: 3,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        backgroundColor: "#1E1E1E",
                      },
                    }}
                  >
                    <Typography variant="h6" mb={2}>
                      Add Checklist Item
                    </Typography>
                    <TextField
                      fullWidth
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      label="Task"
                      autoFocus
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={addTask}
                      disabled={!newTask.trim()}
                    >
                      Add
                    </Button>
                  </Drawer>
        
                  {/* Timeline Drawer */}
                  <Drawer
                    anchor="bottom"
                    open={timelineDrawerOpen}
                    onClose={() => setTimelineDrawerOpen(false)}
                    PaperProps={{
                      sx: {
                        p: 3,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        backgroundColor: "#1E1E1E",
                      },
                    }}
                  >
                    <Typography variant="h6" mb={2}>
                      Add Timeline Event
                    </Typography>
                    <TextField
                      fullWidth
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      label="Title"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      type="datetime-local"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      label="Time"
                      InputLabelProps={{ shrink: true }}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      value={newEvent.note}
                      onChange={(e) => setNewEvent({ ...newEvent, note: e.target.value })}
                      label="Notes"
                      multiline
                      rows={3}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={addTimelineEvent}
                      disabled={!newEvent.title || !newEvent.time}
                    >
                      Add Event
                    </Button>
                  </Drawer>
        
                  {/* Budget Drawer */}
                  <Drawer
                    anchor="bottom"
                    open={budgetDrawerOpen}
                    onClose={() => setBudgetDrawerOpen(false)}
                    PaperProps={{
                      sx: {
                        p: 3,
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        backgroundColor: "#1E1E1E",
                      },
                    }}
                  >
                    <Typography variant="h6" mb={2}>
                      Edit Trip Budget
                    </Typography>
        
                    <TextField
                      fullWidth
                      label="Total Budget (₹)"
                      type="number"
                      value={editBudget.total}
                      onChange={(e) =>
                        setEditBudget({ ...editBudget, total: e.target.value })
                      }
                      sx={{ mb: 2 }}
                    />
        
                    <Typography variant="subtitle2">Contributors</Typography>
                    {editBudget.contributors.map((c, i) => (
                      <Box key={i} display="flex" gap={2} mt={1}>
                        <TextField
                          label="Name"
                          value={c.name}
                          onChange={(e) => {
                            const updated = [...editBudget.contributors];
                            updated[i].name = e.target.value;
                            setEditBudget({ ...editBudget, contributors: updated });
                          }}
                          fullWidth
                        />
                        <TextField
                          label="Amount"
                          type="number"
                          value={c.amount}
                          onChange={(e) => {
                            const updated = [...editBudget.contributors];
                            updated[i].amount = e.target.value;
                            setEditBudget({ ...editBudget, contributors: updated });
                          }}
                          sx={{ width: 120 }}
                        />
                      </Box>
                    ))}
        
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => {
                        setEditBudget({
                          ...editBudget,
                          contributors: [...editBudget.contributors, { name: "", amount: "" }],
                        });
                      }}
                    >
                      + Add Contributor
                    </Button>
        
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{ mt: 3 }}
                      onClick={saveBudget}
                      disabled={!editBudget.total || editBudget.contributors.length === 0}
                    >
                      Save Budget
                    </Button>
                  </Drawer>

        {/* Expense Drawer */}
        <Drawer
          anchor="bottom"
          open={expenseDrawerOpen}
          onClose={() => setExpenseDrawerOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              backgroundColor: "#1E1E1E",
              p: 3,
            },
          }}
        >
          <Typography variant="h6" mb={2}>
            Add New Expense
          </Typography>

          <TextField
            fullWidth
            label="Expense Name"
            value={newExpense.name}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, name: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Amount (₹)"
            type="number"
            value={newExpense.amount}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, amount: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Category"
            value={newExpense.category}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, category: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={newExpense.date}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, date: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Time"
            type="time"
            InputLabelProps={{ shrink: true }}
            value={newExpense.time}
            onChange={(e) =>
              setNewExpense((prev) => ({ ...prev, time: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          <Button
            fullWidth
            variant="contained"
            onClick={addExpense}
            disabled={
              !newExpense.name ||
              !newExpense.amount ||
              !newExpense.date ||
              !newExpense.time
            }
          >
            Save Expense
          </Button>
        </Drawer>

        <Dialog
  open={confirmDeleteOpen}
  onClose={() => setConfirmDeleteOpen(false)}
  PaperProps={{ sx: { backgroundColor: "#0000002b", p: 2, borderRadius: 2, backdropFilter: "blur(20px)" } }}
>
  <DialogTitle sx={{ color: mode === "dark" ? "#fff" : "#000" }}>Confirm Delete</DialogTitle>
  <DialogContent>
    <Typography color="text.secondary">
      Are you sure you want to permanently delete this trip? This action cannot be undone.
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmDeleteOpen(false)} color="primary" variant="outlined">
      Cancel
    </Button>
    <Button onClick={handleDeleteTrip} color="error" variant="contained">
      Delete
    </Button>
  </DialogActions>
</Dialog>


      </Box>
    </ThemeProvider>
  );
}
