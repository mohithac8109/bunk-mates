import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Avatar,
  Paper,
  Collapse,
  Container,
  Divider,
  AvatarGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar
} from "@mui/material";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopy from "@mui/icons-material/ContentCopy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0B0C10", paper: "#161B22" },
    primary: { main: "#ffffffff" },
    success: { main: "#10B981" },
    error: { main: "#EF4444" },
    text: { primary: "#E5E7EB", secondary: "#9CA3AF" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h5: { fontWeight: 600 },
    h6: { fontWeight: 500 },
    body2: { fontSize: "0.875rem" },
  },
});

export default function JoinTrip() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [iconURL, setIconURL] = useState("");
  const [creator, setCreator] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [checklist, setChecklist] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const tripId = searchParams.get("trip");

  useEffect(() => {
    const storedUser = localStorage.getItem("bunkmateuser");

    const initialize = async () => {
      let currentUser = auth.currentUser;

      if (!currentUser && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser?.uid) {
            currentUser = parsedUser;
          }
        } catch (err) {
          console.error("Invalid stored user:", err);
        }
      }
      
      if (!tripId) {
        setError("No trip ID provided.");
        setLoading(false);
        return;
      }

      try {
        const tripRef = doc(db, "trips", tripId);
        const tripSnap = await getDoc(tripRef);

        if (!tripSnap.exists()) {
          setError("Trip not found.");
          setLoading(false);
          return;
        }

        const tripData = { id: tripSnap.id, ...tripSnap.data() };
        setTrip(tripData);

        // Get iconURL
        const groupChatRef = doc(db, "groupChats", tripData.id);
        const groupSnap = await getDoc(groupChatRef);
        const groupData = groupSnap.exists() ? groupSnap.data() : null;
        if (groupData?.iconURL) setIconURL(groupData.iconURL);

        // Get creator name
        const creatorSnap = await getDoc(doc(db, "users", tripData.createdBy));
        if (creatorSnap.exists()) {
          const creatorData = creatorSnap.data();
          setCreator(creatorData?.name || creatorData?.username || "Unknown");
        }

        // Member avatars
        const memberDocs = await Promise.all(
          (tripData.members || []).map(uid => getDoc(doc(db, "users", uid)))
        );
        const memberProfiles = memberDocs
          .filter(doc => doc.exists())
          .map(doc => {
            const data = doc.data();
            return {
              uid: doc.id,
              name: data.name || data.username,
              photoURL: data.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${doc.id}`,
            };
          });

        setMemberProfiles(memberProfiles);

        const checklistSnap = await getDocs(collection(db, `trips/${tripData.id}/checklist`));
        setChecklist(checklistSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
        setError("Something went wrong.");
      }

      setLoading(false);
    };

    initialize();
  }, [tripId, navigate]);

  const handleJoin = async () => {
    const fallbackUser = JSON.parse(localStorage.getItem("bunkmateuser"));
    const activeUser = auth.currentUser || fallbackUser;
    if (!activeUser) return;

    try {
      const tripRef = doc(db, "trips", trip.id);
      await updateDoc(tripRef, {
        members: arrayUnion(activeUser.uid),
      });

      await addDoc(collection(db, "groupChat", trip.id, "messages"), {
        type: "system",
        content: `${activeUser.displayName || activeUser.email} joined the trip.`,
        timestamp: serverTimestamp(),
      });

      setJoined(true);
    } catch (err) {
      console.error("Failed to join trip:", err);
    }
  };

  const handleReject = () => {
    navigate("/");
  };

    const inviteLink = `${window.location.origin}/join?trip=${tripId}`;

  return (
    <ThemeProvider theme={darkTheme}>
      <Container
        sx={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
          height: { xs: 470, sm: 320 },
          m: 0,
          p: 0,
        }}
      >
                <Box
                  sx={{
                    backgroundImage: `url(${iconURL || "/default-icon.png"})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: "#1d1d1dff",
                    height: { xs: 470, sm: 320 },
                    boxShadow: "0 6px 16px rgba(0,0,0,0.4)",
                  }}
                />
        {loading ? (
          <Box sx={{ mx: "auto", display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Container
            sx={{
              height: "71vh",
              position: "absolute",
              bottom: "0px",
              p: 4,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              backdropFilter: "blur(180px)",
              background: "linear-gradient(to bottom, #0c0c0c00, #0c0c0c8f, #0c0c0c)",
              color: "#fff",
            }}
          >
            <Box textAlign="center">
            <Collapse in={!joined}>
              <Typography variant="caption">
                You're invited to join
              </Typography>
            </Collapse>
              <Collapse in={joined}>
                <Box textAlign="center" mb={4}>
                    <CheckCircleIcon color="success" fontSize="large" />
                    <Typography mt={1} color="success.main" variant="h6">
                        You’ve joined the trip!
                    </Typography>
                </Box>
              </Collapse>

              <Typography variant="h2" fontWeight="bold" mb={2}>{trip?.name}</Typography>

                <Collapse in={joined}>
                    <TextField
                      fullWidth
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
                </Collapse>

            <Typography>
                          {/* Snackbar */}
                          <Snackbar
                            open={snackbar.open}
                            autoHideDuration={3000}
                            onClose={() => setSnackbar({ ...snackbar, open: false })}
                            message={snackbar.message}
                          />
                          
            </Typography>

              <Box mt={2} textAlign="left">
                <Typography variant="subtitle2" color="text.secondary">Route:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {trip.from} → {trip.to}
                </Typography>

{trip?.startDate && trip?.endDate && (
  <Box display="flex" alignItems="center" gap={1} mt={1}>
    <CalendarMonthIcon fontSize="small" sx={{ color: "text.secondary" }} />
    <Typography variant="body2" color="text.secondary">
      {new Date(trip.startDate).toDateString() === new Date(trip.endDate).toDateString()
        ? new Date(trip.startDate).toDateString()
        : `${new Date(trip.startDate).toDateString()} – ${new Date(trip.endDate).toDateString()}`}
    </Typography>
  </Box>
)}


                <Typography variant="body2" color="text.secondary" mt={1}>
                  Created by <strong>{creator || "someone"}</strong>
                </Typography>

                {memberProfiles.length > 0 && (
                  <Box mt={3} display="flex" justifyContent="center">
                    <AvatarGroup max={7}>
                      {memberProfiles.map(user => (
                        <Avatar key={user.uid} src={user.photoURL} alt={user.name} />
                      ))}
                    </AvatarGroup>
                  </Box>
                )}
              </Box>
            </Box>


            <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.08)" }} />

            <Collapse in={joined}>
              <Box textAlign="center" mb={4}>
                <Button
                  variant="contained"
                  sx={{ mt: 2, borderRadius: 8, px: 4 }}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                >
                  Go to Trip
                </Button>
              </Box>
            </Collapse>

            {!joined && checklist.length > 0 && (
                <>
                    <Box mt={1} mb={4}>
    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
      Checklist
    </Typography>
    <List
        sx={{
          maxHeight: "100px",
          overflowY: "auto",
          scrollbarWidth: "none"
        }}
    >
      {checklist.map((item) => (
        <ListItem key={item.id} disablePadding>
          <Typography variant="body2">
            - {item.text}
          </Typography>
        </ListItem>
      ))}
    </List>
  </Box>

              <Box mt={2} display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button variant="outlined" color="error" onClick={handleReject} sx={{ borderRadius: 1, px: 5 }}>
                  Reject
                </Button>
                <Button variant="contained" color="primary" onClick={handleJoin} sx={{ borderRadius: 1, px: 5 }}>
                  Accept Invite
                </Button>
              </Box>
                </>
            )}
          </Container>
        )}
      </Container>
    </ThemeProvider>
  );
}
