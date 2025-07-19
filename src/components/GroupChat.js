import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase';
import { db } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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
  where,
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
  ListItemAvatar,
  Dialog,
  AppBar,
  Toolbar,
  createTheme,
  keyframes,
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
  Radio,
  RadioGroup,
  FormLabel,
  FormControlLabel,
  Tooltip,
  Menu,
  Switch,
  InputAdornment,
  Card,
  AvatarGroup,
  LinearProgress,
  CardContent,
} from '@mui/material';
import {
  LocationOn, AccessTime,
} from "@mui/icons-material";
import EmojiPicker from 'emoji-picker-react';
import Popover from '@mui/material/Popover';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
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

import { motion, AnimatePresence, useAnimation } from 'framer-motion';


// Generate a consistent color per user based on their name
const generateUserColor = (userName = '') => {
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    hash = userName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = '#' + (Math.abs(hash) % 0xffffff).toString(16).padStart(6, '0');
  return color;
};



const MessageContainer = styled(Box)({
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#12121200',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    bottom: '0'
  });
  
  const MessageBubble = styled(Paper)(({ isCurrentUser }) => ({
    backgroundColor: isCurrentUser ? '#005c4b' : '#353535', // Darker bubbles
    borderRadius: isCurrentUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
    color: '#FFFFFF', // Light text
    padding: '12px 10px',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    maxWidth: '82%',
    alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
    marginBottom: '10px',
  }));
  
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
      hover: "#ccccccff", // bright green hover for interactive elements
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
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none", // translucent dark green hover
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
  

function GroupChat() {
  const { groupName } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageStatus, setMessageStatus] = useState({});
  const { groupId } = useParams();
  const [groupInfo, setGroupInfo] = useState({});
  const [userColors, setUserColors] = useState({});
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const [createdByUser, setCreatedByUser] = useState(null);
  const [memberUsers, setMemberUsers] = useState([]);
  const currentUser = auth.currentUser;
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const messageContainerRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const safeResults = Array.isArray(searchResults) ? searchResults : [];
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [replyTo, setReplyTo] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const controls = useAnimation();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [user, setUser] = useState(null)
  const [memberInfo, setMemberInfo] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState(null);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [groupDesc, setGroupDesc] = useState(groupInfo?.description || "");
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
  const [tripMembers, setTripMembers] = useState([]);
  const [timelineStats, setTimelineStats] = useState(null);
  const [tripBudget, setTripBudget] = useState(null);
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);


  const addedBy = user?.displayName || user?.email || "Someone";
  
  const isAdmin = groupInfo?.createdBy === user?.uid;

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
  if (!tripInfo?.members) return setTripMembers([]);
  Promise.all(
    tripInfo.members.map(uid =>
      getDoc(doc(db, "users", uid)).then(d =>
        d.exists() ? { uid: d.id, ...(d.data() || {}) } : null
      )
    )
  ).then(arr => setTripMembers(arr.filter(Boolean)));
}, [tripInfo]);


useEffect(() => {
  if (!tripInfo?.id) return setTimelineStats(null);
  getDocs(collection(db, "trips", tripInfo.id, "timeline")).then(snap => {
    const events = snap.docs.map(d => d.data());
    const total = events.length || 1;
    const completed = events.filter(e => e.completed === true).length;
    setTimelineStats({ completed, total, percent: Math.round((completed / total) * 100) });
  });
}, [tripInfo]);

useEffect(() => {
  if (!groupInfo?.tripId) return setTripBudget(null);
  const fetch = async () => {
    const budgetRef = doc(db, "budgets", groupInfo.tripId);
    const budgetSnap = await getDoc(budgetRef);
    setTripBudget(budgetSnap.exists() ? budgetSnap.data() : null);
  };
  fetch();
}, [groupInfo?.tripId]);

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

const canSendMessages = groupInfo?.sendAccess === "all" ||
  groupInfo?.createdBy === auth.currentUser?.uid ||
  groupInfo?.admins?.includes(auth.currentUser?.uid);
  
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
        const alreadySelected = selectedUsers.includes(uid);
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
}, [searchTerm, groupInfo?.members]);

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
    setGroupDesc(groupInfo.description || "");
    setGroupIconType(groupInfo.iconURL ? "image" : "emoji");
    setGroupIconValue(groupInfo.iconURL || groupInfo.emoji || "💬");
  }
}, [editingGroupInfo, groupInfo]);



const fetchGroupDetails = async (groupId) => {
  try {
    const groupRef = doc(db, "groupChats", groupId);
    const groupSnap = await getDoc(groupRef);

    if (groupSnap.exists()) {
      const groupData = { id: groupSnap.id, ...groupSnap.data() };
      setSelectedGroup(groupData);
      setEditingGroupInfo(true); // optionally open drawer here
    } else {
      console.warn("Group not found in Firestore.");
    }
  } catch (err) {
    console.error("Error fetching group details:", err.message);
  }
};


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



  const handleContextMenu = (event, message) => {
    event.preventDefault();
    setContextMenu({ visible: true, x: event.clientX, y: event.clientY, message });
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
  
  
  const handleAddReaction = (msg, emoji) => {
    // Example: You can update Firestore to add emoji reaction
    console.log(`Reacted to ${msg.id} with ${emoji}`);
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

  const handleLongPress = (e, message) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: window.innerWidth / 2,
      y: e.touches[0].clientY,
      message,
    });
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
  

  const handleAddUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchTerm('');
  };
  
  const handleRemoveUser = (uid) => {
    setSelectedUsers(prev => prev.filter(u => u.uid !== uid));
  };
  
  const handleBackButton = () => navigate(-1);

  const groupEmoji = groupInfo.emoji || '';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const colors = {};
    messages.forEach((msg) => {
      if (!colors[msg.senderId]) {
        colors[msg.senderId] = generateUserColor(msg.senderName);
      }
    });
    setUserColors(colors);
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
      height: '64px',
      background: 'linear-gradient(to bottom, #000000, #000000d9, #000000c9, #00000090, #00000000)',
      backdropFilter: 'blur(0px)',
    }}
  >
    <IconButton onClick={handleBackButton} sx={{ mr: 1 }} style={{ color: '#fff' }}>
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
          bgcolor: '#333333',
          color: '#000',
          fontSize: 24,
          width: 48,
          height: 48,
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
            color: '#fff',
          }}
        >
          {groupInfo.name || groupName}

          {/* ✅ Conditionally show group chip */}
          {groupInfo.name === "BM - Beta members" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 1,
                py: 0.3,
                fontSize: 12,
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
                px: 1,
                py: 0.3,
                fontSize: 12,
                backgroundColor: '#66ccff33',
                color: '#66ccff',
                borderRadius: 1.5,
              }}
            >
              🧪 Dev Beta
            </Box>
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
            maxWidth: '100%'
          }}
        >
        <Avatar
            src={groupInfo.iconURL ? groupInfo.iconURL : ""}
            sx={{
              bgcolor: '#000',
              color: '#000',
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
      fontSize: '28px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: '#FFFFFF',
      mb: 0.5,
    }}
  >
    {groupInfo.name || groupName}
          {groupInfo.name === "BM - Beta members" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 1,
                py: 0.3,
                fontSize: 12,
                backgroundColor: '#00f72133',
                color: '#00f721',
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
                px: 1,
                py: 0.3,
                fontSize: 12,
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
      color: '#FFFFFF',
      textAlign: "center",
      mb: 0.5,
      width: "80vw"
    }}
  >
    {groupInfo.description || ""}
  </Typography>

  {createdByUser && (
    <Typography variant="caption" sx={{ color: '#B0BEC5', mb: 0.5 }}>
      <strong sx={{color: '#fff'}}>Created by:</strong> {createdByUser.name}
    </Typography>
  )}

  <Typography variant="caption" sx={{ color: '#B0BEC5' }}>
  <br></br><strong sx={{color: '#fff'}}>{groupInfo.members?.length || 0} Members</strong>
  </Typography>

<Typography
  variant="caption"
  sx={{
    color: '#B0BEC5',
    whiteSpace: 'pre-wrap',
    mt: 1,
  }}
>
  <strong style={{ color: '#fff' }}>Members Joined:</strong>
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
            <Typography variant="body1" sx={{ textAlign: 'center', color: '#888' }}>
              Loading messages...
            </Typography>
          ) : (
            Object.keys(groupedMessages).map((date) => (
              <Box key={date} sx={{ marginBottom: '80px' }}>
                <Typography variant="body2" sx={{ color: '#aaa', bgcolor: '#2b2b2b54', borderRadius: '15px', textAlign: 'center', marginBottom: '10px' }}>
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
          backgroundColor: "#ffffff0a",
          borderRadius: 2,
          px: 2,
          py: 0.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#b5b5b5",
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
                        sx={{ width: 40, height: 40 }}
                      >
                        {msg.photoURL && <AccountCircleIcon sx={{ fontSize: 52, color: '#e8e8e8' }} />}
                      </Avatar>
                    </Box>
                    <motion.div
      key={msg.id}
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
        gap: 8,
        padding: '0 8px',
      }}
    >
                    <MessageBubble isCurrentUser={msg.senderId === currentUser.uid} status={msg.status}>
                      
                    {msg.replyTo?.text && (
  <Box
    sx={{
      borderLeft: '4px solid #00f721',
      p: 0.8,
      pl: 1,
      mb: 1,
      bgcolor: '#2b2b2bea',
      borderRadius: 1,
    }}
  >
    <Typography variant="caption" color="#83f192">
  {msg.senderId === currentUser.uid
    ? 'You'
    : (msg.replyTo?.senderName?.length > 60
        ? msg.replyTo.senderName.slice(0, 60) + '...'
        : msg.replyTo?.senderName || 'Unknown')}
</Typography>

    <Typography variant="body2" sx={{ color: '#ccc', fontStyle: 'italic' }}>
      {msg.replyTo.text.length > 60
        ? msg.replyTo.text.slice(0, 60) + '...'
        : msg.replyTo.text}
    </Typography>
  </Box>
)}

                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '13px',
                          marginBottom: '5px',
                          color: '#a7a7a7',
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
<Box sx={{ maxWidth: 420, minWidth: 310 }}>
  <Typography
    variant="subtitle1"
    sx={{ color: "#fff", fontWeight: 700, mb: 1 }}
  >
    📅 Group Timeline
  </Typography>
  <List dense>
    {sortedTimeline.length === 0 && (
      <Typography sx={{ color: "#888", mb: 1 }}>
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
                : "#ececec30",
              border: isUpcoming ? "2px solid #f79400aa" : undefined,
              px: 1.2,
              py: 0.5,
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              minHeight: 34,
              width: "80%",
              boxShadow: isUpcoming ? "0 2px 12px #00f72100" : undefined,
              transition: "background 0.2s, border 0.2s",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontFamily: "monospace",
                color: event.completed
                  ? "#f7f7f7ff"
                  : isUpcoming
                  ? "#ffffffff"
                  : "#b6b6b6ff",
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
                  color: event.completed ? "#c5c5c5ff" : "#fff",
                  fontWeight: 700,
                  lineHeight: 1.1,
                }}
              >
                {event.title || event.text || isUpcoming || "Untitled"}
              </Typography>
              <Typography variant="caption" sx={{ color: event.completed ? "#c5c5c5ff" : "#fff", fontWeight: isUpcoming ? 700 : 400 }}>
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
  <Box sx={{ maxWidth: 420, minWidth: 260 }}>
    <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 700 }}>
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
                  color: "#00f721",
                  '&.Mui-checked': { color: "#00f721" },
                }}
              />
              <ListItemText
                primary={item.text || "Untitled"}
                sx={{
                  color: isChecked ? "#9affd3" : "#fff",
                  textDecoration: isChecked ? "line-through" : "none",
                }}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
    <Typography variant="caption" sx={{ color: "#aaa", mt: 1 }}>
      Only you see your own progress
    </Typography>
  </Box>
) : (
  <Typography
  variant="body2"
  sx={{
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#fff',
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
            bgcolor: "#2b2b2b",
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


                      <MessageTime>
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
                    </MessageBubble>
                    </motion.div>
                  </Box>
                    );
                    })}
              </Box>
            ))
          )}
          {showScrollButton && (
  <Button
    onClick={() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setNewMessageCount(0);
    }}
    sx={{
      position: 'fixed',
      bottom: 80,
      right: 20,
      zIndex: 1000,
      backgroundColor: '#1ac635',
      color: '#000',
      borderRadius: '20px',
      padding: '10px 20px',
    }}
  >
    {newMessageCount} New Message{newMessageCount > 1 ? 's' : ''}
  </Button>
)}

<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
  PaperProps={{
    sx: {
      minWidth: 200,
      borderRadius: 2,
      bgcolor: "#181818",
      color: "#fff",
      boxShadow: "0 4px 24px #000a",
      p: 0.5,
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
          color: "#fff",
          fontSize: 18,
          width: 36,
          height: 36,
          bgcolor: "#292929",
          borderRadius: "12px",
          "&:hover": {
            bgcolor: "#3a3a3a",
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
        color: "#fff",
        width: 36,
        height: 36,
        bgcolor: "#292929",
        borderRadius: "12px",
        "&:hover": {
          bgcolor: "#3a3a3a",
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
    sx={{ fontWeight: 500, fontSize: 15 }}
  >
    💬 Reply
  </MenuItem>

  {selectedMsg?.senderId === currentUser.uid && (
    <>
      <MenuItem
        onClick={() => {
          handleEdit(selectedMsg);
          setAnchorEl(null);
        }}
        sx={{ fontWeight: 500, fontSize: 15 }}
      >
        ✏️ Edit
      </MenuItem>
      <MenuItem
        onClick={() => {
          handleDelete(selectedMsg?.id);
          setAnchorEl(null);
        }}
        sx={{ color: "#ff4444", fontWeight: 500, fontSize: 15 }}
      >
        🗑️ Delete
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
    sx={{ fontSize: 15 }}
  >
    📋 Copy Text
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
      minWidth: 220,
      borderRadius: 2,
      bgcolor: "#181818",
      color: "#fff",
      boxShadow: "0 4px 24px #000a",
      p: 0.5,
    },
  }}
>
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
          }}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            py: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
            <Typography variant="body1">{emoji}</Typography>
                {users.map((u) => (
                  <Tooltip title={u.name} key={u.uid}>
                    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, fontSize: 12, ml: 1 }}>
                        <Avatar
                          src={u.photoURL || ""}
                          sx={{ width: 22, height: 22 }}
                          />
{users.map((u) => (
  <Box key={u.uid}>
    {u.uid === currentUser.uid ? 'You' : u.name}
  </Box>
))}

                      </Box>
                  </Tooltip>
                ))}
          </Box>
        </MenuItem>
      )
    )}

</Menu>


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
      p: 1,
    },
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
    width: '96vw',
    zIndex: '1200',
    alignItems: 'center',
    borderTop: '0px solid #5E5E5E',
    background: 'linear-gradient(to top, #000000, #00000090, #00000000)',
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
            backgroundColor: "#000000ff",
            borderTop: "1px solid #333"
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
    background: 'linear-gradient(to top, #000000, #00000090, #00000000)',
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
      mr: 0.7
}}>
    <Button
    sx={{
      display: editingMsg ? "none" : "flex",
      backgroundColor: '#f1f1f11c',
      backdropFilter: "blur(80px)",
      height: '40px',
      px: 0,
      minWidth: '40px',
      borderRadius: 40,
    }}
    onClick={(e) => setMoreAnchorEl(e.currentTarget)}
  >
    <AddIcon sx={{ color: '#ffffffff', fontSize: 24 }} />
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
      mr: 0,
      input: {
        color: '#FFFFFF',
        height: '30px',
        width: "53vw",
        borderRadius: '40px'
      },
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: '#5e5e5e00',
          borderRadius: '40px'
        },
        '&:hover fieldset': {
          borderColor: '#75757500',
          borderRadius: '40px'
        },
        '&.Mui-focused fieldset': {
          borderColor: '#75757500',
          borderRadius: '40px'
        },
      },
      '& .MuiInputBase-input::placeholder': {
        color: '#757575'
      }
    }}
  />
</Box>

  {editingMsg ? (
    <>
      <Button
        sx={{ backgroundColor: '#430400ff', height: '50px', width: '50px', borderRadius: 40, mr: 1 }}
        onClick={() => {
          setEditingMsg(null);
          setEditText("");
        }}
      >
        <CloseIcon sx={{ color: '#ffd2cfff' }} />
      </Button> 
      <Button
        sx={{ backgroundColor: '#ffffffff', height: '50px', width: '50px', borderRadius: 40 }}
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
        <CheckIcon sx={{ color: '#000' }} />
      </Button>

    </>
  ) : (
    <>
    <Button
      sx={{ backgroundColor: '#ffffffff', height: '50px', width: '50px', borderRadius: 40 }}
      onClick={sendMessage}
    >
      <SendIcon sx={{ color: '#000' }} />
    </Button>
  </>
  )}

  {/* --- More Options Menu --- */}
  <Menu
    anchor="bottom"
    top={0}
    position={"fixed"}
    anchorEl={moreAnchorEl}
    open={Boolean(moreAnchorEl)}
    onClose={() => setMoreAnchorEl(null)}
    PaperProps={{
      sx: {
        bgcolor: "#2323231b",
        color: "#fff",
        borderRadius: 1,
        maxWidth: 370,
        backdropFilter: "blur(40px)",
        width: 370,
        position: "static",
        margin: "auto",
        marginTop: "177%",
      }
    }}
  >
  <MenuItem
    onClick={async () => {
      const items = await fetchTripTimeline();
      await sendStructuredMessage("Timeline", items);
      setMoreAnchorEl(null);
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
  >
    ✅ Send Checklist
  </MenuItem>
{/* 
    <MenuItem onClick={() => { setShowPollDialog(true); setMoreAnchorEl(null); }}>
    📊 Create Poll
  </MenuItem> */}
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
  <DialogTitle sx={{ color: "#fff", fontWeight: "bold" }}>
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
      InputProps={{ style: { color: '#fff' } }}
    />

    {pollOptions.map((option, index) => (
      <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <TextField
          fullWidth
          placeholder={`Option ${index + 1}`}
          value={option}
          onChange={(e) => handleOptionChange(index, e.target.value)}
          InputLabelProps={{ style: { color: '#aaa' } }}
          InputProps={{ style: { color: '#fff' } }}
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
            backgroundColor: 'rgba(12, 12, 12, 0.32)',
            backdropFilter: 'blur(40px)',
            color: '#fff',
            boxShadow: '0 -5px 20px rgba(0, 0, 0, 0.3)',
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
            sx={{ color: '#ccc' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6">
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
    color: '#fff',
  }}
>
  {/* Only show emoji fallback if no image */}
  {(groupInfo.iconURL || groupInfo.emoji || groupInfo.name?.[0]?.toUpperCase() || 'G')}
</Avatar>


            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {groupInfo.name || groupName}
              {groupInfo.name === "BM - Beta members" && (
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 1,
                py: 0.3,
                fontSize: 12,
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
                px: 1,
                py: 0.3,
                fontSize: 12,
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
                backgroundColor: "#f1f1f111",
                mt: 2,
                mb: 2,
                px: 1.5,
                py: 0.5,
                borderRadius: 1
              }}
            >
{groupInfo.description && (
  <Typography
    variant="body2"
    sx={{
      color: '#B0BEC5',
      mt: 0.5,
      whiteSpace: 'pre-wrap', // ✅ preserves \n line breaks and spaces
      wordBreak: 'break-word',
    }}
  >
    {groupInfo.description}
  </Typography>
)}

              {createdByUser && (
                <Typography variant="caption" sx={{ color: '#bbb', mb: 1 }}>
                  Created by <strong>{createdByUser.name}</strong>
                </Typography>
              )}
            </Box>

{tripInfo && (
  <Card
    sx={{
      background: `url(${groupInfo.iconURL})`,
      backgroundSize: "cover",
      backgroundColor: "#f1f1f101",
      backgroundPosition: "center",
      color: "#fff",
      borderRadius: 1,
    }}
  >

    <CardContent sx={{ backdropFilter: "blur(20px)" }}>
    <Box display="flex" alignItems="start" gap={2} mb={1}>  
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
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
                  mx: "auto"
                }}
              >
                {canEditGroupInfo && (
                    <Button
                      variant="contained"
                      onClick={() => setEditingGroupInfo(true)}
                      sx={{
                        bgcolor: '#f1f1f111', color: '#fff', borderRadius: 1, py: 1.4, px: 2, display: "flex", alignItems: "center", justifyContent: "left", gap: 1.5
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
                        bgcolor: '#f1f1f111', color: '#fff', borderRadius: 1, py: 1.4, px: 2, display: "flex", alignItems: "center", justifyContent: "left", gap: 1.5
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
                  backgroundColor: "#f1f1f111",
                  p: 1,
                  mt: 2,
                  borderRadius: 1
                }}
              >
             <Typography
              variant="body2"
              sx={{
                color: '#a5a5a5ff',
                fontWeight: 500,
                p: 1
              }}
            >
              {groupInfo.members?.length || 0} Members
            </Typography>

{canAddMembers && (
  <Button
    variant="contained"
    onClick={() => setAddUserDialogOpen(true)}
    sx={{ mt: 0, backgroundColor: "#f1f1f111", boxShadow: "none", color: "#fff", justifyContent: "left", alignItems: "center", borderRadius: 1, gap: 1, px: 1, display: "flex" }}
  >
    <AddIcon sx={{ backgroundColor: "#fff", color: "#000", padding: 1, borderRadius: 4 }} />
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
          sx={{ background: "#f1f1f111", p: 1, borderRadius: 1 }}
          onClick={() => window.location.href=`/chat/${memberUid}`}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src={member?.photoURL} sx={{ width: 40, height: 40, mr: 1 }} />
            <Box>
              <Typography variant='body1'>
                {member?.name || memberUid.slice(0, 6)}
                {isOwner && (
                  <Chip label="Admin" size="small" sx={{ ml: 1, background: "#ffffff36", color: "#fff", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 0.5 }} />
                )}
                {isAdmin && !isOwner && (
                  <Chip label="Admin" size="small" sx={{ ml: 1, background: "#ffffff36", color: "#fff", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 0.5 }} />
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
                  sx={{ color: "#fff", backgroundColor: "#f1f1f111", padding: 1 }}
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
                    sx={{ color: "#fbb", backgroundColor: "#ff000030", padding: 1 }}
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
          sx={{ mt: 2, height: 50, px: 2, backgroundColor: "#f1f1f124", boxShadow: "none", color: "#fff", justifyContent: "space-between", alignItems: "center", borderRadius: 1, gap: 1, display: "flex" }}
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
                      bgcolor: '#f1f1f111',
                      color: '#ff6767',
                      fontSize: 16,
                      borderRadius: 1,
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
>
  <DialogTitle>Remove Member</DialogTitle>
  <DialogContent>
    <Typography>
      Are you sure you want to remove this member from the group?
    </Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
    <Button
      onClick={async () => {
        await handleRemoveMember(selectedMemberToRemove);
        setConfirmDialogOpen(false);
      }}
      color="error"
      variant="contained"
    >
      Remove
    </Button>
  </DialogActions>
</Dialog>


          </Box>

<SwipeableDrawer
  anchor="bottom"
  open={membersDrawerOpen}
  onClose={() => setMembersDrawerOpen(false)}
  PaperProps={{
    sx: {
      p: 2,
      backgroundColor: "#111",
      color: "#fff",
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      minHeight: "60vh",
      maxHeight: "80vh",
    },
  }}
>
  <Box>
                <Box
            sx={{
              width: 40,
              height: 5,
              backgroundColor: '#666',
              borderRadius: 3,
              mx: 'auto',
              mb: 2,
              opacity: 0.7,
            }}
          />
          
  <Typography variant="h6" sx={{ mb: 2 }}>
    All Group Members
  </Typography>
  <TextField
    fullWidth
    placeholder="Search member"
    value={memberSearch}
    onChange={e => setMemberSearch(e.target.value)}
    sx={{
      mb: 2,
      input: { color: "#fff" },
      label: { color: "#ccc" },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: '#555' },
        '&:hover fieldset': { borderColor: '#888' },
        '&.Mui-focused fieldset': { borderColor: '#ffffffff' },
      },
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


  <List sx={{ maxHeight: "60vh", overflowY: "auto" }}>
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
                background: "#f1f1f111",
                p: 1,
                borderRadius: 1,
              }}
              onClick={() => window.location.href=`/chat/${memberUid}`}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar src={member?.photoURL} sx={{ width: 40, height: 40, mr: 1 }} />
                <Box>
                  <Typography variant='body1'>
                    {member?.name || memberUid.slice(0, 6)}
                    {isOwner && (
                      <Chip label="Admin" size="small" sx={{ ml: 1, background: "#ffffff36", color: "#fff", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 0.5 }} />
                    )}
                    {isAdmin && !isOwner && (
                      <Chip label="Admin" size="small" sx={{ ml: 1, background: "#ffffff36", color: "#fff", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 0.5 }} />
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
                  sx={{ color: "#fff", backgroundColor: "#f1f1f111", padding: 1 }}
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
                    sx={{ color: "#fbb", backgroundColor: "#ff000030", padding: 1 }}
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
        <Typography sx={{ color: "#aaa", mt: 2, textAlign: "center" }}>
          No members
        </Typography>
      )}
    </Stack>
  </List>
  <Box textAlign="center" mt={2}>
  </Box>
</SwipeableDrawer>


<Drawer
  anchor="bottom"
  fullHeight
  open={groupSettingsOpen}
  onClose={() => setGroupSettingsOpen(false)}
  PaperProps={{
    sx: {
      p: 3,
      backgroundColor: "#111",
      color: "#fff",
      maxWidth: 480,
      mx: "auto",
      height: "95vh"
    },
  }}
>


  <Box display="flex" flexDirection="column" gap={3} maxHeight={"93vh"} overflowY={"auto"} mb={2}>

  <Box display="flex" alignItems="center">
  <IconButton onClick={() => setGroupSettingsOpen(false)} sx={{ color: "#fff", mr: 1 }}>
    <ArrowBackIcon />
  </IconButton>
  <Typography variant="h5" sx={{ fontWeight: "bold" }}>
    Group Settings
  </Typography>
</Box>

    {/* Section: Permission Toggles */}
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Permissions
      </Typography>
<Stack spacing={3}>
  {/* Edit Access Section */}
  <Box>
    <Typography variant="subtitle2" sx={{ mb: 1, color: "#ccc" }}>
      Who can edit group info?
    </Typography>
    <Stack direction="row" spacing={2}>
      {["admin", "all"].map((role) => (
        <Button
          key={role}
          variant={groupInfo?.editAccess === role ? "contained" : "outlined"}
          onClick={() => handlePermissionChange("editAccess", role)}
          sx={{
            color: groupInfo?.editAccess === role ? "#000" : "#fff",
            backgroundColor:
              groupInfo?.editAccess === role ? "#fff" : "transparent",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            borderRadius: 2,
          }}
        >
          {role === "admin" ? "Admins Only" : "All Members"}
        </Button>
      ))}
    </Stack>
  </Box>

  {/* Invite Access Section */}
  <Box>
    <Typography variant="subtitle2" sx={{ mb: 1, color: "#ccc" }}>
      Who can add members?
    </Typography>
    <Stack direction="row" spacing={2}>
      {["admin", "all"].map((role) => (
        <Button
          key={role}
          variant={groupInfo?.inviteAccess === role ? "contained" : "outlined"}
          onClick={() => handlePermissionChange("inviteAccess", role)}
          sx={{
            color: groupInfo?.inviteAccess === role ? "#000" : "#fff",
            backgroundColor:
              groupInfo?.inviteAccess === role ? "#fff" : "transparent",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            borderRadius: 2,
          }}
        >
          {role === "admin" ? "Admins Only" : "All Members"}
        </Button>
      ))}
    </Stack>
  </Box>

  {/* Send Messages Access Section */}
  <Box>
    <Typography variant="subtitle2" sx={{ mb: 1, color: "#ccc" }}>
      Who can send messages?
    </Typography>
    <Stack direction="row" spacing={2}>
      {["admin", "all"].map((role) => (
        <Button
          key={role}
          variant={groupInfo?.sendAccess === role ? "contained" : "outlined"}
          onClick={() => handlePermissionChange("sendAccess", role)}
          sx={{
            color: groupInfo?.sendAccess === role ? "#000" : "#fff",
            backgroundColor:
              groupInfo?.sendAccess === role ? "#fff" : "transparent",
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            borderRadius: 2,
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
<Box mt={3} mb={3}>
  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
    <Typography variant="h6">Members & Admins</Typography>
    <Button
      variant="contained"
      size="small"
      sx={{ color: "#ffffffff", backgroundColor: "#f1f1f121", display: "flex", alignItems: "center" }}
      onClick={() => setShowSearchBar(prev => !prev)}
    >
      {showSearchBar ? <CloseIcon sx={{ fontSize: "18px", mr: 1 }} /> : <SearchIcon sx={{ fontSize: "18px", mr: 1 }} /> }
      {showSearchBar ? "Hide Search" : "Search"}
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
        input: { color: "#fff" },
        '& label': { color: '#ccc' },
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#555' },
          '&:hover fieldset': { borderColor: '#888' },
          '&.Mui-focused fieldset': { borderColor: '#ffffffff' },
        },
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
              borderRadius: 1,
              bgcolor: "#f1f1f111",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar src={member?.photoURL}>
                {member?.name?.[0]?.toUpperCase() || "U"}
              </Avatar>
              <Box>
                <Typography variant="body1">
                  {member?.name || member?.email}
                </Typography>
                <Typography variant="body2" color="#aaa">
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
                    color: isAdmin ? "#ffffffff" : "#8e8e8eff",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: "#555"
                    }
                  }}
                  MenuProps={{
                    PaperProps: { sx: { bgcolor: "#232323", color: "#fff" } }
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
                  bgcolor: isAdmin ? "#ffffff44" : "#ffffff44",
                  color: isAdmin ? "#fff" : "#fff",
                  fontWeight: 600,
                  fontSize: "0.8rem"
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
      background: "#111",
      color: "#fff",
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
  sx={{ mb: 2, input: { color: "#fff" }, label: { color: "#ccc" } }}
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
  <InputLabel sx={{ color: "#ccc" }}>Icon Type</InputLabel>
  <Select
    value={groupIconType}
    onChange={(e) => setGroupIconType(e.target.value)}
    sx={{ color: "#fff" }}
  >
    <MenuItem value="emoji">Emoji</MenuItem>
    <MenuItem value="image">Image URL</MenuItem>
  </Select>
</FormControl>

{/* Icon Selector */}
{groupIconType === "emoji" ? (
  <>
    <Typography variant="subtitle2" sx={{ mb: 1, color: "#ccc" }}>
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
                  groupIconValue === emoji ? "#ffffffff" : "#232323",
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
      sx={{ mb: 1, input: { color: "#fff" }, label: { color: "#ccc" } }}
    />

    <Button
      variant="contained"
      component="label"
      sx={{
        mt: 1,
        color: "#fff",
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
  sx={{ mb: 3, input: { color: "#fff" }, label: { color: "#ccc" } }}
/>


  {/* Buttons */}
  <Box display="flex" justifyContent="space-between" gap={2}>
    <Button
      variant="outlined"
      onClick={() => setEditingGroupInfo(false)}
      sx={{
        flex: 1,
        color: "#fff",
        borderColor: "#666",
        fontWeight: 500,
        backgroundColor: "#0c0c0c"
      }}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={handleUpdateGroupInfo}
      sx={{
        flex: 1,
        bgcolor: "#ffffffff",
        color: "#000",
        fontWeight: 600,
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
      color: '#fff',
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
      input: { color: '#fff' },
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
                primaryTypographyProps={{ color: '#fff' }}
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
            color: '#fff',
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