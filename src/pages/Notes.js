import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Fab,
  Drawer,
  TextField,
  Stack,
  CircularProgress,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  SwipeableDrawer,
  Collapse,
  Avatar,
  ThemeProvider,
  createTheme,
  keyframes,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import CodeIcon from "@mui/icons-material/Code";
import PushPinIcon from "@mui/icons-material/PushPin";
import LabelIcon from "@mui/icons-material/Label";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

import { db } from "../firebase";
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
  getDoc,
  setDoc,
  arrayUnion,
  onSnapshot
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Navigate } from "react-router-dom";
import ProfilePic from "../components/Profile";
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import BetaAccessGuard from "../components/BetaAccessGuard";
import DeviceGuard from "../components/DeviceGuard";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
}

function getCookie(name) {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
}


const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px);}
  to { opacity: 1; transform: translateY(0);}
`;

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

const fetchUserInfo = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }
  } catch (e) {
    // ignore
  }
  return null;
};

const WEATHER_STORAGE_KEY = "bunkmate_weather";

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuIndex, setMenuIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [shareDrawerOpen, setShareDrawerOpen] = useState(false);
  const [shareUsername, setShareUsername] = useState("");
  const [sharedWith, setSharedWith] = useState([]);
  const [sharedUsersInfo, setSharedUsersInfo] = useState({});
  const [expanded, setExpanded] = useState(false);
  const noteContentRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [noteLabels, setNoteLabels] = useState([]); // For add/edit
  const [selectedNoteLabels, setSelectedNoteLabels] = useState([]); // For view
  const [collaborators, setCollaborators] = useState([]); // For add/edit
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [addCollaboratorDrawerOpen, setAddCollaboratorDrawerOpen] = useState(false);
  const [addCollabDrawerOpen, setAddCollabDrawerOpen] = useState(false);
  const [addLabelDrawerOpen, setAddLabelDrawerOpen] = useState(false);
  const [newCollaboratorUsername, setNewCollaboratorUsername] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [sortOption, setSortOption] = useState(() => localStorage.getItem("noteSortOption") || "newest");
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("noteViewMode") || "list");
  const [selectedLabelFilter, setSelectedLabelFilter] = useState(() => localStorage.getItem("noteLabelFilter") || "All");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const history = useNavigate();
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  
  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);

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
}, []); // ✅ keep this


useEffect(() => {
  const savedSort = localStorage.getItem("noteSortOption");
  const savedView = localStorage.getItem("noteViewMode");
  const savedLabel = localStorage.getItem("noteLabelFilter");

  if (savedSort) setSortOption(savedSort);
  if (savedView) setViewMode(savedView);
  if (savedLabel) setSelectedLabelFilter(savedLabel);
}, []);

useEffect(() => {
  localStorage.setItem("noteSortOption", sortOption);
}, [sortOption]);

useEffect(() => {
  localStorage.setItem("noteViewMode", viewMode);
}, [viewMode]);

useEffect(() => {
  localStorage.setItem("noteLabelFilter", selectedLabelFilter);
}, [selectedLabelFilter]);



useEffect(() => {
  if (!user) {
    const u = getUserFromStorage();
    if (u) {
      setUser(u);
    }
  }
  // Do NOT include `user` in dependencies
}, []);


const fetchNotes = async (currentUser) => {
  setLoading(true);
  try {
    if (!currentUser) {
      setNotes([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "notes"),
      where("owners", "array-contains", currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    const data = [];
    querySnapshot.forEach((doc) => {
      const note = { id: doc.id, ...doc.data() };
      data.push(note);
    });
    // Sort notes by createdAt descending (most recent first)
    data.sort((a, b) => {
      // Handle Firestore Timestamp or JS Date or string
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return bTime - aTime;
    });
    setNotes(data);
  } catch (err) {
    setNotes([]);
    console.error("Error fetching notes:", err); // Debug
  }
  setLoading(false);
};

useEffect(() => {
  if (!user || !user.uid) {
    setNotes([]);
    return;
  }

  const q = query(
    collection(db, "notes"),
    where("owners", "array-contains", user.uid)
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const data = [];
    querySnapshot.forEach((doc) => {
      const note = { id: doc.id, ...doc.data() };
      data.push(note);
    });

    // ✅ Add "shared" label if user is not an owner
    const processed = data.map((note) => {
      const isNotOwner = !note.owners?.includes(user.uid);
      const labelSet = new Set(note.labels || []);
      if (isNotOwner) labelSet.add("shared");
      return {
        ...note,
        labels: Array.from(labelSet),
      };
    });

    // ✅ Sort notes by time
    processed.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return bTime - aTime;
    });

    setNotes(processed);
    setLoading(false);
  });

  return () => unsubscribe();
}, [user]);

useEffect(() => {
  const labelSet = new Set();
  notes.forEach((note) => {
    (note.labels || []).forEach((label) => {
      labelSet.add(label);
    });
  });
  const sortedLabels = Array.from(labelSet).sort((a, b) => a.localeCompare(b));
  setLabels(sortedLabels);
}, [notes]);


  // When opening edit drawer, set collaborators and labels
  useEffect(() => {
    if (editDrawerOpen && selectedNote) {
      setCollaborators(selectedNote.sharedWith || []);
      setNoteLabels(selectedNote.labels || []);
    }
    if (drawerOpen) {
      setCollaborators([]);
      setNoteLabels([]);
    }
  }, [editDrawerOpen, drawerOpen, selectedNote]);

  // When viewing a note, show its labels
  useEffect(() => {
    if (viewDrawerOpen && selectedNote) {
      setSelectedNoteLabels(selectedNote.labels || []);
    }
  }, [viewDrawerOpen, selectedNote]);

  // --- Collaborator add/remove logic for add/edit ---
  const handleAddCollaborator = async () => {
    if (!collaboratorInput.trim()) return;
    // Find user by username
    const q = query(collection(db, "users"), where("username", "==", collaboratorInput.trim()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const shareUid = userDoc.id;
      if (!collaborators.includes(shareUid) && shareUid !== user.uid) {
        setCollaborators(prev => [...prev, shareUid]);
      }
      setCollaboratorInput("");
    } else {
      setError("User not found!");
    }
  };
  const handleRemoveCollaborator = (uid) => {
    setCollaborators(prev => prev.filter(id => id !== uid));
  };

const handleAddCollaboratorFromDrawer = async () => {
  if (!newCollaboratorUsername.trim()) return;

  try {
    const q = query(
      collection(db, "users"),
      where("username", "==", newCollaboratorUsername.trim())
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty && selectedNote?.id) {
      const userDoc = snapshot.docs[0];
      const shareUid = userDoc.id;

      if (shareUid === user.uid) {
        setError("You cannot share with yourself.");
        return;
      }

      const noteRef = doc(db, "notes", selectedNote.id);

      // Add both the current user and collaborator to owners and sharedWith
      await updateDoc(noteRef, {
        sharedWith: arrayUnion(shareUid),
        owners: arrayUnion(user.uid, shareUid)
      });

      // Update local state
      if (!collaborators.includes(shareUid)) {
        setCollaborators(prev => [...prev, shareUid]);
      }

      setNewCollaboratorUsername("");
      setAddCollaboratorDrawerOpen(false);
      setAddCollabDrawerOpen(false);
      setError("");
    } else {
      setError("User not found or no note selected.");
    }
  } catch (error) {
    console.error("Error adding collaborator:", error);
    setError("Something went wrong. Please try again.");
  }
};

  // --- Label add/remove logic for add/edit ---
  const handleToggleLabel = (label) => {
    setNoteLabels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

    const handleAddCustomLabel = () => {
    if (!newLabel.trim()) return;
    if (!labels.includes(newLabel.trim())) {
      setLabels(prev => [...prev, newLabel.trim()]);
    }
    setNoteLabels(prev => [...prev, newLabel.trim()]);
    setNewLabel("");
    setAddLabelDrawerOpen(false);
  };

  // --- Pin note logic ---
  const handlePinNote = async (note) => {  
    await updateDoc(doc(db, "notes", note.id), {
      pinned: !note.pinned,
    });
    fetchNotes(user);
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "notes"), {
      owners: [user.uid],
      title: noteTitle,
      content: noteContent,
      createdAt: new Date(),
      sharedWith: collaborators,
      labels: noteLabels,
      pinned: false,
    });
    setNoteTitle("");
    setNoteContent("");
    setDrawerOpen(false);
    setSaving(false);
    fetchNotes(user);
  };

  // --- Edit Note ---
  const handleEditNote = async () => {
    if (!selectedNote || (!noteTitle.trim() && !noteContent.trim())) return;
    setSaving(true);
    await updateDoc(doc(db, "notes", selectedNote.id), {
      title: noteTitle,
      content: noteContent,
      sharedWith: collaborators,
      labels: noteLabels,
    });
    setEditDrawerOpen(false);
    setSelectedNote(true);
    setSaving(false);
    fetchNotes(user);
  };

  const handleDeleteNote = async (id) => {
    await deleteDoc(doc(db, "notes", id));
    fetchNotes(user);
  };

  const handleMenuOpen = (event, index) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuIndex(index);
  };
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuIndex(null);
  };

  const handleShareNote = (note) => {
    setSelectedNote(note);
    setShareDrawerOpen(true);
    setShareUsername("");
    setSharedWith(note.sharedWith || []);
  };

  const handleShareWithUser = async () => {
    if (!shareUsername.trim()) return;
    // Find user by username
    const q = query(collection(db, "users"), where("username", "==", shareUsername.trim()));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      const shareUid = userDoc.id;
      // Update note's sharedWith and owners
      await updateDoc(doc(db, "notes", selectedNote.id), {
        sharedWith: [...(selectedNote.sharedWith || []), shareUid],
        owners: Array.from(new Set([...(selectedNote.owners || []), shareUid])),
      });
      setSharedWith((prev) => [...prev, shareUid]);
      setShareUsername("");
      fetchNotes(user);
    } else {
      setError("User not found!");
    }
  };

const filteredNotes = notes.filter(note => {
  if (selectedLabelFilter === "All") return true;

  if (selectedLabelFilter === "Pinned") {
    return note.pinned === true;
  }

  if (selectedLabelFilter === "Shared") {
    // Note is shared with user but user is not an owner
    return note.sharedWith?.includes(user?.uid) && !note.owners?.includes(user?.uid);
  }

  // 🔍 Filter by label
  return note.labels?.includes(selectedLabelFilter);
});


  const applyFormat = (format) => {
  const textarea = noteContentRef.current;
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  let selected = noteContent.slice(start, end);
  let before = noteContent.slice(0, start);
  let after = noteContent.slice(end);

  let formatted = selected;
  switch (format) {
    case "bold":
      formatted = `**${selected || "bold text"}**`;
      break;
    case "italic":
      formatted = `*${selected || "italic text"}*`;
      break;
    case "underline":
      formatted = `<u>${selected || "underlined text"}</u>`;
      break;
    case "ul":
      formatted = selected
        ? selected
            .split("\n")
            .map((line) => (line.startsWith("- ") ? line : `- ${line}`))
            .join("\n")
        : "- List item";
      break;
    case "ol":
      formatted = selected
        ? selected
            .split("\n")
            .map((line, i) =>
              /^\d+\.\s/.test(line) ? line : `${i + 1}. ${line}`
            )
            .join("\n")
        : "1. List item";
      break;
    case "code":
      formatted = `\`\`\`\n${selected || "code"}\n\`\`\``;
      break;
    default:
      break;
  }
  const newValue = before + formatted + after;
  setNoteContent(newValue);

  // Set cursor after the formatted text
  setTimeout(() => {
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd =
      before.length + formatted.length;
  }, 0);
};

const sortedNotes = [...filteredNotes].sort((a, b) => {
  const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
  const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);

  switch (sortOption) {
    case "title-asc":
      return a.title?.localeCompare(b.title);
    case "title-desc":
      return b.title?.localeCompare(a.title);
    case "oldest":
      return aTime - bTime;
    case "newest":
    default:
      return bTime - aTime;
  }
});


  const pinnedNotes = sortedNotes.filter(note => note.pinned);
  const unpinnedNotes = sortedNotes.filter(note => !note.pinned);

  useEffect(() => {
    const fetchSharedUsers = async () => {
      let uids = [];
      if (viewDrawerOpen && selectedNote?.sharedWith) {
        uids = selectedNote.sharedWith;
      } else if (shareDrawerOpen && sharedWith) {
        uids = sharedWith;
      }
      if (!uids || uids.length === 0) {
        setSharedUsersInfo({});
        return;
      }
      const info = {};
      await Promise.all(
        uids.map(async (uid) => {
          if (!sharedUsersInfo[uid]) {
            const user = await fetchUserInfo(uid);
            if (user) info[uid] = user;
          } else {
            info[uid] = sharedUsersInfo[uid];
          }
        })
      );
      setSharedUsersInfo((prev) => ({ ...prev, ...info }));
    };
    fetchSharedUsers();
    // eslint-disable-next-line
  }, [viewDrawerOpen, shareDrawerOpen, selectedNote, sharedWith]);

  useEffect(() => {
  // After notes are loaded, fetch all unique sharedWith user info
  const fetchAllSharedUsers = async () => {
    const allUids = new Set();
    notes.forEach(note => {
      (note.sharedWith || []).forEach(uid => allUids.add(uid));
      (note.owners || []).forEach(uid => allUids.add(uid));
    });
    const info = {};
    await Promise.all(
      Array.from(allUids).map(async (uid) => {
        if (!sharedUsersInfo[uid]) {
          const user = await fetchUserInfo(uid);
          if (user) info[uid] = user;
        }
      })
    );
    if (Object.keys(info).length > 0) {
      setSharedUsersInfo(prev => ({ ...prev, ...info }));
    }
  };
  if (notes.length > 0) fetchAllSharedUsers();
  // eslint-disable-next-line
}, [notes]);

 const goBack = () => {
    history(-1);
 };

 useEffect(() => {
  if (editDrawerOpen && selectedNote) {
    setNoteTitle(selectedNote.title || "");
    setNoteContent(selectedNote.content || "");
    setCollaborators(selectedNote.sharedWith || []);
    setNoteLabels(selectedNote.labels || []);
  }
  if (!editDrawerOpen) {
    setNoteTitle("");
    setNoteContent("");
    setCollaborators([]);
    setNoteLabels([]);
  }
}, [editDrawerOpen, selectedNote]);


  return (
    <ThemeProvider theme={theme}>
      <DeviceGuard>
      <BetaAccessGuard>
              <Box
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          Height: "auto",
          maxWidth: 700,
          mx: "auto",
        }}
      >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              gap: 3,
              justifyContent: "space-between",
              mb: 2
            }}
          >
            <Button onClick={goBack} sx={{ mr: 2, width: '30px', fontSize: 3, borderRadius: 8, height: '50px', color: mode === "dark" ?  "#fff" : "#000", backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0" , }}>
              <ArrowBackIcon />
            </Button>
            <ProfilePic />
          </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 0 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ flex: 1, color: mode === "dark" ? "#fff" : "#000" }}>
            Notes
          </Typography>
        </Box>
        <Box 
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
            placeholder="Search notes..."
            variant="outlined"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: mode === "dark" ? "#aaa" : "#333", mr: 1 }} />
              ),
              style: { color: mode === "dark" ? "#aaa" : "#333", borderRadius: 11 },
            }}
            sx={{
              width: "100%",
              mb: 2,
              input: { color: mode === "dark" ? "#aaa" : "#333", borderColor: theme.palette.primary.main },
            }}
          />

<Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
  <TextField
  select
  label="Sort by"
  value={sortOption}
  onChange={(e) => setSortOption(e.target.value)}
  size="small"
  sx={{ minWidth: 150, color: theme.palette.primary.main }}
  InputLabelProps={{ color: theme.palette.primary.main, borderRadius: 12 }}
  InputProps={{ color: theme.palette.primary.main, borderRadius: 12 }}
>
  <MenuItem value="newest">Newest First</MenuItem>
  <MenuItem value="oldest">Oldest First</MenuItem>
  <MenuItem value="title-asc">Title A–Z</MenuItem>
  <MenuItem value="title-desc">Title Z–A</MenuItem>
</TextField>

<ToggleButtonGroup
  value={viewMode}
  exclusive
  onChange={(e, next) => next && setViewMode(next)}
  size="small"
  borderRadius={12}
>
  <ToggleButton value="list">
    <ViewListIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} />
  </ToggleButton>
  <ToggleButton value="grid">
    <ViewModuleIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} />
  </ToggleButton>
</ToggleButtonGroup>
</Box>


<Stack direction="row" spacing={1} sx={{ overflowX: "auto", mb: 2 }}>
  {["All", "Pinned", "Shared", ...labels].map((label) => (
    <Chip
      key={label}
      label={label === "Pinned" ? "📌 Pinned" : label}
      clickable
      color={selectedLabelFilter === label ? "primary" : "default"}
      onClick={() => setSelectedLabelFilter(label)}
      sx={{
        borderRadius: 5,
        backdropFilter: "blur(80px)",
        color: selectedLabelFilter === label ? theme.palette.primary.main : theme.palette.text.secondary,
        backgroundColor: selectedLabelFilter === label ? theme.palette.primary.bg : theme.palette.background.paper,
      }}
    />
  ))}
</Stack>


        </Box>
          <Box sx={{ mb: 2, backgroundColor: "transparent", height: "auto" }}>
          <CardContent sx={{ mb: 8, padding: 0, backgroundColor: "transparent" }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                <CircularProgress color="inherit" />
              </Box>
            ) : sortedNotes.length === 0 ? (
              <Box sx={{ display: "flex", height: "70vh", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary" fontSize={16}>
                  No notes yet.
                </Typography>
              </Box>
            ) : (
<Box>
  {viewMode === "list" ? (
    <Stack spacing={1.3}>
      {[...pinnedNotes, ...unpinnedNotes].map((note, idx) => (
        <>
                  <Card
          key={note.id}
          sx={{
            background: mode === "dark" ? "#262626" : "#ffffff00",
            borderRadius: 5,
            border: "1px solid #26262648",
            boxShadow: "none",
            color: theme.palette.text.primary,
            cursor: "pointer",
            transition: "background 0.2s",
            animation: `${fadeIn} 0.6s ease forwards`,
            position: "relative",
          }}
          onClick={() => {
            setSelectedNote(note);
            setViewDrawerOpen(true);
          }}
        >
          <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Box>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>
                              {note.title || "Untitled"}
                              {note.pinned && (
                                <PushPinIcon fontSize="small" sx={{ ml: 1, color: "#00f721" }} />
                              )}
                            </Typography>
                            <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>
                              {note.content?.slice(0, 60) || ""}
                              {note.content?.length > 60 ? "..." : ""}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton
                              onClick={e => {
                                e.stopPropagation();
                                handleMenuOpen(e, idx);
                              }}
                              sx={{ color: mode === "dark" ? "#fff" : "#000" }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        {/* Labels */}
                        {note.labels && note.labels.length > 0 && (
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {note.labels.map(label => (
                              <Chip
                                key={label}
                                icon={<LabelIcon sx={{ color: theme.palette.text.primary }} />}
                                label={label}
                                size="small"
                                sx={{
                                  fontSize: "0.7rem",
                                  borderRadius: '10px',
                                  color: theme.palette.text.primary,
                                  background: mode === "dark" ? "#3a3a3a" : "#bdbdbd83",
                                }}
                              />
                            ))}
                          </Stack>
                        )}
                        {/* Shared users */}
                        <Box sx={{ mt: 1 }}>
                          {/* Show "Shared with you" if you are not the creator */}
                          {note.owners && note.owners[0] !== user?.uid && (
                            <Chip
                              label="Shared with you"
                              size="small"
                              sx={{
                                ml: 0,
                                background: theme.palette.primary.bgr,
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                borderRadius: "10px",
                              }}
                            />
                          )}
                        </Box>
          </CardContent>
        </Card>


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
                                  setSelectedNote(note);
                                  setNoteTitle(note.title || "");
                                  setNoteContent(note.content || "");
                                  setEditDrawerOpen(true);
                                  setDrawerOpen(true);
                                  setViewDrawerOpen(false);
                                  handleMenuClose();    
                                }}
                              >
                                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                Edit
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  handleShareNote(note);
                                  setAddCollabDrawerOpen(true);
                                  handleMenuClose();
                                }}
                              >
                                <ShareIcon fontSize="small" sx={{ mr: 1 }} />
                                Share
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  handlePinNote(note);
                                  handleMenuClose();
                                }}
                              >
                                <PushPinIcon fontSize="small" sx={{ mr: 1 }} />
                                {note.pinned ? "Unpin" : "Pin to Top"}
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  setNoteToDelete(note);
                                  setDeleteDialogOpen(true);
                                  handleMenuClose();
                                  setViewDrawerOpen(false);
                                }}
                                sx={{ color: "#f44336", backgroundColor: "#f443361a" }}
                              >
                                <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                                Delete
                              </MenuItem>

                            </Menu>
        </>
        
      ))}
    </Stack>
  ) : (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(30vw, 1fr))",
        gap: 1,
      }}
    >
      {[...pinnedNotes, ...unpinnedNotes].map((note, idx) => (
        <>
                  <Card
          key={note.id}
          sx={{
            background: mode === "dark" ? "#262626" : "#ffffff00",
            borderRadius: 3,
            border: "1px solid #26262648",
            boxShadow: "none",
            color: theme.palette.text.primary,
            cursor: "pointer",
            transition: "background 0.2s",
            animation: `${fadeIn} 0.6s ease forwards`,
            position: "relative",
            height: "100%",
          }}
          onClick={() => {
            setSelectedNote(note);
            setViewDrawerOpen(true);
          }}
        >
          <CardContent>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Box>
                            <Box display={"flex"}>
                              <Typography variant="h6" sx={{ mb: 0.5 }}>
                              {note.title?.slice(0, 20) || ""}
                              {note.title?.length > 20 ? "..." : ""}
                              {note.pinned && (
                                <PushPinIcon fontSize="small" sx={{ ml: 1, color: "#00f721" }} />
                              )}
                            </Typography>
                            
                          <Box>
                            <IconButton
                              onClick={e => {
                                e.stopPropagation();
                                handleMenuOpen(e, idx);
                              }}
                              sx={{ color: mode === "dark" ? "#fff" : "#000" }}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                            </Box>
                            <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>
                              {note.content?.slice(0, 60) || ""}
                              {note.content?.length > 60 ? "..." : ""}
                            </Typography>
                          </Box>
                        </Box>
                        {/* Labels */}
{(note.labels?.length > 0 || (note.owners && !note.owners.includes(user?.uid))) && (
  <Stack direction="row" sx={{ mt: 1, flexWrap: "wrap", gap: 0.1 }}>
    {/* Labels */}
{note.labels?.map(label => (
  <Chip
    key={label}
    label={label}
    size="small"
    icon= {<LabelIcon sx={{ color: theme.palette.text.primary, }} />}
    sx={{
      fontSize: "0.7rem",
      borderRadius: '10px',
      color: theme.palette.text.primary,
      background: mode === "dark" ? "#3a3a3a" : "#bdbdbd83",
    }}
  />
))}


    {/* Shared Chip */}
                        <Box sx={{ mt: 1 }}>
                          {/* Show "Shared with you" if you are not the creator */}
                          {note.owners && note.owners[0] !== user?.uid && (
                            <Chip
                              label="Shared with you"
                              size="small"
                              sx={{
                                marginLeft: 0,
                                background: theme.palette.primary.bgr,
                                color: theme.palette.primary.main,
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                borderRadius: "10px",
                              }}
                            />
                          )}
                        </Box>
  </Stack>
)}

          </CardContent>
        </Card>

        
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
                                  setSelectedNote(note);
                                  setNoteTitle(note.title || "");
                                  setNoteContent(note.content || "");
                                  setEditDrawerOpen(true);
                                  setDrawerOpen(true);
                                  setViewDrawerOpen(false);
                                  handleMenuClose();    
                                }}
                              >
                                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                Edit
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  handleShareNote(note);
                                  setAddCollabDrawerOpen(true);
                                  handleMenuClose();
                                }}
                              >
                                <ShareIcon fontSize="small" sx={{ mr: 1 }} />
                                Share
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  handlePinNote(note);
                                  handleMenuClose();
                                }}
                              >
                                <PushPinIcon fontSize="small" sx={{ mr: 1 }} />
                                {note.pinned ? "Unpin" : "Pin to Top"}
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  setNoteToDelete(note);
                                  setDeleteDialogOpen(true);
                                  handleMenuClose();
                                  setViewDrawerOpen(false);
                                }}
                                sx={{ color: "#f44336", backgroundColor: "#f443361a" }}
                              >
                                <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                                Delete
                              </MenuItem>
                            </Menu>
        </>
      ))}
    </Box>
  )}
</Box>


            )}
          </CardContent>
          </Box>

        

        {/* Add Note Drawer */}
        <SwipeableDrawer
          anchor="bottom"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              backgroundColor: theme.palette.background.default,
              p: 3,
              maxWidth: 480,
              height: "95vh",
              mx: "auto",
            },
          }}
        >
            <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      pb: 9, // space for floating button
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
    <Typography variant="h6" fontWeight="bold" color={theme.palette.text.primary}>
      {editDrawerOpen ? "Edit Note" : ""}
    </Typography>
    <Button
      variant="contained"
      onClick={editDrawerOpen ? handleEditNote : handleAddNote}
      disabled={saving}
      fullWidth
      sx={{ borderRadius: 4, color: "#000", backgroundColor: theme.palette.primary.bgr, fontWeight: "bold", width: "110px", boxShadow: "none" }}
    >
      {saving ? "Saving..." : editDrawerOpen ? "Save" : "Add Note"}
    </Button>
    </Box>

    {/* Title Input */}
    <TextField
      placeholder="Enter title..."
      value={noteTitle}
      onChange={(e) => setNoteTitle(e.target.value)}
      fullWidth
      variant="standard"
      InputProps={{
        disableUnderline: true,
        sx: {
          fontSize: 22,
          fontWeight: 600,
          color: mode === "dark" ? "#fff" : "#000",
          mb: 1,
        },
      }}
    />
        {/* Labels Display */}
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1, mb: 1 }}>
      {labels.map((label) => (
        <Chip
          key={label}
          label={label}
          onClick={() => handleToggleLabel(label)}
          variant={noteLabels.includes(label) ? "filled" : "outlined"}
          size="small"
          sx={{
            color: noteLabels.includes(label) ? "#000" : "#BDBDBD",
            background: noteLabels.includes(label) ? theme.palette.primary.bgr : "#f1f1f111",
          }}
        />
      ))}
    </Stack>

    {/* Content */}
    <TextField
      placeholder="Start writing your note..."
      value={noteContent}
      onChange={(e) => setNoteContent(e.target.value)}
      fullWidth
      multiline
      minRows={12}
      variant="standard"
      inputRef={noteContentRef}
      InputProps={{
        disableUnderline: true,
        sx: { color: mode === "dark" ? "#fff" : "#000", fontFamily: "inherit", fontSize: 16 },
      }}
      sx={{ flex: 1, mb: 2 }}
    />

  </Box>

    {/* Toolbar */}
    <Box
      sx={{ 
        position: "sticky",
        bottom: 0,
        left: 0,
        display: "flex",
        flexWrap: "wrap",
        gap: 1,
        mb: 2,
        alignItems: "center",
        justifyContent: "space-between",
        padding: 1,
        backgroundColor: theme.palette.primary.bgr,
        borderRadius: 4,
        backdropFilter: "blur(80px)"
    }}>
      
      {["bold", "italic", "underline", "ul", "code"].map((action) => (
        <Tooltip title={action.charAt(0).toUpperCase() + action.slice(1)} key={action}>
          <IconButton onClick={() => applyFormat(action)} size="small" sx={{ color: "#333", backgroundColor: "#ffffff11" }}>
            {{
              bold: <FormatBoldIcon />,
              italic: <FormatItalicIcon />,
              underline: <FormatUnderlinedIcon />,
              ul: <FormatListBulletedIcon />,
              code: <CodeIcon />,
            }[action]}
          </IconButton>
        </Tooltip>
      ))}


<Tooltip title="Add Collaborator">
  <IconButton
    onClick={() => {
      if (editDrawerOpen) {
        setAddCollabDrawerOpen(true);
      } else {
        setAddCollaboratorDrawerOpen(true);
      }
    }}
    size="small"
    sx={{
      color: "#333",
      borderRadius: 2,
      px: 0.6,
      height: 36,
      backgroundColor: "#ffffff11"
    }}
  >
    <PersonAddIcon />
  </IconButton>
</Tooltip>

      <Tooltip title="Add Label">
        <IconButton
          onClick={() => setAddLabelDrawerOpen(true)}
          size="small"
          sx={{
            color: "#333",
            borderRadius: 2,
            px: 0.6,
            height: 36,
            backgroundColor: "#ffffff11"
          }}
        >
          <LabelOutlinedIcon />
        </IconButton>
      </Tooltip>
    </Box>
          </SwipeableDrawer>

        <SwipeableDrawer
          anchor="bottom"
          open={addCollaboratorDrawerOpen}
          onClose={() => setAddCollaboratorDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: "${theme.palette.background.default}00",
              backdropFilter: "blur(80px)",
              p: 3,
              maxWidth: 400,
              mx: "auto",
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Add Collaborator
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Username"
              value={newCollaboratorUsername}
              onChange={e => setNewCollaboratorUsername(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: mode === "dark" ? "#fff" : "#000" } }}
              InputLabelProps={{ style: { color: mode === "dark" ? "#aaa" : "#333" } }}
            />
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              variant="contained"
              sx={{
                borderRadius: 5,
                px: 2,
                py: 1,
                color: "#000",
                background: theme.palette.primary.bgr,
                boxShadow: "none",
                fontWeight: "bold",
              }}
              onClick={handleAddCollaboratorFromDrawer}
              fullWidth
            >
              Add Collaborator
            </Button>
          </Stack>
        </SwipeableDrawer>

        {/* Add Custom Label Drawer */}
        <SwipeableDrawer
          anchor="bottom"
          open={addLabelDrawerOpen}
          onClose={() => setAddLabelDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: "${theme.palette.background.default}00",
              backdropFilter: "blur(80px)",
              p: 3,
              maxWidth: 400,
              mx: "auto",
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Add Custom Label
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Label Name"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: mode === "dark" ? "#fff" : "#000" } }}
              InputLabelProps={{ style: { color: mode === "dark" ? "#aaa" : "#333" } }}
            />
            <Button
              variant="contained"
              sx={{
                borderRadius: 4,
                px: 2,
                py: 1,
                color: "#000",
                background: theme.palette.primary.bgr,
                fontWeight: "bold",
              }}
              onClick={handleAddCustomLabel}
              fullWidth
            >
              Add Label
            </Button>
          </Stack>
        </SwipeableDrawer>

        {/* View Note Drawer */}
        <SwipeableDrawer
          anchor="bottom"
          open={viewDrawerOpen}
          onClose={() => setViewDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              backgroundColor: mode === "dark" ? "#0c0c0c" : "#f1f1f1",
              p: 3,
              maxWidth: 480,
              height: "95vh",
              mx: "auto",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Button
              onClick={() => setViewDrawerOpen(false)}
              sx={{
                mr: 2,
                height: 36,
                minWidth: 0,
                borderRadius: 8,
                color: mode === "dark" ? "#fff" : "#000",
                backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
                gap: 0.5,
              }}
            >
              <ArrowBackIcon /> <Typography>Back</Typography>
            </Button>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ flex: 1, borderBottom: "1px solid #777777ff", paddingBottom: 1, mb: 3 }}>
              {selectedNote?.title || ""}
            </Typography>

          {selectedNote?.sharedWith && selectedNote.sharedWith.length > 0 && (
  <Box sx={{ mt: 2, mb: 2 }}>
    <Stack direction="row" spacing={1}>
      {selectedNote.sharedWith.map((uid, i) => {
        const user = sharedUsersInfo[uid];
        return (
          <Box key={uid} sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "#171717" : "#acacac7e", borderRadius: 8, px: 0.5, py: 0.5 }}>
            <Avatar
              src={user?.photoURL || ""}
              alt={user?.username || "User"}
              sx={{ width: 24, height: 24, fontSize: 14, bgcolor: theme.palette.primary.bg, color: "#000" }}
            >
              {user?.username ? user.username[0].toUpperCase() : "U"}
            </Avatar>
            <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", fontSize: 14, mr: 0.3 }}>
              {user?.username || uid.slice(0, 6) + "..."}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  </Box>
)}


          {selectedNoteLabels && selectedNoteLabels.length > 0 && (
            <Box sx={{ width: "100%", mb: 2 }}>
              <Stack direction="row" display="flex" alignItems="center" spacing={1}>
                {selectedNoteLabels.map(label => (
                  <Chip
                    key={label}
                    icon={<LabelIcon sx={{ color: theme.palette.text.primary }} />}
                    label={label}
                    size="small"
                    sx={{
                      fontSize: "0.7rem",
                      borderRadius: '10px',
                      color: theme.palette.text.primary,
                      background: theme.palette.primary.bgr,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}

            <Box>
              <Box height={"-webkit-fill-available"}>
                <Typography variant="body1" sx={{ mb: 2, color: theme.palette.text.primary, whiteSpace: "pre-line" }}>
                {selectedNote?.content}
              </Typography>
              </Box>


            <Box 
              sx={{ 
                display: "flex",
                padding: 1,
                position: "sticky",
                right: 0,
                bottom: 0,
                backgroundColor: mode === "dark" ? "#1e1e1eff" : "#e0e0e0",
                justifyContent: "space-between",
                borderRadius: 4,
                alignContent: "center"
              }}>
              <Tooltip title="Edit">
              <IconButton
                onClick={() => {
                  setSelectedNote(selectedNote);
                  setNoteTitle(selectedNote.title || "");
                  setNoteContent(selectedNote.content || "");
                  setEditDrawerOpen(true);
                  setDrawerOpen(true);
                  setViewDrawerOpen(false);
                }}
                sx={{ color: theme.palette.text.primary, backgroundColor: theme.palette.primary.bgr, padding: 1 }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton
                onClick={() => {
                  handleShareNote(selectedNote);
                  setAddCollabDrawerOpen(true);
                }}
                sx={{ color: theme.palette.text.primary, backgroundColor: theme.palette.primary.bgr, padding: 1 }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={selectedNote?.pinned ? "Unpin" : "Pin to Top"}>
              <IconButton
                onClick={() => handlePinNote(selectedNote)}
                sx={{ 
                  color: selectedNote?.pinned ? "#00f721" : theme.palette.text.primary,
                  backgroundColor: selectedNote?.pinned ? "#00f72121" : theme.palette.primary.bgr,
                  padding: 1,
                  transform: selectedNote?.pinned ? "rotate(30deg)" : "rotate(0deg)",
                 }}
              >
                <PushPinIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Note Details">
              <IconButton
                onClick={() => setDetailsDrawerOpen(true)}
                sx={{ color: theme.palette.text.primary, backgroundColor: theme.palette.primary.bgr, padding: 1 }}
              >
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Note">
              <IconButton
                onClick={() => {
                  setNoteToDelete(selectedNote);
                  setDeleteDialogOpen(true);
                }}
                sx={{ color: mode === "dark" ? "#ffd4d4" : "#ff0000ff", backgroundColor: mode === "dark" ? "#ff0000" : "#ffd4d4", padding: 1 }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Tooltip>
            </Box>

            </Box>
          </Box>

        </SwipeableDrawer>

        <SwipeableDrawer
          anchor="bottom"
          open={addCollabDrawerOpen}
          onClose={() => setAddCollabDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: "${theme.palette.background.default}00",
              backdropFilter: "blur(80px)",
              p: 3,
              maxWidth: 400,
              mx: "auto",
              zIndex: 999,
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Add Collaborator11
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Username"
              value={newCollaboratorUsername}
              onChange={e => setNewCollaboratorUsername(e.target.value)}
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
                background: buttonWeatherBg,
                fontWeight: "bold",
              }}
              onClick={handleAddCollaboratorFromDrawer}
              fullWidth
            >
              Add Collaborator
            </Button>
          </Stack>
        </SwipeableDrawer>


<Dialog
  open={deleteDialogOpen}
  onClose={() => setDeleteDialogOpen(false)}
  PaperProps={{
    sx: {
      backgroundColor: mode === "dark" ? "#00000000" : "#ffffff91",
      backdropFilter: 'blur(10px)',
      boxShadow: 'none',
      borderRadius: 6,
    }
  }}
>
  <DialogTitle variant="title">Delete Note</DialogTitle>
  <DialogContent>
    <Typography>
      Are you sure you want to delete{" "}
      <strong>{noteToDelete?.title || "this note"}</strong>?
    </Typography>
  </DialogContent>
  <DialogActions sx={{ mb: 2, mr: 2 }}>
    <Button 
      onClick={() => setDeleteDialogOpen(false)} 
      color="inherit" 
      variant="outlined" 
      sx={{ 
        color: "#000",
        borderRadius: 4,
        fontWeight: "bold",
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e071",
        color: mode === "dark" ? "#fff" : "#000", 
        boxShadow: "none",
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={async () => {
        await handleDeleteNote(noteToDelete.id);
        setDeleteDialogOpen(false);
        setNoteToDelete(null);
        setViewDrawerOpen(false);
      }}
      color="error"
      variant="contained"
      sx={{ backgroundColor: mode === "dark" ? "#700000ff" : "#ffd4d4", borderRadius: 4, color: mode === "dark" ? "#ffd4d4" : "#ff0000ff", boxShadow: "none", fontWeight: "bold" }}
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>


        {/* Note Details Drawer */}
        <SwipeableDrawer
          anchor="right"
          open={detailsDrawerOpen}
          onClose={() => setDetailsDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
              backgroundColor: mode === "dark" ? "#00000000" : "#ffffffda",
              backdropFilter: "blur(80px)",
              p: 3,
              maxWidth: 340,
              width: "85vw", 
              height: "95vh",
              mx: "auto",
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Note Details
          </Typography>
          {selectedNote && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Title:</Typography>
                <Typography variant="title" sx={{ fontSize: "2rem" }}>{selectedNote.title || "Untitled"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Labels:</Typography>
                <Stack direction="row" spacing={1}>
                  {(selectedNote.labels || []).map(label => (
                    <Chip
                      key={label}
                      icon={<LabelIcon sx={{ color: "#000" }} />}
                      label={label}
                      size="small"
                      sx={{
                        fontSize: "0.7rem",
                        borderRadius: '10px',
                        color: '#000',
                        background: theme.palette.primary.bgr,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Collaborators:</Typography>
                <Stack direction="row" spacing={1}>
                  {(selectedNote.sharedWith || []).map(uid => {
                    const user = sharedUsersInfo[uid];
                    return (
                      <Box key={uid} sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "#171717" : "#acacac7e", borderRadius: 8, px: 0.5, py: 0.5 }}>
                        <Avatar
                          src={user?.photoURL || ""}
                          alt={user?.username || "User"}
                          sx={{ width: 24, height: 24, fontSize: 14, bgcolor: theme.palette.primary.bg, color: "#000" }}
                        >
                          {user?.username ? user.username[0].toUpperCase() : "U"}
                        </Avatar>
                        <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 14, marginRight: 1 }}>
                          {user?.username || uid.slice(0, 6) + "..."}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Created At:</Typography>
                <Typography variant="body2">
                  {selectedNote.createdAt?.toDate
                    ? selectedNote.createdAt.toDate().toLocaleString()
                    : new Date(selectedNote.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Created By:</Typography>
                <Stack direction="row" spacing={1}>
                  {selectedNote.owners && selectedNote.owners.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, background: mode === "dark" ? "#171717" : "#acacac7e", borderRadius: 8, px: 0.5, py: 0.5 }}>
                      <Avatar
                        src={sharedUsersInfo[selectedNote.owners[0]]?.photoURL || ""}
                        alt={sharedUsersInfo[selectedNote.owners[0]]?.username || "User"}
                        sx={{ width: 24, height: 24, fontSize: 14, bgcolor: theme.palette.primary.bg, color: "#000" }}
                      >
                        {sharedUsersInfo[selectedNote.owners[0]]?.username
                          ? sharedUsersInfo[selectedNote.owners[0]].username[0].toUpperCase()
                          : "U"}
                      </Avatar>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontSize: 14, marginRight: 1 }}>
                        {sharedUsersInfo[selectedNote.owners[0]]?.username ||
                          selectedNote.owners[0].slice(0, 6) + "..."}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Note ID:</Typography>
                <Typography variant="body2">{selectedNote.id}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.secondary }}>Pinned:</Typography>
                <Typography variant="body2">{selectedNote.pinned ? "Yes" : "No"}</Typography>
              </Box>
            </Stack>
          )}
        </SwipeableDrawer>
        
          <Button
            size="medium"
            sx={{ ml: 2, backgroundColor: theme.palette.primary.bg, width: "70px", height: "70px", color: "#000", borderRadius: "20px", boxShadow: "none", position: "fixed", bottom: 20, right: 20, zIndex: 999 }}
            onClick={() => setDrawerOpen(true)}
          >
            <AddIcon />
          </Button>
      </Box>
      </BetaAccessGuard>
      </DeviceGuard>
    </ThemeProvider>
  );
};

export default Notes;