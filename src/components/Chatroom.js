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
import ReplyIcon from '@mui/icons-material/Reply';
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
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';

import {
  LocationOn, AccessTime,
} from "@mui/icons-material";
import { v4 as uuidv4 } from 'uuid'; // For notification message id
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

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
        hover: "#b6b6b6ff", // bright green hover for interactive elements
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
            "&:hover": {
              backgroundColor: "#000",
              color: "#fff",
            },
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
  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);
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
  const messageRefs = useRef({});
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [draggedMsgId, setDraggedMsgId] = useState(null);

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
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: mode === "dark" ? "#fff" : "#000" }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }
  
  return (
    <ThemeProvider theme={theme}>
          <Box sx={{ backgroundColor: '#21212100', height: '98vh', display: 'flex', flexDirection: 'column', color: mode === "dark" ? "#fff" : "#000" }}>
      
      {/* Header */}
      <AppBar
        position="fixed"
        sx={{
          background: mode === "dark" ? 'linear-gradient(to bottom, #000000, #000000d9, #000000c9, #00000090, #00000000)' : 'linear-gradient(to bottom, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
          backdropFilter: 'blur(0px)',
          padding: '18px 10px 10px 10px',
          borderBottom: "none",
          zIndex: 1100,
          boxShadow: "none",
        }}
        elevation={1}
      >
        <Box display={"flex"} justifyContent={"space-between"} alignItems={"center"}>
          <Box display={"flex"} alignItems={"center"}>
          <IconButton onClick={goBack} sx={{ mr: 1, color: mode === "dark" ? "#fff" : "#000" }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar src={friendDetails.photoURL} alt={friendDetails.name} sx={{ mr: 2, height: '40px', width: '40px' }} />
          <Box onClick={() => setOpenProfile(true)}>
            <Typography variant="h6" color={mode === "dark" ? "#fff" : "#000"} fontSize="14px">
              {nickname ? nickname : friendDetails.name}
            </Typography>
            <Typography variant="h6" color={mode === "dark" ? "#aaa" : "#333"} fontSize="10px">@{friendDetails.username}</Typography>
            <Typography variant="body2" sx={{ color: friendDetails.status === 'online' ? '#AEEA00' : '#BDBDBD' }}>
              {friendDetails.status}
            </Typography>
          </Box>
          </Box>
                  <IconButton
                    sx={{ color: mode === "dark" ? "#fff" : "#000", backgroundColor: mode === "dark" ? "#181818" : "#d6d6d6ff", backdropFilter: "blur(80px)", borderRadius: 8, py: 1, px: 1, display: "flex", alignItems: "center", mr: 2 }}
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
          backgroundImage: mode === "dark" ? 'url(/assets/images/chatbg/dark.png)' : 'url(/assets/images/chatbg/light.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
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
                      bgcolor: mode === "dark" ? "#f1f1f111" : "#00000011",
                      backdropFilter: "blur(80px)",
                      color: mode === "dark" ? "#fff" : "#000",
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
                ref={el => { messageRefs.current[msg.id] = el; }}
                className={`message-container ${isOwn ? 'own' : ''}`}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragStart={() => setDraggedMsgId(msg.id)}
                onDragEnd={(event, info) => {
                  setDraggedMsgId(null); // Hide icon after drag
                  if (info.offset.x > 100) {
                    setReplyingTo(msg);
                  }
                  controls.start({ x: 0 });
                }}
                animate="visible"
                initial="hidden"
                exit="exit"
                variants={messageVariants}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{ touchAction: 'pan-y',
                ...(highlightedMsgId === msg.id && {
                    boxShadow: "none",
                    padding: 2,
                    borderRadius: 12,
                    background: theme.palette.primary.mainbg,
                    transition: "background 1.5s ease-in-out",
                  })
                }}
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
                      sx={{ color: mode === "dark" ? "#aaa" : "#333", backgroundColor: mode === "dark" ? "#f1f1f111" : "#88888811", backdropFilter: "blur(120px)", px: 1, borderRadius: 8, textAlign: 'center' }}
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
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      maxWidth: '90%',
                      position: 'relative',
                    }}>
{msg.replyTo && (
  <Box
    sx={{
      border: mode === "dark" ? '1px solid #6565659d' : '1px solid #9f9f9fff',
      borderLeft: mode === "dark" ? '4px solid #00f72172' : '4px solid #057c1572',
      px: 1.5,
      py: 0.2,
      mb: 0.3,
      bgcolor: mode === "dark" ? '#4a4a4a00' : "#ececec70",
      backdropFilter: 'blur(24px)',
      color: mode === "dark" ? "#fff" : "#222",
      borderRadius: 2,
      boxShadow: mode === "dark"
        ? "0 2px 8px #0002"
        : "0 2px 8px #8881",
      display: "flex",
      flexDirection: "column",
      gap: 0.2,
      maxWidth: "95%",
    }}
    onClick={() => {
      const replyId = msg.replyTo.id;
      const el = messageRefs.current[replyId];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedMsgId(replyId);
        setTimeout(() => setHighlightedMsgId(null), 1200);
      }
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mb: 0 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: mode === "dark" ? "#00f721ab" : "#057c1572",
          letterSpacing: 0.2,
        }}
      >
        {msg.replyTo.senderId === currentUser.uid
          ? (msg.senderId === currentUser.uid
              ? "You (self)"
              : "You")
          : friendDetails.name}
      </Typography>
    </Box>
    <Typography
      variant="body2"
      sx={{
        color: mode === "dark" ? "#919191ff" : "#7c7c7cff",
        fontStyle: 'italic',
        fontSize: "0.97em",
        wordBreak: "break-word",
      }}
    >
      {msg.replyTo.text.length > 60
        ? msg.replyTo.text.slice(0, 30) + '...'
        : msg.replyTo.text}
    </Typography>
  </Box>
)}
                  <Paper
                    elevation={1}
                    sx={{
                      px: 2,
                      py: 0.5,
                      maxWidth: '70%',
                      minWidth: "100px",
                      bgcolor: isOwn ? mode === "dark" ? "#005c4b" : "#d9fdd3" : mode === "dark" ? "#353535" : "#ffffff",
                      borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      color: mode === "dark" ? "#fff" : "#000",
                      position: 'relative',
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <Typography variant="body1">{msg.text}</Typography>

                    {msg.reactions && msg.reactions.length > 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.5,
                          alignItems: 'center',
                          position: 'absolute',
                          bottom: -8,
                          right: 5,
                          zIndex: 2,
                          borderRadius: '12px',
                        }}
                      >
                        {Object.entries(getGroupedReactions(msg)).map(([emoji, users]) => (
<Chip
  key={emoji}
  label={    <span style={{
      fontSize: '0.8rem',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      letterSpacing: 0,
      userSelect: 'none'
    }}>
      {emoji}
    </span>}
  size="small"
  sx={{
    bgcolor: mode === "dark" ? "#353535" : "#ffffff",
    color: mode === "dark" ? "#fff" : "#222",
    borderRadius: '25px',
    cursor: 'pointer',
    border: mode === "dark" ? '1.5px solid #000000ff' : '1.5px solid #d3d3d3ff',
    height: 20,
    width: 20,
    minWidth: 0,
    minHeight: 0,
    boxShadow: mode === "dark"
      ? "0 2px 8px #000a"
      : "0 2px 8px #8882",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
    '&:hover': {
      bgcolor: mode === "dark" ? "#444" : "#f5f5f5",
      borderColor: mode === "dark" ? "#b2b2b2ff" : "#565656ff",
      transform: "scale(1.13)",
      boxShadow: mode === "dark"
        ? "0 4px 16px #000c"
        : "0 4px 16px #1976d233",
    },
    m: 0.2,
    p: 0,
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
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        width: '75%',
                        minWidth: "100px",
                        color: mode === "dark" ? "#ccc" : "#555",
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
                            sx={{ color: msg.isRead ? '#00b7ffff' : '#7b7b7bff' }}
                          />
                        </Box>
                      )}
                    </Typography>
                    </Box>
                  <div ref={messagesEndRef} />
                </Box>
                
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
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </Box>

      {replyingTo && (
        <Paper sx={{ p: 1, position: 'relative', bottom: '55px', width: '90vw', mx: "auto", bgcolor: mode === "dark" ? '#2b2b2bc0' : "#dadadac0", boxShadow: "none", mb: 1, borderLeft: mode === "dark" ? "4px solid #00f721" : "4px solid #057c15ff", backdropFilter: 'blur(80px)', borderRadius: '11px', zIndex: 1000 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="caption" color={mode === "dark" ? "#00f721" : "#057c15ff"}>
                Replying to {replyingTo.senderId === currentUser.uid ? 'Self' : friendDetails.name}
              </Typography>
              <Typography variant="body2" sx={{ color: mode === "dark" ? "#e7e7e7ff" : "#242424ff" }}>
                {replyingTo.text.length > 60
                  ? replyingTo.text.slice(0, 60) + '...'
                  : replyingTo.text}
              </Typography>
            </Box>
            <IconButton onClick={() => setReplyingTo(null)}>
              <CloseIcon fontSize="small" sx={{ color: {color: mode === "dark" ? "#fff" : "#000"} }} />
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
          mx: 'auto',
          display: 'flex',
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '95vw',
          alignItems: 'center',
          zIndex: '1200',
          borderTop: '0px solid #5E5E5E',
          background: mode === "dark" ? 'linear-gradient(to top, #000000, #000000d9, #000000c9, #00000090, #00000000)' : 'linear-gradient(to top, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
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
              color: mode === "dark" ? "#fff" : "#000",
              height: '28px',
              borderRadius: '40px',
              backdropFilter: "blur(30px)",
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#5E5E5E',
                borderRadius: '40px'
              },
              '&:hover fieldset': {
                borderColor: '#393939ff',
                borderRadius: '40px'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#757575',
                borderRadius: '40px'
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: mode === "dark" ? "#cccccc" : "#343434ff"
            }
          }}
        />
        <Button type="submit" sx={{ backgroundColor: mode === "dark" ? "#fff" : "#000", height: '45px', width: '30px', borderRadius: 8, }} disabled={isSending}>
          {isSending ? <CircularProgress size={24} sx={{ color: mode === "dark" ? "#000" : "#fff" }} /> : <SendIcon sx={{ color: mode === "dark" ? "#000" : "#fff" }} />}
        </Button>
      </Box>

      {/* Context Menu */}
<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleMenuClose}
  PaperProps={{
    sx: {
      minWidth: 220,
      borderRadius: 4,
      bgcolor: mode === "dark" ? "#18181823" : "#ffffff43",
      color: mode === "dark" ? "#fff" : "#222",
      boxShadow: mode === "dark" ? "0 8px 32px #000b" : "0 8px 32px #8882",
      p: 1,
      backdropFilter: mode === "dark" ? 'blur(18px)' : 'blur(8px)',
      border: mode === "dark" ? '1.5px solid #232323' : '1.5px solid #e0e0e0',
      overflow: 'hidden',
      transition: "box-shadow 0.3s, background 0.3s",
    },
  }}
>
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1, py: 0.5 }}>
    {['❤️', '😂', '👍', '😁', '👌'].map((emoji) => (
      <IconButton
        key={emoji}
        onClick={() => {
          handleReaction(emoji, selectedMsg);
          handleMenuClose();
        }}
        sx={{
          width: 38,
          height: 38,
          fontSize: 20,
          bgcolor: mode === "dark" ? 'rgba(41,41,41,0.85)' : '#f7f7f7',
          borderRadius: 2,
          color: mode === "dark" ? "#fff" : "#222",
          backdropFilter: mode === "dark" ? 'blur(10px)' : 'blur(2px)',
          border: mode === "dark" ? '1.5px solid #232323' : '1.5px solid #e0e0e0',
          boxShadow: mode === "dark" ? '0 2px 8px #0004' : '0 2px 8px #bbb2',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': {
            bgcolor: mode === "dark" ? '#333' : '#e0e0e0',
            borderColor: mode === "dark" ? '#444' : '#bdbdbd'
          },
        }}
      >
        {emoji}
      </IconButton>
    ))}
    <IconButton
      onClick={() => {
        setShowEmojiPicker(true);
        handleMenuClose();
      }}
      sx={{
        width: 38,
        height: 38,
        bgcolor: mode === "dark" ? '#292929d9' : '#ffffffff',
        borderRadius: 2,
        color: mode === "dark" ? "#fff" : "#222",
        border: mode === "dark" ? '1.5px solid #232323' : '1.5px solid #e0e0e0',
        boxShadow: mode === "dark" ? '0 2px 8px #0004' : '0 2px 8px #bbb2',
        backdropFilter: mode === "dark" ? 'blur(10px)' : 'blur(2px)',
        transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          bgcolor: mode === "dark" ? '#333' : '#e0e0e0',
          borderColor: mode === "dark" ? '#444' : '#bdbdbd'
        },
      }}
    >
      <AddIcon fontSize="small" />
    </IconButton>
  </Box>

  <Divider sx={{ my: 1, bgcolor: mode === "dark" ? '#333' : '#e0e0e0', borderRadius: 2 }} />

  <MenuItem
    onClick={() => {
      setReplyingTo(selectedMsg);
      handleMenuClose();
    }}
    sx={{
      fontWeight: 500,
      fontSize: 15,
      borderRadius: 2,
      mx: 0.5,
      my: 0.2,
      backdropFilter: mode === "dark" ? 'blur(8px)' : 'blur(2px)',
      color: mode === "dark" ? "#fff" : "#222",
      '&:hover': { bgcolor: mode === "dark" ? '#232323' : '#ffffffff' },
      transition: 'background 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}
  >
    <ReplyIcon fontSize="small" sx={{ color: mode === "dark" ? "#fff" : "#222" }} />
    Reply
  </MenuItem>

  {selectedMsg?.senderId === currentUser.uid && (
    <>
      <MenuItem
        onClick={() => {
          handleEdit(selectedMsg);
          handleMenuClose();
        }}
        sx={{
          fontWeight: 500,
          fontSize: 15,
          borderRadius: 2,
          mx: 0.5,
          my: 0.2,
          backdropFilter: mode === "dark" ? 'blur(8px)' : 'blur(2px)',
          color: mode === "dark" ? "#fff" : "#222",
          '&:hover': { bgcolor: mode === "dark" ? '#232323' : '#ffffffff' },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <EditIcon fontSize="small" sx={{ color: mode === "dark" ? "#fff" : "#222" }} />
        Edit
      </MenuItem>
      <MenuItem
        onClick={() => {
          handleDelete(selectedMsg?.id);
          handleMenuClose();
        }}
        sx={{
          color: '#ff4444',
          fontWeight: 500,
          fontSize: 15,
          borderRadius: 2,
          mx: 0.5,
          my: 0.2,
          backdropFilter: mode === "dark" ? 'blur(8px)' : 'blur(2px)',
          '&:hover': { bgcolor: mode === "dark" ? '#2a1818' : '#ffe2e2ff' },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <DeleteOutlineIcon fontSize="small" sx={{ color: '#ff4444' }} />
        Delete
      </MenuItem>
    </>
  )}

  <Divider sx={{ my: 0.5, bgcolor: mode === "dark" ? '#333' : '#e0e0e0', borderRadius: 2 }} />

  <MenuItem
    onClick={() => {
      navigator.clipboard.writeText(selectedMsg?.text || '');
      setNotification('Message copied!');
      handleMenuClose();
    }}
    sx={{
      fontSize: 15,
      borderRadius: 2,
      mx: 0.5,
      my: 0.2,
      backdropFilter: mode === "dark" ? 'blur(8px)' : 'blur(2px)',
      color: mode === "dark" ? "#fff" : "#222",
      '&:hover': { bgcolor: mode === "dark" ? '#232323' : '#ffffffff' },
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}
  >
    <ContentCopyIcon fontSize="small" sx={{ color: mode === "dark" ? "#fff" : "#222" }} />
    Copy Text
  </MenuItem>

  {selectedMsg?.text?.length > 10 && (
    <MenuItem
      onClick={() => {
        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(selectedMsg.text)}`,
          '_blank'
        );
        handleMenuClose();
      }}
      sx={{
        fontSize: 15,
        borderRadius: 2,
        mx: 0.5,
        my: 0.2,
        backdropFilter: mode === "dark" ? 'blur(8px)' : 'blur(2px)',
        color: mode === "dark" ? "#fff" : "#222",
        '&:hover': { bgcolor: mode === "dark" ? '#232323' : '#ffffffff' },
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <SearchIcon fontSize="small" sx={{ color: mode === "dark" ? "#fff" : "#222" }} />
      Search on Google
    </MenuItem>
  )}
</Menu>

<SwipeableDrawer
  anchor="bottom"
  open={Boolean(reactionAnchorEl) && !showEmojiPicker}
  onClose={() => {
    setReactionAnchorEl(null);
    setReactionMsg(null);
  }}
  onOpen={() => {}} // Required for SwipeableDrawer
  disableSwipeToOpen={false}
  disableDiscovery={false}
  PaperProps={{
    sx: {
      minWidth: 220,
      borderRadius: "25px 25px 0 0",
      bgcolor: mode === "dark" ? "#00000026" : "#ffffffde",
      color: mode === "dark" ? "#fff" : "#222",
      boxShadow: mode === "dark" ? "0 12px 32px #000c" : "0 8px 32px #8882",
      p: 2,
      backdropFilter: "blur(40px)",
      border: "none",
      overflow: 'hidden',
      transition: "box-shadow 0.3s, background 0.3s",
    },
  }}
>
  <Box
    sx={{
      width: 40,
      height: 4,
      bgcolor: mode === "dark" ? '#6a6a6aff' : '#818181ff',
      borderRadius: 3,
      mx: 'auto',
      mb: 1.5,
      opacity: 0.5,
      cursor: "grab"
    }}
  />
  <Typography
    variant="subtitle2"
    sx={{
      color: mode === "dark" ? "#fff" : "#222",
      textAlign: "center",
      mb: 1,
      letterSpacing: 1,
      fontWeight: 600,
      opacity: 0.8,
      textShadow: mode === "dark" ? "0 2px 8px #0008" : "none"
    }}
  >
    Reactions
  </Typography>
  <Divider sx={{ mb: 1, bgcolor: "#696969ff", borderRadius: 2 }} />
  <Box sx={{ px: 1, pb: 1 }}>
    {reactionMsg &&
      Object.entries(getGroupedReactions(reactionMsg)).map(([emoji, users]) => (
        users.map((uid, idx) => (
          <MenuItem
            key={emoji + uid}
            sx={{
              display: "flex",
              alignItems: "center",
              borderRadius: 3,
              mx: 0.5,
              my: 0.7,
              px: 2,
              py: 1.2,
              bgcolor: mode === "dark" ? "#0000003d" : "#31313121",
              color: mode === "dark"
                ? "#fff"
                : "#222",
              fontWeight: 500,
              fontSize: 17,
              boxShadow: "none",
              backdropFilter: mode === "dark" ? 'blur(8px)' : 'blur(2px)',
              border: "none",
              transition: "background 0.2s",
              '&:hover': {
                bgcolor: mode === "dark" ? '#232323' : '#e0e0e0',
                borderColor: mode === "dark" ? "#444" : "#bdbdbd"
              },
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 0.5,
            }}
            onClick={async () => {
              if (uid === currentUser?.uid) {
                await removeUserReaction(reactionMsg, emoji);
                setReactionAnchorEl(null);
                setReactionMsg(null);
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
             <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
               <Avatar
                src={groupMembersInfo?.[uid]?.photoURL}
                sx={{
                  width: 28,
                  height: 28,
                  mr: 1.2,
                  border: mode === "dark" ? "2px solid #232323" : "2px solid #e0e0e0",
                  bgcolor: mode === "dark" ? "#222" : "#fafafa",
                  color: mode === "dark" ? "#fff" : "#222",
                  fontWeight: 700,
                  fontSize: 18,
                }}
              >
                {groupMembersInfo?.[uid]?.photoURL ? "" : groupMembersInfo?.[uid]?.name?.[0] || "?"}
              </Avatar>
              <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  color: mode === "dark" ? "#fff" : "#222",
                  fontSize: 13,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {uid === currentUser?.uid
                  ? "You"
                  : groupMembersInfo?.[uid]?.name || "Unknown"}
              </Typography>

            {uid === currentUser?.uid && (
              <Typography
                variant="caption"
                sx={{
                  color: mode === "dark" ? "#b4b4b4ff" : "#333333ff",
                  fontWeight: 500,
                  opacity: 0.8,
                  fontSize: 10,
                  letterSpacing: 0.1,
                  userSelect: "none"
                }}
              >
                Tap to remove reaction
              </Typography>
            )}
            </Box>
             </Box>
              <span
                style={{
                  fontSize: 22,
                  marginLeft: "auto",
                  marginRight: 2,
                  filter: "none"
                }}
              >
                {emoji}
              </span>
            </Box>
          </MenuItem>
        ))
      ))
    }
    {!reactionMsg && (
      <Typography variant="body2" sx={{ color: mode === "dark" ? "#bbb" : "#888", textAlign: "center", py: 2 }}>
        No reactions yet.
      </Typography>
    )}
  </Box>
</SwipeableDrawer>

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
  PaperProps={{
    sx: {
      borderRadius: 3,
      bgcolor: "rgba(24,24,24,0.98)",
      boxShadow: "0 8px 32px #000b",
      backdropFilter: 'blur(18px)',
      border: '1.5px solid #232323',
      overflow: 'hidden',
    }
  }}
>
  <EmojiPicker
    onEmojiClick={(emojiData) => {
      handleReaction(emojiData.emoji, reactionMsg);
      setShowEmojiPicker(false);
    }}
    theme={ mode === "dark" ? "dark" : "light" }
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
              color: mode === "dark" ? "#fff" : "#000",
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
      backgroundColor: mode === "dark" ? '#0c0c0c0a' : '#f1f1f1de',
      backdropFilter: 'blur(70px)',
      color: mode === "dark" ? "#fff" : "#000",
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
        borderRadius: 8,
        color: mode === "dark" ? "#fff" : "#000",
        backgroundColor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11",
        '&:hover': { backgroundColor: "#f1f1f121" },
      }}
    >
      Back
    </Button>

    {/* Profile Section */}
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
      <Avatar src={friendDetails.photoURL} sx={{ width: 90, height: 90, mb: 2 }} />
      <Typography variant="h6" fontWeight="bold" color={mode === "dark" ? "#fff" : "#000"}>{friendDetails.name}</Typography>
      <Typography variant="subtitle1" sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>@{friendDetails.username}</Typography>

      <Typography
        variant="body2"
        sx={{
          backgroundColor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11",
          px: 2,
          py: 0.5,
          borderRadius: 4,
          color: mode === "dark" ? "#aaa" : "#333",
        }}
      >
        {nickname || friendDetails.name}
      </Typography>

      {friendDetails.bio && (
        <Box
          sx={{
            bgcolor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11",
            color: mode === "dark" ? "#aaa" : "#333",
            borderRadius: 1.2,
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
      {/* <IconButton
        onClick={() => window.open(`mailto:${friendDetails.email}`, '_blank')}
        disabled={!friendDetails.email}
        sx={{
          bgcolor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11",
          color: mode === "dark" ? "#fff" : "#000",
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
        <Typography variant="body1" sx={{ fontSize: 16, color: mode === "dark" ? "#aaa" : "#333" }}>
          {friendDetails.email || 'Email not available'}
        </Typography>
      </IconButton> */}

      {friendDetails.mobile && (
        <IconButton
          onClick={() => window.open(`tel:${friendDetails.mobile}`, '_blank')}
          sx={{
            bgcolor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11",
            color: mode === "dark" ? "#fff" : "#000",
            py: 1.4,
            px: 2,
            borderRadius: "20px 20px 7px 7px",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
            gap: 1.5,
          }}
        >
          <PhoneOutlinedIcon />
          <Typography variant="body1" sx={{ fontSize: 16, color: mode === "dark" ? "#aaa" : "#333" }}>
            {friendDetails.mobile}
          </Typography>
        </IconButton>
      )}


      <IconButton
        onClick={() => setOpenProfile(false)}
        sx={{
          bgcolor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11",
          color: mode === "dark" ? "#fff" : "#000",
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
        <Typography variant="body1" sx={{ fontSize: 16, color: mode === "dark" ? "#aaa" : "#333" }}>
          Send a Message
        </Typography>
      </IconButton>

      <IconButton
        onClick={() => {
          setAddNicknameDrawerOpen(true);
          setEditNickname(true);
        }}
        sx={{
          bgcolor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11",
          color: mode === "dark" ? "#fff" : "#000",
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
        <Typography variant="body1" sx={{ fontSize: 16, color: mode === "dark" ? "#aaa" : "#333" }}>
          Add a Nickname
        </Typography>
      </IconButton>


    {/* Common Groups */}
<Box>
  <Typography variant="subtitle1" fontWeight="bold" mt={3} mb={0.5}>Common Groups</Typography>
  <Grid container spacing={0.5} mb={2}>
    {(commonGroups.slice(0,3)).map(group => (
      <Grid item xs={12} sm={6} md={4} key={group.id}>
        <Card sx={{ bgcolor: mode === "dark" ? "#f1f1f106" : "#0c0c0c06", color: mode === "dark" ? "#fff" : "#000", borderRadius: "10px", overflow: 'hidden', boxShadow: "none"}}>
          <CardActionArea onClick={() => history(`/group/${group.id}`)}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={group.iconURL}
                sx={{ bgcolor: mode === "dark" ? "#fff" : "#000", color: '#111' }}
              >
                {group.emoji || group.name?.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body1" color={mode === "dark" ? "#fff" : "#000"} fontWeight={"bolder"} noWrap>
                  {group.name}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    fontSize: 13,
                    color: mode === "dark" ? "#ccc" : "#555",
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
          sx={{ color: mode === "dark" ? "#fff" : "#000", backgroundColor: mode === "dark" ? "#f1f1f121" : "#0c0c0c11", borderRadius: 3, fontWeight: 600, boxShadow: "none" }}
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
          backgroundColor: mode === "dark" ? "#f1f1f111" : "#0c0c0c01",
          backgroundPosition: "center",
          color: mode === "dark" ? "#fff" : "#000",
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
                    <Typography variant="caption" sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>
                      {timelineStatsMap[trip.id]?.completed} / {timelineStatsMap[trip.id]?.total} complete
                    </Typography>
                    <LinearProgress
                      value={timelineStatsMap[trip.id]?.percent}
                      variant="determinate"
                      sx={{
                        mt: 0.5, borderRadius: 20, height: 7, bgcolor: mode === "dark" ? "#ffffff36" : "#00000036",
                        "& .MuiLinearProgress-bar": { bgcolor: mode === "dark" ? "#fff" : "#000" }
                      }}
                    />
                  </Box>
                )}
              </Box>
              <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", display: "flex", alignItems: "center" }}>
                <LocationOn sx={{ fontSize: 16, mr: 1 }} /> {trip.from} → {trip.location}
              </Typography>
              <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", display: "flex", alignItems: "center" }}>
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
          color: mode === "dark" ? "#fff" : "#000", backgroundColor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11", borderRadius: "7px 7px 20px 20px", fontWeight: 600, boxShadow: "none",
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
            <Card key={budget.id} sx={{ bgcolor: '#232323', color: mode === "dark" ? "#fff" : "#000", mb: 2, borderRadius: 3 }}>
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
          bgcolor: mode === "dark" ? "#ff676711" : "#ff676726",
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
          bgcolor: mode === "dark" ? "#ff676711" : "#ff676726",
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
      backgroundColor: mode === "dark" ? "#0c0c0c0a" : "#f1f1f19a",
      backdropFilter: 'blur(70px)',
      color: mode === "dark" ? "#fff" : "#000",
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
        style: { color: mode === "dark" ? "#fafafa" : "#0c0c0c", borderRadius: 8 },
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
            sx={{ bgcolor: mode === "dark" ? '#0c0c0c11' : '#ffffff31', color: mode === "dark" ? "#fff" : "#000", borderRadius: 2, mb: 0.5, boxShadow: "none", overflow: "hidden" }}>
            <CardActionArea onClick={() => {
              setAllCommonGroupsDrawerOpen(false);
              history(`/group/${group.id}`);
            }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  src={group.iconURL}
                  sx={{ bgcolor: mode === "dark" ? "#fff" : "#000", color: '#111' }}
                >
                  {group.emoji || group.name?.charAt(0)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body1" color={mode === "dark" ? "#fff" : "#000"} fontWeight="regular" noWrap>
                    {group.name}
                  </Typography>
                  <Box
                    sx={{
                      minWidth: 0,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      fontSize: 11,
                      color: mode === "dark" ? "#ccc" : "#555",
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
    sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: mode === "dark" ? "#0c0c0c0a" : "#f1f1f19a", backdropFilter: 'blur(70px)', color: mode === "dark" ? "#fff" : "#000", maxWidth: 470, mx: 'auto', p: 2, height: '90vh' }
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
      InputProps={{ style: { borderRadius: 8, color: mode === "dark" ? "#fafafa" : "#0c0c0c" },
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
          color: mode === "dark" ? "#fff" : "#000",
          mb: 1,
          overflow: "hidden",
          boxShadow: "none",
        }}>
          <CardContent sx={{ backdropFilter: "blur(20px)", borderRadius: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: '100%' }}>
              <Typography variant="h6" noWrap>{trip.name}</Typography>
              {timelineStatsMap?.[trip.id] && (
                <Box minWidth={110}>
                  <Typography variant="caption" sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>
                    {timelineStatsMap[trip.id]?.completed} / {timelineStatsMap[trip.id]?.total} complete
                  </Typography>
                  <LinearProgress
                    value={timelineStatsMap[trip.id]?.percent}
                    variant="determinate"
                    sx={{
                      mt: 0.5, borderRadius: 20, height: 7, bgcolor: mode === "dark" ? "#ffffff36" : "#00000018",
                      "& .MuiLinearProgress-bar": { bgcolor: mode === "dark" ? "#ffffff" : "#1e1e1eff" }
                    }}
                  />
                </Box>
              )}
            </Box>
            <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", display: "flex", flexDirection: "row", alignItems: "center" }}>
              <LocationOn sx={{ fontSize: 14, mr: 1 }} />
              {trip.from} → {trip.location}
            </Typography>
            <Typography variant="body2" sx={{ color: mode === "dark" ? "#ccc" : "#555", display: "flex", flexDirection: "row", alignItems: "center" }}>
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
                        backgroundColor: mode === "dark" ? "#00000011" : "#ffffffd1",
                        backdropFilter: "blur(80px)",
                        p: 3,
                        maxWidth: 400,
                        mx: "auto",
                      },
                    }}
                  >
                  <Typography variant="subtitle2" sx={{ color: mode === "dark" ? "#fff" : "#000", mb: 0.5 }}>Add a Nickname</Typography>
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
                          input: { color: mode === "dark" ? "#fff" : "#000" }
                        }}
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            fontSize: 22,
                            fontWeight: 600,
                            color: mode === "dark" ? "#fff" : "#000",
                            mb: 1,
                          },
                        }}
                        InputLabelProps={{ 
                          style: { color: mode === "dark" ? "#aaa" : "#333" }
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
                          backgroundColor: mode === "dark" ? "#f1f1f111" : "#0c0c0c11",
                          fontSize: 14,
                          color: mode === "dark" ? "#fff" : "#000",
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
                          backgroundColor: mode === "dark" ? "#f1f1f1" : "#0c0c0c",
                          fontSize: 14,
                          color: mode === "dark" ? "#000" : "#fff",
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