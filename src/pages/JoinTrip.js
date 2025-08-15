import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Avatar,
  Collapse,
  Container,
  Divider,
  AvatarGroup,
  List,
  ListItem,
  TextField,
  InputAdornment,
  IconButton,
  Snackbar
} from "@mui/material";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  addDoc,
  getDoc,
  getDocs,
  query,
  where
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
  const [currentUserUID, setCurrentUserUID] = useState(null);
  const tripId = searchParams.get("trip");

  useEffect(() => {
    if (!tripId) {
      setError("No trip ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);

    let unsubscribeTrip;
    let unsubscribeChecklist;

    const storedUser = localStorage.getItem("bunkmateuser");
    let userEmail = null, possibleUID = null;
    let fallbackParsedUser = null;

    try {
      const authUser = auth.currentUser;
      if (authUser) {
        userEmail = authUser.email;
        possibleUID = authUser.uid;
      } else if (storedUser) {
        fallbackParsedUser = JSON.parse(storedUser);
        userEmail = fallbackParsedUser?.email;
        possibleUID = fallbackParsedUser?.uid;
      }
    } catch {}

    // Resolve Firestore UID by email
    const resolveUID = async () => {
      let uid = possibleUID;
      if (!uid && userEmail) {
        let firestoreUserUID = null;
        const q = query(collection(db, "users"), where("email", "==", userEmail.toLowerCase()));
        const usersQuery = await getDocs(q);
        if (!usersQuery.empty) {
          firestoreUserUID = usersQuery.docs[0].id;
        } else {
          const usersAll = await getDocs(collection(db, "users"));
          usersAll.forEach(userDoc => {
            const data = userDoc.data();
            if (data.email && data.email.toLowerCase() === userEmail.toLowerCase()) {
              firestoreUserUID = userDoc.id;
            }
          });
        }
        uid = firestoreUserUID;
      }
      setCurrentUserUID(uid || null);
      return uid;
    };

    // Real-time trip listener
    unsubscribeTrip = onSnapshot(
      doc(db, "trips", tripId),
      async (tripSnap) => {
        if (!tripSnap.exists()) {
          setError("Trip not found.");
          setLoading(false);
          return;
        }
        const tripData = { id: tripSnap.id, ...tripSnap.data() };
        setTrip(tripData);

        // Get iconURL (static)
        const groupChatRef = doc(db, "groupChats", tripData.id);
        getDoc(groupChatRef).then(groupSnap => {
          const groupData = groupSnap.exists() ? groupSnap.data() : null;
          if (groupData?.iconURL) setIconURL(groupData.iconURL);
        });

        // Get creator name (static)
        getDoc(doc(db, "users", tripData.createdBy)).then(creatorSnap => {
          if (creatorSnap.exists()) {
            const creatorData = creatorSnap.data();
            setCreator(creatorData?.name || creatorData?.username || "Unknown");
          }
        });

        // Member avatars (static)
        const memberDocs = await Promise.all(
          (tripData.members || []).map(uid =>
            getDoc(doc(db, "users", uid))
          )
        );
        setMemberProfiles(
          memberDocs
            .filter(doc => doc.exists())
            .map(doc => {
              const data = doc.data();
              return {
                uid: doc.id,
                name: data.name || data.username,
                photoURL: data.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${doc.id}`,
              };
            })
        );

        // Real-time join logic
        const resolvedUID = await resolveUID();
        if (
          resolvedUID &&
          Array.isArray(tripData.members) &&
          tripData.members.includes(resolvedUID)
        ) {
          setJoined(true);
        } else {
          setJoined(false);
        }

        setLoading(false);
      },
      (err) => {
        setError("Something went wrong.");
        setLoading(false);
      }
    );

    // Real-time checklist listener
    unsubscribeChecklist = onSnapshot(
      collection(db, `trips/${tripId}/checklist`),
      (checklistSnap) => {
        setChecklist(checklistSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      if (unsubscribeTrip) unsubscribeTrip();
      if (unsubscribeChecklist) unsubscribeChecklist();
    };
    // eslint-disable-next-line
  }, [tripId, navigate]);

  const handleJoin = async () => {
    const fallbackUser = JSON.parse(localStorage.getItem("bunkmateuser"));
    const activeUser = auth.currentUser || fallbackUser;
    if (!activeUser || !trip) return;
    try {
      // Add user UID to trip members list
      await updateDoc(doc(db, "trips", trip.id), {
        members: arrayUnion(activeUser.uid),
      });

      // Add user UID to trips group chat members
      const groupChatRef = doc(db, "groupChats", trip.id);
      await updateDoc(groupChatRef, {
        members: arrayUnion(activeUser.uid),
      });

      // Add system message about user joining to group chat messages subcollection
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
          mx: "auto"
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
              height: "auto",
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
              {!joined && (
                <Typography variant="caption">
                  You're invited to join
                </Typography>
              )}
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

              <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
              />

              <Box mt={2} textAlign="left">
                <Typography variant="subtitle2" color="text.secondary">Route:</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {trip?.from} → {trip?.to}
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

            {!loading && !error && (
              <>
                {joined ? (
                  <Box mt={2} display="flex" flexDirection="column" alignItems="center">
                    <Button
                      variant="contained"
                      sx={{ mt: 1, borderRadius: 8, px: 4 }}
                      onClick={() => navigate(`/trips/${trip.id}`)}
                    >
                      Go to Trip
                    </Button>
                  </Box>
                ) : (
                  <>
                    {checklist.length > 0 && (
                      <Box mt={1} mb={4}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Checklist
                        </Typography>
                        <List
                          sx={{
                            maxHeight: "100px",
                            overflowY: "auto",
                            scrollbarWidth: "none",
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
                    )}
                    <Box mt={2} display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleReject}
                        sx={{ borderRadius: 1, px: 5 }}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleJoin}
                        sx={{ borderRadius: 1, px: 5 }}
                      >
                        Accept Invite
                      </Button>
                    </Box>
                  </>
                )}
              </>
            )}
          </Container>
        )}
      </Container>
    </ThemeProvider>
  );
}
