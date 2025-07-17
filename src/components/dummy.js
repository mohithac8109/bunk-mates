import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Avatar,
  LinearProgress,
  Button,
  List,
  ListItem,
  IconButton,
  TextField,
  Snackbar,
  InputAdornment,
  Drawer,
  ListItemText,
} from "@mui/material";
import {
  LocationOn,
  AccessTime,
  CheckCircle,
  Cancel,
  Edit,
  ContentCopy,
  Add,
  Category,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import {
  getDoc,
  doc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { QRCodeSVG } from "qrcode.react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#121212", paper: "#1E1E1E" },
    text: { primary: "#ffffff", secondary: "#bbbbbb" },
    primary: { main: "#ffffffff" },
  },
  shape: { borderRadius: 12 },
});

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

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
  const [memberDetails, setMemberDetails] = useState([]);
  const [expenseDrawerOpen, setExpenseDrawerOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    category: "",
    date: "",
    time: "",
  });

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUseruid = currentUser ? currentUser.uid : null;


  // Fetch trip data on mount or id change
  useEffect(() => {
    fetchTripData();
  }, [id]);

  const fetchTripData = async () => {
    const docRef = doc(db, "trips", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      setTrip(data);
      setEditTrip(data);
      await fetchBudget(id);

      if (data.members?.length) {
        loadMemberDetails(data.members);
      }

      // Fetch cover image from Unsplash
      const imageQuery = data.name || data.location || "travel";
      const imageUrl = await fetchCoverImage(imageQuery);
      setCoverImage(imageUrl);
    }
  };

  const loadMemberDetails = async (uids) => {
    const usersRef = collection(db, "users");
    const snapshots = await Promise.all(
      uids.map((uid) => getDoc(doc(usersRef, uid)))
    );

    const details = snapshots
      .filter((snap) => snap.exists())
      .map((snap) => ({ uid: snap.id, ...snap.data() }));

    setMemberDetails(details);
  };

  // Fetch budget for this trip from user's budgets document
  const fetchBudget = async (tripId) => {
    const userBudgetRef = doc(db, "budgets", currentUseruid);
    const userBudgetSnap = await getDoc(userBudgetRef);

    if (!userBudgetSnap.exists()) {
      setBudget(null);
      setEditBudget({ total: "", contributors: [] });
      return;
    }

    const data = userBudgetSnap.data();
    if (!Array.isArray(data.items)) {
      setBudget(null);
      setEditBudget({ total: "", contributors: [] });
      return;
    }

    // Find the budget item matching this trip
    const item = data.items.find((item) => item.tripId === tripId);
    if (!item) {
      setBudget(null);
      setEditBudget({ total: "", contributors: [] });
      return;
    }

const totalExpenses = item.expenses
  ? item.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  : 0;

setBudget({
  total: item.amount,
  used: totalExpenses,
  contributors: item.contributors || [],
  expenses: item.expenses || [],
});


    setEditBudget({
      total: item.amount,
      contributors: item.contributors || [],
    });
  };

  // Save budget updates
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

  // Checklist fetching and realtime update
  useEffect(() => {
    const unsubChecklist = onSnapshot(
      collection(db, `trips/${id}/checklist`),
      (snapshot) => {
        setChecklist(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );
    return () => unsubChecklist();
  }, [id]);

  // Timeline fetching and realtime update
  useEffect(() => {
    const unsubTimeline = onSnapshot(
      collection(db, `trips/${id}/timeline`),
      (snap) => {
        const events = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const sorted = events.sort((a, b) => new Date(a.time) - new Date(b.time));
        setTimeline(sorted);
      }
    );
    return () => unsubTimeline();
  }, [id]);

  // Checklist handlers
  const addTask = async () => {
    if (!newTask) return;
    await addDoc(collection(db, `trips/${id}/checklist`), {
      text: newTask,
      completed: false,
    });
    setNewTask("");
    setChecklistDrawerOpen(false);
  };

  const toggleTask = async (task) => {
    await updateDoc(doc(db, `trips/${id}/checklist`, task.id), {
      completed: !task.completed,
    });
  };

  // Timeline handlers
  const addTimelineEvent = async () => {
    if (!newEvent.title || !newEvent.time) return;
    await addDoc(collection(db, `trips/${id}/timeline`), newEvent);
    setNewEvent({ title: "", time: "", note: "" });
    setTimelineDrawerOpen(false);
  };

  const deleteTimelineEvent = async (eventId) => {
    await deleteDoc(doc(db, `trips/${id}/timeline`, eventId));
  };

  // Edit trip save
  const handleEditSave = async () => {
    await updateDoc(doc(db, "trips", id), editTrip);
    setTrip(editTrip);
    setEditMode(false);
  };

    const addExpense = async () => {
    if (!newExpense.name || !newExpense.amount || !currentUseruid) return;

    try {
      const budgetDocRef = doc(db, "budgets", currentUseruid);
      const budgetSnap = await getDoc(budgetDocRef);

      if (budgetSnap.exists()) {
        const data = budgetSnap.data();
        const items = data.items || [];
        const tripBudgetIndex = items.findIndex(item => item.tripId === id);

        if (tripBudgetIndex !== -1) {
          // Prepare new expense item with date & time combined as ISO string
          const expenseDateTime = new Date(`${newExpense.date}T${newExpense.time}`).toISOString();

          const expenseItem = {
            name: newExpense.name,
            amount: parseFloat(newExpense.amount),
            category: newExpense.category || "General",
            date: newExpense.date,
            time: newExpense.time,
            dateTime: expenseDateTime,
          };

          // Append new expense
          items[tripBudgetIndex].expenses = items[tripBudgetIndex].expenses || [];
          items[tripBudgetIndex].expenses.push(expenseItem);

          // Update the Firestore document with updated items array
          await updateDoc(budgetDocRef, { items });

          // Update local budget state to reflect changes (calculate used from expenses)
          const totalUsed = items[tripBudgetIndex].expenses.reduce(
            (sum, exp) => sum + (exp.amount || 0), 0
          );

          setBudget(prev => ({
            ...prev,
            expenses: items[tripBudgetIndex].expenses,
            used: totalUsed,
          }));

          setSnackbar({ open: true, message: "Expense added successfully!" });
          setExpenseDrawerOpen(false);
          setNewExpense({ name: "", amount: "", category: "", date: "", time: "" });
        } else {
          setSnackbar({ open: true, message: "Budget for this trip not found." });
        }
      } else {
        setSnackbar({ open: true, message: "User budget document not found." });
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      setSnackbar({ open: true, message: "Failed to add expense." });
    }
  };

  // Fetch cover image from Unsplash
  const fetchCoverImage = async (query) => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
          query
        )}&client_id=MGCA3bsEUNBsSG6XbcqnJXckFB4dDyN5ZPKVBrD0FeQ`
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
    navigate(-1);
  };

  const now = new Date();
  const upcomingIndex = timeline.findIndex((item) => new Date(item.time) > now);

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ color: "#ffffff", minHeight: "100vh" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={goBack}
          sx={{
            mb: 2,
            borderRadius: 2,
            color: "#fff",
            position: "absolute",
            top: 16,
            left: 16,
            backgroundColor: "#00000047",
            backdropFilter: "blur(180px)",
            "&:hover": { backgroundColor: "#f1f1f121" },
          }}
        >
          Back
        </Button>

        <Box
          sx={{
            backgroundImage: `url(${coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: { xs: 420, sm: 320 },
            borderRadius: 2,
            boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
          }}
        />

        <Container
          sx={{
            py: 0,
            px: 0,
            position: "relative",
            top: -120,
            borderRadius: 1.5,
            backdropFilter: "blur(80px)",
          }}
        >
          {/* Title + Edit */}
          <Box display="flex" flexDirection="column" gap={1} px={3} py={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              {editMode ? (
                <TextField
                  value={editTrip.name}
                  onChange={(e) => setEditTrip({ ...editTrip, name: e.target.value })}
                  fullWidth
                  sx={{ mr: 2 }}
                />
              ) : (
                <Typography variant="h5" fontWeight="bold">
                  {trip?.name}
                </Typography>
              )}
              <IconButton onClick={() => setEditMode(!editMode)} size="small">
                <Edit fontSize="small" />
              </IconButton>
            </Box>

            <Typography sx={{ mt: 1 }}>
              {editMode ? (
                <TextField
                  value={editTrip.location}
                  onChange={(e) => setEditTrip({ ...editTrip, location: e.target.value })}
                  variant="standard"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  <LocationOn sx={{ fontSize: 16, mr: 0.5 }} /> {trip?.location}
                </Typography>
              )}
            </Typography>

            <Typography>
              {editMode ? (
                <TextField
                  type="date"
                  value={editTrip.date}
                  onChange={(e) => setEditTrip({ ...editTrip, date: e.target.value })}
                  variant="standard"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />{" "}
                  {trip?.date ? new Date(trip.date).toDateString() : ""}
                </Typography>
              )}
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
                    variant="outlined"
                    color="primary"
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Directions
                  </Button>
                </Box>
              </Box>
            )}

            {editMode && (
              <Button variant="contained" onClick={handleEditSave} sx={{ mt: 2 }}>
                Save Changes
              </Button>
            )}
          </Box>

          {/* Budget */}
          <Box sx={{ mt: 4, p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Budget</Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setExpenseDrawerOpen(true)}
            sx={{ mb: 2 }}
          >
            Add Expense
          </Button>
            </Box>

<Typography variant="body2" sx={{ mt: 1 }}>
  Used: ₹{budget?.used || 0} / Total: ₹{budget?.total || 0} — Remaining: ₹{(budget?.total - budget?.used) || 0}
</Typography>

            <LinearProgress
              value={(budget?.used / budget?.total) * 100 || 0}
              variant="determinate"
              sx={{ mt: 1, borderRadius: 2, height: 6 }}
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
                    <Box sx={{ my: 2 }}>
                      <hr style={{ borderColor: "#555" }} />
                    </Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Expenses
                    </Typography>
                    {budget.expenses.map((exp, idx) => (
                      <Typography key={idx} variant="body2">
                        {exp.name || "Unnamed"} — ₹{exp.amount}
                      </Typography>
                    ))}
                  </>
                )}
              </Box>
            )}
          </Box>

          {/* Checklist */}
          <Box sx={{ mt: 4, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Checklist
            </Typography>
            <List>
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
                        color: task.completed ? "#888" : "#fff",
                      },
                    }}
                  />
                </ListItem>
              ))}
            </List>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => setChecklistDrawerOpen(true)}
              sx={{ mt: 2 }}
            >
              + Add Checklist Item
            </Button>
          </Box>

          {/* Timeline */}
          <Box sx={{ mt: 4, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Trip Timeline
            </Typography>
            {timeline.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No events added yet.
              </Typography>
            ) : (
              <List>
                {timeline.map((item, index) => {
                  const itemTime = new Date(item.time);
                  const isPast = itemTime < now;
                  const isNext = index === upcomingIndex;

                  return (
                    <ListItem
                      key={item.id}
                      sx={{
                        bgcolor: isNext ? "#2e7d32" : "transparent",
                        borderRadius: 1,
                        px: 2,
                        py: 1,
                      }}
                      secondaryAction={
                        <IconButton onClick={() => deleteTimelineEvent(item.id)}>
                          <Cancel color="error" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Typography
                            fontWeight={isNext ? "bold" : "normal"}
                            color={isPast && !isNext ? "#888" : "#fff"}
                            sx={{
                              textDecoration:
                                isPast && !isNext ? "line-through" : "none",
                            }}
                          >
                            {item.title} — {itemTime.toLocaleString()}
                          </Typography>
                        }
                        secondary={item.note}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}

            <Button
              variant="outlined"
              fullWidth
              onClick={() => setTimelineDrawerOpen(true)}
              sx={{ mt: 2 }}
            >
              + Add Timeline Event
            </Button>
          </Box>

          {/* Members & Share */}
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Members
            </Typography>
            <List dense>
              {memberDetails.map((user) => (
                <ListItem key={user.uid} disableGutters>
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
              sx={{ mt: 2 }}
              onClick={() => setShareDrawerOpen(true)}
            >
              Invite Members
            </Button>
          </Box>

          {/* Invite Drawer */}
          <Drawer
            anchor="bottom"
            open={shareDrawerOpen}
            onClose={() => setShareDrawerOpen(false)}
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
              Invite Members via Link
            </Typography>

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
            />

            <Box
              sx={{
                mt: 3,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <QRCodeSVG value={inviteLink} size={180} bgColor="#1E1E1E" fgColor="#fff" />
            </Box>
          </Drawer>

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
            disabled={!newExpense.name || !newExpense.amount || !newExpense.date || !newExpense.time}
          >
            Save Expense
          </Button>
        </Drawer>

          {/* Snackbar for messages */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            message={snackbar.message}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
}
