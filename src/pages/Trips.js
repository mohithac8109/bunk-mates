import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  DialogContent,
  TextField,
  DialogActions,
  AvatarGroup,
  Avatar,
  Collapse,
  IconButton,
  Stack,
  LinearProgress,
  ThemeProvider,
  createTheme,
  Chip,
  Slide,
  Tooltip,
  Drawer,
} from "@mui/material";
import {
  Add,
  ExpandMore,
  ExpandLess,
  LocationOn,
  Cancel,
} from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  setDoc,
  doc,
  arrayUnion,
  updateDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ProfilePic from "../components/Profile";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [showPast, setShowPast] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: "",
    from: "",
    to: "",
    location: "",
    startDate: "",
    endDate: "",
    members: "",
    budget: ""
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberInput, setMemberInput] = useState("");
  const [latestTripId, setLatestTripId] = useState(null);

  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);


  const navigate = useNavigate();
  const user = auth.currentUser;

  const history = useNavigate();

useEffect(() => {
  if (!user) return;

  const q = query(
    collection(db, "trips"),
    where("members", "array-contains", user.uid)
  );

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const allTrips = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const trip = { id: docSnap.id, ...docSnap.data() };

        // 📦 Get budget
// 📦 Get budget from /budgets/{user.uid} → items[]
const userBudgetRef = doc(db, "budgets", user.uid);
const budgetSnap = await getDoc(userBudgetRef);

if (budgetSnap.exists()) {
  const budgetDoc = budgetSnap.data();

  const matchingItem = Array.isArray(budgetDoc.items)
    ? budgetDoc.items.find((item) => item.tripId === trip.id)
    : null;

  if (matchingItem) {
    const used = Array.isArray(matchingItem.expenses)
      ? matchingItem.expenses.reduce(
          (sum, e) => sum + (parseFloat(e.amount) || 0),
          0
        )
      : 0;

    trip.budget = {
      ...matchingItem,
      used,
    };
  } else {
    trip.budget = null;
  }
} else {
  trip.budget = null;
}

const memberSnapshots = await Promise.all(
  trip.members.map(uid => getDoc(doc(db, "users", uid)))
);

const memberProfiles = memberSnapshots
  .filter(snap => snap.exists())
  .map(snap => {
    const data = snap.data();
    return {
      uid: snap.id,
      photoURL: data.photoURL || "",
      name: data.name || "",
      username: data.username || "",
    };
  });

trip.memberProfiles = memberProfiles;

const groupChatRef = doc(db, "groupChats", trip.id);
const groupChatSnap = await getDoc(groupChatRef);
if (groupChatSnap.exists()) {
  const groupChatData = groupChatSnap.data();
  trip.iconURL = groupChatData.iconURL || null;
} else {
  trip.iconURL = null;
}



        // 📅 Get timeline events
const timelineSnap = await getDocs(collection(db, "trips", trip.id, "timeline"));
const timelineEvents = timelineSnap.docs.map(d => d.data());

const total = timelineEvents.length || 1;
const completedCount = timelineEvents.filter(ev => ev.completed === true).length;

trip.timelineProgress = Math.round((completedCount / total) * 100);
trip.timelineStats = { completed: completedCount, total };


        return trip;
      })
    );

    setTrips(allTrips);
  });

  return () => unsubscribe();
}, [user]);


  useEffect(() => {
  if (createDialogOpen && user) {
    const alreadyIncluded = selectedMembers.some(m => m.uid === user.uid);
    if (!alreadyIncluded) {
      const newCreator = {
        uid: user.uid,
        name: user.displayName || "You",
        username: user.email?.split("@")[0] || "you",
        email: user.email,
        photoURL: user.photoURL || "",
        contribution: ""
      };
      setSelectedMembers(prev => [...prev, newCreator]);
    }
  }
}, [createDialogOpen, user]);


  const getUidFromEmail = async (email) => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return snapshot.docs[0].id;
};


const handleCreateTrip = async () => {
  const { name, from, to, location, startDate, endDate } = newTrip;

  if (!name || !from || !to || !location || !startDate || !endDate || selectedMembers.length === 0) {
    alert("Please fill all fields & add members");
    return;
  }

  const members = selectedMembers.map(m => m.uid);
  const contributors = selectedMembers.map(m => ({
    uid: m.uid,
    name: m.name || m.username,
    amount: parseInt(m.contribution || 0)
  }));

  const total = contributors.reduce((sum, c) => sum + c.amount, 0);

  try {
    // Create trip
    const tripDoc = await addDoc(collection(db, "trips"), {
      name,
      from,
      to,
      location,
      startDate,
      endDate,
      members,
      createdBy: user.uid,
      createdAt: new Date().toISOString()
    });
    setLatestTripId(tripDoc.id);

// Save shared budget
await setDoc(doc(db, "budgets", tripDoc.id), {
  tripId: tripDoc.id,
  tripName: name,
  total,
  used: 0,
  contributors,
  createdBy: user.uid,
  createdAt: new Date().toISOString()
});

// ✅ Save personal budget reference under each contributor
await Promise.all(contributors.map(async (c) => {
  const userRef = doc(db, "budgets", c.uid);

  await updateDoc(userRef, {
      items: arrayUnion(
        {
          amount: total,
          category: "Tour",
          name,
          tripId: tripDoc.id,
          contributors,
          createdAt: new Date(),
          expenses: []
        }
    ),
  });
}));


    await setDoc(doc(db, "groupChats", tripDoc.id), {
      tripId: tripDoc.id,
      name: `${from} - to - ${location} Trip`,
      members,
      description: `Group for ${from} to ${to}`,
      inviteAccess: "all",
      emoji: "",
      iconURL: "",
      createdBy: user.uid,
      createdAt: new Date().toISOString()
    });
    console.log("✅ Group chat created");

    // Close dialog and reset form
    setCreateDialogOpen(false);
    setNewTrip({ name: "", from: "", to: "", location: "", startDate: "", endDate: "", members: "", budget: "" });
    setSelectedMembers([]);
  } catch (error) {
    console.error("Error creating trip or group chat:", error);
    alert("Error occurred while creating trip or group chat. Please try again.");
  }
};



const searchUsers = async (input) => {
  const q = query(
    collection(db, "users"),
    where("keywords", "array-contains", input.toLowerCase()) // keywords = ['john', 'doe', 'johndoe', 'john@example.com']
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
};

const handleAddMemberByInput = async () => {
  const input = memberInput.trim().toLowerCase();
  if (!input) return;

  const usersRef = collection(db, "users");

  const usernameQuery = query(usersRef, where("username", "==", input));
  const emailQuery = query(usersRef, where("email", "==", input));

  const [usernameSnap, emailSnap] = await Promise.all([
    getDocs(usernameQuery),
    getDocs(emailQuery),
  ]);

  let match = null;

  if (!usernameSnap.empty) {
    const doc = usernameSnap.docs[0];
    match = { uid: doc.id, ...doc.data(), contribution: "" };
  } else if (!emailSnap.empty) {
    const doc = emailSnap.docs[0];
    match = { uid: doc.id, ...doc.data(), contribution: "" };
  }

  if (match) {
    const alreadyAdded = selectedMembers.some((m) => m.uid === match.uid);
    if (!alreadyAdded) {
      setSelectedMembers([...selectedMembers, match]);
      setMemberInput("");
    }
  } else {
    alert(`No user found with username or email: ${input}`);
  }
};


  const totalContribution = selectedMembers.reduce(
    (sum, m) => sum + (parseInt(m.contribution) || 0), 0
  );

   const goBack = () => {
      history("/");
   };

  const today = new Date();
  const upcomingTrips = trips.filter((trip) => new Date(trip.endDate || trip.startDate) >= today);
  const pastTrips = trips.filter((trip) => new Date(trip.endDate || trip.startDate) < today);


  const mockChecklist = () => Math.floor(Math.random() * 100);
  const mockBudget = () => ({ total: 10000, used: Math.floor(Math.random() * 8000) });
  const generateInviteCode = (tripId) => tripId.slice(-6).toUpperCase();

  const renderTripCard = (trip) => {
    const isNew = trip.id === latestTripId;
    const budget = mockBudget();
    const checklist = mockChecklist();
    const inviteCode = generateInviteCode(trip.id);

    return (
      <Slide in direction="up" timeout={isNew ? 600 : 0} mountOnEnter unmountOnExit>
<Card
  key={trip.id}
  onClick={() => navigate(`/trips/${trip.id}`)}
  sx={{
    backdropFilter: "blur(12px)",
    backgroundImage: `url(${trip?.iconURL})`,
    backgroundSize: "cover",
    backgroundColor: mode === "dark" ? "#313131ff" : "#e4e4e4ff",
    backgroundPosition: "center",
    borderRadius: "20px",
    overflow: "hidden",
    color: mode === "dark" ? "#fff" : "#000",
    boxShadow: "none",
    transition: "transform 0.3s ease",
    '&:hover': {
      transform: "scale(1.015)"
    }
  }}
>
  <CardContent
    sx={{ p: 3, backgroundColor: mode === "dark" ? "#00000066" : "#ffffff66", backdropFilter: "blur(10px)" }}
    onClick={() => navigate(`/trips/${trip.id}`)}
>

    <Box display={"flex"} alignItems="center" justifyContent="space-between">
    <Typography variant="h4" fontWeight="bold" gutterBottom>
      {trip.name}
    </Typography>
    
    <AvatarGroup max={3} sx={{ mt: 1}}>
      {trip.memberProfiles?.map((m) => (
        <Tooltip title={m.name || `@${m.username}`} key={m.uid}>
          <Avatar
            sx={{
                width: 24,
                height: 24,
            }}
            src={m.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${m.uid}`}
            alt={m.name || m.username}
          />
        </Tooltip>
      ))}
    </AvatarGroup>
    </Box>

    <Box display="flex" alignItems="center" gap={1} color="text.secondary" mb={1} mt={2.5}>
      <LocationOn sx={{ fontSize: 18 }} />
      <Typography variant="body2">
        {trip.location} — {new Date(trip.startDate).toDateString()} to {new Date(trip.endDate).toDateString()}

      </Typography>
    </Box>

    {trip.budget && (
      <Box mt={2}>
        <Typography variant="caption" sx={{ color: "#ccc" }}>
          Budget Used:
        </Typography>
        <Typography variant="body2" fontWeight="medium">
          ₹{trip.budget.used || 0} / ₹{trip.budget.amount || 0}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={
            trip.budget.amount
              ? (trip.budget.used / trip.budget.amount) * 100
              : 0
          }
            sx={{
              mt: 0.5,
              borderRadius: 20,
              height: 7,
              bgcolor: mode === "dark" ? "#ffffff36" : "#00000018",
              "& .MuiLinearProgress-bar": { bgcolor: mode === "dark" ? "#ffffff" : "#3d3d3dff", borderRadius: 20 },
            }}
        />
      </Box>
    )}

    <Box mt={2}>
<Typography variant="caption" color={mode === "dark" ? "#ccc" : "#555"}>
  Timeline: {trip.timelineStats?.completed || 0} / {trip.timelineStats?.total || 0} completed
</Typography>
      <LinearProgress
        value={trip.timelineProgress || 0}
        variant="determinate"
        sx={{
          mt: 0.5,
          borderRadius: 20,
          height: 7,
          bgcolor: mode === "dark" ? "#ffffff36" : "#00000018",
          "& .MuiLinearProgress-bar": { bgcolor: mode === "dark" ? "#ffffff" : "#3d3d3dff", borderRadius: 20 },
        }}
      />
    </Box>

  </CardContent>
</Card>

      </Slide>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Container sx={{ pt: 4, pb: 10, px: 3, color: mode === "dark" ? "#fff" : "#000" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 3,
                      justifyContent: "space-between",
                      mb: 2
                    }}
                  >
                    <Button onClick={goBack} sx={{ mr: 2, width: '30px', fontSize: 3, borderRadius: 8, height: '50px', color: mode === "dark" ? "#fff" : "#000", backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0" , }}>
                      <ArrowBackIcon />
                    </Button>
                    <ProfilePic />
                  </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold" mb={0}>
            Your Trips
          </Typography>

          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ borderRadius: 8, fontWeight: "bold", width: "auto", backgroundColor: mode === "dark" ? "#fff" : "#000", color: mode === "dark" ? "#000" : "#fff" }}
            onClick={() => setCreateDialogOpen(true)}
            fullWidth
          >
            Create New Trip
          </Button>
        </Box>

        {/* Upcoming Trips */}
        <Typography variant="h6" mb={2}>Upcoming Trips</Typography>
        <Stack spacing={2}>
          {upcomingTrips.map(renderTripCard)}
        </Stack>

        {/* Past Trips */}
        <Box mt={5} sx={{ backgroundColor: mode === "dark" ? "#1f1f1f6c" : "#ffffff", p: 1, borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" onClick={() => setShowPast(!showPast)} sx={{ cursor: "pointer"}}>
            <Typography variant="h6" px={2}>Past Trips</Typography>
            <IconButton>
              {showPast ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>  
          <Collapse in={showPast}>
            <Stack spacing={2} mt={1}>
              {pastTrips.map(renderTripCard)}
            </Stack>
          </Collapse>
        </Box>

        {/* Create Trip Dialog */}
        <Drawer
          anchor="bottom"
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          fullWidth height={"100vh"}
          sx={{
            padding: 2,
            backgroundColor: mode === "dark" ? "#000000" : "#ffffff",
            color: mode === "dark" ? "#fff" : "#000",
            height: "100vh",
            '& .MuiDrawer-paper': {
              backgroundColor: mode === "dark" ? "#000000" : "#ffffff",
              color: mode === "dark" ? "#fff" : "#000",
              height: "100vh",
            }
            }}
        >
          <Typography sx={{ fontSize: 32, m: 3 }}>Create New Trip</Typography>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 0 }}>
            <TextField
              label="Trip Name"
              fullWidth
              value={newTrip.name}
              onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
            />
            <TextField
  label="From"
  fullWidth
  value={newTrip.from}
  onChange={(e) => setNewTrip({ ...newTrip, from: e.target.value })}
/>

<TextField
  label="To"
  fullWidth
  value={newTrip.to}
  onChange={(e) => setNewTrip({ ...newTrip, to: e.target.value })}
/>

            <TextField
              label="Location"
              fullWidth
              value={newTrip.location}
              onChange={(e) => setNewTrip({ ...newTrip, location: e.target.value })}
            />

<TextField
  label="Add member (username or email)"
  type="text"
  value={memberInput}
  onChange={(e) => setMemberInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddMemberByInput();
    }
  }}
  fullWidth
  placeholder="e.g. amitdev or amit@gmail.com"
  sx={{ mt: 2 }}
/>

<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
  {selectedMembers.map((user, index) => (
    <Chip
      key={user.uid}
      avatar={<Avatar src={user.photoURL || ""} />}
      label={`${user.name || user.username}`}
      onDelete={() =>
        setSelectedMembers((prev) =>
          prev.filter((m) => m.uid !== user.uid)
        )
      }
      variant="outlined"
      sx={{ backgroundColor: mode === "dark" ? "#222" : "#ccc", color: mode === "dark" ? "#fff" : "#000" }}
    />
  ))}
</Box>




{/* Chips with contribution inputs */}
<Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
  {selectedMembers.map((user, index) => (
    <Box key={user.uid} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Avatar src={user.photoURL} />
      <Box>
        <Typography>{user.name || user.username}</Typography>
        <Typography variant="caption" color="text.secondary">@{user.username}</Typography>
      </Box>
      <TextField
        label="Contribution ₹"
        type="number"
        size="small"
        value={user.contribution}
        onChange={(e) => {
          const updated = [...selectedMembers];
          updated[index].contribution = e.target.value;
          setSelectedMembers(updated);
        }}
        sx={{ width: 120 }}
      />
      {user.uid !== user?.uid && (
        <IconButton
          onClick={() => {
            setSelectedMembers((prev) =>
              prev.filter((m) => m.uid !== user.uid)
            );
          }}
        >
          <Cancel fontSize="small" />
        </IconButton>
      )}
    </Box>
  ))}
</Box>

{/* Total Display */}
<Typography sx={{ mt: 2 }} color="primary">
  Total Budget: ₹{totalContribution}
</Typography>



           <TextField
  label="Budget (₹)"
  fullWidth
  type="number"
  value={totalContribution}
  InputProps={{ readOnly: true }} // 🔒 Optional: disable manual edit
  sx={{ mt: 1 }}
/>

<TextField
  label="Start Date"
  type="date"
  fullWidth
  InputLabelProps={{ shrink: true }}
  value={newTrip.startDate}
  onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
/>

<TextField
  label="End Date"
  type="date"
  fullWidth
  InputLabelProps={{ shrink: true }}
  value={newTrip.endDate}
  onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
/>

          </DialogContent>
          <DialogActions>
            <Button sx={{ border: "1px solid #bbb", borderRadius: 8}} color={mode === "dark" ? "#ccc" : "#333"} onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" sx={{ backgroundColor: mode === "dark" ? "#ffffff" : "#000000", borderRadius: 8, color: mode === "dark" ? "#000000" : "#ffffff" }} onClick={handleCreateTrip}>Create</Button>
          </DialogActions>
        </Drawer>
      </Container>
    </ThemeProvider>
  );
}
