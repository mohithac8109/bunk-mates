import React, { useState, useEffect, useCallback } from "react";
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
  Chip,
  Slide,
  Tooltip,
  Drawer,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  Slider,
  Grid,
  Fade,
} from "@mui/material";
import {
  Add,
  ExpandMore,
  ExpandLess,
  LocationOn,
  Cancel,
  PhotoCamera,
} from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { db, auth } from "../firebase"; // <-- Make sure storage is exported!
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
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";
import Cropper from "react-easy-crop";

// Utility to create a cropped image data URL from crop details
async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );
  return canvas.toDataURL("image/png");
}

// Helper for above
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = error => reject(error);
    image.src = url;
  });
}

const LOCAL_STORAGE_KEY = "bunkmate.newTripForm";

const UNSPLASH_ACCESS_KEY = "MGCA3bsEUNBsSG6XbcqnJXckFB4dDyN5ZPKVBrD0FeQ";

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [showPast, setShowPast] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [step, setStep] = useState(0); // 0=Details, 1=Members
  const [newTrip, setNewTrip] = useState({
    name: "",
    from: "",
    to: "",
    location: "",
    startDate: "",
    endDate: "",
    iconDataUri: "",
  });
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [memberInput, setMemberInput] = useState("");
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [friendCards, setFriendCards] = useState([]);
  const [latestTripId, setLatestTripId] = useState(null);

  // Cropping state
  const [cropDrawerOpen, setCropDrawerOpen] = useState(false);
  const [uploadedImageSrc, setUploadedImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const { mode, accent } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const isDarkMode = theme.palette.mode === 'dark'
  const navigate = useNavigate();
  const user = auth.currentUser;
  const history = useNavigate();
  const [randomNatureImage, setRandomNatureImage] = useState("");

  useEffect(() => {
    if (createDialogOpen && !newTrip.iconDataUri) {
      fetch("https://api.unsplash.com/photos/random?query=nature&orientation=squarish&client_id=" + UNSPLASH_ACCESS_KEY)
        .then(res => res.json())
        .then(data => {
          if (data && data.urls && data.urls.small) {
            setRandomNatureImage(data.urls.small);
          }
        })
        .catch(() => setRandomNatureImage(""));
    }
    // Optionally, reset image between dialog opens:
    if (!createDialogOpen) setRandomNatureImage("");
  }, [createDialogOpen, newTrip.iconDataUri]);

  useEffect(() => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    setNewTrip(JSON.parse(saved));
  }
}, []);

useEffect(() => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newTrip));
}, [newTrip]);


  // Fetch trips on mount
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "trips"), where("members", "array-contains", user.uid));
    const unsubscribe = onSnapshot(q, async snapshot => {
      const allTrips = await Promise.all(
        snapshot.docs.map(async docSnap => {
          const trip = { id: docSnap.id, ...docSnap.data() };
          const userBudgetRef = doc(db, "budgets", user.uid);
          const budgetSnap = await getDoc(userBudgetRef);
          if (budgetSnap.exists()) {
            const budgetDoc = budgetSnap.data();
            const matchingItem = Array.isArray(budgetDoc.items)
              ? budgetDoc.items.find(item => item.tripId === trip.id)
              : null;
            if (matchingItem) {
              const used = Array.isArray(matchingItem.expenses)
                ? matchingItem.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
                : 0;
              trip.budget = { ...matchingItem, used };
            } else {
              trip.budget = null;
            }
          } else {
            trip.budget = null;
          }
          const memberSnapshots = await Promise.all(trip.members.map(uid => getDoc(doc(db, "users", uid))));
          trip.memberProfiles = memberSnapshots.filter(s => s.exists()).map(s => {
            const data = s.data();
            return {
              uid: s.id,
              photoURL: data.photoURL || "",
              name: data.name || "",
              username: data.username || "",
            };
          });
          const groupChatSnap = await getDoc(doc(db, "groupChats", trip.id));
          trip.iconURL = groupChatSnap.exists() ? groupChatSnap.data().iconURL || null : null;

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

  // Ensure creator added as member
  useEffect(() => {
    if ((createDialogOpen || step === 1) && user) {
      if (!selectedMembers.some(m => m.uid === user.uid)) {
        setSelectedMembers(prev => [
          ...prev,
          {
            uid: user.uid,
            name: user.displayName || "You",
            username: user.email?.split("@")[0] || "you",
            email: user.email,
            photoURL: user.photoURL || "",
            contribution: "",
          },
        ]);
      }
    }
  }, [createDialogOpen, step, user]);

  // Stepper navigation
  const handleNext = () => {
    const { name, from, to, location, startDate, endDate } = newTrip;
    if (!name || !from || !to || !location || !startDate || !endDate) {
      alert("Please fill all trip details.");
      return;
    }
    setStep(1);
  };
  const handleBack = () => setStep(prev => prev - 1);

  // Upload handler: read as data URL, open crop drawer
const handleIconUpload = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    setUploadedImageSrc(reader.result);
    setCropDrawerOpen(true);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };
  reader.readAsDataURL(file);
};


  // When cropping complete, update croppedAreaPixels
  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create group icon only from cropped portion (data uri)
  const handleContinueCrop = async () => {
    if (!uploadedImageSrc || !croppedAreaPixels) {
      alert("Please complete cropping.");
      return;
    }
    const dataUri = await getCroppedImg(uploadedImageSrc, croppedAreaPixels);
    setNewTrip(prev => ({ ...prev, iconDataUri: dataUri }));
    setCropDrawerOpen(false);
  };

  // User search for member autocomplete
  const handleSearchUsers = async input => {
    if (!input) {
      setUserSuggestions([]);
      return;
    }
    const q = query(collection(db, "users"), where("keywords", "array-contains", input.toLowerCase()));
    const snap = await getDocs(q);
    setUserSuggestions(
      snap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        contribution: "",
      }))
    );
  };

  // Fetch friends for pre-suggestions
  useEffect(() => {
    if (!user) return;
    (async () => {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const friends = snap.data().friends || [];
        const friendsData = await Promise.all(friends.map(uid => getDoc(doc(db, "users", uid))));
        setFriendCards(
          friendsData.filter(f => f.exists()).map(f => ({
            uid: f.id,
            ...f.data(),
            contribution: "",
          }))
        );
      }
    })();
  }, [user, step]);

  // Add member if not already selected
  const handleAddMember = member => {
    if (!selectedMembers.some(m => m.uid === member.uid)) {
      setSelectedMembers(prev => [...prev, member]);
    }
    setMemberInput("");
    setUserSuggestions([]);
  };

  const handleRemoveMember = uid => setSelectedMembers(prev => prev.filter(m => m.uid !== uid));
  const handleContributionChange = (idx, value) => {
    setSelectedMembers(prev => {
      const updated = [...prev];
      updated[idx].contribution = value;
      return updated;
    });
  };

  const handleCreateTrip = async () => {
    const { name, from, to, location, startDate, endDate, iconDataUri } = newTrip;
    if (selectedMembers.length === 0) {
      alert("Please add at least one member.");
      return;
    }
    const iconURL = iconDataUri ? iconDataUri : randomNatureImage;
    const members = selectedMembers.map(m => m.uid);
    const contributors = selectedMembers.map(m => ({
      uid: m.uid,
      name: m.name || m.username,
      amount: parseInt(m.contribution || 0),
    }));
    const total = contributors.reduce((sum, c) => sum + c.amount, 0);

  try {
    const tripDoc = await addDoc(collection(db, "trips"), {
      name,
      from,
      to,
      location,
      startDate,
      endDate,
      members,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    });
    setLatestTripId(tripDoc.id);

    await setDoc(doc(db, "groupChats", tripDoc.id), {
      tripId: tripDoc.id,
      name: `${from} - to - ${location} Trip`,
      members,
      description: `Group for ${from} to ${to}`,
      inviteAccess: "all",
      emoji: "",
      iconURL, // <-- here!
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
    });

      // Budget for group
      await setDoc(doc(db, "budgets", tripDoc.id), {
        tripId: tripDoc.id,
        tripName: name,
        total,
        used: 0,
        contributors,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
      });

      // Update each contributor's personal budget
      await Promise.all(
        contributors.map(async c => {
          const userRef = doc(db, "budgets", c.uid);
          const userBudgetSnap = await getDoc(userRef);
          const newItem = {
            amount: total,
            category: "Tour",
            name,
            tripId: tripDoc.id,
            contributors,
            createdAt: new Date(),
            expenses: [],
          };
          if (!userBudgetSnap.exists()) {
            await setDoc(userRef, { items: [newItem] });
          } else {
            await updateDoc(userRef, { items: arrayUnion(newItem) });
          }
        })
      );

      setStep(0);
      setCreateDialogOpen(false);
      setNewTrip({
        name: "",
        from: "",
        to: "",
        location: "",
        startDate: "",
        endDate: "",
        iconDataUri: "",
      });
      setSelectedMembers([]);
      setUploadedImageSrc(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } catch (error) {
      alert("Error occurred while creating trip: " + error.message);
    }
  };

  const totalContribution = selectedMembers.reduce(
    (sum, m) => sum + (parseInt(m.contribution) || 0),
    0
  );

  const goBack = () => {
    history("/");
  };

  const today = new Date();
  const upcomingTrips = trips.filter(trip => new Date(trip.endDate || trip.startDate) >= today);
  const pastTrips = trips.filter(trip => new Date(trip.endDate || trip.startDate) < today);

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
      <Container sx={{ pt: 4, pb: 10, px: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 3,
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Button
            onClick={goBack}
            sx={{
              mr: 2,
              width: "30px",
              fontSize: 3,
              borderRadius: 8,
              height: "50px",
              color: mode === "dark" ? "#fff" : "#000",
              backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
            }}
          >
            <ArrowBackIcon />
          </Button>
          <ProfilePic />
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography
            variant="h5"
            fontWeight="bold"
            mb={0}
            sx={{ color: mode === "dark" ? "#fff" : "#000" }}
          >
            Your Trips
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              borderRadius: 8,
              fontWeight: "bold",
              width: "auto",
              backgroundColor: mode === "dark" ? "#fff" : "#000",
              color: mode === "dark" ? "#000" : "#fff",
            }}
            onClick={() => setCreateDialogOpen(true)}
            fullWidth
          >
            Create New Trip
          </Button>
        </Box>

        {/* Upcoming Trips */}
        <Typography variant="h6" mb={2} sx={{ color: mode === "dark" ? "#fff" : "#000" }}>Upcoming Trips</Typography>
        <Stack spacing={2}>
          {upcomingTrips.map(renderTripCard)}
        </Stack>

        {/* Past Trips */}
        <Box mt={5} sx={{ backgroundColor: mode === "dark" ? "#1f1f1f6c" : "#ffffff", p: 1, borderRadius: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" onClick={() => setShowPast(!showPast)} sx={{ cursor: "pointer"}}>
            <Typography variant="h6" px={2} sx={{ color: mode === "dark" ? "#fff" : "#000" }}>Past Trips</Typography>
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

        {/* Create Trip Drawer */}
<Drawer
  anchor="bottom"
  open={createDialogOpen}
  onClose={() => {
    setCreateDialogOpen(false);
    setStep(0);
    setUploadedImageSrc(null);
  }}
  sx={{
    "& .MuiDrawer-paper": {
      height: "100vh",
      backgroundColor: mode === "dark" ? "#000000ff" : "#ffffff",
      color: mode === "dark" ? "#fff" : "#000",
      height: "100vh",
      p: 3,
      boxShadow: 6,
      position: "relative"
    },
  }}
>

<Box display={"flex"} alignItems={"center"} sx={{ mb: 4 }}>
  <Typography variant="h5" fontWeight={"bolder"}>Create a trip</Typography>
  {/* 🔻 Close Button */}
  <IconButton
    onClick={() => {
      setCreateDialogOpen(false);
      setStep(0);
      setUploadedImageSrc(null);
    }}
    sx={{
      position: "absolute",
      top: 12,
      right: 12,
      zIndex: 10,
      backgroundColor: "rgba(0,0,0,0.05)",
      "&:hover": { backgroundColor: "rgba(0,0,0,0.1)" }
    }}
  >
    <CloseOutlinedIcon />
  </IconButton>
</Box>

  {/* 🧭 Stepper */}
<Stepper
  activeStep={step}
  alternativeLabel
  sx={{
    backgroundColor: mode === "dark" ? "#33333377" : "#f1f1f1",
    py: 2,
    borderRadius: 4,
    mx: 2,
    mb: 4,
    "& .MuiStepIcon-root": {
      color: mode === "dark" ? "#555" : "transparent", // make default inactive icon background transparent
      borderRadius: "50%",
    },
    "& .MuiStepIcon-root.Mui-completed": {
      color: "#4caf50", // completed
    },
    "& .MuiStepIcon-root.Mui-active": {
      color: mode === "dark" ? "#fff" : "#ffffffff", // active
      border: mode === "dark" ? "1.2px solid #fff" : "1.2px solid #333"
    },
    "& .MuiStepLabel-label": {
      fontWeight: 500,
      fontSize: 14,
      color: mode === "dark" ? "#999" : "#444", // label default
    },
    "& .MuiStepLabel-label.Mui-active": {
      color: mode === "dark" ? "#fff" : "#000", // active
    },
    "& .MuiStepLabel-label.Mui-completed": {
      color: "#4caf50", // completed
    },
  }}
>
  <Step>
    <StepLabel>Trip Details</StepLabel>
  </Step>
  <Step>
    <StepLabel>Add Members</StepLabel>
  </Step>
</Stepper>

  {/* 📦 Content with Fade Transition */}
  <Fade in>
    <Box>
      {/* STEP 0 */}
      {step === 0 && (
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

<Box sx={{ display: "flex", alignItems: "center", gap: 2, mx: "auto" }}>
  <Box
    sx={{
      position: "relative",
      mb: 2,
      "&:hover .hover-preview": {
        opacity: 1,
      }
    }}
  >
    <Avatar
      src={
            newTrip.iconDataUri
              ? newTrip.iconDataUri
              : randomNatureImage ||
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=56&q=80"
      }
      sx={{ width: 196, height: 196, borderRadius: 7}}
    />

  <Button
    component="label"
      sx={{
        position: "absolute",
        bottom: 5,
        right: 5,
        width: 56,
        height: 56,
        borderRadius: "23px 10px",
        border: "none",
        backgroundColor: mode === "dark" ? "#000000a1" : "#ffffffff",
        backdropFilter: "blur(30px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: mode === "dark" ? "#ffffff86" : "#000000ff",
        transition: "opacity 0.3s ease",
        fontSize: 12,
      }}
  ><PhotoCamera />
    <input type="file" accept="image/*" hidden onChange={handleIconUpload} />
  </Button>
  </Box>

</Box>

          {/* Form Fields */}
          <TextField
            label="Trip Name"
            fullWidth
            value={newTrip.name}
            onChange={e => setNewTrip({ ...newTrip, name: e.target.value })}
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
              borderRadius: 4,
              boxShadow: "none",
              '& .MuiInputLabel-root.Mui-focused': {
                color: mode === "dark" ? "#fff" : "#000",
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                '& fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                },
                '&:hover fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                  boxShadow: "none",
                  color: mode === "dark" ? "#fff" : "#000"
                },
                backgroundColor: 'inherit',
              },
              input: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
              },
              label: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
              },
            }}
          />

          <TextField
            label="From"
            fullWidth
            value={newTrip.from}
            onChange={e => setNewTrip({ ...newTrip, from: e.target.value })}
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
              borderRadius: 4,
              boxShadow: "none",
              '& .MuiInputLabel-root.Mui-focused': {
                color: mode === "dark" ? "#fff" : "#000",
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                '& fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                },
                '&:hover fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                  boxShadow: "none",
                  color: mode === "dark" ? "#fff" : "#000"
                },
                backgroundColor: 'inherit',
              },
              input: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
              },
              label: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
              },
            }}
          />

          <TextField
            label="To"
            fullWidth
            value={newTrip.to}
            onChange={e => setNewTrip({ ...newTrip, to: e.target.value })}
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
              borderRadius: 4,
              boxShadow: "none",
              '& .MuiInputLabel-root.Mui-focused': {
                color: mode === "dark" ? "#fff" : "#000",
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                '& fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                },
                '&:hover fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                  boxShadow: "none",
                  color: mode === "dark" ? "#fff" : "#000"
                },
                backgroundColor: 'inherit',
              },
              input: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
              },
              label: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
              },
            }}
          />

          <TextField
            label="Route/Location"
            fullWidth
            value={newTrip.location}
            onChange={e => setNewTrip({ ...newTrip, location: e.target.value })}
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
              borderRadius: 4,
              boxShadow: "none",
              '& .MuiInputLabel-root.Mui-focused': {
                color: mode === "dark" ? "#fff" : "#000",
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                '& fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                },
                '&:hover fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                  boxShadow: "none",
                  color: mode === "dark" ? "#fff" : "#000"
                },
                backgroundColor: 'inherit',
              },
              input: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
              },
              label: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
              },
            }}
          />

          <Box gap={1.5} display={"flex"} flexDirection={"row"}>
              <TextField
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newTrip.startDate}
                onChange={e => setNewTrip({ ...newTrip, startDate: e.target.value })}
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
              borderRadius: 4,
              boxShadow: "none",
              '& .MuiInputLabel-root.Mui-focused': {
                color: mode === "dark" ? "#fff" : "#000",
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                '& fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                },
                '&:hover fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                  boxShadow: "none",
                  color: mode === "dark" ? "#fff" : "#000"
                },
                backgroundColor: 'inherit',
              },
              input: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
              },
              label: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
              },
            }}
              />
              <TextField
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newTrip.endDate}
                onChange={e => setNewTrip({ ...newTrip, endDate: e.target.value })}
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
              borderRadius: 4,
              boxShadow: "none",
              '& .MuiInputLabel-root.Mui-focused': {
                color: mode === "dark" ? "#fff" : "#000",
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 4,
                '& fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                },
                '&:hover fieldset': {
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                },
                '&.Mui-focused fieldset': {
                  borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                  boxShadow: "none",
                  color: mode === "dark" ? "#fff" : "#000"
                },
                backgroundColor: 'inherit',
              },
              input: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
              },
              label: {
                color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
              },
            }}
              />
          </Box>

          {/* Footer Actions */}
<DialogActions
  sx={{
    justifyContent: "space-between",
    mt: 3,
    px: 0,
    pb: 2,
  }}
>
  <Button
    fullWidth
    onClick={() => {
      setCreateDialogOpen(false);
      setStep(0);
      setUploadedImageSrc(null);
    }}
    sx={{
      color: mode === "dark" ? "#aaa" : "#666",
      textTransform: "none",
      fontWeight: 500,
      borderRadius: 8,
      border: mode === "dark" ? "1.2px solid #f1f1f1" : "1.2px solid #333",
      "&:hover": {
        backgroundColor: mode === "dark" ? "#2a2a2a" : "#f1f1f1",
      },
    }}
  >
    Cancel
  </Button>

  <Button
    variant="contained"
    fullWidth
    onClick={handleNext}
    sx={{
      backgroundColor: mode === "dark" ? "#fff" : "#000",
      color: mode === "dark" ? "#000" : "#fff",
      textTransform: "none",
      fontWeight: 600,
      px: 3,
      borderRadius: 8,
      "&:hover": {
        backgroundColor: mode === "dark" ? "#ddd" : "#333",
      },
    }}
  >
    Next
  </Button>
</DialogActions>
        </DialogContent>
      )}

  {/* Step 1: Add Members */}
  {step === 1 && (
    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
<Autocomplete
  freeSolo
  options={userSuggestions}
  getOptionLabel={option =>
    `${option.name || option.username}${option.email ? " (" + option.email + ")" : ""}`
  }
  inputValue={memberInput}
  onInputChange={(_, val) => {
    setMemberInput(val);
    handleSearchUsers(val);
  }}
  onChange={(_, value) => value && handleAddMember(value)}
  renderInput={params => (
    <TextField
      {...params}
      label="Search user by username or email"
      fullWidth
      variant="outlined"
      sx={{
        bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
        borderRadius: 4,
        boxShadow: "none",
        '& .MuiInputLabel-root.Mui-focused': {
          color: mode === "dark" ? "#fff" : "#000",
        },
        '& .MuiOutlinedInput-root': {
          borderRadius: 4,
          '& fieldset': {
            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
          },
          '&:hover fieldset': {
            borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
          },
          '&.Mui-focused fieldset': {
            borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
            boxShadow: "none",
            color: mode === "dark" ? "#fff" : "#000"
          },
          backgroundColor: 'inherit',
        },
        input: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
        },
        label: {
          color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
        },
      }}
    />
  )}
  renderOption={(props, option) => (
    <Box
      component="li"
      {...props}
      key={option.uid}
      sx={{
        display: "flex",
        alignItems: "center",
        px: 1.5,
        py: 1,
        gap: 1,
        backgroundColor: isDarkMode ? "#2a2a2a" : "#fff",
        "&:hover": {
          backgroundColor: isDarkMode ? "#3a3a3a" : "#f5f5f5",
        },
        borderBottom: `1px solid ${isDarkMode ? "#444" : "#e0e0e0"}`
      }}
    >
      <Avatar
        src={option.photoURL || ""}
        sx={{ width: 28, height: 28 }}
      />
      <Box>
        <Typography variant="body2" color={isDarkMode ? "#fff" : "#000"}>
          {option.name || option.username}
        </Typography>
        <Typography variant="caption" color={isDarkMode ? "#aaa" : "#666"}>
          {option.email}
        </Typography>
      </Box>
    </Box>
  )}
/>

      {friendCards.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>Your Friends</Typography>
          <Stack
  direction="row"
  spacing={2}
  sx={{
    overflowX: "auto",
    pb: 1,
    "&::-webkit-scrollbar": { height: 6 },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme => theme.palette.mode === "dark" ? "#444" : "#ccc",
      borderRadius: 3,
    },
  }}
>
  {friendCards.map(friend => (
    <Card
      key={friend.uid}
      elevation={3}
      sx={{
        p: 2,
        minWidth: 120,
        flexShrink: 0,
        borderRadius: 4,
        transition: "transform 0.2s ease",
        boxShadow: "none",
        backgroundColor: mode === "dark" ? "#1e1e1eff" : "#f1f1f1",
        "&:hover": {
          transform: "scale(1.03)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Avatar
          src={friend.photoURL || ""}
          sx={{ width: 56, height: 56, mb: 1 }}
        />
        <Typography
          variant="subtitle1"
          sx={{ textAlign: "center", mb: 0, fontWeight: "bolder" }}
        >
          {friend.name || friend.username}
        </Typography>
        <Typography
          variant="caption"
          sx={{ textAlign: "center", mb: 1, color: "#8f8f8fff" }}
        >
          @{friend.username || friend.username}
        </Typography>
        <Button
          size="small"
          variant="contained"
          sx={{
            backgroundColor: mode === "dark" ? "#fff" : "#000",
            color: mode === "dark" ? "#000" : "#fff",
            borderRadius: 8,
            boxShadow: "none",
            mt: 1,
          }}
          onClick={() => handleAddMember(friend)}
        >
          + Add
        </Button>
      </Box>
    </Card>
  ))}
</Stack>

        </Box>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {selectedMembers.map(user => (
          <Chip
            key={user.uid}
            avatar={<Avatar src={user.photoURL || ""} />}
            label={user.name || user.username}
            onDelete={() => handleRemoveMember(user.uid)}
          />
        ))}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {selectedMembers.map((user, idx) => (
          <Box key={user.uid} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar src={user.photoURL} />
            <Box>
              <Typography>{user.name || user.username}</Typography>
              <Typography variant="caption" color="text.secondary">
                @{user.username}
              </Typography>
            </Box>
            <TextField
              label="Contribution ₹"
              type="number"
              size="small"
              value={user.contribution}
              onChange={e => handleContributionChange(idx, e.target.value)}
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#fafafa',
                borderRadius: 4,
                width: 90,
                boxShadow: "none",
                '& .MuiInputLabel-root.Mui-focused': {
                  color: mode === "dark" ? "#fff" : "#000",
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                  '& fieldset': {
                    borderColor: (theme) => (theme.palette.mode === 'dark' ? '#555' : '#c1c1c1ff'),
                  },
                  '&:hover fieldset': {
                    borderColor: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#aaa'),
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: (theme) => mode === 'dark' ? '#ffffffff' : '#000000ff',
                    boxShadow: "none",
                    color: mode === "dark" ? "#fff" : "#000"
                  },
                  backgroundColor: 'inherit',
                },
                input: {
                  color: (theme) => (theme.palette.mode === 'dark' ? '#eee' : '#222'),
                },
                label: {
                  color: (theme) => (theme.palette.mode === 'dark' ? '#bbb' : '#666'),
                },
              }}
            />
          </Box>
        ))}
      </Box>

<Typography
  variant="h6"
  sx={{
    display: "flex",
    alignItems: "center",
    mt: 2,
    px: 2,
    py: 1,
    gap: 1,
    borderRadius: 2,
    color: isDarkMode ? "#fff" : "#000",
    boxShadow: "none",
    textAlign: "center",
    maxWidth: "fit-content",
    mx: "auto",
  }}
>
  Total Budget: 
  <Typography
    sx={{
      px: 2,
      py: 1,
      fontWeight: 600,
      borderRadius: 2,
      backgroundColor: theme => theme.palette.mode === "dark" ? "#1e1e1e" : "#f0f0f0",
      color: isDarkMode ? "#fff" : "#000",
      boxShadow: "none",
      textAlign: "center",
      maxWidth: "fit-content",
      mx: "auto",
    }}
  >
    ₹{totalContribution}
  </Typography>
</Typography>

<DialogActions
  sx={{
    justifyContent: "space-between",
    mt: 3,
    px: 0,
    pb: 2,
  }}
>
  <Button
    fullWidth
    onClick={handleBack}
    sx={{
      color: mode === "dark" ? "#aaa" : "#666",
      textTransform: "none",
      fontWeight: 500,
      borderRadius: 8,
      border: mode === "dark" ? "1.2px solid #f1f1f1" : "1.2px solid #333",
      "&:hover": {
        backgroundColor: mode === "dark" ? "#2a2a2a" : "#f1f1f1",
      },
    }}
  >
    Back
  </Button>

  <Button
    variant="contained"
    fullWidth
    onClick={handleCreateTrip}
    sx={{
      backgroundColor: mode === "dark" ? "#fff" : "#000",
      color: mode === "dark" ? "#000" : "#fff",
      textTransform: "none",
      fontWeight: 600,
      px: 3,
      borderRadius: 8,
      "&:hover": {
        backgroundColor: mode === "dark" ? "#ddd" : "#333",
      },
    }}
  >
    Create Trip
  </Button>
</DialogActions>
    </DialogContent>
  )}
  </Box>
  </Fade>
</Drawer>


        {/* Crop Drawer */}
        <Drawer
          anchor="bottom"
          open={cropDrawerOpen}
          onClose={() => setCropDrawerOpen(false)}
        ModalProps={{
          BackdropProps: {
            sx: {
              p: 3,
              backgroundColor: mode === "dark" ? "#0000000d" : "#0000000d",
              backdropFilter: "blur(5px)",
            },
          },
        }}
        PaperProps={{
          sx: {
            p: 3,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "70vh",
            overflowY: "auto",
            backgroundColor: mode === "dark" ? "#000000ff" : "#fff",
            boxShadow: "none"
          },
        }}
        >
          <DialogContent
            sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              height: "100%",
              p: 2,
            }}
          >
            {uploadedImageSrc && (
<Box
  sx={{
    position: "relative",
    height: 300,
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: mode === "dark" ? "#121212" : "#fcfcfca9",
    boxShadow: "none",
    border: theme => theme.palette.mode === "dark"
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(0,0,0,0.05)"
  }}
>
  <Cropper
    image={uploadedImageSrc}
    crop={crop}
    zoom={zoom}
    aspect={1}
    cropShape="rect"
    onCropChange={setCrop}
    onZoomChange={setZoom}
    onCropComplete={onCropComplete}
    showGrid={false}
  />
</Box>

            )}
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Zoom</Typography>
<Slider
  value={zoom}
  min={1}
  max={3}
  step={0.01}
  onChange={(_, value) => setZoom(value)}
  sx={{
    mx: "auto",
    color: mode === "dark" ? "#fff" : "#000",
    height: 20,
    '& .MuiSlider-thumb': {
      height: 22,
      width: 22,
      backgroundColor: mode === "dark" ? "#000000ff" : "#ffffffff",
      border: "2px solid",
      borderColor: mode === "dark" ? "#ffffffff" : "#000000ff",
      transition: "0.3s ease",
      '&:hover': {
        boxShadow: `0 0 0 10px ${mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
      },
    },
    '& .MuiSlider-track': {
      border: "none",
      backgroundColor: mode === "dark" ? "#fff" : "#000",
    },
    '& .MuiSlider-rail': {
      opacity: 0.2,
      backgroundColor: mode === "dark" ? "#555" : "#ccc",
    },
    '& .MuiSlider-valueLabel': {
      backgroundColor: mode === "dark" ? "#222" : "#eee",
      color: mode === "dark" ? "#fff" : "#000",
      borderRadius: 2,
      fontSize: 12,
    },
  }}
/>

            </Box>
            <DialogActions>
  <Button
    onClick={() => setCropDrawerOpen(false)}
    fullWidth
    variant="outlined"
    sx={{
      px: 3,
      py: 1,
      borderRadius: 8,
      textTransform: "none",
      fontWeight: 500,
      color: mode === "dark" ? "#fff" : "#000",
      borderColor: mode === "dark" ? "#888" : "#000",
      '&:hover': {
        borderColor: mode === "dark" ? "#aaa" : "#000",
        backgroundColor: mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      },
    }}
  >
    Cancel
  </Button>

  <Button
    variant="contained"
    fullWidth
    onClick={handleContinueCrop}
    sx={{
      px: 3,
      py: 1,
      borderRadius: 8,
      textTransform: "none",
      fontWeight: 500,
      backgroundColor: mode === "dark" ? "#fff" : "#000",
      color: mode === "dark" ? "#000" : "#fff",
      '&:hover': {
        backgroundColor: mode === "dark" ? "#e6e6e6ff" : "#1d1d1dff",
      },
    }}
  >
    Continue
  </Button>

            </DialogActions>
          </DialogContent>
        </Drawer>

      </Container>
    </ThemeProvider>
  );
}
