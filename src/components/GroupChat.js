import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase';
import { db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Paper,
  IconButton,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  Dialog,
  ThemeProvider,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  ListItemButton,
  Divider,
  MenuItem,
  Tooltip,
  Menu,
  Fab
} from '@mui/material';
import EmojiPicker from 'emoji-picker-react';
import Popover from '@mui/material/Popover';
import { styled } from '@mui/system';
import BetaAccessGuard from "../components/BetaAccessGuard";
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import GroupInfoDrawer from "./GroupChat/GroupInfoDrawer";

import { motion, useAnimation } from 'framer-motion';
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

const MessageContainer = styled(Box)({
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#12121200',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    bottom: '0'
  });
  
  const MessageTime = styled(Typography)({
    fontSize: '10px',
    position: 'absolute',
    bottom: '-18px',
    right: '5px',
    color: '#B0BEC5', // Grey text
  });
  
  const GroupHeader = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0',
    backgroundColor: '#2C387E00', // Dark indigo header
    borderBottom: '1px solid rgba(66, 66, 66, 0.16)',
    color: '#FFFFFF',
  });
  
function GroupChat() {
  const { groupName } = useParams();
  const { mode, accent, } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupInfo, setGroupInfo] = useState({});
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const [createdByUser, setCreatedByUser] = useState(null);
  const [memberUsers, setMemberUsers] = useState([]);
  const currentUser = auth.currentUser;
  const [profileOpen, setProfileOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [replyTo, setReplyTo] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const controls = useAnimation();
  const [user, setUser] = useState(null)
  const [memberInfo, setMemberInfo] = useState({});
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [allUsers, setAllUsers] = useState({}); // { uid1: { photoURL, name }, ... }
  const [editingMsg, setEditingMsg] = useState(null); // message object
  const [editText, setEditText] = useState(""); // input value

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);

  const [reactionAnchorEl, setReactionAnchorEl] = useState(null);
  const [reactionMsg, setReactionMsg] = useState(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [tripInfo, setTripInfo] = useState(null);
  const [timelineStats, setTimelineStats] = useState(null);
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const messageRefs = useRef({});
  const [showGoToBottom, setShowGoToBottom] = useState(false);
  const containerRef = useRef(null);
  const [mentionDrawerOpen, setMentionDrawerOpen] = useState(false);
  const [mentionSelected, setMentionSelected] = useState(false);



useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (u) => {
    if (u) setUser(u);
    else setUser(null);
  });

  return () => unsubscribe();
}, []);

useEffect(() => {
  const text = editingMsg ? editText : newMsg;

  // Check if text contains "@" at the start or anywhere else for new mentions
  const atIndex = text.indexOf('@');

  // Open drawer only if:
  // - starts with @ and no mention is selected
  // - or user types a new '@' after clearing selection
  if (atIndex === 0 && !mentionSelected) {
    setMentionDrawerOpen(true);
  } else if (atIndex > 0 && mentionSelected) {
    // User typed '@' somewhere after a mention was selected, reset to allow new selection
    setMentionSelected(false);
    setMentionDrawerOpen(true);
  } else if (atIndex === -1) {
    // If no @ present at all, close drawer and reset selection
    setMentionDrawerOpen(false);
    setMentionSelected(false);
  }
}, [newMsg, editText, editingMsg]);

const handleMentionSelect = (username) => {
  let text = editingMsg ? editText : newMsg;

  // Replace first '@' and anything typed after it till cursor with '@username '
  // For simplicity, replace whole text starting from '@'

  text = '@' + username + ' ';

  if (editingMsg) {
    setEditText(text);
  } else {
    setNewMsg(text);
  }

  setMentionSelected(true);
  setMentionDrawerOpen(false);
};


useEffect(() => {
  const fetchTrip = async () => {
    if (!groupInfo?.tripId) return setTripInfo(null);
    const tripRef = doc(db, "trips", groupInfo.tripId);
    const tripSnap = await getDoc(tripRef);
    setTripInfo(tripSnap.exists() ? { id: tripSnap.id, ...tripSnap.data() } : null);
  };
  fetchTrip();
}, [groupInfo?.tripId]);

useEffect(() => {
  // Get tripId from groupInfo (if this is a trip group and msg.type === "checklist")
  const tripId = groupInfo?.tripId;
  if (!tripId) return setChecklist([]);
  const q = collection(db, "trips", tripId, "checklist");
  const unsubscribe = onSnapshot(q, (snap) =>
    setChecklist(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  );
  return () => unsubscribe();
}, [groupInfo?.tripId]);

useEffect(() => {
  if (!tripInfo?.id) return setTimelineStats(null);
  getDocs(collection(db, "trips", tripInfo.id, "timeline")).then(snap => {
    const events = snap.docs.map(d => d.data());
    const total = events.length || 1;
    const completed = events.filter(e => e.completed === true).length;
    setTimelineStats({ completed, total, percent: Math.round((completed / total) * 100) });
  });
}, [tripInfo]);

const handleToggleChecklistItem = async (itemId, checked) => {
  if (!groupInfo?.tripId || !currentUser) return;
  const itemRef = doc(db, "trips", groupInfo.tripId, "checklist", itemId);
  await updateDoc(itemRef, {
    checkedBy: checked
      ? arrayUnion(currentUser.uid)
      : arrayRemove(currentUser.uid),
  });
};

const handleOptionChange = (index, value) => {
  setPollOptions((options) => {
    const newOptions = [...options];
    newOptions[index] = value;
    return newOptions;
  });
};

const addOption = () => {
  setPollOptions((options) => [...options, ""]);
};

const removeOption = (index) => {
  setPollOptions((options) => options.filter((_, i) => i !== index));
};

// Fetch timeline from Firestore
const fetchTripTimeline = async () => {
  if (!groupInfo?.tripId) return [];
  const timelineSnap = await getDocs(collection(db, "trips", groupInfo.tripId, "timeline"));
  // Each doc: {text: "...", completed: true/false}
  return timelineSnap.docs.map(doc => doc.data()).filter(Boolean);
};

// Fetch checklist from Firestore
const fetchTripChecklist = async () => {
  if (!groupInfo?.tripId) return [];
  const checklistSnap = await getDocs(collection(db, "trips", groupInfo.tripId, "checklist"));
  // Each doc: {text: "...", completed: true/false}
  return checklistSnap.docs.map(doc => doc.data()).filter(Boolean);
};

useEffect(() => {
  if (!groupInfo?.tripId) return setTimeline([]);
  const q = collection(db, "trips", groupInfo.tripId, "timeline");
  const unsub = onSnapshot(q, (snap) => {
    setTimeline(
      snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
    );
  });
  return () => unsub();
}, [groupInfo?.tripId]);

useEffect(() => {
  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const usersMap = {};
    snapshot.forEach(doc => {
      usersMap[doc.id] = doc.data();
    });
    setAllUsers(usersMap);
  };
  fetchUsers();
}, []);

useEffect(() => {
  if (!groupName) return;

  const groupRef = doc(db, "groupChats", groupName);

  const unsubscribe = onSnapshot(groupRef, (docSnap) => {
    if (docSnap.exists()) {
      setGroupInfo(docSnap.data()); // ✅ keeps everything in sync
    }
  });

  return () => unsubscribe(); // cleanup on unmount
}, [groupName]);

useEffect(() => {
  const fetchMembers = async () => {
    if (!groupInfo?.members) return;

    const fetched = {};
    await Promise.all(
      groupInfo.members.map(async (uid) => {
        try {
          const userRef = doc(db, "users", uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            fetched[uid] = userSnap.data();
          }
        } catch (err) {
          console.error("Error fetching member info:", err);
        }
      })
    );
    setMemberInfo(fetched);
  };

  fetchMembers();
}, [groupInfo?.members]);


const sendStructuredMessage = async (label, items) => {
  if (!groupInfo?.tripId || !items?.length) {
    setNotification(`No ${label.toLowerCase()} items found`);
    return;
  }

  let listText = "";
  if (label.toLowerCase() === "timeline") {
    listText = items.map((item, idx) => {
      // Format time and date
      let dateObj;
      // If you store a seconds (timestamp) field, prefer that
      if (item.timestamp?.seconds) {
        dateObj = new Date(item.timestamp.seconds * 1000);
      } else if (item.datetime || item.time) {
        // item.datetime can be an ISO string or item.time can be "09:00 AM"
        dateObj = new Date(item.datetime || `${item.date || ""} ${item.time || ""}`.trim());
      } else {
        dateObj = null;
      }

      let formattedDateTime = "";
      if (dateObj && !isNaN(dateObj.getTime())) {
        formattedDateTime = dateObj.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } else if (item.time) {
        formattedDateTime = item.time;
      } else {
        formattedDateTime = "—";
      }

      const title = item.title || item.text || "Untitled event";
      const completed = item.completed ? "✅" : "🕒";
      return `${completed} [${formattedDateTime}] ${title}`;
    }).join('\n');
  } else if (label.toLowerCase() === "checklist") {
    listText = items.map((item, idx) => {
      const completed = item.completed ? "✅" : "⬜";
      const text = item.text || item.name || "Untitled task";
      return `${completed} ${text}`;
    }).join('\n');
  }

  const messageObject = {
    text: `${listText}`,
    senderId: currentUser.uid,
    senderName: currentUser.displayName || "Anonymous",
    photoURL: currentUser.photoURL || null,
    timestamp: serverTimestamp(),
    status: 'sent',
    read: false,
    type: label.toLowerCase(),
  };

  try {
    await addDoc(collection(db, "groupChat", groupName, "messages"), messageObject);
    setNotification(`✅ ${label} shared successfully`);
  } catch (err) {
    console.error(`Error sharing ${label}:`, err);
    setNotification(`❌ Could not share ${label}`);
  }
};

const now = new Date(); // Or use new Date("2025-07-20T00:06:00") for consistent testing

// Sort timeline events in descending order (most recent first)
const sortedTimeline = [...timeline].sort((a, b) => {
  // Derive proper Date object from timestamp or datetime
  const getDate = (event) => {
    if (event.timestamp?.seconds)
      return new Date(event.timestamp.seconds * 1000);
    if (event.datetime)
      return new Date(event.datetime);
    return null;
  };
  const dateA = getDate(a);
  const dateB = getDate(b);
  // Descending order
  return dateB - dateA;
});

let upcomingEventId = null;
for (let i = sortedTimeline.length - 1; i >= 0; i--) { // start from soonest
  const event = sortedTimeline[i];
  const date = event.timestamp?.seconds
    ? new Date(event.timestamp.seconds * 1000)
    : event.datetime
    ? new Date(event.datetime)
    : null;
  if (!event.completed && date && date >= now) {
    upcomingEventId = event.id;
    break;
  }
}

const handleSendPoll = async () => {
  const trimmedQuestion = pollQuestion.trim();
  const validOptions = pollOptions.filter(opt => opt.trim() !== "");

  if (!trimmedQuestion || validOptions.length < 2) {
    setNotification("Please enter a question and at least 2 options.");
    return;
  }

  const poll = {
    type: "poll",
    question: trimmedQuestion,
    options: validOptions.map(text => ({ text, votes: [] })),
    senderId: currentUser.uid,
    senderName: currentUser.displayName || "Anonymous",
    photoURL: currentUser.photoURL || null,
    timestamp: serverTimestamp(),
    status: "sent",
    read: false,
  };

  try {
    await addDoc(collection(db, "groupChat", groupName, "messages"), poll);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollDialog(false);
    setNotification("✅ Poll sent");
  } catch (err) {
    console.error("Error sending poll:", err);
    setNotification("❌ Failed to send poll");
  }
};

const handleVote = async (msgId, optionIdx) => {
  const msgRef = doc(db, "groupChat", groupName, "messages", msgId);
  // Get the current poll message from Firestore
  const snapshot = await getDoc(msgRef);
  if (!snapshot.exists()) return;
  const data = snapshot.data();
  // Prevent duplicate voting
  const alreadyVoted = (data.options || []).some(opt =>
    Array.isArray(opt.votes) && opt.votes.includes(currentUser.uid)
  );
  if (alreadyVoted) return;

  // Safely update ONLY the chosen option's votes array
  const optionPath = `options.${optionIdx}.votes`;
  await updateDoc(msgRef, {
    [optionPath]: arrayUnion(currentUser.uid)
  });
};

useEffect(() => {
  const q = query(
    collection(db, "groupChat", groupName, "messages"),
    orderBy("timestamp", "asc")
  );

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const msgs = [];
    querySnapshot.forEach((doc) => {
      msgs.push({ id: doc.id, ...doc.data() });
    });
    setMessages(msgs);
    setLoading(false);
  });

  return () => unsubscribe();
}, [groupName]);

useEffect(() => {
  // Realtime listener for messages and fetching group info and members
  const unsubscribe = onSnapshot(doc(db, 'groupChats', groupName), async (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      setGroupInfo(data);

      // Fetch createdBy user info
      if (data.createdBy) {
        const createdByRef = doc(db, 'users', data.createdBy);
        const createdBySnap = await getDoc(createdByRef);
        if (createdBySnap.exists()) {
          setCreatedByUser(createdBySnap.data());
        }
      }

      // Fetch member user info with UID attached
      if (Array.isArray(data.members) && data.members.length > 0) {
        try {
          const memberFetches = data.members.map((uid) =>
            getDoc(doc(db, 'users', uid))
          );
          const memberDocs = await Promise.all(memberFetches);
          const memberNames = memberDocs
            .map((docSnap, idx) => {
              if (docSnap.exists()) {
                return { uid: data.members[idx], ...docSnap.data() };
              }
              return null;
            })
            .filter(Boolean);
          setMemberUsers(memberNames);
        } catch (e) {
          console.error('Error fetching group members:', e);
          setMemberUsers([]);
        }
      } else {
        setMemberUsers([]);
      }
    }
  });

  return () => unsubscribe();
}, [groupName]);

      
const sendMessage = async () => {
  if (!newMsg.trim()) return;

  // Permissions: check who is allowed to send messages
  const canSend =
    groupInfo?.sendAccess === "all" ||
    groupInfo?.createdBy === currentUser.uid ||
    (groupInfo?.admins || []).includes(currentUser.uid);

  if (!canSend) {
    alert("You don't have permission to send messages in this group.");
    return;
  }

  const messageData = {
    text: newMsg.trim(),
    senderId: currentUser.uid,
    senderName: currentUser.displayName || 'Anonymous',
    photoURL: currentUser.photoURL || null,
    timestamp: serverTimestamp(),
    status: 'sent',
    read: false,
  };

  // Only include replyTo if valid
  if (replyTo?.text && replyTo?.senderName && replyTo?.id) {
    messageData.replyTo = {
      senderName: replyTo.senderName,
      text: replyTo.text,
      id: replyTo.id,
    };
  }

  try {
    await addDoc(collection(db, 'groupChat', groupName, 'messages'), messageData);
    setNewMsg('');
    setReplyTo(null); // Clear reply state
  } catch (err) {
    console.error("Error sending message:", err);
  }
};

  const handleTouchStart = (message) => {
    const timer = setTimeout(() => {
      setContextMenu({ visible: true, x: window.innerWidth / 2, y: window.innerHeight / 2, message });
    }, 600); // 600ms long press
    setLongPressTimer(timer);
  };
  
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer);
  };
  
  const handleReply = (msg) => {
    if (msg?.text && msg?.id && msg?.senderName) {
      setReplyTo(msg);
    }
    setContextMenu({ ...contextMenu, visible: false });
  };
  
const handleDelete = async (messageId) => {
  if (!messageId || !groupName) return;
  try {
    await deleteDoc(doc(db, "groupChat", groupName, "messages", messageId));
    setContextMenu({ ...contextMenu, visible: false });
  } catch (err) {
    console.error("Failed to delete message:", err.message);
  }
};

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);
   
  const handleBackButton = () => navigate(-1);

  
const scrollToBottom = () => {
  bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
};

const handleScroll = () => {
  const container = containerRef.current;
  if (!container) return;

  const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
  setShowGoToBottom(distanceFromBottom > 10);
};

useEffect(() => {
  // Scroll to bottom initially and when messages change
  scrollToBottom();
}, [messages]);

useEffect(() => {
  const container = containerRef.current;
  if (!container) return;

  container.addEventListener('scroll', handleScroll);

  return () => {
    container.removeEventListener('scroll', handleScroll);
  };
}, []);

  if (!currentUser) return <div>Loading...</div>;

  const groupMessagesByDate = (messages) => {
    return messages.reduce((groups, message) => {
      const timestamp = message.timestamp?.seconds
        ? new Date(message.timestamp.seconds * 1000)
        : new Date();
      const dateString = timestamp.toLocaleDateString();

      if (!groups[dateString]) {
        groups[dateString] = [];
      }
      groups[dateString].push(message);

      return groups;
    }, {});
  };

  const groupedMessages = groupMessagesByDate(messages);

const handleReaction = async (emoji, msg) => {
  if (!msg || !msg.id || !groupName || !auth?.currentUser) return;

  const userId = auth.currentUser.uid;
  const messageRef = doc(db, "groupChat", groupName, "messages", msg.id);

  try {
    const msgSnap = await getDoc(messageRef);
    if (!msgSnap.exists()) return;

    const currentData = msgSnap.data();
    const reactions = currentData.reactions || {};

    // Toggle emoji: if same emoji exists, remove it
    if (reactions[userId] === emoji) {
      const updated = { ...reactions };
      delete updated[userId];
      await updateDoc(messageRef, { reactions: updated });
    } else {
      const updated = { ...reactions, [userId]: emoji };
      await updateDoc(messageRef, { reactions: updated });
    }
  } catch (err) {
    console.error("🔥 Failed to update reaction:", err.message);
  }
};

const handleEdit = (msg) => {
  if (msg.senderId !== currentUser.uid) return; // permission check
  setEditingMsg(msg);
  setEditText(msg.text || "");
};

const getGroupedReactions = (msg, allUsers = {}) => {
  const grouped = {};
  if (!msg?.reactions) return grouped;

  for (const [uid, emoji] of Object.entries(msg.reactions)) {
    if (!grouped[emoji]) grouped[emoji] = [];
    grouped[emoji].push({
      uid,
      name: allUsers[uid]?.name || "User",
      photoURL: allUsers[uid]?.photoURL || "",
    });
  }

  return grouped;
};

const renderMessageWithMentions = (text) => {
  if (!text) return null;

  const mentionRegex = /@(\w+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Text before mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const username = match[1];

    // Find user by username or name in memberUsers
    const user = memberUsers.find(u => u.username === username || u.name === username);

    if (user) {
      parts.push(
        <Typography
          key={`${username}-${match.index}`}
          component="span"
          onClick={() => navigate(`/chat/${user.uid}`)}
          sx={{
            cursor: 'pointer',
            color: mode === 'dark' ? '#00f721' : '#007700',
            fontWeight: 'bold',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          @{username}
        </Typography>
      );
    } else {
      // No matching user: render as plain text
      parts.push(text.slice(match.index, mentionRegex.lastIndex));
    }

    lastIndex = mentionRegex.lastIndex;
  }

  // Remaining text after last mention
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

  return (
    <ThemeProvider theme={theme}>
      <BetaAccessGuard>
          <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '98vh',
      backgroundColor: '#F0F2F500',
      overflow: 'hidden'
    }}>
<GroupHeader>
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      background: mode === "dark" ? 'linear-gradient(to bottom, #000000, #000000d9, #000000c9, #00000090, #00000000)' : 'linear-gradient(to bottom, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
      height: '64px',
    }}
  >
    <IconButton onClick={handleBackButton} sx={{ mr: 1 }} style={{ color: mode === "dark" ? "#fff" : "#000" }}>
      <ArrowBackIcon />
    </IconButton>

    <Box
      onClick={() => setProfileOpen(true)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <Avatar
        src={groupInfo.iconURL || ""}
        sx={{
          bgcolor: mode === "dark" ? "#aaa" : "#333",
          color: mode === "dark" ? '#000' : "#fff",
          fontSize: 24,
          width: 40,
          height: 40,
          border: '2px solid rgb(7, 7, 7)',
          marginRight: 2,
        }}
      >
        {(groupInfo.iconURL || groupInfo.emoji || groupInfo.name?.[0]?.toUpperCase() || 'G')}
      </Avatar>

      <Box>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: "14px",
            color: mode === "dark" ? "#fff" : "#000",
          }}
        >
          {groupInfo.name || groupName}

          {/* ✅ Conditionally show group chip */}
          {groupInfo.name === "BM - Beta members" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.5,
                py: 0.1,
                fontSize: 11,
                backgroundColor: '#00f72133',
                color: '#009e15ff',
                borderRadius: 1.5,
              }}
            >
              🔒 Beta
            </Box>
          )}
          {groupInfo.name === "BM - Dev Beta" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.5,
                py: 0.1,
                fontSize: 11,
                backgroundColor: '#66ccff33',
                color: '#66ccff',
                borderRadius: 1.5,
              }}
            >
              🧪 Dev Beta
            </Box>
          )}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: mode === "dark" ? "#ccc" : "#555",
            mt: 0.1,
          }}
        >
          {memberUsers.length === 0 ? (
            'None'
          ) : (
            <>
              {memberUsers.slice(0, 2).map((user) => user.name).join(', ')}
              {memberUsers.length > 2 && `...`}
            </>
          )}
        </Typography>
      </Box>
    </Box>
  </Box>
</GroupHeader>



      <Box
      ref={containerRef}
        sx={{
        flexGrow: 1,
        paddingTop: '60px',
        overflowY: 'auto',
        marginBottom: '0px',
        backgroundImage: mode === "dark" ? `url(/assets/images/chatbg/dark.png)` : `url(/assets/images/chatbg/light.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        }}
      >
        <MessageContainer>


        <Box
          onClick={() => setProfileOpen(true)}
          sx={{
            display: 'flex', 
            flexDirection: 'column',
            margin: '20px',
            backgroundColor: '#009b5912',
            borderRadius: '20px',
            alignItems: 'center',
            textAlign: 'center',
            padding: '25px',
            border: '1.2px solid #009b59ad',
            backdropFilter: 'blur(25px)',
            maxWidth: '100%'
          }}
        >
        <Avatar
            src={groupInfo.iconURL ? groupInfo.iconURL : ""}
            sx={{
              bgcolor: mode === "dark" ? '#f1f1f1' : "#0c0c0c",
              color: mode === "dark" ? "#000" : "#fff",
              fontSize: 38,
              width: 68,
              height: 68,
              border: '2px solid rgb(7, 7, 7)',
              marginBottom: 2,
            }}
          >
            {(groupInfo.iconURL || groupInfo.emoji || groupInfo.name?.[0]?.toUpperCase() || 'G')}
          </Avatar>
  <Typography
    variant="subtitle1"
    sx={{
      fontWeight: 'bold',
      fontSize: '21px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: mode === "dark" ? "#fff" : "#000",
      mb: 0.5,
    }}
  >
    {groupInfo.name || groupName}
          {groupInfo.name === "BM - Beta members" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.5,
                py: 0.1,
                fontSize: 11,
                backgroundColor: '#00f72133',
                color: '#008912ff',
                borderRadius: 1.5,
              }}
            >
              🔒
            </Box>
          )}
          {groupInfo.name === "BM - Dev Beta" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 0.5,
                py: 0.1,
                fontSize: 11,
                backgroundColor: '#66ccff33',
                color: '#66ccff',
                borderRadius: 1.5,
              }}
            >
              🧪
            </Box>
          )}
  </Typography>

  <Typography
    variant="caption"
    multiline
    sx={{
      whiteSpace: 'pre-wrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: mode === "dark" ? "#fff" : "#000",
      textAlign: "center",
      mb: 0.5,
      width: "80vw"
    }}
  >
    {groupInfo.description || ""}
  </Typography>

  {createdByUser && (
    <Typography variant="caption" sx={{ color: mode === "dark" ? "#ccc" : "#555", mb: 0.5 }}>
      <strong sx={{color: mode === "dark" ? "#fff" : "#000"}}>Created by:</strong> {createdByUser.name}
    </Typography>
  )}

  <Typography variant="caption" sx={{ color: mode === "dark" ? "#ccc" : "#555" }}>
  <br></br><strong sx={{color: mode === "dark" ? "#fff" : "#000"}}>{groupInfo.members?.length || 0} Members</strong>
  </Typography>

<Typography
  variant="caption"
  sx={{
    color: mode === "dark" ? "#ccc" : "#555",
    whiteSpace: 'pre-wrap',
    mt: 1,
  }}
>
  <strong style={{ color: mode === "dark" ? "#fff" : "#000" }}>Members Joined:</strong>
  {'\n'}
  {memberUsers.length === 0 ? (
    'None'
  ) : (
    <>
      {memberUsers.slice(0, 3).map((user) => user.name).join(', ')}
      {memberUsers.length > 3 && ` +${memberUsers.length - 3} more`}
    </>
  )}
</Typography>

</Box>


          {loading ? (
            <Typography variant="body1" sx={{ textAlign: 'center', color: mode === "dark" ? "#aaa" : "#333" }}>
              Loading messages...
            </Typography>
          ) : (
            Object.keys(groupedMessages).map((date) => (
              <Box key={date} sx={{ marginBottom: '80px' }}>
                <Typography variant="body2" sx={{ color: mode === "dark" ? "#aaa" : "#333", bgcolor: mode === "dark" ? '#2b2b2b54' : "#0c0c0c24", borderRadius: '0px', textAlign: 'center', marginBottom: '10px' }}>
                  {date}
                </Typography>
                {(groupedMessages?.[date] || []).map((msg) => {
if (msg.type === "system") {
  return (
    <Box
      key={msg.id}
      sx={{
        display: "flex",
        justifyContent: "center",
        mb: 1,
        mt: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          backgroundColor: "#6c6c6c21",
          backdropFilter: "blur(10px)",
          borderRadius: 2,
          px: 2,
          py: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: mode === "dark" ? "#ccc" : "#555",
            fontStyle: "italic",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          {msg.content}
        </Typography>
      </Box>
    </Box>
  );
}

                    return(
                      <Box
  key={msg.id}
  sx={{
    display: 'flex',
    flexDirection: msg.senderId === currentUser.uid ? 'row-reverse' : 'row',
    marginBottom: '15px',
    alignItems: 'flex-end',
    gap: 1,
    px: 1,
    maxWidth: '90%',
    mx: "auto"
  }}
  onContextMenu={(e) => {
    e.preventDefault();
    setSelectedMsg(msg);
    setAnchorEl(e.currentTarget);
  }}
  onTouchStart={(e) => handleTouchStart(e, msg)}
  onTouchEnd={(e) => handleTouchEnd(e)}
>


                    <Box sx={{ marginRight: '0px', marginLeft: '4px' }}>
                      <Avatar
                        src={msg.photoURL || 'https://via.placeholder.com/50'}
                        alt={msg.senderName}
                        sx={{ width: 30, height: 30 }}
                      >
                        {msg.photoURL && <AccountCircleIcon sx={{ fontSize: 40, color: mode === "dark" ? '#2f2f2fff' : "#fff" }} />}
                      </Avatar>
                    </Box>  

                    <motion.div
                key={msg.id}
                ref={el => { messageRefs.current[msg.id] = el; }}
            drag="x"
      dragConstraints={{ left: 0, right: 100 }}
      dragElastic={0.3}
      onDragEnd={(_, info) => {
        if (info.offset.x > 80) {
          handleReply(msg);
        }
        controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
      }}
      animate={controls}
      whileDrag={{ scale: 1.02 }}
      style={{
        display: 'flex',
        flexDirection: msg.senderId === currentUser.uid ? 'row-reverse' : 'row',
        marginBottom: '15px',
        alignItems: 'flex-end',
        gap: 1,
        padding: '0',
                ...(highlightedMsgId === msg.id && {
                    boxShadow: "none",
                    padding: 2,
                    borderRadius: 12,
                    background: theme.palette.primary.mainbg,
                    transition: "background 1.5s ease-in-out",
                  })
      }}
    >
      <Box sx={{ display: "flex", flexDirection: 'column', m: 0 }}>
                          {msg.replyTo?.text && (
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
    <Typography variant="caption" color={mode === "dark" ? "#00f721ab" : "#057c1572"}>
  {msg.senderId === currentUser.uid
    ? 'You'
    : (msg.replyTo?.senderName?.length > 60
        ? msg.replyTo.senderName.slice(0, 60) + '...'
        : msg.replyTo?.senderName || 'Unknown')}
</Typography>

    <Typography variant="body2" sx={{ color: mode === "dark" ? "#919191ff" : "#7c7c7cff", fontStyle: 'italic', fontSize: "0.97em", wordBreak: "break-word" }}>
      {msg.replyTo.text.length > 60
        ? msg.replyTo.text.slice(0, 30) + '...'
        : msg.replyTo.text}
    </Typography>
  </Box>
)}
                    <Paper
                      isCurrentUser={msg.senderId === currentUser.uid} 
                      status={msg.status}                    
                      elevation={1}
                      sx={{
                        px: 2,
                        py: 0.5,
                        mx: 0,
                        maxWidth: "65vw",
                        minWidth: "100px",
                        bgcolor: msg.senderId === currentUser.uid ? mode === "dark" ? "#005c4b" : "#d9fdd3" : mode === "dark" ? "#353535" : "#ffffff",
                        borderRadius:msg.senderId === currentUser.uid ? '16px 16px 8px 16px' : '16px 16px 16px 8px',
                        color: mode === "dark" ? "#fff" : "#000",
                        position: 'relative',
                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '13px',
                          marginBottom: '5px',
                          color: mode === "dark" ? '#a7a7a7' : "#696969ff",
                          maxWidth: 'auto',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={msg.senderName}
                      >
                        {msg.senderName}
                      </Typography>

{msg.type === "poll" && Array.isArray(msg.options) && msg.options.length > 0 ? (
  <Box>
    <Typography variant="subtitle1" sx={{ color: "#00f721", fontWeight: 600 }}>
      📊 {msg.question || "Untitled Poll"}
    </Typography>

    <List>
      {msg.options.map((opt, i) => {
        const votes = Array.isArray(opt.votes) ? opt.votes : [];
        const hasVoted = votes.includes(currentUser.uid);
        const userHasVoted = msg.options.some(o =>
          Array.isArray(o.votes) && o.votes.includes(currentUser.uid)
        );

        return (
          <ListItemButton
            key={i}
            disabled={userHasVoted}
            onClick={() => handleVote(msg.id, i)}
            sx={{
              bgcolor: hasVoted ? "#00f72144" : "transparent",
              mb: 0.5,
              borderRadius: 2,
            }}
          >
            <ListItemText
              primary={opt.text || `Option ${i + 1}`}
              sx={{
                color: hasVoted ? "#00f721" : "#fff",
                fontWeight: hasVoted ? 600 : 500,
              }}
            />
            <Typography variant="body2" sx={{ color: "#b5ffca", minWidth: 35 }}>
              {votes.length} vote{votes.length !== 1 ? "s" : ""}
            </Typography>
          </ListItemButton>
        );
      })}
    </List>

    <Typography variant="caption" sx={{ color: "#aaa", mt: 1, fontStyle: 'italic' }}>
      Total votes: {msg.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0)}
    </Typography>
  </Box>
) : msg.type === "timeline" && groupInfo?.tripId ? (
<Box sx={{ maxWidth: 250, minWidth: 220 }}>
  <Typography
    variant="subtitle1"
    sx={{ color: mode === "dark" ? "#fff" : "#000", fontWeight: 700, mb: 1 }}
  >
    📅 Group Timeline
  </Typography>
  <List dense>
    {sortedTimeline.length === 0 && (
      <Typography sx={{ color: mode === "dark" ? "#888888" : "#111111", mb: 1 }}>
        No timeline events yet.
      </Typography>
    )}
{sortedTimeline.map((event, idx) => {
  const dateObj = event.timestamp?.seconds
    ? new Date(event.timestamp.seconds * 1000)
    : event.datetime
    ? new Date(event.datetime)
    : null;
  const isUpcoming = event.id === upcomingEventId;

      let timeStr = "";
      if (dateObj && !isNaN(dateObj.getTime())) {
        timeStr = dateObj.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          weekday: "short",
        });
      } else if (event.time) {
        timeStr = event.time;
      } else {
        timeStr = "—";
      }
      return (
        <ListItem key={event.id || idx} disableGutters>
          <Box
            sx={{
              bgcolor: isUpcoming
                ? "#f794002a"
                : event.completed
                ? "transparent"
                : "#8787873f",
              border: isUpcoming ? "2px solid #f79400aa" : undefined,
              px: 1.2,
              py: 0.5,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              minHeight: 34,
              m: 0,
              width: "90%",
              boxShadow: isUpcoming ? "0 2px 12px #00f72100" : undefined,
              transition: "background 0.2s, border 0.2s",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                color: event.completed
                  ? mode === "dark" ? "#c5c5c5ff" : "#313131ff"
                  : isUpcoming
                  ? mode === "dark" ? "#ffffffff" : "#000000"
                  : mode === "dark" ? "#b6b6b6ff" : "#333333",
                fontWeight: 700,
                minWidth: 30,
              }}
            >
              {event.completed ? "✅" : isUpcoming ? "⏩" : "⏳"}
            </Typography>
            <Box ml={0}>
              <Typography
                variant="body2"
                sx={{
                  color: event.completed ? mode === "dark" ? "#c5c5c5ff" : "#333333" : mode === "dark" ? "#fff" : "#000",
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                {event.title || event.text || isUpcoming || "Untitled"}
              </Typography>
              <Typography variant="caption" sx={{ color: event.completed ? mode === "dark" ? "#c5c5c5ff" : "#333333" : mode === "dark" ? "#fff" : "#000", fontWeight: isUpcoming ? 700 : 400 }}>
                {timeStr}
              </Typography>
            </Box>
          </Box>
        </ListItem>
      );
    })}
  </List>
</Box>
) : msg.type === "checklist" && groupInfo?.tripId ? (
  <Box sx={{ maxWidth: 250, minWidth: 220 }}>
    <Typography variant="subtitle1" sx={{ color: mode === "dark" ? "#fff" : "#000", fontWeight: 700 }}>
      📝 Trip Checklist
    </Typography>
    <List dense>
      {checklist.map((item) => {
        const isChecked = item.checkedBy?.includes(currentUser.uid);
        return (
          <ListItem key={item.id} disableGutters sx={{ borderRadius: 2 }}>
            <ListItemButton
              onClick={() => handleToggleChecklistItem(item.id, !isChecked)}
              sx={{ borderRadius: 2 }}
            >
              <Checkbox
                edge="start"
                checked={isChecked}
                tabIndex={-1}
                sx={{
                  color: mode === "dark" ? "#fff" : "#000",
                  '&.Mui-checked': { color: "#56cb66ff" },
                }}
              />
              <ListItemText
                primary={item.text || "Untitled"}
                sx={{
                  color: isChecked ? "#56cb66ff" : mode === "dark" ? "#fff" : "#000",
                  textDecoration: isChecked ? "line-through" : "none",
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
    <Typography variant="caption" sx={{ color: "#818181ff", mt: 1, fontStyle: 'italic' }}>
      Only you see your own progress
    </Typography>
  </Box>
) : (
  <Typography
  variant="body2"
  sx={{
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: mode === "dark" ? "#fff" : "#000",
    fontSize: '15px'
  }}
>
  {renderMessageWithMentions(msg.text)}
</Typography>

)}

                      
                      
{msg.reactions && (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      mt: 1,
      flexWrap: "wrap",
    }}
  >
    {Object.entries(msg.reactions).map(([uid, emoji]) => {
      const user = allUsers[uid] || {};
      return (
        <Box
          key={uid}
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: mode ===  "dark" ? "#2b2b2b" : "#efefefff",
            borderRadius: "20px",
            px: 0.5,
            py: 0.2,
            gap: 0.5,
          }}
          onClick={(e) => {
            setReactionMsg(msg);
            setReactionAnchorEl(e.currentTarget);
          }}
        >
          <Avatar
            src={user.photoURL || "https://via.placeholder.com/32"}
            sx={{ width: 15, height: 15 }}
          />
          <Typography variant="body2" sx={{ fontSize: 14 }}>
            {emoji}
          </Typography>
        </Box>
      );
    })}
  </Box>
)}


                      <MessageTime
                        sx={{
                          color: "#757575"
                        }}
                      >
                        {msg.timestamp?.seconds
                          ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Just now'}
                      </MessageTime>
                      

                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: '-18px',
                          left: '5px',
                          color: '#757575',
                          fontSize: '10px',
                        }}
                      >
                        {msg.status === 'sent'
                          ? 'Sent'
                          : msg.status === 'delivered'
                          ? 'Delivered'
                          : 'Read'} 
                        {msg.edited && (
                          <Typography
                          variant="caption"
                          sx={{ color: "#888", ml: 1, fontStyle: "italic" }}
                          >
                            edited
                          </Typography>
                        )}
                        </Box>
                    </Paper>
      </Box>
                    </motion.div>
                  </Box>
                    );
                    })}
              </Box>
            ))
          )}

<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
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
  {/* 🔥 Row of Reactions */}
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, px: 1 }}>
    {["❤️", "😂", "👍", "😁", "👌"].map((emoji) => (
      <IconButton
        key={emoji}
        onClick={() => {
          handleReaction(emoji, selectedMsg);
          setAnchorEl(null);
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
        setAnchorEl(null);
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
      <AddIcon />
    </IconButton>
  </Box>

  <Divider sx={{ my: 1, bgcolor: "#333" }} />

  {/* 📄 Message Actions */}
  <MenuItem
    onClick={() => {
      handleReply(selectedMsg);
      setAnchorEl(null);
    }}
        sx={{
          fontWeight: 500,
          fontSize: 15,
          borderRadius: 2,
          mx: 0.5,
          my: 0.2,
          backdropFilter: mode === "dark" ? 'blur(2px)' : 'blur(2px)',
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
          setAnchorEl(null);
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
          setAnchorEl(null);
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

  <Divider sx={{ my: 0.5, bgcolor: "#333" }} />

  <MenuItem
    onClick={() => {
      navigator.clipboard.writeText(selectedMsg?.text || "");
      setNotification("Message copied!");
      setAnchorEl(null);
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
          "_blank"
        );
        setAnchorEl(null);
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
  anchorEl={reactionAnchorEl}
  open={Boolean(reactionAnchorEl) && !showEmojiPicker}
  onClose={() => {
    setReactionAnchorEl(null);
    setReactionMsg(null);
  }}
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
{reactionMsg && (() => {
  // Group reactions by user id
  const userGroupedReactions = {};
  for (const [emoji, users] of Object.entries(getGroupedReactions(reactionMsg, allUsers))) {
    users.forEach(u => {
      if (!userGroupedReactions[u.uid]) {
        userGroupedReactions[u.uid] = {
          user: u,
          emojis: [],
        };
      }
      userGroupedReactions[u.uid].emojis.push(emoji);
    });
  }

  // Convert to array
  const groupedArray = Object.values(userGroupedReactions);

  // Sort so current user is first
  groupedArray.sort((a, b) => {
    if (a.user.uid === currentUser.uid) return -1;
    if (b.user.uid === currentUser.uid) return 1;
    return 0;
  });

  return groupedArray.map(({ user, emojis }) => (
    <ListItem
      key={user.uid}
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: 3,
        mx: 0.5,
        my: 0.7,
        px: 2,
        py: 1.2,
        bgcolor: mode === "dark" ? "#0000003d" : "#31313121",
        color: mode === "dark" ? "#fff" : "#222",
        fontWeight: 500,
        fontSize: 17,
        boxShadow: "none",
        backdropFilter: mode === "dark" ? "blur(8px)" : "blur(2px)",
        border: "none",
        transition: "background 0.2s",
        "&:hover": {
          bgcolor: mode === "dark" ? "#232323" : "#e0e0e0",
          borderColor: mode === "dark" ? "#444" : "#bdbdbd",
        },
        flexDirection: "column",
        gap: 0.5,
      }}
      onClick={() => {
        if (user.uid === currentUser.uid) {
          // Remove all reactions of this user from this message
          emojis.forEach(emoji => handleReaction(emoji, reactionMsg));
          setReactionAnchorEl(null);
          setReactionMsg(null);
        }
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          gap: 1,
        }}
      >
        <Tooltip title={user.name}>
          <Avatar
            src={user.photoURL || ""}
            sx={{
              width: 36,
              height: 36,
              border: "none",
              bgcolor: mode === "dark" ? "#222" : "#fafafa",
              color: mode === "dark" ? "#fff" : "#222",
              fontWeight: 700,
              fontSize: 18,
            }}
          />
        </Tooltip>
        <Box sx={{ flexGrow: 1, ml: 1 }}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              color: mode === "dark" ? "#fff" : "#222",
              fontSize: 15,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.uid === currentUser.uid ? "You" : user.name}
          </Typography>
          {user.uid === currentUser?.uid && (
            <Typography
              variant="caption"
              sx={{
                color: mode === "dark" ? "#b4b4b4ff" : "#333333ff",
                fontWeight: 500,
                opacity: 0.8,
                fontSize: 10,
                letterSpacing: 0.1,
                userSelect: "none",
              }}
            >
              Tap to remove all your reactions
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {emojis.map((emoji) => (
            <Typography key={emoji} variant="body1" fontSize={22}>
              {emoji}
            </Typography>
          ))}
        </Box>
      </Box>
    </ListItem>
  ));
})()}

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
    vertical: "top",
    horizontal: "center",
  }}
  transformOrigin={{
    vertical: "bottom",
    horizontal: "center",
  }}
  PaperProps={{
    sx: {
      bgcolor: "#222",
      borderRadius: 3,
      boxShadow: "0 4px 24px #000a",
      p: 0,
    },
  }}
>
<EmojiPicker
  onEmojiClick={(emojiData) => {
    handleReaction(emojiData.emoji, reactionMsg);
    setShowEmojiPicker(false);
  }}
  theme={mode === "dark" ? "dark" : "light"}
/>
</Popover>


<div ref={bottomRef} />
        </MessageContainer>          

          
    {showGoToBottom && (
        <Fab
          color="primary"
          aria-label="scroll to bottom"
          onClick={scrollToBottom}
          sx={{
      position: 'absolute',
      bottom: 200, // adjust for footer height
      right: 24,
      zIndex: 1500,
      backgroundColor: '#00f721',
      color: '#000',
      '&:hover': { backgroundColor: '#00c218' },
          }}
          size="small"
        >
          <ArrowDownwardIcon />
        </Fab>
      )}

      </Box>

      {replyTo && (
    <Paper sx={{ p: 1, position: 'relative', bottom: '55px', bgcolor: '#2b2b2bb0', mb: 1, borderLeft: '4px solid #00f721', backdropFilter: 'blur(30px)' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="caption" color="primary">
            Replying to {replyTo.senderName === currentUser.uid ? 'You' : replyTo.senderName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#ccc' }}>
            {replyTo.text.length > 60
              ? replyTo.text.slice(0, 60) + '...'
              : replyTo.text}
          </Typography>
        </Box>
        <IconButton onClick={() => setReplyTo(null)}>
          <CloseIcon fontSize="small" sx={{ color: 'white' }} />
        </IconButton>
      </Box>
    </Paper>
  )}
  
<Box
  sx={{
    p: 1,
    display: 'flex',
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '95vw',
    zIndex: '1200',
    alignItems: 'center',
    borderTop: '0px solid #5E5E5E',
    background: mode === "dark" ? 'linear-gradient(to bottom, #000000, #000000d9, #000000c9, #00000090, #00000000)' : 'linear-gradient(to bottom, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
  }}
>
  <SwipeableDrawer
  anchor="bottom"
  open={mentionDrawerOpen}
  onClose={() => setMentionDrawerOpen(false)}
  PaperProps={{
    sx: {
      height: '50vh',
      borderTopRightRadius: 24,
      borderTopLeftRadius: 24,
      backgroundColor: mode === "dark" ? "#000000" : "#fff",
      color: mode === "dark" ? "#fff" : "#000",
      p: 2,
    },
  }}
>
  <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
    Mention a member
  </Typography>
  <List>
    {memberUsers.length === 0 && (
      <Typography sx={{ textAlign: 'center', mt: 4, color: mode === "dark" ? "#aaa" : "#555" }}>
        No members found
      </Typography>
    )}
    {memberUsers.map((member) => (
      <ListItemButton
        key={member.uid || member.id} // uid or doc id
        onClick={() => handleMentionSelect(member.username || member.name)}
        sx={{ py: 1 }}
      >
        <Avatar src={member.photoURL || ''} sx={{ width: 36, height: 36, mr: 2 }} />
        <ListItemText
          primary={member.name || member.username || 'Unknown'}
          secondary={member.username || ''}
          primaryTypographyProps={{ noWrap: true }}
          secondaryTypographyProps={{ noWrap: true, variant: 'caption', sx: {color: mode === "dark" ? "#ccc" : "#666"} }}
        />
      </ListItemButton>
    ))}
  </List>
</SwipeableDrawer>

  {(() => {
    const canSend =
      groupInfo?.sendAccess === "all" ||
      groupInfo?.createdBy === currentUser?.uid ||
      (groupInfo?.admins || []).includes(currentUser?.uid);

    if (!canSend) {
      return (
        <Typography
          variant="body2"
          sx={{
            color: '#999',
            fontStyle: 'italic',
            p: 1,
            textAlign: 'center',
            width: '100%',
            backgroundColor: mode === "dark" ? "#000000ff" : "#ffffff",
            borderTop: "1px solid #737373ff"
          }}
        >
          🔒 Only Admins can send messages in this group.
        </Typography>
      );
    }

    return (
<Box
  sx={{
    mx: "auto",
    p: 1,
    display: 'flex',
    justifyContent: "space-around",
    position: 'fixed',
    width: '97vw',
    bottom: 0,
    left: 0,
    zIndex: '1200',
    alignItems: 'center',
    borderTop: '0px solid #5e5e5e81',
    background: mode === "dark" ? 'linear-gradient(to top, #000000, #000000d9, #000000c9, #00000090, #00000000)' : 'linear-gradient(to top, #ffffff, #ffffffd9, #ffffffc9, #ffffff90, #ffffff00)',
  }}
>
  
<Box
sx={{
    display: "flex",
    alignItems: "center",
    px: 0.5,
    backgroundColor: "rgba(0, 0, 0, 0.17)",
    border: "1px solid #757575ff",
    borderRadius: '40px',
    backdropFilter: "blur(30px)",
    mr: 0.7,
    height: '40px',
}}
>
    <Button
    sx={{
      display: editingMsg ? "none" : "flex",
      backgroundColor: mode === "dark" ? '#f1f1f11c' : "#ffffff1c",
      backdropFilter: "blur(80px)",
      height: '30px',
      px: 0,
      minWidth: '30px',
      borderRadius: 40,
    }}
    onClick={(e) => setMoreAnchorEl(e.currentTarget)}
  >
    <AddIcon sx={{ color: mode === "dark" ? '#ffffffff' : "#000000", fontSize: 24 }} />
  </Button>

  <TextField
    value={editingMsg ? editText : newMsg}
    onChange={(e) =>
      editingMsg ? setEditText(e.target.value) : setNewMsg(e.target.value)
    }
    placeholder={editingMsg ? "Edit message..." : "Type a message..."}
    size="small"
    fullWidth
          sx={{
            zIndex: '1500',
            mr: 1,
            borderRadius: '40px',
            input: {
              color: mode === "dark" ? "#fff" : "#000",
              height: '28px',
              borderRadius: '40px',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#5E5E5E00',
                borderRadius: '40px'
              },
              '&:hover fieldset': {
                borderColor: '#39393900',
                borderRadius: '40px'
              },
              '&.Mui-focused fieldset': {
                borderColor: '#75757500',
                borderRadius: '40px'
              },
            },
            '& .MuiInputBase-input::placeholder': {
              color: mode === "dark" ? "#cccccc" : "#343434ff"
            }
          }}
  />
</Box>

  {editingMsg ? (
    <>
      <Button
        sx={{ backgroundColor: mode === "dark" ? '#430400ff' : '#ffd2cfff', height: '45px', width: '45px', borderRadius: 40, mr: 1 }}
        onClick={() => {
          setEditingMsg(null);
          setEditText("");
        }}
      >
        <CloseIcon sx={{ color: mode === "dark" ? '#ffd2cfff' : '#430400ff' }} />
      </Button> 
      <Button
        sx={{ backgroundColor: mode === "dark" ? '#ffffffff' : "#000000", height: '45px', width: '45px', borderRadius: 40 }}
        onClick={async () => {
          try {
            const msgRef = doc(
              db,
              "groupChat",
              groupName,
              "messages",
              editingMsg.id
            );
            await updateDoc(msgRef, {
              text: editText,
              edited: true,
              timestamp: serverTimestamp(), // optional
            });
            setEditingMsg(null);
            setEditText("");
          } catch (err) {
            console.error("❌ Failed to update message:", err.message);
          }
        }}
      >
        <CheckIcon sx={{ color: mode === "dark" ? '#000' : "#fff" }} />
      </Button>

    </>
  ) : (
    <>
    <Button
      sx={{ backgroundColor: mode === "dark" ? '#ffffffff' : "#000000", height: '45px', width: '54px', borderRadius: 40 }}
      onClick={sendMessage}
    >
      <SendIcon sx={{ color: mode === "dark" ? '#000' : "#fff" }} />
    </Button>
  </>
  )}

  {/* --- More Options Menu --- */}
<Menu
  anchorEl={moreAnchorEl}
  open={Boolean(moreAnchorEl)}
  onClose={() => setMoreAnchorEl(null)}
  PaperProps={{
    sx: {
      bgcolor: mode === "dark" ? "#232323e6" : "#f7f7f7e6",
      color: mode === "dark" ? "#fff" : "#222",
      borderRadius: 3,
      maxWidth: 370,
      minWidth: 260,
      backdropFilter: "blur(24px)",
      boxShadow: mode === "dark" ? "0 8px 32px #000b" : "0 8px 32px #8882",
      p: 1,
      mx: "auto",
      my: 2,
      border: "none",
      transition: "box-shadow 0.3s, background 0.3s",
    }
  }}
  anchorOrigin={{
    vertical: "bottom",
    horizontal: "center"
  }}
  transformOrigin={{
    vertical: "top",
    horizontal: "center"
  }}
>
  <MenuItem
    onClick={async () => {
      const items = await fetchTripTimeline();
      await sendStructuredMessage("Timeline", items);
      setMoreAnchorEl(null);
    }}
    sx={{
      fontWeight: 600,
      fontSize: 16,
      borderRadius: 2,
      mb: 1,
      px: 2,
      py: 1.5,
      color: mode === "dark" ? "#fff" : "#222",
      '&:hover': {
        bgcolor: mode === "dark" ? "#232323" : "#e0e0e0"
      },
      transition: "background 0.2s"
    }}
  >
    📅 Send Timeline
  </MenuItem>
  <MenuItem
    onClick={async () => {
      const items = await fetchTripChecklist();
      await sendStructuredMessage("Checklist", items);
      setMoreAnchorEl(null);
    }}
    sx={{
      fontWeight: 600,
      fontSize: 16,
      borderRadius: 2,
      mb: 1,
      px: 2,
      py: 1.5,
      color: mode === "dark" ? "#fff" : "#222",
      '&:hover': {
        bgcolor: mode === "dark" ? "#232323" : "#e0e0e0"
      },
      transition: "background 0.2s"
    }}
  >
    ✅ Send Checklist
  </MenuItem>
  {/* 
  <MenuItem
    onClick={() => { setShowPollDialog(true); setMoreAnchorEl(null); }}
    sx={{
      fontWeight: 600,
      fontSize: 16,
      borderRadius: 2,
      mb: 1,
      px: 2,
      py: 1.5,
      color: mode === "dark" ? "#fff" : "#222",
      '&:hover': {
        bgcolor: mode === "dark" ? "#232323" : "#e0e0e0"
      },
      transition: "background 0.2s"
    }}
  >
    📊 Create Poll
  </MenuItem>
  */}
</Menu>

<Dialog
  open={showPollDialog}
  onClose={() => setShowPollDialog(false)}
  fullWidth
  maxWidth="sm"
  PaperProps={{
    sx: {
      bgcolor: "#121212",
      borderRadius: 4,
      p: 2
    }
  }}
>
  <DialogTitle sx={{ color: mode === "dark" ? "#fff" : "#000", fontWeight: "bold" }}>
    📊 Create Poll
  </DialogTitle>

  <DialogContent>
    <TextField
      label="Poll Question"
      fullWidth
      value={pollQuestion}
      onChange={(e) => setPollQuestion(e.target.value)}
      variant="outlined"
      sx={{ mb: 3 }}
      InputLabelProps={{ style: { color: '#aaa' } }}
      InputProps={{ style: { color: mode === "dark" ? "#fff" : "#000" } }}
    />

    {pollOptions.map((option, index) => (
      <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <TextField
          fullWidth
          placeholder={`Option ${index + 1}`}
          value={option}
          onChange={(e) => handleOptionChange(index, e.target.value)}
          InputLabelProps={{ style: { color: '#aaa' } }}
          InputProps={{ style: { color: mode === "dark" ? "#fff" : "#000" } }}
        />
        <IconButton
          onClick={() => removeOption(index)}
          disabled={pollOptions.length <= 2}
          sx={{ ml: 1, color: "#ff5555" }}
        >
          <RemoveIcon />
        </IconButton>
      </Box>
    ))}

    <Button
      onClick={addOption}
      startIcon={<AddIcon />}
      sx={{ color: "#00f721" }}
    >
      Add Option
    </Button>
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setShowPollDialog(false)} sx={{ color: "#ccc" }}>
      Cancel
    </Button>
    <Button onClick={handleSendPoll} variant="contained" sx={{ bgcolor: "#00f721", color: "#000" }}>
      Send Poll
    </Button>
  </DialogActions>
</Dialog>

</Box>

    );
  })()}
</Box>

      <GroupInfoDrawer
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        // pass all required props here: groupInfo, user, handlers, mode, etc
        groupInfo={groupInfo}
        groupName="My Group"
        mode="dark"
        createdByUser={createdByUser}
        tripInfo={tripInfo}
        timelineStats={timelineStats}
        memberInfo={memberInfo}
        canEditGroupInfo={true}
        canAddMembers={true}
        currentUser={currentUser}
        user={user}
        handleExitGroup={() => console.log("exit group")}
        handleRemoveMember={(uid) => console.log("remove member", uid)}
        handleUpdateGroupInfo={() => console.log("update")}
        handlePermissionChange={(perm, role) => console.log("perm change", perm, role)}
        toggleAdminStatus={(uid) => console.log("toggle admin", uid)}
        setGroupSettingsOpen={setGroupSettingsOpen}
        groupSettingsOpen={groupSettingsOpen}
        membersDrawerOpen={membersDrawerOpen}
        setMembersDrawerOpen={setMembersDrawerOpen}
        inviteDrawerOpen={inviteDrawerOpen}
        setInviteDrawerOpen={setInviteDrawerOpen}
        setNotification={() => {}}
        notification={null}
        handleShare={() => console.log("share link")}
        addUserDialogOpen={addUserDialogOpen}
        setAddUserDialogOpen={setAddUserDialogOpen}
        searchTerm={""}
        setSearchTerm={() => {}}
        searchLoading={false}
        searchResults={[]}
        selectedUsers={[]}
        setSelectedUsers={() => {}}
        handleBatchAddUsers={() => {}}
      />

      <Box>

</Box>
    </Box>
    </BetaAccessGuard>
    </ThemeProvider>
  );
}

export default GroupChat;