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
  limit
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
  Stack,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  ListItemButton,
  Divider,
  Drawer,
  CircularProgress,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Tooltip,
  Menu,
  InputAdornment,
  Card,
  LinearProgress,
  CardContent,
} from '@mui/material';
import {
  LocationOn, AccessTime,
} from "@mui/icons-material";
import EmojiPicker from 'emoji-picker-react';
import Popover from '@mui/material/Popover';
import { styled } from '@mui/system';
import BetaAccessGuard from "../components/BetaAccessGuard";
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckIcon from '@mui/icons-material/Check';
import RemoveIcon from '@mui/icons-material/Remove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ShareIcon from "@mui/icons-material/Share";
import ReplyIcon from '@mui/icons-material/Reply';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { QRCodeCanvas } from 'qrcode.react';

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
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [replyTo, setReplyTo] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const controls = useAnimation();
  const [user, setUser] = useState(null)
  const [memberInfo, setMemberInfo] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState(null);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [groupIconType, setGroupIconType] = useState(groupInfo?.iconURL?.startsWith("http") ? "image" : "emoji");
  const [groupIconValue, setGroupIconValue] = useState(groupInfo?.iconURL || "");
  const [editingGroupInfo, setEditingGroupInfo] = useState(false);
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
  const [memberSearch, setMemberSearch] = useState("");
  const [searchMembersText, setSearchMembersText] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
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

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (u) => {
    if (u) setUser(u);
    else setUser(null);
  });

  return () => unsubscribe();
}, []);

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

const handleExitGroup = async () => {
  if (!user || !groupName) {
    console.warn("Missing user or groupName", { user, groupName });
    return;
  }

  try {
    const groupRef = doc(db, "groupChats", groupName); // groupName = doc ID
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      console.warn("Group does not exist");
      return;
    }

    const groupData = groupSnap.data();

    // ✅ Prevent exit for system groups
    if (groupData.isSystem) {
      alert("You cannot exit a system group like Beta or Dev Beta.");
      return;
    }

    // ✅ Remove user from group
    await updateDoc(groupRef, {
      members: arrayRemove(user.uid),
    });

    // ✅ Send system message
    await addDoc(collection(db, "groupChat", groupName, "messages"), {
      type: "system",
      content: `${user.displayName || "A user"} left the group.`,
      timestamp: serverTimestamp(),
    });

    console.log("✅ User removed from group.");
    navigate("/chats");
  } catch (err) {
    console.error("❌ Failed to exit group:", err.message);
  }
};


const handleRemoveMember = async (uidToRemove) => {
  if (!groupName || !uidToRemove) return;

  try {
    const groupRef = doc(db, "groupChats", groupName);

    // Step 1: Remove member
    await updateDoc(groupRef, {
      members: arrayRemove(uidToRemove),
    });

    // Step 2: Re-fetch group doc to check members length
    const updatedSnap = await getDoc(groupRef);
    const updatedData = updatedSnap.data();
    const remainingMembers = updatedData.members || [];

    // Step 3: If no members left, delete the group
    if (remainingMembers.length === 0) {
      await deleteDoc(groupRef);
      console.log("Group deleted due to no members remaining.");
      navigate("/chats");
      return;
    }

    // Step 4: Notify removed member in group messages
    await addDoc(collection(db, "groupChat", groupName, "messages"), {
      type: "system",
      content: `${memberInfo[uidToRemove]?.username || "A member"} was removed from the group.`,
      timestamp: serverTimestamp(),
    });

    console.log("Member removed and system message sent.");
  } catch (err) {
    console.error("Failed to remove member or delete group:", err.message);
  }
};

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

const canAddMembers =
  groupInfo?.inviteAccess === "all" ||
  groupInfo?.createdBy === currentUser?.uid ||
  groupInfo?.admins?.includes(currentUser?.uid);

const canEditGroupInfo =
  groupInfo?.editAccess === "all" ||
  groupInfo?.createdBy === currentUser?.uid ||
  groupInfo?.admins?.includes(currentUser?.uid);

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

useEffect(() => {
  const fetchUsers = async () => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);

    try {
      const q = query(collection(db, "users"), limit(50));
      const snapshot = await getDocs(q);

      const results = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const uid = doc.id;

        const isAlreadyInGroup = groupInfo?.members?.includes(uid);
        const alreadyInResults = searchResults.some((u) => u.uid === uid);

        const matchesSearch =
          data.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.email?.toLowerCase().includes(searchTerm.toLowerCase());

        // ✅ Only include if not a group member, matches search, and not already shown
        if (!isAlreadyInGroup && matchesSearch && !alreadyInResults) {
          results.push({ uid, ...data });
        }
      });

      // ✅ Keep previous results to allow stacking
      setSearchResults((prev) => {
        const combined = [...prev, ...results];
        const unique = Object.values(
          combined.reduce((acc, cur) => {
            acc[cur.uid] = cur;
            return acc;
          }, {})
        );
        return unique;
      });
    } catch (err) {
      console.error("Search error:", err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  fetchUsers();
}, [searchTerm, searchResults, groupInfo?.members]);

const handleUpdateGroupInfo = async () => {
  if (!groupName) {
    console.error("❌ No groupName found in URL.");
    return;
  }

  try {
    const groupRef = doc(db, "groupChats", groupName);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      console.error("❌ Group not found.");
      return;
    }

    const oldData = groupSnap.data();

    if (groupIconType === "emoji" && !groupIconValue) {
      alert("Please select an emoji.");
      return;
    }

    const newData = {
      name: groupInfo?.name?.trim() || groupName,
      description: groupInfo?.description?.trim() || "",
      iconURL: groupIconType === "image" ? groupIconValue : "",
      emoji: groupIconType === "emoji" ? groupIconValue : "",
    };

    await updateDoc(groupRef, newData);
    console.log("✅ Group info updated in Firestore.");

    // Get current user details
    const currentUser = auth.currentUser;
    const senderId = currentUser?.uid || "";
    const senderName =
      currentUser?.displayName ||
      currentUser?.email?.split("@")[0] ||
      "Someone";

    // Detect changes
    const changes = [];

    if (oldData.name !== newData.name) {
      changes.push(`renamed the group to "${newData.name}"`);
    }
    if (oldData.description !== newData.description) {
      changes.push("updated the description");
    }
    if (
      oldData.iconURL !== newData.iconURL ||
      oldData.emoji !== newData.emoji
    ) {
      changes.push("updated the group icon");
    }

    // Send system message if changes occurred
    if (changes.length > 0) {
      const messageText = `${senderName} ${changes.join(", ")}.`;

      await addDoc(collection(db, "groupChat", groupName, "messages"), {
        type: "system",
        content: messageText,
        senderId: senderId,
        senderName: senderName,
        timestamp: serverTimestamp(),
      });

      console.log("📢 System message sent:", messageText);
    }

    setEditingGroupInfo(false);
  } catch (err) {
    console.error("❌ Failed to update group info:", err.message);
  }
};

useEffect(() => {
  if (editingGroupInfo && groupInfo) {
    setGroupIconType(groupInfo.iconURL ? "image" : "emoji");
    setGroupIconValue(groupInfo.iconURL || groupInfo.emoji || "💬");
  }
}, [editingGroupInfo, groupInfo]);

const handleGroupIconUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const maxSizeInBytes = 250 * 1024; // 250 KB limit

  if (file.size > maxSizeInBytes) {
    alert("File size too large! Please select an image under 250KB.");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64DataUri = reader.result;
    setGroupIconValue(base64DataUri);  // Store as data URI
    setGroupIconType("image");         // Switch icon type to image
  };
  reader.readAsDataURL(file); // Convert to base64
};

const handlePermissionChange = async (field, value) => {
  const groupRef = doc(db, "groupChats", groupName);
  await updateDoc(groupRef, {
    [field]: value,
  });
};

const toggleAdminStatus = async (uid) => {
  if (!uid) {
    console.error("UID is undefined. Cannot update admin status.");
    return;
  }

  try {
    const groupRef = doc(db, "groupChats", groupName);
    const isAdmin = groupInfo?.admins?.includes(uid);

    await updateDoc(groupRef, {
      admins: isAdmin ? arrayRemove(uid) : arrayUnion(uid),
    });
  } catch (error) {
    console.error("Failed to update admin status:", error.message);
  }
};

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


const handleBatchAddUsers = async () => {
  if (!groupName || selectedUsers.length === 0) return;

  try {
    const user = auth.currentUser;
    const groupRef = doc(db, "groupChats", groupName);

    // Step 1: Add users to Firestore members array
    await updateDoc(groupRef, {
      members: arrayUnion(...selectedUsers),
    });

    // Step 2: Attempt to map selectedUsers to usernames from searchResults
    const localNames = searchResults
      ?.filter(u => u && selectedUsers.includes(u.uid))
      .map(u => u?.username || u?.displayName || u?.email);

    // Step 3: Fallback – fetch missing profiles from Firestore
    const missingUids = selectedUsers.filter(
      uid => !searchResults?.some(u => u?.uid === uid)
    );

    const fetchedNames = [];
    for (const uid of missingUids) {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        fetchedNames.push(data.username || data.displayName || data.email || uid.slice(0, 6));
      } else {
        fetchedNames.push(uid.slice(0, 6));
      }
    }

    const fullNameList = [...(localNames || []), ...fetchedNames];

    // Step 4: Identify the adder
    const addedBy = user?.displayName || user?.email || "Someone";
    const byText = user?.uid === groupInfo?.createdBy ? "You" : addedBy;

    // Step 5: Final message
    const message = `${byText} added ${fullNameList.join(", ")} to the group.`;

    // Step 6: Send system message
    await addDoc(collection(db, "groupChat", groupName, "messages"), {
      type: "system",
      content: message,
      timestamp: serverTimestamp(),
    });

    // Step 7: Reset UI
    setSelectedUsers([]);
    setSearchTerm('');
    setSearchResults([]);
    setAddUserDialogOpen(false);
    console.log("✅ Users added with proper system message.");
  } catch (err) {
    console.error("❌ Failed to add users:", err.message);
  }
};



    useEffect(() => {
      const fetchUsers = async () => {
        if (searchTerm.trim() === '') return setSearchResults([]);
        const usersSnapshot = await getDocs(collection(db, "users"));
        const matches = [];
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          if (
            data.username?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            data.uid !== currentUser.uid &&
            !selectedUsers.some(u => u.uid === data.uid)
          ) {
            matches.push({ ...data, uid: doc.id });
          }
        });
        setSearchResults(matches);
      };
      fetchUsers();
    }, [searchTerm, selectedUsers]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {

    // Realtime listener for messages
    const q = query(
      collection(db, 'groupChat', groupName, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
      setLoading(false);
    });

    // Get group info
    const fetchGroupInfo = async () => {
        try {
          const groupDocRef = doc(db, 'groupChats', groupName);
          const docSnap = await getDoc(groupDocRef);
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
      
            // Fetch member user names
            if (Array.isArray(data.members)) {
              const memberFetches = data.members.map((uid) =>
                getDoc(doc(db, 'users', uid))
              );
              const memberDocs = await Promise.all(memberFetches);
              const memberNames = memberDocs
                .filter((doc) => doc.exists())
                .map((doc) => doc.data());
              setMemberUsers(memberNames);
            }
          }
        } catch (error) {
          console.error('Failed to fetch group info or user details:', error);
        }

      };
  
      fetchGroupInfo();
  
      return () => unsubscribe();
    }, [currentUser, navigate, groupName]);
      
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

const inviteLink = `${window.location.origin}/group-invite/${groupName}`; // or groupInfo.inviteToken

const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Join my group!',
        text: 'Here’s an invite to our group:',
        url: inviteLink
      });
    } catch (err) {
      // handle user cancellation or error
    }
  } else {
    navigator.clipboard.writeText(inviteLink);
    setNotification("📤 Link shared!");
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        sx={{
          flexGrow: 1,
          paddingTop: '60px',
          overflowY: 'auto',
          marginBottom: '0px', // optional if you have a fixed input/footer
          backgroundImage: mode === "dark" ? `url(/assets/images/chatbg/dark.png)` : `url(/assets/images/chatbg/light.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
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
                        borderRadius:msg.senderId === currentUser.uid ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
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
  {msg.text}
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
  {reactionMsg &&
    Object.entries(getGroupedReactions(reactionMsg, allUsers)).map(
      ([emoji, users]) => (
        <MenuItem
          key={emoji}
          onClick={() => {
            const youReacted = users.find(u => u.uid === currentUser.uid);
            if (youReacted) {
              // Remove your own reaction
              handleReaction(emoji, reactionMsg);
              setReactionAnchorEl(null);
              setReactionMsg(null);
            }
          }}sx={{
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
              gap: 0.5,
            }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                {users.map((u) => (
                  <Tooltip title={u.name} key={u.uid}>
                    <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                        <Avatar
                          src={u.photoURL || ""}
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
                          />
{users.map((u) => (
  <Box key={u.uid} sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
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
                  >{u.uid === currentUser.uid ? 'You' : u.name}</Typography>
    
    {u.uid === currentUser?.uid && (
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
))}
                      </Box>
                  </Tooltip>
                ))}
            <Typography variant="body1">{emoji}</Typography>
          </Box>
        </MenuItem>
      )
    )}

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
    justifyContent: "space-around",
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

      <Box>
  {profileOpen && (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <Drawer
        anchor="bottom"
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onOpen={() => {}}
        onDragEnd={(e, data) => {
          // Close the profile if dragged down enough (e.g., 100px)
          if (data.offset.y > 100) {
            setProfileOpen(false);
          }
        }}
        PaperProps={{
          sx: {
            height: '100vh',
            backgroundColor: mode === "dark" ? '#0c0c0c' : "#f1f1f1",
            backdropFilter: 'blur(40px)',
            color: mode === "dark" ? '#fff' : "#000",
            boxShadow: 'none',
            transition: 'transform 0.3s ease', // Ensure smooth transition on open/close
          },
        }}
        disableSwipeToOpen={false}
        sx={{
          '& .MuiDrawer-paper': {
            transition: 'transform 0.3s ease', // Smooth transition while dragging
          },
        }}
      >
        <Box sx={{ p: 3, height: '100%', position: "relative", overflowY: 'auto' }}>

        <Box display="flex" alignItems="center">
          <IconButton
            onClick={() => setProfileOpen(false)}
            sx={{ color: mode === "dark" ? "#ccc" : "#000" }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" color={ mode === "dark" ? "#ccc" : "#000" }>
            Group Info
          </Typography>
        </Box>


          {/* Profile Content */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', mt: 6 }}>
<Avatar
  src={groupInfo.iconURL ? groupInfo.iconURL : ""}
  sx={{
    width: 100,
    height: 100,
    fontSize: '48px',
    mb: 2,
    boxShadow: '0 0 15px rgba(26, 26, 26, 0.37)',
    backgroundColor: '#232323',
    color: mode === "dark" ? "#fff" : "#000",
  }}
>
  {/* Only show emoji fallback if no image */}
  {(groupInfo.iconURL || groupInfo.emoji || groupInfo.name?.[0]?.toUpperCase() || 'G')}
</Avatar>


            <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                color: '#00f721',
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
<Box width={"90vw"}>
  
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
                mt: 2,
                mb: 2,
                px: 1.5,
                py: 0.5,
                borderRadius: 3,
                boxShadow: "none",
              }}
            >
{groupInfo.description && (
  <Typography
    variant="body2"
    sx={{
      color: mode === "dark" ? "#ccc" : "#000",
      mt: 0.5,
      whiteSpace: 'pre-wrap', // ✅ preserves \n line breaks and spaces
      wordBreak: 'break-word',
    }}
  >
    {groupInfo.description}
  </Typography>
)}

              {createdByUser && (
                <Typography variant="caption" sx={{ color: mode === "dark" ? "#bbb" : "#333", mb: 1 }}>
                  Created by <strong>{createdByUser.name}</strong>
                </Typography>
              )}
            </Box>

{tripInfo && (
  <Card
    sx={{
      background: `url(${groupInfo.iconURL})`,
      backgroundSize: "cover",
      backgroundColor: mode === "dark" ? "#f1f1f101" : "#e0e0e0",
      backgroundPosition: "center",
      color: mode === "dark" ? "#fff" : "#000",
      borderRadius: 3,
      boxShadow: "none",
    }}
  >

    <CardContent sx={{ backdropFilter: "blur(20px)" }}>
    <Box display="flex" alignItems="start" gap={2} mb={1}>  
      <Box>
        <Typography variant="h6" sx={{ color: "#ffffffff", fontWeight: 800, mb: 1 }}>
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
    </CardContent>
  </Card>
)}

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  mt: 2,
                  mx: "auto",
                  boxShadow: "none",
                }}
              >
                {canEditGroupInfo && (
                    <Button
                      variant="contained"
                      onClick={() => setEditingGroupInfo(true)}
                      sx={{
                        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0", color: mode === "dark" ? "#fff" : "#000", borderRadius: 3, boxShadow: "none", py: 1.4, px: 2, display: "flex", alignItems: "center", justifyContent: "left", gap: 1.5
                      }}
                    >
                    <EditIcon sx={{ fontSize: 24 }} />
                    <Typography variant="body1" sx={{ fontSize: 16 }}>
                      Edit Group Info
                    </Typography>
                    </Button>
                )}

                {(groupInfo?.createdBy === currentUser.uid || groupInfo?.admins?.includes(currentUser.uid)) && (
                  <Button
                    variant="contained"
                    onClick={() => setGroupSettingsOpen(true)}
                    sx={{
                        backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0", color: mode === "dark" ? "#fff" : "#000", borderRadius: 3, boxShadow: "none", py: 1.4, px: 2, display: "flex", alignItems: "center", justifyContent: "left", gap: 1.5
                    }}
                  >
                    <SettingsOutlinedIcon sx={{ fontSize: 24 }} />
                    <Typography variant="body1" sx={{ fontSize: 16 }}>
                      Group Settings
                    </Typography>
                  </Button>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  alignContent: "left",
                  backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e020",
                  p: 1,
                  mt: 2,
                  borderRadius: 3
                }}
              >
             <Typography
              variant="body2"
              sx={{
                color: mode === "dark" ? "#a5a5a5ff" : "#4f4f4fff",
                fontWeight: 500,
                p: 1
              }}
            >
              {groupInfo.members?.length || 0} Members
            </Typography>

{canAddMembers && (
  <Button
    variant="contained"
    onClick={() => setInviteDrawerOpen(true)}
    sx={{ mt: 0, backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0", boxShadow: "none", color: mode === "dark" ? "#fff" : "#000", justifyContent: "left", alignItems: "center", borderRadius: 2, gap: 1, px: 1, display: "flex" }}
  >
    <AddIcon sx={{ backgroundColor: mode === "dark" ? "#fff" : "#000", color: mode === "dark" ? "#000" : "#fff", padding: 1, borderRadius: 8 }} />
     Add Members
  </Button>
)}


            {/* Members List */}
<List sx={{ width: '100%', maxHeight: '60vh', overflowY: 'auto' }}>
  <Stack spacing={1} sx={{ mt: 0 }}>
    {(groupInfo.members || []).slice(0, 5).map(memberUid => {
      const member = memberInfo[memberUid];
      const isOwner = memberUid === groupInfo?.createdBy;
      const isAdmin = Array.isArray(groupInfo?.admins) && groupInfo.admins.includes(memberUid);

      return (
        <Box
          key={memberUid}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ background: "#f1f1f111", p: 1, borderRadius: 2 }}
        >
          <Box display="flex" alignItems="center" gap={1} onClick={() => window.location.href=`/chat/${memberUid}`}>
            <Avatar src={member?.photoURL} sx={{ width: 40, height: 40, mr: 1 }} />
            <Box>
              <Typography variant='body1'>
                {member?.name || memberUid.slice(0, 6)}
                {isOwner && (
                  <Chip label="Admin" size="small" sx={{ ml: 1, background: mode === "dark" ? "#ffffff36" : "#00000036", color: mode === "dark" ? "#fff" : "#000", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 1.5 }} />
                )}
                {isAdmin && !isOwner && (
                  <Chip label="Admin" size="small" sx={{ ml: 1, background: mode === "dark" ? "#ffffff36" : "#00000036", color: mode === "dark" ? "#fff" : "#000", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 1.5 }} />
                )}
              </Typography>
              <Typography variant='body2'>{member?.username || memberUid.slice(0, 6)}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Call">
              {member?.mobile ? (
                <IconButton
                  onClick={() => window.open(`tel:${member.mobile}`, '_self')}
                  sx={{ color: mode === "dark" ? "#fff" : "#000", backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0", padding: 1 }}
                >
                  <PhoneOutlinedIcon />
                </IconButton>
              ) : null}
            </Tooltip>
            {(groupInfo?.createdBy === user?.uid || (groupInfo?.admins || []).includes(user?.uid)) &&
              memberUid !== groupInfo?.createdBy &&
              !(groupInfo?.admins || []).includes(memberUid) &&
              memberUid !== user?.uid && (
                <Tooltip title="Remove User From Group">
                  <IconButton
                    onClick={() => {
                      setSelectedMemberToRemove(memberUid);
                      setConfirmDialogOpen(true);
                    }}
                    sx={{ color: mode === "dark" ? "#ffbbbb" : "#ff3333ff", backgroundColor: "#ff000020", padding: 1 }}
                  >
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                </Tooltip>
            )}
          </Box>
        </Box>
      )
    })}
    {groupInfo.members?.length > 5 && (
        <Button
          variant="contained"
          size="small"
          sx={{ mt: 2, height: 50, px: 2, backgroundColor: mode === "dark" ? "#f1f1f124" : "#13131324", boxShadow: "none", color: mode === "dark" ? "#fff" : "#000", justifyContent: "space-between", alignItems: "center", borderRadius: 2.5, gap: 1, display: "flex" }}
          onClick={() => setMembersDrawerOpen(true)}
        >
          <Typography variant='body1'>
            View More ({groupInfo.members.length})
          </Typography>
          <ArrowForwardIosIcon sx={{ fontSize: 15 }} />
        </Button>
    )}
  </Stack>
</List>


 </Box>
 
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  mt: 2,
                  mx: "auto"
                }}
              >
                {(!user || !groupName) ? (
                  <Typography>Loading group...</Typography>
                ) : (
                  <Button
                    sx={{
                      backgroundColor: mode === "dark" ? "#f1f1f111" : "#ff000010",
                      color: '#ff6767',
                      fontSize: 16,
                      borderRadius: 3,
                      py: 1.4,
                      px: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "left",
                      gap: 1.5
                    }}
                    justifyContent={"left"} 
                    onClick={handleExitGroup}
                  >
                    <ExitToAppOutlinedIcon />
                    Exit Group
                  </Button>
                )}
              </Box>
</Box>

<Dialog
  open={confirmDialogOpen}
  onClose={() => setConfirmDialogOpen(false)}
  PaperProps={{
    sx: {
      bgcolor: mode === "dark" ? "#00000061" : "#f1f1f161",
      color: mode === "dark" ? "#fff" : "#222",
      backdropFilter: "blur(20px)",
      borderRadius: 4,
      boxShadow: mode === "dark" ? "0 8px 32px #000b" : "0 8px 32px #8882",
      p: 2,
      minWidth: 320,
      maxWidth: 400,
    }
  }}
>
  <DialogTitle sx={{
    color: mode === "dark" ? "#ff4444" : "#d32f2f",
    fontWeight: 700,
    fontSize: 20,
    textAlign: "center",
    pb: 1,
    letterSpacing: 1,
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
  }}>
    <RemoveCircleOutlineIcon sx={{ mr: 1, color: mode === "dark" ? "#ff4444" : "#d32f2f" }} />
    Remove Member
  </DialogTitle>
  <DialogContent sx={{ textAlign: "center", py: 2 }}>
    <Typography sx={{
      color: mode === "dark" ? "#fff" : "#222",
      fontSize: 16,
      mb: 2,
    }}>
      Are you sure you want to remove this member from the group?
    </Typography>
    <Typography variant="caption" sx={{ color: mode === "dark" ? "#9b9b9bff" : "#333" }}>
      This action cannot be undone.
    </Typography>
  </DialogContent>
  <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
    <Button
      onClick={() => setConfirmDialogOpen(false)}
      variant="outlined"
      sx={{
        color: mode === "dark" ? "#fff" : "#222",
        borderColor: mode === "dark" ? "#555" : "#ccc",
        fontWeight: 600,
        px: 3,
        borderRadius: 8,
        mr: 1,
        backgroundColor: mode === "dark" ? "#23232300" : "#f7f7f700",
        "&:hover": {
          backgroundColor: mode === "dark" ? "#333" : "#e0e0e0"
        }
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={async () => {
        await handleRemoveMember(selectedMemberToRemove);
        setConfirmDialogOpen(false);
      }}
      color="error"
      variant="contained"
      sx={{
        fontWeight: 700,
        px: 3,
        borderRadius: 8,
        bgcolor: "#ff4444",
        color: mode === "dark" ? "#fff" : "#000",
        boxShadow: "none",
        "&:hover": {
          bgcolor: "#d32f2f"
        }
      }}
    >
      Remove
    </Button>
  </DialogActions>
</Dialog>

          </Box>

<SwipeableDrawer
  anchor="bottom"
  open={inviteDrawerOpen}
  onClose={() => setInviteDrawerOpen(false)}
  onOpen={() => {}} // Required for SwipeableDrawer
  PaperProps={{
    sx: {
      p: { xs: 2, sm: 3 },
      bgcolor: mode === "dark" ? "#18181821" : "#f7f7f7",
      backdropFilter: "blur(80px)",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      boxShadow: "0 -2px 20px rgba(0,0,0,0.6)",
      minHeight: "40vh",
      maxWidth: 420,
      mx: "auto",
    },
  }}
>
  <Box
    sx={{
      width: 40,
      height: 5,
      backgroundColor: "#8b8b8bff",
      borderRadius: 3,
      mx: "auto",
      mb: 2,
      opacity: 0.7,
    }}
  />
  <Typography variant="h6" sx={{ color: mode === "dark" ? "#fff" : "#222", mb: 2, textAlign: "center", fontWeight: 700 }}>
    Invite to Group
  </Typography>

  <Button
    variant="contained"
    onClick={() => setAddUserDialogOpen(true)}
    fullWidth
    sx={{
      mt: 0,
      backgroundColor: mode === "dark" ? "#23232331" : "#e0e0e031",
      boxShadow: "none",
      color: mode === "dark" ? "#fff" : "#222",
      justifyContent: "left",
      alignItems: "center",
      borderRadius: 3,
      gap: 1.5,
      px: 2,
      py: 1.2,
      fontWeight: 600,
      fontSize: 16,
      mb: 2,
      "&:hover": {
        backgroundColor: mode === "dark" ? "#333" : "#f1f1f1"
      }
    }}
  >
    <PersonAddIcon sx={{ backgroundcolor: mode === "dark" ? "#fff" : "#000", color: "#000", padding: 1, borderRadius: 8 }} />
    Add Members
  </Button>

  <Divider sx={{ my: 2, borderColor: "#444", color: "#aaa" }}>
    Or add members directly
  </Divider>

  <Box
    sx={{
      mb: 4,
      backgroundColor: mode === "dark" ? "#23232331" : "#f1f1f131",
      color: mode === "dark" ? "#fff" : "#222",
      borderRadius: 3,
      gap: 1,
      px: 2,
      py: 1.5,
      display: "flex",
      alignItems: "center",
      boxShadow: "none",
    }}
  >
    <TextField
      value={inviteLink}
      fullWidth
      variant="standard"
      InputProps={{
        disableUnderline: true,
        sx: { color: mode === "dark" ? "#fff" : "#222", fontSize: 18 },
        endAdornment: (
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              setNotification("🔗 Invite link copied!");
            }}
            sx={{
              backgroundColor: mode === "dark" ? "#232323" : "#e0e0e0",
              color: mode === "dark" ? "#fff" : "#222",
              ml: 1,
              borderRadius: 8,
              "&:hover": {
                backgroundColor: mode === "dark" ? "#333" : "#f1f1f1"
              }
            }}
          >
            <ContentCopyIcon />
          </IconButton>
        ),
      }}
    />
  </Box>

  <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
    <Box sx={{ p: 2, backgroundcolor: mode === "dark" ? "#fff" : "#000", borderRadius: 3, boxShadow: "none" }}>
      <QRCodeCanvas value={inviteLink} size={180} />
    </Box>
  </Box>

  <Button
    variant="contained"
    onClick={handleShare}
    fullWidth
    sx={{
      bgcolor: mode === "dark" ? "#fff" : "#000",
      color: mode === "dark" ? "#000" : "#fff",
      fontWeight: 700,
      borderRadius: 2,
      py: 1.2,
      mb: 2,
      fontSize: 16,
      boxShadow: "none",
    }}
  >
    <ShareIcon sx={{ mr: 1, fontSize: 18 }} /> Share Invite Link
  </Button>

  <Snackbar
    open={Boolean(notification)}
    autoHideDuration={2500}
    onClose={() => setNotification(null)}
    message={notification}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    ContentProps={{
      sx: {
        bgcolor: mode === "dark" ? "#232323" : "#fff",
        color: mode === "dark" ? "#fff" : "#000",
        fontSize: 14,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        boxShadow: "none",
      },
    }}
  />
</SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={membersDrawerOpen}
  onClose={() => setMembersDrawerOpen(false)}
  PaperProps={{
    sx: {
      p: { xs: 2, sm: 3 },
      backgroundColor: mode === "dark" ? "#181818f2" : "#f7f7f7f2",
      color: mode === "dark" ? "#fff" : "#222",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      boxShadow: "0 -2px 20px rgba(0,0,0,0.18)",
      minHeight: "60vh",
      maxHeight: "80vh",
      mx: "auto",
      transition: "background 0.3s",
      backdropFilter: "blur(60px)",
    },
  }}
>
  <Box>
    <Box
      sx={{
        width: 40,
        height: 5,
        backgroundColor: mode === "dark" ? "#888" : "#bbb",
        borderRadius: 3,
        mx: "auto",
        mb: 2,
        opacity: 0.7,
      }}
    />
    <Typography
      variant="h6"
      sx={{
        mb: 2,
        textAlign: "center",
        fontWeight: 700,
        letterSpacing: 1,
        color: mode === "dark" ? "#fff" : "#222",
      }}
    >
      All Group Members
    </Typography>
    <TextField
      fullWidth
      placeholder="Search member"
      value={memberSearch}
      onChange={e => setMemberSearch(e.target.value)}
      sx={{
        mb: 2,
        input: { color: mode === "dark" ? "#fff" : "#222" },
        label: { color: "#ccc" },
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#555' },
          '&:hover fieldset': { borderColor: '#888' },
          '&.Mui-focused fieldset': { borderColor: '#00f721' },
        },
        borderRadius: 2,
        backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#777" }} />
          </InputAdornment>
        ),
      }}
    />
  </Box>

  <List sx={{
    maxHeight: "60vh",
    overflowY: "auto",
    px: 1,
    py: 1,
    borderRadius: 3,
    backgroundColor: mode === "dark" ? "#23232322" : "#f1f1f122",
    boxShadow: "none",
  }}>
    <Stack spacing={1}>
      {(groupInfo.members || [])
        .filter(uid => {
          const m = memberInfo[uid];
          if (!m) return false;
          if (!memberSearch.trim()) return true;
          const low = memberSearch.toLowerCase();
          return (
            (m.name?.toLowerCase().includes(low)) ||
            (m.username?.toLowerCase().includes(low)) ||
            uid.toLowerCase().includes(low)
          );
        })
        .map(memberUid => {
          const member = memberInfo[memberUid];
          const isOwner = memberUid === groupInfo?.createdBy;
          const isAdmin = Array.isArray(groupInfo?.admins) && groupInfo.admins.includes(memberUid);
          return (
            <Box
              key={memberUid}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                background: mode === "dark" ? "#23232344" : "#f1f1f144",
                p: 1.2,
                borderRadius: 2,
                boxShadow: "0 1px 6px #0001",
                transition: "background 0.2s",
                "&:hover": {
                  background: mode === "dark" ? "#23232388" : "#e0e0e088",
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} sx={{ cursor: "pointer" }} onClick={() => window.location.href=`/chat/${memberUid}`}>
                <Avatar src={member?.photoURL} sx={{
                  width: 40,
                  height: 40,
                  mr: 1,
                  boxShadow: "0 2px 8px #0002",
                  border: mode === "dark" ? "2px solid #444" : "2px solid #eee",
                }} />
                <Box>
                  <Typography variant='body1' sx={{ fontWeight: 600, color: mode === "dark" ? "#fff" : "#222" }}>
                    {member?.name || memberUid.slice(0, 6)}
                    {isOwner && (
                      <Chip label="Owner" size="small" sx={{ ml: 1, background: "#00f72144", color: mode === "dark" ? "#fff" : "#000", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 1 }} />
                    )}
                    {isAdmin && !isOwner && (
                      <Chip label="Admin" size="small" sx={{ ml: 1, background: mode === "dark" ? "#ffffff36" : "#00000036", color: mode === "dark" ? "#fff" : "#000", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 1 }} />
                    )}
                  </Typography>
                  <Typography variant='body2' sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>{member?.username || memberUid.slice(0, 6)}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Tooltip title="Call">
                  {member?.mobile ? (
                    <IconButton
                      onClick={() => window.open(`tel:${member.mobile}`, '_self')}
                      sx={{
                        color: mode === "dark" ? "#fff" : "#000",
                        backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
                        padding: 1,
                        borderRadius: 2,
                        "&:hover": {
                          backgroundColor: mode === "dark" ? "#333" : "#e0e0e0",
                        }
                      }}
                    >
                      <PhoneOutlinedIcon />
                    </IconButton>
                  ) : null}
                </Tooltip>
                {(groupInfo?.createdBy === user?.uid || (groupInfo?.admins || []).includes(user?.uid)) &&
                  memberUid !== groupInfo?.createdBy &&
                  !(groupInfo?.admins || []).includes(memberUid) &&
                  memberUid !== user?.uid && (
                    <Tooltip title="Remove User From Group">
                      <IconButton
                        onClick={() => {
                          setSelectedMemberToRemove(memberUid);
                          setConfirmDialogOpen(true);
                        }}
                        sx={{
                          color: mode === "dark" ? "#ffbbbb" : "#ff4747ff",
                          backgroundColor: "#ff000030",
                          padding: 1,
                          borderRadius: 2,
                          "&:hover": {
                            backgroundColor: "#ff4444",
                            color: mode === "dark" ? "#fff" : "#000",
                          }
                        }}
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                )}
              </Box>
            </Box>
          )
        })}
      {groupInfo.members?.length === 0 && (
        <Typography sx={{ color: "#aaa", mt: 2, textAlign: "center", fontStyle: "italic" }}>
          No members
        </Typography>
      )}
    </Stack>
  </List>
  <Box textAlign="center" mt={2}></Box>
</SwipeableDrawer>

<Drawer
  anchor="bottom"
  open={groupSettingsOpen}
  onClose={() => setGroupSettingsOpen(false)}
  PaperProps={{
    sx: {
      p: { xs: 3, sm: 4 },
      backgroundColor: mode === "dark" ? "#181818f2" : "#f7f7f7f2",
      color: mode === "dark" ? "#fff" : "#222",
      boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
      maxWidth: 480,
      mx: "auto",
      height: "95vh",
      backdropFilter: "blur(60px)",
      transition: "background 0.3s",
    },
  }}
>
  <Box display="flex" flexDirection="column" gap={3} maxHeight="93vh" overflowY="auto" mb={2}>
    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
      <IconButton onClick={() => setGroupSettingsOpen(false)} sx={{ color: mode === "dark" ? "#fff" : "#000", mr: 1 }}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" sx={{ fontWeight: "bold", letterSpacing: 1 }}>
        Group Settings
      </Typography>
    </Box>

    {/* Section: Permission Toggles */}
    <Box sx={{
      p: 2,
      boxShadow: "none",
      mb: 2,
    }}>
      <Typography variant="h6" sx={{ mb: 2, color: mode === "dark" ? "#fff" : "#222", fontWeight: 700 }}>
        Permissions
      </Typography>
      <Stack spacing={3}>
        {/* Edit Access Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? "#ccc" : "#555", fontWeight: 600 }}>
            Who can edit group info?
          </Typography>
          <Stack direction="row" spacing={2}>
            {["admin", "all"].map((role) => (
              <Button
                key={role}
                variant={groupInfo?.editAccess === role ? "contained" : "outlined"}
                onClick={() => handlePermissionChange("editAccess", role)}
                sx={{
                  color: groupInfo?.editAccess === role ? mode === "dark" ? "#000" : "#fff" :  mode === "dark" ? "#fff" : "#000",
                  backgroundColor: groupInfo?.editAccess === role ?  mode === "dark" ? "#fff" : "#000" : "transparent",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  borderRadius: 8,
                  boxShadow: "none",
                  border: groupInfo?.editAccess === role ? "none" : "1.5px solid #555",
                  "&:hover": {
                    backgroundColor: groupInfo?.editAccess === role ? "#e0e0e0" : "#23232344",
                    boxShadow: "none",
                  },
                  transition: "background 0.2s",
                }}
              >
                {role === "admin" ? "Admins Only" : "All Members"}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Invite Access Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? "#ccc" : "#555", fontWeight: 600 }}>
            Who can add members?
          </Typography>
          <Stack direction="row" spacing={2}>
            {["admin", "all"].map((role) => (
              <Button
                key={role}
                variant={groupInfo?.inviteAccess === role ? "contained" : "outlined"}
                onClick={() => handlePermissionChange("inviteAccess", role)}
                sx={{
                  color: groupInfo?.inviteAccess === role ? mode === "dark" ? "#000" : "#fff" :  mode === "dark" ? "#fff" : "#000",
                  backgroundColor: groupInfo?.inviteAccess === role ?  mode === "dark" ? "#fff" : "#000" : "transparent",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  borderRadius: 8,
                  boxShadow: "none",
                  border: groupInfo?.inviteAccess === role ? "none" : "1.5px solid #555",
                  "&:hover": {
                    backgroundColor: groupInfo?.inviteAccess === role ? "#e0e0e0" : "#23232344",
                    boxShadow: "none",
                  },
                  transition: "background 0.2s",
                }}
              >
                {role === "admin" ? "Admins Only" : "All Members"}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Send Messages Access Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? "#ccc" : "#555", fontWeight: 600 }}>
            Who can send messages?
          </Typography>
          <Stack direction="row" spacing={2}>
            {["admin", "all"].map((role) => (
              <Button
                key={role}
                variant={groupInfo?.sendAccess === role ? "contained" : "outlined"}
                onClick={() => handlePermissionChange("sendAccess", role)}
                sx={{
                  color: groupInfo?.sendAccess === role ? mode === "dark" ? "#000" : "#fff" :  mode === "dark" ? "#fff" : "#000",
                  backgroundColor: groupInfo?.sendAccess === role ?  mode === "dark" ? "#fff" : "#000" : "transparent",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  borderRadius: 8,
                  boxShadow: "none",
                  border: groupInfo?.sendAccess === role ? "none" : "1.5px solid #555",
                  "&:hover": {
                    backgroundColor: groupInfo?.sendAccess === role ? "#e0e0e0" : "#23232344",
                    boxShadow: "none",
                  },
                  transition: "background 0.2s",
                }}
              >
                {role === "admin" ? "Admins Only" : "All Members"}
              </Button>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>

    {/* Section: Member List and Admin Toggle */}
    <Box mt={3} mb={3} sx={{
      background: mode === "dark" ? "#23232344" : "#f1f1f144",
      borderRadius: 3,
      p: 2,
      boxShadow: "none",
    }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: mode === "dark" ? "#fff" : "#222" }}>
          Members & Admins
        </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{
            color: mode === "dark" ? "#fff" : "#000",
            backgroundColor: "#23232348",
            display: "flex",
            alignItems: "center",
            borderRadius: 2,
            boxShadow: "none",
            px: 2,
            py: 0.5,
            fontWeight: 600,
          }}
          onClick={() => setShowSearchBar(prev => !prev)}
        >
          {showSearchBar ? <CloseIcon sx={{ fontSize: "18px", mr: 1 }} /> : <SearchIcon sx={{ fontSize: "18px", mr: 1 }} />}
          {showSearchBar ? "Hide" : "Search"}
        </Button>
      </Box>

      {showSearchBar && (
        <TextField
          placeholder="Search members by name or email..."
          value={searchMembersText}
          onChange={(e) => setSearchMembersText(e.target.value)}
          size="small"
          fullWidth
          sx={{
            mb: 2,
            input: { color: mode === "dark" ? "#fff" : "#000" },
            '& label': { color: '#ccc' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#555' },
              '&:hover fieldset': { borderColor: '#888' },
            },
            borderRadius: 4,
            backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#777" }} />
              </InputAdornment>
            ),
          }}
        />
      )}

      <Stack spacing={1} sx={{ maxHeight: "47vh", overflowY: "auto" }}>
        {(groupInfo?.members || [])
          .filter((uid) => {
            const m = memberInfo[uid];
            if (!searchMembersText) return true;
            const search = searchMembersText.toLowerCase();
            return (
              m?.name?.toLowerCase().includes(search) ||
              m?.email?.toLowerCase().includes(search) ||
              m?.username?.toLowerCase().includes(search)
            );
          })
          .map((uid) => {
            const member = memberInfo[uid];
            const isCreator = uid === groupInfo?.createdBy;
            const isAdmin = (groupInfo?.admins || []).includes(uid);
            const canChangeRole =
              !isCreator &&
              (groupInfo?.createdBy === currentUser?.uid ||
                (groupInfo?.admins || []).includes(currentUser?.uid));

            return (
              <Paper
                elevation={0}
                key={uid}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: mode === "dark" ? "#23232344" : "#f1f1f144",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  boxShadow: "0 1px 6px #0001",
                  transition: "background 0.2s",
                  "&:hover": {
                    background: mode === "dark" ? "#23232388" : "#e0e0e088",
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar src={member?.photoURL} sx={{
                    bgcolor: "#232323",
                    color: mode === "dark" ? "#fff" : "#000",
                    width: 40,
                    height: 40,
                    fontWeight: 700,
                    fontSize: 20,
                    boxShadow: "0 2px 8px #0002",
                    border: mode === "dark" ? "2px solid #444" : "2px solid #eee",
                  }}>
                    {member?.name?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: mode === "dark" ? "#fff" : "#222" }}>
                      {member?.name || member?.email}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#aaa" }}>
                      {member?.username || ""}
                    </Typography>
                  </Box>
                </Box>

                {canChangeRole ? (
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={isAdmin ? "admin" : "member"}
                      onChange={e => toggleAdminStatus(uid)}
                      sx={{
                        bgcolor: "transparent",
                        color: isAdmin ?  mode === "dark" ? "#fff" : "#000" :  mode === "dark" ? "#ccc" : "#555",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        borderRadius: 3,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: "#555"
                        }
                      }}
                      MenuProps={{
                        PaperProps: { sx: { bgcolor:  mode === "dark" ? "#000" : "#fff", color: mode === "dark" ? "#fff" : "#000", borderRadius: 3 } }
                      }}
                    >
                      <MenuItem value="member">Member</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={isCreator ? "Owner" : "Member"}
                    size="small"
                    sx={{
                      bgcolor: isAdmin ? "#00f72144" : mode === "dark" ? "#ffffff44" : "#00000044",
                      color: mode === "dark" ? "#fff" : "#000",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      borderRadius: 1,
                    }}
                  />
                )}
              </Paper>
            );
          })}
      </Stack>
    </Box>
  </Box>
</Drawer>

<SwipeableDrawer
  anchor="bottom"
  open={editingGroupInfo}
  onClose={() => setEditingGroupInfo(false)}
  PaperProps={{
    sx: {
      p: 3,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      background: mode === "dark" ? "#111" : "#f1f1f1",
      color: mode === "dark" ? "#fff" : "#000",
    },
  }}
>
  <Typography variant="h6" sx={{ mb: 2 }}>
    Edit Group Details
  </Typography>

{/* Group Name */}
<TextField
  label="Group Name"
  fullWidth
  value={groupInfo?.name || ""}
  onChange={(e) =>
    setGroupInfo((prev) => ({ ...prev, name: e.target.value }))
  }
  sx={{ mb: 2, input: { color: mode === "dark" ? "#fff" : "#000" }, label: { color: mode === "dark" ? "#ccc" : "#555" } }}
/>

{/* Preview */}
<Box display="flex" justifyContent="center" mb={2}>
  {groupIconType === "emoji" ? (
    <Avatar sx={{ width: 80, height: 80, fontSize: 40, bgcolor: "#232323" }}>
      {groupIconValue || "📍"}
    </Avatar>
  ) : (
    <Avatar
      src={groupIconValue}
      sx={{ width: 80, height: 80, fontSize: 40, bgcolor: "#232323" }}
    />
  )}
</Box>

{/* Icon Type Toggle */}
<FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel sx={{ color: mode === "dark" ? "#ccc" : "#555" }}>Icon Type</InputLabel>
  <Select
    value={groupIconType}
    onChange={(e) => setGroupIconType(e.target.value)}
    sx={{ color: mode === "dark" ? "#fff" : "#000" }}
  >
    <MenuItem value="emoji">Emoji</MenuItem>
    <MenuItem value="image">Image URL</MenuItem>
  </Select>
</FormControl>

{/* Icon Selector */}
{groupIconType === "emoji" ? (
  <>
    <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? "#ccc" : "#555" }}>
      Choose an Emoji
    </Typography>
    <Grid container spacing={1} sx={{ mb: 2 }}>
      {["😀", "😎", "🔥", "🎉", "🚀", "🌍", "📚", "🧠", "🧳", "🍕", "🎮", "🏖️"].map(
        (emoji) => (
          <Grid item xs={3} sm={2} key={emoji}>
            <Button
              variant={groupIconValue === emoji ? "contained" : "outlined"}
              onClick={() => setGroupIconValue(emoji)}
              sx={{
                fontSize: 24,
                width: "100%",
                aspectRatio: "1",
                color: groupIconValue === emoji ? "#000" : "#fff",
                backgroundColor:
                  groupIconValue === emoji ? "#ffffffff20" : "#23232349",
                borderColor: "#555",
                borderRadius: 2,
              }}
            >
              {emoji}
            </Button>
          </Grid>
        )
      )}
    </Grid>
  </>
) : (
  <Box sx={{ mb: 2 }}>
    <TextField
      label="Image URL or Uploaded Image"
      value={groupIconValue}
      onChange={(e) => setGroupIconValue(e.target.value)}
      fullWidth
      sx={{ mb: 1, input: { color: mode === "dark" ? "#fff" : "#000" }, label: { color: mode === "dark" ? "#ccc" : "#555" } }}
    />

    <Button
      variant="contained"
      component="label"
      sx={{
        mt: 1,
        color: mode === "dark" ? "#fff" : "#000",
        background:"#f1f1f111",
        borderColor: "#f1f1f151",
        fontWeight: 600,
        textTransform: "none",
      }}
    >
      📁 Select Image
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={handleGroupIconUpload}
      />
    </Button>

    <Typography
      variant="caption"
      sx={{ color: "#888", mt: 1, display: "block" }}
    >
      Only images under 250KB allowed.
    </Typography>
  </Box>
)}

{/* Group Description */}
<TextField
  label="Group Description"
  fullWidth
  multiline
  rows={3}
  value={groupInfo?.description || ""}
  onChange={(e) =>
    setGroupInfo((prev) => ({ ...prev, description: e.target.value }))
  }
  sx={{ mb: 3, input: { color: mode === "dark" ? "#fff" : "#000" }, label: { color: mode === "dark" ? "#ccc" : "#555" } }}
/>


  {/* Buttons */}
  <Box display="flex" justifyContent="space-between" gap={2}>
    <Button
      variant="outlined"
      onClick={() => setEditingGroupInfo(false)}
      sx={{
        flex: 1,
        color: mode === "dark" ? "#fff" : "#000",
        borderColor: "#666",
        fontWeight: 500,
        backgroundColor: mode === "dark" ? "#0c0c0c" : "#f1f1f1",
        borderRadius: 8,
      }}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={handleUpdateGroupInfo}
      sx={{
        flex: 1,
        bgcolor: mode === "dark" ? "#ffffffff" : "#000000",
        color: mode === "dark" ? "#000" : "#fff",
        fontWeight: 600,
        borderRadius: 8,
      }}
    >
      Save Changes
    </Button>
  </Box>
</SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={addUserDialogOpen}
  onClose={() => {
    setAddUserDialogOpen(false);
    setSelectedUsers([]);
    setSearchTerm('');
  }}
  sx={{ maxWidth: 470 }}
  PaperProps={{
    sx: {
      height: '85vh',
      width: "91vw",
      borderTopRightRadius: 24,
      borderTopLeftRadius: 24,
      backgroundColor: '#111',
      color: mode === "dark" ? "#fff" : "#000",
      p: 2,
      mx: "auto"
    },
  }}
>
  <Typography variant="h6" sx={{ mb: 2 }}>
    Select Users to Add
  </Typography>

  <TextField
    fullWidth
    label="Search by username or email"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    sx={{
      mb: 2,
      input: { color: mode === "dark" ? "#fff" : "#000" },
      label: { color: '#ccc' },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: '#555' },
        '&:hover fieldset': { borderColor: '#888' },
        '&.Mui-focused fieldset': { borderColor: '#00f721' },
      },
    }}
  />

  {/* Search Results */}
  <Typography variant="subtitle2" sx={{ mb: 1, color: '#ccc' }}>
    Search Results
  </Typography>

  {searchLoading ? (
    <Box sx={{ textAlign: 'center', mt: 2 }}>
      <CircularProgress size={24} color="inherit" />
    </Box>
  ) : (
    <>
      <List dense>
        {searchResults.map((user) => (
          <ListItem key={user.uid} disablePadding>
            <ListItemButton
              onClick={() => {
                setSelectedUsers((prev) =>
                  prev.includes(user.uid)
                    ? prev.filter((id) => id !== user.uid)
                    : [...prev, user.uid]
                );
              }}
            >
              <Checkbox
                edge="start"
                checked={selectedUsers.includes(user.uid)}
                tabIndex={-1}
                sx={{ color: '#00f721' }}
              />
              <Avatar
                src={user.photoURL || ''}
                sx={{ width: 36, height: 36, mr: 2 }}
              >
                {(user.username?.[0] || user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </Avatar>
              <ListItemText
                primary={user.username || user.name || user.email}
                secondary={user.email}
                primaryTypographyProps={{ color: mode === "dark" ? "#fff" : "#000" }}
                secondaryTypographyProps={{ color: '#aaa' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {searchResults.length === 0 && searchTerm.length >= 2 && !searchLoading && (
        <Typography variant="body2" sx={{ color: '#999', mt: 1 }}>
          No users found.
        </Typography>
      )}
    </>
  )}

  {/* Selected Users Section */}
  <Divider sx={{ my: 2, borderColor: '#444' }} />
  <Typography variant="subtitle2" sx={{ mb: 1, color: '#ccc' }}>
    Selected Users ({selectedUsers.length})
  </Typography>
  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
    {selectedUsers.map(uid => {
      // Try to find user in searchResults; otherwise fallback to a minimal display
      const user = searchResults.find(u => u.uid === uid) || { uid, username: 'Pending User', email: '', photoURL: '' };
      return (
        <Chip
          key={uid}
          avatar={
            <Avatar src={user.photoURL || ''}>
              {(user.username?.[0] || user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </Avatar>
          }
          label={user.username || user.name || user.email || uid}
          onDelete={() =>
            setSelectedUsers((prev) => prev.filter((id) => id !== uid))
          }
          sx={{
            bgcolor: '#333',
            color: mode === "dark" ? "#fff" : "#000",
            borderColor: '#555',
            mb: 1
          }}
        />
      );
    })}
  </Stack>

  {/* Action Buttons */}
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
    <Button onClick={() => setAddUserDialogOpen(false)} sx={{ color: '#ccc' }}>
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={handleBatchAddUsers}
      disabled={selectedUsers.length === 0}
      sx={{ bgcolor: '#00f721', color: '#000', fontWeight: 600 }}
    >
      Add Selected
    </Button>
  </Box>
</SwipeableDrawer>


        </Box>
      </Drawer>
    </motion.div>
  )}
</Box>
    </Box>
    </BetaAccessGuard>
    </ThemeProvider>
  );
}

export default GroupChat;