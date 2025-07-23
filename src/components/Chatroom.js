import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Button, Avatar, Typography, TextField, IconButton, CircularProgress,
  AppBar, Toolbar, Paper, Menu, MenuItem, Slide, Dialog, Divider, SwipeableDrawer, Stack, Chip, useTheme, keyframes, createTheme,
  ThemeProvider, Card, CardActionArea, CardContent, Grid, List, ListItemText, ListItemAvatar, LinearProgress, InputAdornment, Drawer
} from '@mui/material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Phone, Video, MoreVertical, ArrowDownToDotIcon } from 'lucide-react';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useSwipeable } from 'react-swipeable';
import CloseIcon from '@mui/icons-material/Close';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EmojiPicker from 'emoji-picker-react';
import Popover from '@mui/material/Popover';
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, getDoc, getDocs, where, deleteDoc
} from "firebase/firestore";
import { db, auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import {
  LocationOn, AccessTime,
} from "@mui/icons-material";
import { v4 as uuidv4 } from 'uuid'; // For notification message id
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";

function showLocalNotification(title, options) {
  if (Notification.permission === "granted") {
    if (document.hasFocus()) {
      // Show notification in foreground
      new Notification(title, options);
    } else if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      // Show notification via Service Worker in background
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    }
  }
}

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

// Custom dark theme based on your detailed colors
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#02020200", // almost transparent black for main background
      paper: "#0c0c0c", // deep black for dialogs/paper
    },
    primary: {
      main: "#ffffffff", // bright green solid for buttons and accents
      contrastText: "#000000", // black text on bright green buttons
    },
    secondary: {
      main: "#444444ea", // dark grey with transparency for popups or secondary backgrounds
    },
    text: {
      primary: "#FFFFFF", // pure white for main text
      secondary: "#BDBDBD", // light grey for secondary text
      disabled: "#f0f0f0", // off-white for less prominent text or backgrounds
    },
    action: {
      hover: "#c0c0c0ff", // bright green hover for interactive elements
      selected: "#131313", // dark black for selected states
      disabledBackground: "rgba(0,155,89,0.16)", // dark green transparent backgrounds for outlines
      disabled: "#BDBDBD",
    },
    divider: "rgb(24, 24, 24)", // very dark grey for borders
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h6: {
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: "1.5",
      color: "#FFFFFF",
    },
    body2: {
      fontSize: "0.875rem",
      color: "#BDBDBD",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0c0c0c40",
          backdropFilter: "blur(40px)", // dark grey/black for app bar background
          boxShadow: "none",
          borderBottom: "1px solid rgb(24, 24, 24, 0.5)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#2c2c2c00", // dark grey card background
          color: "#FFFFFF",
          boxShadow: "none",
          borderRadius: 16,
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          cursor: "pointer",
          "&:hover": {
            transform: "translateY(-4px)",
            backgroundColor: "#131313",
          },
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
          transition: "background-color 0.3s ease, box-shadow 0.3s ease",
          color: "#000",
          backgroundColor: "#fff",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: "#f0f0f0", // off-white avatar background
          color: "#000",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#0c0c0c40", // deep black menu background
          color: "#FFFFFF",
          backdropFilter: "blur(40px)",
          borderRadius: 10,
          border: "1px solid rgb(24, 24, 24)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#2c2c2c", // translucent dark green hover
          },
        },
      },
    },
    MuiBox: {
      styleOverrides: {
        root: {
          // General box overrides if needed
        },
      },
    },
  },
});

function ChatRoom() {
  const { friendId } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [friendDetails, setFriendDetails] = useState({ name: 'Loading...', photoURL: '', status: 'offline' });
  const [editMessageId, setEditMessageId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [commonGroups, setCommonGroups] = useState([]);
  const [commonTrips, setCommonTrips] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedReplyMessage, setSelectedReplyMessage] = useState(null);
  const controls = useAnimation();
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [reactionMsg, setReactionMsg] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [nickname, setNickname] = useState('');
  const [editNickname, setEditNickname] = useState(false);
  const [addNicknameDrawerOpen, setAddNicknameDrawerOpen] = useState(false);
  const [sharedBudgets, setSharedBudgets] = useState([]);
  const muiTheme = useTheme();
  const [groupMembersInfo, setGroupMembersInfo] = useState({});
  const [allCommonGroupsDrawerOpen, setAllCommonGroupsDrawerOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");
  const [checklist, setChecklist] = useState([]);
  const [timelineStatsMap, setTimelineStatsMap] = useState([]);
  const [showAllTripsDrawer, setShowAllTripsDrawer] = useState(false);
  const [tripSearch, setTripSearch] = useState("");
  const visibleTrips = commonTrips.slice(0, 1);
  const moreCount = commonTrips.length - 1;

  const scrollContainerRef = useRef(null);
  const chatId = currentUser && friendId ? [currentUser.uid, friendId].sort().join('_') : null;

  const history = useNavigate();
  const messagesEndRef = useRef(null);

  const [notification, setNotification] = useState(null);

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
  };

  useEffect(() => {
  // Request notification permission and FCM token
  async function requestPermission() {
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      await getToken(messaging, { vapidKey: "BA3kLicUjBzLvrGk71laA_pRVYsf6LsGczyAzF-NTBWEmOE3r4_OT9YiVt_Mvzqm7dZCoPnht84wfX-WRzlaSLs" });
    }
  }
  requestPermission();

  // Listen for foreground FCM messages
  const unsubscribe = onMessage(messaging, (payload) => {
    if (payload?.notification) {
      showLocalNotification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/logo192.png",
      });
    }
  });

  return () => {
    // No unsubscribe needed for onMessage in v9 modular
  };
}, []);

// --- In your onSnapshot for messages, show notification for new messages, reactions, or nickname edits ---
useEffect(() => {
  if (!chatId || !currentUser) return;

  const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const msgs = [];
    querySnapshot.forEach((doc) => {
      const msg = doc.data();
      msg.id = doc.id;
      msgs.push(msg);
    });
    setMessages(msgs);

    // Notification for new message from friend
    const lastMessage = msgs[msgs.length - 1];
    if (
      lastMessage &&
      lastMessage.senderId !== currentUser.uid &&
      !lastMessage.isRead &&
      !lastMessage.system
    ) {
      showLocalNotification("New Message", {
        body: lastMessage.text,
        icon: "/logo192.png",
      });
    }

    // Notification for system messages (nickname edits, etc)
    if (
      lastMessage &&
      lastMessage.system &&
      lastMessage.senderId !== currentUser.uid &&
      lastMessage.notificationType === "nickname"
    ) {
      showLocalNotification("Nickname Changed", {
        body: lastMessage.text,
        icon: "/logo192.png",
      });
    }

    // Notification for reactions
    if (
      lastMessage &&
      lastMessage.reactions &&
      Array.isArray(lastMessage.reactions) &&
      lastMessage.reactions.some(r => r.user !== currentUser.uid)
    ) {
      showLocalNotification("New Reaction", {
        body: "Someone reacted to a message!",
        icon: "/logo192.png",
      });
    }

    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.senderId !== currentUser?.uid && !lastMsg.isRead) {
      updateDoc(doc(db, "chats", chatId, "messages", lastMsg.id), {
        isRead: true
      });
    }
  });

  return () => unsubscribe();
}, [chatId, currentUser]);

  const getGroupedReactions = (msg) => {
    if (!msg.reactions) return {};
    // reactions: [{emoji: '❤️', users: ['uid1', 'uid2']}]
    const grouped = {};
    msg.reactions.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r.user);
    });
    return grouped;
  };

  useEffect(() => {
    const fetchNickname = async () => {
      if (!currentUser || !friendId) return;
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const nicknames = userDoc.data().nicknames || {};
        setNickname(nicknames[friendId] || '');
      }
    };
    fetchNickname();
  }, [currentUser, friendId]);

  // --- Remove user from friends ---
  const handleRemoveFriend = async () => {
    if (!window.confirm("Are you sure you want to remove this user from your friends?")) return;
    // Remove from current user's friends
    const userRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userRef);
    const friends = userDoc.exists() ? (userDoc.data().friends || []) : [];
    await updateDoc(userRef, {
      friends: friends.filter(uid => uid !== friendId)
    });
    // Remove from friend's friends
    const friendRef = doc(db, "users", friendId);
    const friendDoc = await getDoc(friendRef);
    const friendFriends = friendDoc.exists() ? (friendDoc.data().friends || []) : [];
    await updateDoc(friendRef, {
      friends: friendFriends.filter(uid => uid !== currentUser.uid)
    });
    setNotification("Removed from friends.");
    setOpenProfile(false);
    // Optionally redirect to chats list
    history('/chats');
  };

  // --- Clear chat history ---
  const handleClearChat = async () => {
    if (!window.confirm("Clear all chat messages with this user?")) return;
    const msgsQuery = query(collection(db, "chats", chatId, "messages"));
    const msgsSnapshot = await getDocs(msgsQuery);
    const batch = [];
    msgsSnapshot.forEach(docSnap => {
      batch.push(deleteDoc(doc(db, "chats", chatId, "messages", docSnap.id)));
    });
    await Promise.all(batch);
    setNotification("Chat cleared.");
  };

  // --- Edit nickname ---
  const handleSaveNickname = async () => {
    const userRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userRef);
    const nicknames = userDoc.exists() ? (userDoc.data().nicknames || {}) : {};
    nicknames[friendId] = nickname;
    await updateDoc(userRef, { nicknames });
    setEditNickname(false);

    // Send a notification message in the chat (styled as a system/notification message)
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: `${currentUser.displayName || "A user"} set a nickname for you: "${nickname}"`,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      isRead: false,
      system: true, // Use this flag to style as a notification in your message rendering
      notificationType: "nickname"
    });
  };

  // --- Budget card click handler ---
  const handleBudgetClick = (budgetId) => {
    history(`/budgets/${budgetId}`);
  };

  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  const [openProfile, setOpenProfile] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) return;
    setDrawerOpen(open);
  };

  useEffect(() => {
    if (messages.length > 0) {
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Don't scroll, just show button
        setNewMessagesCount(prev => prev + 1);
      }
    }
  }, [messages]);


  const bottomRef = useRef(null);

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);


const fetchCommonGroupsAndTrips = async (currentUser, friendId) => {
  if (!currentUser?.uid || !friendId) return;

  // --- Fetch Groups where currentUser is a member ---
  const groupQuery = query(
    collection(db, 'groupChats'),
    where('members', 'array-contains', currentUser.uid)
  );
  const groupSnapshot = await getDocs(groupQuery);

  const matchedGroups = groupSnapshot.docs
    .filter(doc => {
      const members = doc.data().members || [];
      // member arrays can be mixed, make sure elements are string
      return members.map(String).includes(String(friendId));
    })
    .map(doc => ({
      id: doc.id,
      name: doc.data().name ?? "",
      iconURL: doc.data().iconURL ?? "",
      emoji: doc.data().emoji ?? "",
      members: doc.data().members || [],
    }));

  setCommonGroups(matchedGroups);

  // --- Fetch Trips where currentUser is a member ---
  const tripQuery = query(
    collection(db, 'trips'),
    where('members', 'array-contains', currentUser.uid)
  );
  const tripSnapshot = await getDocs(tripQuery);

  const matchedTrips = tripSnapshot.docs
    .filter(doc => {
      const members = doc.data().members || [];
      return members.map(String).includes(String(friendId));
    })
    .map(doc => ({
      id: doc.id,
      name: doc.data().name ?? "",
      from: doc.data().from ?? "",
      location: doc.data().location ?? "",
      startDate: doc.data().startDate ?? "",
      endDate: doc.data().endDate ?? "",
      iconURL: doc.data().iconURL ?? ""
    }));

  setCommonTrips(matchedTrips);
};

useEffect(() => {
  if (currentUser && friendDetails?.uid) {
    fetchCommonGroupsAndTrips({
      currentUser,
      friendDetails,
      setCommonGroups,
      setCommonTrips,
    });
  }
}, [currentUser, friendDetails]);

useEffect(() => {
  // Get all unique member UIDs for all common groups
  const allUids = [...new Set(commonGroups.flatMap(g => g.members || []))];
  if (allUids.length === 0) {
    setGroupMembersInfo({});
    return;
  }
  const fetchMembers = async () => {
    const map = {};
    await Promise.all(
      allUids.map(async uid => {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) map[uid] = snap.data();
      })
    );
    setGroupMembersInfo(map);
  };
  fetchMembers();
}, [commonGroups]);

useEffect(() => {
  if (!commonTrips || commonTrips.length === 0) return;

  // Reset when trips change
  setTimelineStatsMap({});

  commonTrips.forEach(async (trip) => {
    const snap = await getDocs(collection(db, "trips", trip.id, "timeline"));
    const events = snap.docs.map(d => d.data());
    const total = events.length || 1;
    const completed = events.filter(e => e.completed === true).length;
    const percent = Math.round((completed / total) * 100);
    setTimelineStatsMap(prev => ({
      ...prev,
      [trip.id]: { completed, total, percent }
    }));
  });
}, [commonTrips]);


useEffect(() => {
  const fetchSharedBudgets = async () => {
    if (!currentUser?.uid || !friendId) return;

    // 1. Get all budgets.
    const q = collection(db, "budgets");
    const snap = await getDocs(q);

    // 2. Filter for budgets where both users are contributors.
    const shared = snap.docs
      .filter(doc => {
        const contributors = Array.isArray(doc.data().contributors) ? doc.data().contributors : [];
        // Defensive: Check for .uid property in contributor objects
        const contributorUids = contributors
          .map(c => typeof c === "object" && c && c.uid ? String(c.uid) : null)
          .filter(Boolean);
        return contributorUids.includes(String(currentUser.uid)) &&
               contributorUids.includes(String(friendId));
      })
      .map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().tripName,
        total: doc.data().total || "N/A",
        contributors: doc.data().contributors || [],
      }));

    setSharedBudgets(shared);
  };
  fetchSharedBudgets();
}, [currentUser, friendId]);

// Usage in your component
useEffect(() => {
  if (currentUser && friendId) {
    fetchCommonGroupsAndTrips(currentUser, friendId);
  }
}, [currentUser, friendId]);


  useEffect(() => {
    const fetchUserDetails = async () => {
      const userDoc = await getDoc(doc(db, "users", friendId));
      if (userDoc.exists()) setFriendDetails(userDoc.data());
    };
    fetchUserDetails();
  }, [friendId]);

  useEffect(() => {
    if (!chatId) return;
  
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        const msg = doc.data();
        msg.id = doc.id;
        msgs.push(msg);
      });
      setMessages(msgs);
  
      const lastMessage = msgs[msgs.length - 1];
      if (lastMessage && lastMessage.senderId !== currentUser?.uid && !lastMessage.isRead) {
        updateDoc(doc(db, "chats", chatId, "messages", lastMessage.id), {
          isRead: true
        });
      }
    });
  
    return () => unsubscribe();
  }, [chatId, currentUser]);
  

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setIsSending(true);
    if (editMessageId) {
      await updateDoc(doc(db, "chats", chatId, "messages", editMessageId), {
        text: input.trim(),
        edited: true,
        timestamp: serverTimestamp()
      });
      setEditMessageId(null);
    } else {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: input.trim(),
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
        isRead: false,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          text: replyingTo.text,
          senderId: replyingTo.senderId
        } : null
      });      
    }
    setInput('');
    setIsSending(false);
  };

  const handleEdit = (msg) => {
    setInput(msg.text || "");
    setEditMessageId(msg.id);
  };

  const handleDelete = async (msgId) => {
    await deleteDoc(doc(db, "chats", chatId, "messages", msgId));
  };

  const handleContextMenu = (event, msg) => {
    event.preventDefault();
    if (msg.senderId === currentUser.uid || msg.senderId === friendId) {
      setAnchorEl(event.currentTarget);
      setSelectedMsg(msg);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMsg(null);
  };

  // --- Update handleReaction to support multiple reactions per message ---
  const handleReaction = async (emoji, msg = reactionMsg || selectedMsg) => {
    if (!msg) return;
    const reactions = msg.reactions || [];
    const userId = currentUser.uid;

    // Remove any previous reaction by this user (regardless of emoji)
    let updated = reactions.filter(r => r.user !== userId);

    // Add the new reaction
    updated.push({ emoji, user: userId });

    await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
      reactions: updated
    });

    setShowEmojiPicker(false);
    setReactionAnchorEl(null);
    setReactionMsg(null);
    handleMenuClose();
  };

const removeUserReaction = async (msg, emoji) => {
  if (!msg || !msg.reactions) return;
  const userId = currentUser.uid;
  // Keep all reactions except the one with this emoji and user
  const updated = msg.reactions.filter(
    r => !(r.emoji === emoji && r.user === userId)
  );
  await updateDoc(doc(db, "chats", chatId, "messages", msg.id), {
    reactions: updated
  });
};


  const getMessageDate = (timestamp) => {
    const date = new Date(timestamp?.toDate());
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const goBack = () => {
    history(-1);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (authLoading || !currentUser) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
          <Box sx={{ backgroundColor: '#21212100', height: '98vh', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          background: 'linear-gradient(to bottom, #000000, #000000d9, #000000c9, #00000090, #00000000)',
          backdropFilter: 'blur(0px)',
          padding: '10px 10px',
          borderBottom: "none",
          zIndex: 1100 
        }}
        elevation={1}
      >
        <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"}>
          <Box display={"flex"} alignItems={"center"}>
          <IconButton onClick={goBack} sx={{ mr: 1, color: '#fff' }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar src={friendDetails.photoURL} alt={friendDetails.name} sx={{ mr: 2, height: '50px', width: '50px' }} />
          <Box onClick={() => setOpenProfile(true)}>
            <Typography variant="h6" color="#fff" fontSize="18px">
              {nickname ? nickname : friendDetails.name}
            </Typography>
            <Typography variant="h6" color="#d1d1d1" fontSize="13px">@{friendDetails.username}</Typography>
            <Typography variant="body2" sx={{ color: friendDetails.status === 'online' ? '#AEEA00' : '#BDBDBD' }}>
              {friendDetails.status}
            </Typography>
          </Box>
          </Box>
                  <IconButton
                    sx={{ color: '#fff', backgroundColor: "#181818", backdropFilter: "blur(80px)", borderRadius: 5, py: 1.4, px: 1.4, display: "flex", alignItems: "center", mr: 2 }}
                    onClick={() => window.open(`tel:${friendDetails.mobile}`, '_blank')}
                    disabled={!friendDetails.mobile}
                  >
                    <PhoneOutlinedIcon />
                  </IconButton>
        </Box>
      </AppBar>

      {/* Messages */}
      <Box
        ref={scrollContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          pt: '80px',
          pb: '80px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUser.uid;
            const showDate =
              index === 0 ||
              getMessageDate(msg.timestamp) !== getMessageDate(messages[index - 1].timestamp);

            // System/notification message style
            if (msg.system) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '10px 0'
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      px: 1,
                      py: 1,
                      bgcolor: '#f1f1f111',
                      backdropFilter: "blur(80px)",
                      color: '#fff',
                      borderRadius: '12px',
                      fontStyle: 'italic',
                      fontSize: '0.95em',
                      opacity: 0.85,
                      boxShadow: 'none',
                      textAlign: "center"
                    }}
                  >
                    {msg.text}
                  </Paper>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                className={`message-container ${isOwn ? 'own' : ''}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(event, info) => {
                  if (info.offset.x > 100) {
                    setReplyingTo(msg);
                  }
                  // Always reset x to 0 after drag
                  controls.start({ x: 0 });
                }}
                animate="visible"
                initial="hidden"
                exit="exit"
                variants={messageVariants}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ touchAction: 'pan-y' }}
              >
                {showDate && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      marginBottom: 0,
                      marginTop: 15
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: '#BDBDBD', textAlign: 'center' }}
                    >
                      {getMessageDate(msg.timestamp)}
                    </Typography>
                  </motion.div>
                )}

                <Box
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                  onDoubleClick={() => isOwn && handleEdit(msg)}
                  sx={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Paper
                    elevation={1}
                    sx={{
                      px: 2,
                      py: 1,
                      maxWidth: '70%',
                      minWidth: "100px",
                      bgcolor: isOwn ? '#005c4b' : '#353535',
                      borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      color: '#FFFFFF',
                      position: 'relative'
                    }}
                  >
                    {msg.replyTo && (
                      <Box
                        sx={{
                          borderLeft: '4px solid #00f721',
                          pl: 1,
                          mb: 1,
                          bgcolor: '#2b2b2b',
                          borderRadius: 1,
                          zIndex: 9999
                        }}
                      >
                        <Typography variant="caption" color="primary">
                          {msg.replyTo.senderId === currentUser.uid ? 'You' : friendDetails.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#ccc', fontStyle: 'italic' }}>
                          {msg.replyTo.text.length > 60
                            ? msg.replyTo.text.slice(0, 60) + '...'
                            : msg.replyTo.text}
                        </Typography>
                      </Box>
                    )}

                    <Typography variant="body1">{msg.text}</Typography>

                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        color: '#BDBDBD',
                        mt: 0.5,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      {msg.timestamp?.toDate().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}


                      {isOwn && (
                        <Box sx={{ textAlign: 'right', display: "flex", alignItems: "center", gap: 1 }}>
                      {msg.edited && (
                        <Typography
                        variant="caption"
                        sx={{ color: "#888", ml: 1, fontStyle: "italic" }}
                        >
                          edited
                        </Typography>
                      )}
                          <DoneAllIcon
                            fontSize="small"
                            sx={{ color: msg.isRead ? '#0099ff' : '#BDBDBD' }}
                          />
                        </Box>
                      )}
                    </Typography>

                    {msg.reactions && msg.reactions.length > 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          alignItems: 'center',
                          position: 'absolute',
                          bottom: -18,
                          right: 5,
                          zIndex: 2,
                          borderRadius: '12px',
                        }}
                      >
                        {Object.entries(getGroupedReactions(msg)).map(([emoji, users]) => (
                          <Chip
                            key={emoji}
                            label={`${emoji}`}
                            size="small"
                            sx={{
                              bgcolor: '#333',
                              color: '#fff',
                              fontSize: '1.1em',
                              borderRadius: '18px',
                              cursor: 'pointer',
                              padding: '5px 1px',
                            }}
                            onClick={(e) => {
                              setReactionAnchorEl(e.currentTarget);
                              setReactionMsg(msg);
                            }}
                          />
                        ))}
                      </Box>
                    )}

                  </Paper>
                  {!isAtBottom && newMessagesCount > 0 && (
                    <button
                      className="scroll-to-bottom-btn"
                      onClick={() => {
                        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                        setNewMessagesCount(0);
                      }}
                    >
                      ↓ {newMessagesCount} New Message{newMessagesCount > 1 ? 's' : ''}
                    </button>
                  )}

                  <div ref={messagesEndRef} />
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </Box>

      {replyingTo && (
        <Paper sx={{ p: 1, position: 'relative', bottom: '55px', width: '9v5w', bgcolor: '#2b2b2bb0', mb: 1, borderLeft: '4px solid #00f721', backdropFilter: 'blur(30px)' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color="primary">
                Replying to {replyingTo.senderId === currentUser.uid ? 'You' : friendDetails.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                {replyingTo.text.length > 60
                  ? replyingTo.text.slice(0, 60) + '...'
                  : replyingTo.text}
              </Typography>
            </Box>
            <IconButton onClick={() => setReplyingTo(null)}>
              <CloseIcon fontSize="small" sx={{ color: 'white' }} />
            </IconButton>
          </Box>
        </Paper>
      )}

          <div ref={bottomRef} />
      {/* Input Field */}
      <Box
        component="form"
        onSubmit={sendMessage}
        sx={{
          p: 1,
          display: 'flex',
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '95vw',
          alignItems: 'center',
          zIndex: '1200',
          borderTop: '0px solid #5E5E5E',
          background: 'linear-gradient(to top, #000000, #00000090, #00000000)',
        }}
      >
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={editMessageId ? "Editing message..." : "Type your message..."}
          fullWidth
          variant="outlined"
          size="small"
          position="fixed"
          elevation={1}
          sx={{
            zIndex: '1500',
            mr: 1,
            borderRadius: '40px',
            input: {
              color: '#FFFFFF',
              height: '40px',
              borderRadius: '40px',
              backdropFilter: "blur(30px)",
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#5E5E5E',
                borderRadius: '40px'
              },
              '&:hover fieldset': {
                borderColor: '#757575',
                borderRadius: '40px'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#757575',
                borderRadius: '40px'
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#757575'
            }
          }}
        />
        <Button type="submit" sx={{ backgroundColor: '#ffffffff', height: '50px', width: '50px', borderRadius: 4, }} disabled={isSending}>
          {isSending ? <CircularProgress size={24} sx={{ color: '#000' }} /> : <SendIcon sx={{ color: '#000' }} />}
        </Button>
      </Box>

      {/* Context Menu */}
<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleMenuClose}
  PaperProps={{
    sx: {
      minWidth: 200,
      borderRadius: 2,
      bgcolor: '#181818',
      color: '#fff',
      boxShadow: '0 4px 24px #000a',
      p: 0.5,
    },
  }}
>
  {/* ──────── 1️⃣  Reactions row ──────── */}
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1 }}>
    {['❤️', '😂', '👍', '😁', '👌'].map((emoji) => (
      <IconButton
        key={emoji}
        onClick={() => {
          handleReaction(emoji, selectedMsg);
          handleMenuClose();
        }}
        sx={{
          width: 36,
          height: 36,
          fontSize: 18,
          bgcolor: '#292929',
          borderRadius: 1.5,
          color: '#fff',
          '&:hover': { bgcolor: '#3a3a3a' },
        }}
      >
        {emoji}
      </IconButton>
    ))}

    {/* + emoji‑picker trigger */}
    <IconButton
      onClick={() => {
        setShowEmojiPicker(true);
        handleMenuClose();
      }}
      sx={{
        width: 36,
        height: 36,
        bgcolor: '#292929',
        borderRadius: 1.5,
        color: '#fff',
        '&:hover': { bgcolor: '#3a3a3a' },
      }}
    >
      <AddIcon fontSize="small" />
    </IconButton>
  </Box>

  <Divider sx={{ my: 1, bgcolor: '#333' }} />

  {/* ──────── 2️⃣  Message actions ──────── */}
  <MenuItem
    onClick={() => {
      setReplyingTo(selectedMsg);
      handleMenuClose();
    }}
    sx={{ fontWeight: 500, fontSize: 15 }}
  >
    💬 Reply
  </MenuItem>

  {selectedMsg?.senderId === currentUser.uid && (
    <>
      <MenuItem
        onClick={() => {
          handleEdit(selectedMsg);
          handleMenuClose();
        }}
        sx={{ fontWeight: 500, fontSize: 15 }}
      >
        ✏️ Edit
      </MenuItem>
      <MenuItem
        onClick={() => {
          handleDelete(selectedMsg?.id);
          handleMenuClose();
        }}
        sx={{ color: '#ff4444', fontWeight: 500, fontSize: 15 }}
      >
        🗑️ Delete
      </MenuItem>
    </>
  )}

  <Divider sx={{ my: 0.5, bgcolor: '#333' }} />

  <MenuItem
    onClick={() => {
      navigator.clipboard.writeText(selectedMsg?.text || '');
      setNotification('Message copied!');
      handleMenuClose();
    }}
    sx={{ fontSize: 15 }}
  >
    📋 Copy Text
  </MenuItem>

  {selectedMsg?.text?.length > 10 && (
    <MenuItem
      onClick={() => {
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(
            selectedMsg.text
          )}`,
          '_blank'
        );
        handleMenuClose();
      }}
      sx={{ fontSize: 15 }}
    >
      🔎 Search on Google
    </MenuItem>
  )}
</Menu>

<Menu
  anchorEl={reactionAnchorEl}
  open={Boolean(reactionAnchorEl) && !showEmojiPicker}
  onClose={() => {
    setReactionAnchorEl(null);
    setReactionMsg(null);
  }}
  PaperProps={{
    sx: {
      minWidth: 120,
      borderRadius: 2,
      bgcolor: "#181818",
      color: "#fff",
      boxShadow: "0 4px 24px #000a",
      p: 0.5,
    },
  }}
>
  {reactionMsg &&
    Object.entries(getGroupedReactions(reactionMsg)).map(([emoji, users]) => (
      <MenuItem key={emoji} sx={{ display: "flex", justifyContent: "space-between" }}>
        {users.includes(currentUser?.uid) ? (
        <span
            onClick={async () => {
              await removeUserReaction(reactionMsg, emoji);
              setReactionAnchorEl(null);
              setReactionMsg(null);
            }}>
          {emoji} {users.includes(currentUser?.uid) ? "You" : ""}
        </span>
        ) : (
        <span>
          {emoji} {users.includes(currentUser?.uid) ? "" : friendDetails?.name}
        </span>
        )}
      </MenuItem>
    ))}
</Menu>


      <Popover
        open={showEmojiPicker}
        anchorEl={reactionAnchorEl}
        onClose={() => setShowEmojiPicker(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <EmojiPicker
          onEmojiClick={(emojiData) => {
            handleReaction(emojiData.emoji, reactionMsg);
            setShowEmojiPicker(false);
          }}
          theme="dark"
        />
      </Popover>

      {/* Notification Snackbar */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              top: 20,
              right: 20,
              padding: '10px',
              backgroundColor: '#000',
              color: '#fff',
              borderRadius: '5px',
              zIndex: 1000,
            }}
          >
            <Typography variant="body2">{notification}</Typography>
          </motion.div>
        )}
      </AnimatePresence>

      <Box>
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
<Drawer
  anchor="bottom"
  open={openProfile}
  onClose={() => setOpenProfile(false)}
  onOpen={() => {}}
  fullHeight
  PaperProps={{
    sx: {
      border: 'transparent',
      backgroundColor: '#0c0c0c0a',
      backdropFilter: 'blur(70px)',
      color: '#fff',
      maxWidth: 470,
      mx: 'auto',
    },
  }}
>
  <Box sx={{ p: 3, position: 'relative', height: '100%', overflowY: 'auto' }}>

    <Button
      startIcon={<ArrowBackIcon />}
      onClick={() => setOpenProfile(false)}
      sx={{
        mb: 0,
        borderRadius: 2,
        color: "#fff",
        backgroundColor: "#f1f1f111",
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    {/* Profile Section */}
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
      <Avatar src={friendDetails.photoURL} sx={{ width: 90, height: 90, mb: 2 }} />
      <Typography variant="h6" fontWeight="bold">{friendDetails.name}</Typography>
      <Typography variant="subtitle1" sx={{ color: '#aaa' }}>@{friendDetails.username}</Typography>

      <Typography
        variant="body2"
        sx={{
          backgroundColor: "#f1f1f111",
          px: 2,
          py: 0.5,
          borderRadius: 4,
          color: '#aaa',
        }}
      >
        {nickname || friendDetails.name}
      </Typography>

      {friendDetails.bio && (
        <Box
          sx={{
            bgcolor: '#f1f1f111',
            color: '#aaa',
            borderRadius: 0.7,
            py: 1.4,
            px: 2,
            display: 'flex',
            justifyContent: 'left',
            gap: 1.5,
            mt: 1,
          }}
        >
          <Typography variant="body2" textAlign="justify">
            <strong>Bio:</strong> {friendDetails.bio}
          </Typography>
        </Box>
      )}
    </Box>

    
    {/* Action Buttons */}
    <Stack spacing={0.5} mt={3} mb={2} sx={{ backgroundColor: "#f1f1f100", borderRadius: 1, p: 1 }}>
      <IconButton
        onClick={() => window.open(`mailto:${friendDetails.email}`, '_blank')}
        disabled={!friendDetails.email}
        sx={{
          bgcolor: '#f1f1f111',
          color: '#fff',
          py: 1.4,
          px: 2,
          borderRadius: "20px 20px 7px 7px",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          gap: 1.5,
        }}
      >
        <EmailOutlinedIcon />
        <Typography variant="body1" sx={{ fontSize: 16, color: '#aaa' }}>
          {friendDetails.email || 'Email not available'}
        </Typography>
      </IconButton>

      {friendDetails.mobile && (
        <IconButton
          onClick={() => window.open(`tel:${friendDetails.mobile}`, '_blank')}
          sx={{
            bgcolor: '#f1f1f111',
            color: '#fff',
            py: 1.4,
            px: 2,
            borderRadius: "7px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            gap: 1.5,
          }}
        >
          <PhoneOutlinedIcon />
          <Typography variant="body1" sx={{ fontSize: 16, color: '#aaa' }}>
            {friendDetails.mobile}
          </Typography>
        </IconButton>
      )}


      <IconButton
        onClick={() => setOpenProfile(false)}
        sx={{
          bgcolor: '#f1f1f111',
          color: '#fff',
          py: 1.4,
          px: 2,
          borderRadius: "7px",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          gap: 1.5,
        }}
      >
        <ChatOutlinedIcon />
        <Typography variant="body1" sx={{ fontSize: 16, color: '#aaa' }}>
          Send a Message
        </Typography>
      </IconButton>

      <IconButton
        onClick={() => {
          setAddNicknameDrawerOpen(true);
          setEditNickname(true);
        }}
        sx={{
          bgcolor: '#f1f1f111',
          color: '#fff',
          py: 1.4,
          px: 2,
          borderRadius: "7px 7px 20px 20px",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          gap: 1.5,
        }}
      >
        <TextFieldsIcon />
        <Typography variant="body1" sx={{ fontSize: 16, color: '#aaa' }}>
          Add a Nickname
        </Typography>
      </IconButton>


    {/* Common Groups */}
<Box>
  <Typography variant="subtitle1" fontWeight="bold" mt={3} mb={0.5}>Common Groups</Typography>
  <Grid container spacing={0.5} mb={2}>
    {(commonGroups.slice(0,3)).map(group => (
      <Grid item xs={12} sm={6} md={4} key={group.id}>
        <Card sx={{ bgcolor: '#f1f1f106', color: '#fff', borderRadius: "10px", overflow: 'hidden' }}>
          <CardActionArea onClick={() => history(`/group/${group.id}`)}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={group.iconURL}
                sx={{ bgcolor: '#fff', color: '#111' }}
              >
                {group.emoji || group.name?.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body1" color="#fff" fontWeight={"bolder"} noWrap>
                  {group.name}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    fontSize: 13,
                    color: '#ccc',
                  }}
                >
                  {(group.members ?? [])
                    .map(uid => groupMembersInfo[uid]?.name)
                    .filter(Boolean)
                    .join(", ") ||
                    <Typography variant="caption" sx={{ color: "#ccc" }}>Loading...</Typography>
                  }
                </Box>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>
    ))}
    {(commonGroups.length > 3) && (
        <Button
          variant="contained"
          fullWidth
          sx={{ color: '#ffffffff', backgroundColor: "#f1f1f121", borderRadius: 1, fontWeight: 600, boxShadow: "none" }}
          onClick={() => setAllCommonGroupsDrawerOpen(true)}
        >
          {commonGroups.length - 3} more group{commonGroups.length - 3 > 1 ? "s" : ""}
        </Button>
    )}
  </Grid>
</Box>

<Box mb={4}>
  <Typography variant="subtitle1" fontWeight="bold" mb={1}>Common Trips</Typography>
  <List>
    {visibleTrips.map(trip => (
      <Card key={trip.id}
        sx={{
          background: `url(${trip?.iconURL})`,
          backgroundSize: "cover",
          backgroundColor: "#f1f1f111",
          backgroundPosition: "center",
          color: "#fff",
          borderRadius: "20px 20px 7px 7px",
          boxShadow: "none",
          mb: 0.5,
        }}
      >
        <CardContent sx={{ backdropFilter: "blur(20px)", backgroundColor: "#0c0c0c21" }}>
          <Box display="flex" alignItems="start" gap={2} py="0">
            <Box py="0">
              <Box sx={{
                display: "flex", width: "75vw", flexDirection: "row",
                alignItems: "center", justifyContent: "space-between", gap: 1
              }}>
                <Typography variant="h6"
                  sx={{
                    width: '100%', fontWeight: 800, mb: 1,
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                  }}>
                  {trip.name}
                </Typography>
                {timelineStatsMap?.[trip.id] && (
                  <Box mb={1} minWidth={110}>
                    <Typography variant="caption" sx={{ color: "#cbcbcbff" }}>
                      {timelineStatsMap[trip.id]?.completed} / {timelineStatsMap[trip.id]?.total} complete
                    </Typography>
                    <LinearProgress
                      value={timelineStatsMap[trip.id]?.percent}
                      variant="determinate"
                      sx={{
                        mt: 0.5, borderRadius: 20, height: 7, bgcolor: "#ffffff36",
                        "& .MuiLinearProgress-bar": { bgcolor: "#ffffffff" }
                      }}
                    />
                  </Box>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: "#ffffffff", display: "flex", alignItems: "center" }}>
                <LocationOn sx={{ fontSize: 16, mr: 1 }} /> {trip.from} → {trip.location}
              </Typography>
              <Typography variant="body2" sx={{ color: "#e7e7e7ff", display: "flex", alignItems: "center" }}>
                <AccessTime sx={{ fontSize: 16, mr: 1 }} /> {trip.startDate} → {trip.endDate}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    ))}
    {moreCount > 0 && (
      <Button
        variant="contained"
        fullWidth
        sx={{
          color: '#ffffffff', backgroundColor: "#f1f1f121", borderRadius: "7px 7px 20px 20px", fontWeight: 600, boxShadow: "none",
          fontWeight: 600, py: 1, px: 2,
        }}
        onClick={() => setShowAllTripsDrawer(true)}
      >
        {moreCount} more trip{moreCount > 1 ? "s" : ""}
      </Button>
    )}
  </List>
</Box>


    {/* Shared Budgets */}
    {/* {sharedBudgets.length > 0 && (
      <>
        <Typography variant="subtitle2" fontWeight="bold" mt={2} mb={1}>Shared Budgets</Typography>
        <List>
          {sharedBudgets.map(budget => (
            <Card key={budget.id} sx={{ bgcolor: '#232323', color: '#fff', mb: 2, borderRadius: 3 }}>
              <CardActionArea onClick={() => history(`/budgets/${budget.id}`)}>
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: "#00f721", color: '#000', mr: 2 }}>
                    <CreditCardIcon />
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6">{budget.name}</Typography>
                    <Typography variant="body2" sx={{ color: "#BBB" }}>
                      Total: {budget.total ?? "—"}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </List>
      </>
    )} */}

    <Box></Box>

      <IconButton
        onClick={handleClearChat}
        sx={{
          bgcolor: '#f1f1f111',
          color: '#ff6767',
          py: 1.4,
          px: 2,
          borderRadius: "20px 20px 7px 7px",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'left',
          gap: 1.5,
          mt: 2
        }}
      >
        <DeleteOutlineIcon />
        <Typography variant="body1" sx={{ fontSize: 16, color: '#ff6767' }}>
          Delete Chat
        </Typography>
      </IconButton>
      <IconButton
        onClick={handleRemoveFriend}
        sx={{
          bgcolor: '#f1f1f111',
          color: '#ff6767',
          py: 1.4,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 1.5,
          borderRadius: "7px 7px 20px 20px",
        }}
      >
        <RemoveCircleOutlineIcon sx={{ color: '#ff6767' }} />
        <Typography variant="body1" sx={{ fontSize: 16, color: '#ff6767' }}>
          Remove from Friend
        </Typography>
      </IconButton>
    </Stack>
  </Box>

  <SwipeableDrawer
  anchor="bottom"
  open={allCommonGroupsDrawerOpen}
  onClose={() => setAllCommonGroupsDrawerOpen(false)}
  onOpen={()=>{}}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      backgroundColor: "#0c0c0c0a",
      backdropFilter: 'blur(70px)',
      color: '#fff',
      maxWidth: 470, mx: 'auto',
      p: 2, height: '90vh'
    }
  }}
>

    <Box sx={{ width: 40, height: 5, bgcolor: '#555', borderRadius: 3, mx: 'auto', mb: 2 }} />

  <Box sx={{ mb: 2, position: 'relative' }}>
    <Typography variant="h6" sx={{ mb: 2, textAlign: "center", fontWeight: 700 }}>All Common Groups</Typography>
    <TextField
      value={groupSearch}
      onChange={e => setGroupSearch(e.target.value)}
      placeholder="Search groups..."
      fullWidth
      size="small"
      variant="outlined"
      InputProps={{
        style: { color: "#fafafa", borderRadius: 8 },
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#777" }} />
          </InputAdornment>
        ),
      }}
      sx={{ mb: 2 }}
    />
    <Box sx={{ maxHeight: "75vh", overflowY: "auto", pr: 1 }}>
      {commonGroups
        .filter(g =>
          !groupSearch.trim() ||
          g.name?.toLowerCase().includes(groupSearch.toLowerCase()) ||
          (g.members ?? []).some(uid => (groupMembersInfo[uid]?.name || "").toLowerCase().includes(groupSearch.toLowerCase()))
        )
        .map(group => (
          <Card key={group.id}
            sx={{ bgcolor: '#0c0c0c21', color: '#fff', borderRadius: 2, mb: 1, overflow: "hidden" }}>
            <CardActionArea onClick={() => {
              setAllCommonGroupsDrawerOpen(false);
              history(`/group/${group.id}`);
            }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={group.iconURL}
                  sx={{ bgcolor: '#fff', color: '#111' }}
                >
                  {group.emoji || group.name?.charAt(0)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body1" color="#fff" fontWeight="bolder" noWrap>
                    {group.name}
                  </Typography>
                  <Box
                    sx={{
                      minWidth: 0,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      fontSize: 13,
                      color: '#ccc',
                    }}
                  >
                    {(group.members ?? [])
                      .map(uid => groupMembersInfo[uid]?.name)
                      .filter(Boolean)
                      .join(", ") ||
                      <Typography variant="caption" sx={{ color: "#ccc" }}>Loading...</Typography>
                    }
                  </Box>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
    </Box>
  </Box>
  </SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={showAllTripsDrawer}
  onClose={() => setShowAllTripsDrawer(false)}
  onOpen={() => {}}
  PaperProps={{
    sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: "#0c0c0c0a", backdropFilter: 'blur(70px)', color: '#fff', maxWidth: 470, mx: 'auto', p: 2, height: '90vh' }
  }}
>
      <Box sx={{ width: 40, height: 5, bgcolor: '#555', borderRadius: 3, mx: 'auto', mb: 2 }} />

  <Box>
    <Typography variant="h6" sx={{ mb: 2, mt: 1, fontWeight: 700, textAlign: "center" }}>All Common Trips</Typography>
    <TextField
      value={tripSearch}
      onChange={e => setTripSearch(e.target.value)}
      placeholder="Search trips..."
      fullWidth
      size="small"
      variant="outlined"
      sx={{ mb: 2 }}
      InputProps={{ style: { borderRadius: 8, color: "#fafafa" },
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#777" }} />
          </InputAdornment>
        ),
      }}
    />
    <Box sx={{ maxHeight: "75vh", overflowY: "auto", pr: 1 }}>
      {commonTrips.filter(trip =>
        !tripSearch.trim() ||
        trip.name?.toLowerCase().includes(tripSearch.toLowerCase()) ||
        (trip.location || "").toLowerCase().includes(tripSearch.toLowerCase())
      ).map(trip => (
        <Card key={trip.id} sx={{
          background: `url(${trip.iconURL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
          borderRadius: 2,
          mb: 1, overflow: "hidden",
        }}>
          <CardContent sx={{ backdropFilter: "blur(20px)", backgroundColor: "#0c0c0c21" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: '100%' }}>
              <Typography variant="h6" noWrap>{trip.name}</Typography>
              {timelineStatsMap?.[trip.id] && (
                <Box minWidth={110}>
                  <Typography variant="caption" sx={{ color: "#cbcbcbff" }}>
                    {timelineStatsMap[trip.id]?.completed} / {timelineStatsMap[trip.id]?.total} complete
                  </Typography>
                  <LinearProgress
                    value={timelineStatsMap[trip.id]?.percent}
                    variant="determinate"
                    sx={{
                      mt: 0.5, borderRadius: 20, height: 7, bgcolor: "#ffffff36",
                      "& .MuiLinearProgress-bar": { bgcolor: "#ffffffff" }
                    }}
                  />
                </Box>
              )}
            </Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              <LocationOn sx={{ fontSize: 14, mr: 1 }} />
              {trip.from} → {trip.location}
            </Typography>
            <Typography variant="body2" sx={{ color: "#e7e7e7" }}>
              <AccessTime sx={{ fontSize: 14, mr: 1 }} />
              {trip.startDate} → {trip.endDate}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  </Box>
</SwipeableDrawer>

                  <SwipeableDrawer
                    anchor="bottom"
                    open={addNicknameDrawerOpen}
                    onClose={() => setAddNicknameDrawerOpen(false)}
                    onOpen={() => {}}
                    disableSwipeToOpen={true}
                    disableDiscovery={true}
                    PaperProps={{
                      sx: {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        backgroundColor: "#00000011",
                        backdropFilter: "blur(80px)",
                        p: 3,
                        maxWidth: 400,
                        mx: "auto",
                      },
                    }}
                  >
                  <Typography variant="subtitle2" sx={{ color: '#fff', mb: 0.5 }}>Add a Nickname</Typography>
                  {editNickname && (
                    <Box sx={{ display: 'flex', mt: 2, flexDirection: "column", alignItems: 'center', gap: 1 }}>
                      <TextField
                        value={nickname}
                        label={"Nickname"}
                        onChange={e => setNickname(e.target.value)}
                        size="small"
                        fullWidth
                        variant="outlined"
                        sx={{ 
                          borderRadius: 1,
                          input: { color: '#fff' }
                        }}
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontSize: 22,
                            fontWeight: 600,
                            color: "#fff",
                            mb: 1,
                          },
                        }}
                        InputLabelProps={{ 
                          style: { color: "#aaa" }
                        }}
                      />
                      <Box 
                      display={"flex"} 
                      sx={{
                        width: "100%",
                        gap: 2,
                      }}
                      >
                        <Button
                        sx={{ 
                          backgroundColor: "#f1f1f111",
                          fontSize: 14,
                          color: "#fff",
                          width: "100vw",
                          px: 2,
                          py: 1,
                          borderRadius: 14, 
                        }}  
                        onClick={() => { 
                          setAddNicknameDrawerOpen(false); 
                          setNickname(nickname);
                        }}>
                          Close
                        </Button>
                        <Button 
                        sx={{ 
                          backgroundColor: "#f1f1f1",
                          fontSize: 14,
                          color: "#000",
                          width: "100vw",
                          px: 2,
                          py: 1,
                          borderRadius: 14 
                        }} 
                        onClick={handleSaveNickname}>
                          Save
                        </Button>
                      </Box>
                    </Box>
                  )}
                  </SwipeableDrawer>

</Drawer>
       

        </motion.div>
      </Box>
    </Box>
    </ThemeProvider>

  );
}
export default ChatRoom;