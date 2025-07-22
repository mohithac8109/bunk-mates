import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Snackbar,
  AvatarGroup,
  IconButton,
  Card,
  CardContent,
  LinearProgress,
  Collapse,
} from '@mui/material';
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  LocationOn, AccessTime,
} from "@mui/icons-material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

function GroupInvitePage() {
  const { inviteToken } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [tripInfo, setTripInfo] = useState(null);
  const [memberInfo, setMemberInfo] = useState({});
  const [createdByUser, setCreatedByUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [user, setUser] = useState(auth.currentUser);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timelineStats, setTimelineStats] = useState(null);

  // Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(u => setUser(u));
    return unsub;
  }, []);

  // Group listener (real-time)
  useEffect(() => {
    if (!inviteToken) return;
    const groupRef = doc(db, "groupChats", inviteToken);
    const unsub = onSnapshot(groupRef, (docSnap) => {
      if (docSnap.exists()) {
        setGroup({ id: docSnap.id, ...docSnap.data() });
      } else {
        setGroup(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [inviteToken]);

  // Set already joined status live
  useEffect(() => {
    if (!group?.members || !user?.uid) return;
    setAlreadyMember(group.members.includes(user.uid));
  }, [group?.members, user?.uid]);

  // Fetch creator info
  useEffect(() => {
    if (!group?.createdBy) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "users", group.createdBy));
      if (snap.exists()) setCreatedByUser(snap.data());
    };
    fetch();
  }, [group?.createdBy]);

  // Fetch trip info
  useEffect(() => {
    if (!group?.tripId) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "trips", group.tripId));
      if (snap.exists()) setTripInfo({ id: snap.id, ...snap.data() });
    };
    fetch();
  }, [group?.tripId]);

  // Fetch checklist
  useEffect(() => {
    if (!group?.tripId) return;
    const q = collection(db, "trips", group.tripId, "checklist");
    const unsub = onSnapshot(q, snap =>
      setChecklist(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    return () => unsub();
  }, [group?.tripId]);

  // Fetch first few members' info
  useEffect(() => {
    if (!group?.members?.length) return;
    const fetch = async () => {
      const info = {};
      await Promise.all(group.members.slice(0, 5).map(async uid => {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) info[uid] = snap.data();
      }));
      setMemberInfo(info);
    };
    fetch();
  }, [group?.members]);

  useEffect(() => {
    if (!tripInfo?.id) return setTimelineStats(null);
    getDocs(collection(db, "trips", tripInfo.id, "timeline")).then(snap => {
      const events = snap.docs.map(d => d.data());
      const total = events.length || 1;
      const completed = events.filter(e => e.completed === true).length;
      setTimelineStats({ completed, total, percent: Math.round((completed / total) * 100) });
    });
  }, [tripInfo]);
  

const handleJoin = async () => {
  if (!user) {
    setNotification('Sign in to join.');
    return;
  }
  if (!group) return;
  try {
    const groupRef = doc(db, "groupChats", group.id);

    // Add user to group's members array
    await updateDoc(groupRef, {
      members: arrayUnion(user.uid),
    });

    // Prepare system message text
    const userName = user.displayName || user.email || user.uid;
    const systemMessageText = `${userName} has joined the group via groups invite link`;

    // Add system message to messages subcollection
    const messagesRef = collection(db, "groupChat", group.id, "messages");
    await addDoc(messagesRef, {
      content: systemMessageText,
      type: "system", // flag to mark this as a system message
      timestamp: serverTimestamp(),
      senderId: null,  // system message has no sender id
    });

    setNotification("You've joined the group!");
  } catch (error) {
    console.error(error);
    setNotification("Failed to join group. Try again.");
  }
};
  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${group?.iconURL || ''})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        minHeight: "100vh"
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          bgcolor: alreadyMember ? '#81818111' : '#0000001b',
          backdropFilter: alreadyMember ? 'blur(80px)' : 'blur(60px)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          px: 3,
          pt: 4,
          pb: 5,
          color: '#fff',
        }}
      >
        {loading ? (
          <Typography align="center" sx={{ mb: 2 }}>Loading...</Typography>
        ) : group ? (
          <>
            <Collapse in={!alreadyMember} align="center">
              <Typography variant="caption">
                You're invited to join
              </Typography>
            </Collapse>
            <Collapse in={alreadyMember}>
              <Box textAlign="center" mb={4}>
                  <CheckCircleIcon color="#73ff7a" fontSize="large" />
                  <Typography mt={1} color="#73ff7a" variant="h6">
                      You’ve joined the trip!
                  </Typography>
              </Box>
            </Collapse>
            <Typography variant="h4" align="center" sx={{ fontWeight: 700, mb: 2 }}>
              {group.name}
            </Typography>
            <Typography variant="body2" align="center" sx={{ color: '#bbb', mb: 2 }}>
              {group.description || "No description provided."}
            </Typography>

            {tripInfo && (
              <Card
                sx={{
                  background: alreadyMember ? `url(${group?.iconURL})` : "",
                  backgroundSize: "cover",
                  backgroundColor: "#f1f1f111",
                  backgroundPosition: "center",
                  color: "#fff",
                  borderRadius: 4,
                  boxShadow: "none",
                  mb: 4,
                }}
              >
            
                <CardContent sx={{ backdropFilter: "blur(20px)", backgroundColor: "#0c0c0c21" }}>
                <Box display="flex" alignItems="start" gap={2} mb={1}>  
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                      {tripInfo.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#ffffffff", display: "flex", alignItems: "center" }}>
                      <LocationOn sx={{ fontSize: 16, mr: 1 }} /> {tripInfo.from} → {tripInfo.location}
                    </Typography>
                    {tripInfo.date && (
                      <Typography variant="body2" sx={{ color: "#e7e7e7ff", display: "flex", alignItems: "center" }}>
                       <AccessTime sx={{ fontSize: 16, mr: 1 }} /> {tripInfo.startDate} → {tripInfo.date}
                      </Typography>
                    )}
                  </Box>
                </Box>
            <Collapse in={alreadyMember}>
                {timelineStats && (
                  <Box mb={1}>
                    <Typography variant="caption" sx={{ color: "#cbcbcbff" }}>
                      Timeline Progress: {timelineStats.completed} / {timelineStats.total} complete
                    </Typography>
                    <LinearProgress
                      value={timelineStats.percent}
                      variant="determinate"
                      sx={{
                        mt: 0.5, borderRadius: 20, height: 7, bgcolor: "#ffffff36",
                        "& .MuiLinearProgress-bar": { bgcolor: "#ffffffff" }
                      }}
                    />
                  </Box>
                )}

                {checklist.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#bbb' }}>
                      Checklist
                    </Typography>
                    {checklist.slice(0, 5).map((item, idx) => (
                      <Typography key={idx} variant="body2" sx={{ color: '#aaa' }}>
                        • {item.text}
                      </Typography>
                    ))}
                  </Box>
                )}
            </Collapse>
                </CardContent>
              </Card>
            )}

            <AvatarGroup max={4} sx={{ justifyContent: 'center', mb: 2 }}>
              {group.members?.slice(0, 5).map(uid => (
                <Avatar key={uid} src={memberInfo[uid]?.photoURL || ''} />
              ))}
            </AvatarGroup>

            {alreadyMember ? (
              <>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate(`/group/${group.id}`)}
                  sx={{
                    mt: 4,
                    py: 1.2,
                    borderRadius: 3,
                    fontWeight: 600,
                    bgcolor: '#ffffffff',
                    color: '#000',
                    '&:hover': { bgcolor: '#ddddddff' },
                  }}
                >
                  View Group
                </Button>
              </>
            ) : (
              <Button
                onClick={handleJoin}
                fullWidth
                variant="contained"
                sx={{
                  bgcolor: '#fff',
                  color: '#000',
                  fontWeight: 600,
                  borderRadius: 3,
                  '&:hover': { bgcolor: '#eee' },
                }}
              >
                ACCEPT INVITE
              </Button>
            )}
          </>
        ) : (
          <Typography align="center" sx={{ color: 'red', fontWeight: 500 }}>
            Invalid or expired invite link.
          </Typography>
        )}

        <Snackbar
          open={!!notification}
          autoHideDuration={3000}
          onClose={() => setNotification(null)}
          message={notification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          ContentProps={{
            sx: {
              bgcolor: '#222',
              color: '#fff',
              px: 2,
              py: 1.5,
              borderRadius: 2,
              fontSize: 14,
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default GroupInvitePage;
