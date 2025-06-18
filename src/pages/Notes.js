import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShareIcon from "@mui/icons-material/Share";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMore from "@mui/icons-material/ExpandMore";
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
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px);}
  to { opacity: 1; transform: translateY(0);}
`;

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
  shape: { borderRadius: 12 },
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
  const [expanded, setExpanded] = useState(false);

useEffect(() => {
  const u = getUserFromStorage();
  setUser(u);
  console.log("Current user:", u); // Debug
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
      where("owners", "array-contains", currentUser.uid),
    );
    const querySnapshot = await getDocs(q);
    const data = [];
    querySnapshot.forEach((doc) => {
      const note = { id: doc.id, ...doc.data() };
      data.push(note);
    });
    console.log("Fetched notes:", data); // Debug
    setNotes(data);
  } catch (err) {
    setNotes([]);
    console.error("Error fetching notes:", err); // Debug
  }
  setLoading(false);
};

  useEffect(() => {
    if (user && user.uid) {
      fetchNotes(user);
    } else {
      setNotes([]);
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [user]);

  const handleAddNote = async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;
    setSaving(true);
    await addDoc(collection(db, "notes"), {
      owners: [user.uid],
      title: noteTitle,
      content: noteContent,
      createdAt: new Date(),
      sharedWith: [],
    });
    setNoteTitle("");
    setNoteContent("");
    setDrawerOpen(false);
    setSaving(false);
    fetchNotes(user);
  };

  const handleEditNote = async () => {
    if (!selectedNote || (!noteTitle.trim() && !noteContent.trim())) return;
    setSaving(true);
    await updateDoc(doc(db, "notes", selectedNote.id), {
      title: noteTitle,
      content: noteContent,
    });
    setEditDrawerOpen(false);
    setSelectedNote(null);
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

  const filteredNotes = notes.filter(
    (note) =>
      (note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          p: 3,
          backgroundColor: "#18191A",
          color: "#fff",
          minHeight: "100vh",
          maxWidth: 700,
          mx: "auto",
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ flex: 1 }}>
            Notes Dashboard
          </Typography>
          <Fab
            size="medium"
            color="primary"
            sx={{ ml: 2, boxShadow: "none" }}
            onClick={() => setDrawerOpen(true)}
          >
            <AddIcon />
          </Fab>
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search notes..."
            variant="outlined"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: "#aaa", mr: 1 }} />
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
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress color="inherit" />
              </Box>
            ) : filteredNotes.length === 0 ? (
              <Typography color="text.secondary" fontSize={16}>
                No notes yet.
              </Typography>
            ) : (
              <Box>
                <Stack spacing={2}>
                  {filteredNotes.map((note, idx) => (
                    <Card
                      key={note.id}
                      sx={{
                        background: "#232526",
                        borderRadius: 3,
                        boxShadow: "0 1px 4px #0003",
                        color: "#fff",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        "&:hover": { background: "#232526cc" },
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
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
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
                                  setSelectedNote(note);
                                  setNoteTitle(note.title);
                                  setNoteContent(note.content);
                                  setEditDrawerOpen(true);
                                  handleMenuClose();
                                }}
                              >
                                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                Edit
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  handleDeleteNote(note.id);
                                  handleMenuClose();
                                }}
                                sx={{ color: "#f44336" }}
                              >
                                <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />
                                Delete
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  handleShareNote(note);
                                  handleMenuClose();
                                }}
                              >
                                <ShareIcon fontSize="small" sx={{ mr: 1 }} />
                                Share
                              </MenuItem>
                            </Menu>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 1 }}>
                          {note.sharedWith && note.sharedWith.length > 0 && (
                            <Stack direction="row" spacing={1}>
                              {note.sharedWith.map((uid, i) => (
                                <Chip
                                  key={uid}
                                  label={`Shared`}
                                  size="small"
                                  sx={{
                                    fontSize: "0.7rem",
                                    borderRadius: '10px',
                                    borderColor: "#00f721",
                                    color: '#BDBDBD',
                                    background: "#232526",
                                  }}
                                />
                              ))}
                            </Stack>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

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
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              backgroundColor: "#232526",
              p: 3,
              maxWidth: 480,
              mx: "auto",
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Add New Note
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: "#fff" } }}
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
            <TextField
              label="Content"
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              fullWidth
              multiline
              minRows={4}
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
              color="primary"
              sx={{
                borderRadius: 4,
                px: 2,
                py: 1,
                color: "#000",
                fontWeight: "bold",
              }}
              onClick={handleAddNote}
              disabled={saving}
            >
              {saving ? "Saving..." : "Add Note"}
            </Button>
          </Stack>
        </SwipeableDrawer>

        {/* Edit Note Drawer */}
        <SwipeableDrawer
          anchor="bottom"
          open={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              backgroundColor: "#232526",
              p: 3,
              maxWidth: 480,
              mx: "auto",
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Edit Note
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={noteTitle}
              onChange={e => setNoteTitle(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: "#fff" } }}
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
            <TextField
              label="Content"
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              fullWidth
              multiline
              minRows={4}
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
              color="primary"
              sx={{
                borderRadius: 4,
                px: 2,
                py: 1,
                color: "#000",
                fontWeight: "bold",
              }}
              onClick={handleEditNote}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
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
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              backgroundColor: "#232526",
              p: 3,
              maxWidth: 480,
              mx: "auto",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Button
              onClick={() => setViewDrawerOpen(false)}
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
            <Typography variant="h5" fontWeight="bold" sx={{ flex: 1 }}>
              {selectedNote?.title || "Untitled"}
            </Typography>
            <Tooltip title="Edit">
              <IconButton
                onClick={() => {
                  setNoteTitle(selectedNote?.title || "");
                  setNoteContent(selectedNote?.content || "");
                  setEditDrawerOpen(true);
                  setViewDrawerOpen(false);
                }}
                sx={{ color: "#fff" }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton
                onClick={() => {
                  handleShareNote(selectedNote);
                  setViewDrawerOpen(false);
                }}
                sx={{ color: "#fff" }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ color: "#fff", whiteSpace: "pre-line" }}>
              {selectedNote?.content}
            </Typography>
          </Box>
          {selectedNote?.sharedWith && selectedNote.sharedWith.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ color: "#BDBDBD" }}>
                Shared with:
              </Typography>
              <Stack direction="row" spacing={1}>
                {selectedNote.sharedWith.map((uid, i) => (
                  <Chip
                    key={uid}
                    label={`User: ${uid.slice(0, 6)}...`}
                    size="small"
                    sx={{
                      fontSize: "0.7rem",
                      borderRadius: '10px',
                      borderColor: "#00f721",
                      color: '#BDBDBD',
                      background: "#232526",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </SwipeableDrawer>

        {/* Share Note Drawer */}
        <SwipeableDrawer
          anchor="bottom"
          open={shareDrawerOpen}
          onClose={() => setShareDrawerOpen(false)}
          onOpen={() => {}}
          disableSwipeToOpen={true}
          disableDiscovery={true}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              backgroundColor: "#232526",
              p: 3,
              maxWidth: 480,
              mx: "auto",
            },
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Share Note
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Username to share with"
              value={shareUsername}
              onChange={e => setShareUsername(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{ style: { color: "#fff" } }}
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{
                borderRadius: 4,
                px: 2,
                py: 1,
                color: "#000",
                fontWeight: "bold",
              }}
              onClick={handleShareWithUser}
              disabled={saving}
            >
              Share
            </Button>
            {error && (
              <Typography color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
            <Box>
              <Typography variant="subtitle2" sx={{ color: "#BDBDBD" }}>
                Already shared with:
              </Typography>
              <Stack direction="row" spacing={1}>
                {sharedWith.map((uid, i) => (
                  <Chip
                    key={uid}
                    label={`User: ${uid.slice(0, 6)}...`}
                    size="small"
                    sx={{
                      fontSize: "0.7rem",
                      borderRadius: '10px',
                      borderColor: "#00f721",
                      color: '#BDBDBD',
                      background: "#232526",
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </SwipeableDrawer>
      </Box>
    </ThemeProvider>
  );
};

export default Notes;