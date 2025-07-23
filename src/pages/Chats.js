import React, { useEffect, useState, useCallback } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  where,
  serverTimestamp,
  getDoc,
  setDoc,
  arrayUnion
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import BetaAccessGuard from "../components/BetaAccessGuard";
import { Avatar, useTheme, IconButton, Dialog, createTheme, keyframes, Slide, Box, Tabs, Tab, InputAdornment, Typography, TextField, Button, ThemeProvider, CircularProgress, Drawer, Divider, SwipeableDrawer } from '@mui/material';
import { format, isToday, isYesterday } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AddIcon from '@mui/icons-material/Add';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from "@mui/icons-material/Search";
import ProfilePic from '../components/Profile';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import { Theme } from 'emoji-picker-react';
import { useSettings } from "../contexts/SettingsContext";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import DeviceGuard from '../components/DeviceGuard';
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useThemeToggle } from "../contexts/ThemeToggleContext";
import { getTheme } from "../theme";

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


const SESSION_KEY = "bunkmate_session";
const USER_STORAGE_KEY = "bunkmateuser";
const WEATHER_STORAGE_KEY = "bunkmate_weather";

function showLocalNotification(title, options) {
  if (Notification.permission === "granted") {
    new Notification(title, options);
  }
}


function Chats({ onlyList }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [latestMessages, setLatestMessages] = useState({});
  const [latestTimestamps, setLatestTimestamps] = useState({});
  const [notification, setNotification] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [latestGroupMessages, setLatestGroupMessages] = useState({});
  const [latestGroupTimestamps, setLatestGroupTimestamps] = useState({});
  const muiTheme = useTheme();
  const history = useNavigate();
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [groupDialog, setGroupDialog] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchUsername, setSearchUsername] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupEmoji, setGroupEmoji] = useState('💬');
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chat: null });
  const [friends, setFriends] = useState([]);
  const [nicknames, setNicknames] = useState({});
  const navigate = useNavigate();
  const { mode, setMode, accent, setAccent, toggleTheme } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const [currentUser, setCurrentUser] = useState(null);
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const [dynamicTheme, setDynamicTheme] = useState(theme);
  const [tab, setTab] = useState(0);
  const [friendsList, setFriendsList] = useState([]);
  const [searchFriend, setSearchFriend] = useState(""); 
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [groupDescription, setGroupDescription] = useState('');
  const [groupDialogOpen, setGroupDialogOpen] = useState(false); // Controls group drawer
  const [membDialogOpen, setMembDialogOpen] = useState(false); // Controls group drawer
  const [groupIcon, setGroupIcon] = useState(""); // Icon or emoji
  const [selectedFriends, setSelectedFriends] = useState([]); // List of selected members for group
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success", // can be "success", "error", "info", etc.
  });

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
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

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setCurrentUser(user);
  });
  return () => unsubscribe();
}, []);

  const weatherBg =
  weather && weatherGradients[weather.main]
  ? weatherGradients[weather.main]
  : weatherGradients.Default;
  
  const buttonWeatherBg =
  weather && weatherColors[weather.main]
    ? weatherColors[weather.main]
    : weatherColors.Default;
  
    
  const WeatherBgdrop =
  weather && weatherbgColors[weather.main]
    ? weatherbgColors[weather.main]
    : weatherbgColors.Default;


const [userData, setUserData] = useState({
  name: "",
  username: "",
  email: "",
  mobile: "",
  photoURL: "",
  bio: "",
  uid: "",
});

// Fetch user details from localStorage/cookie (reference: Home.js)
useEffect(() => {
  let user = auth.currentUser;
  if (!user) {
    // Try localStorage
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
      return;
    }
    // Try cookie
    const cookieUser = document.cookie
      .split("; ")
      .find((row) => row.startsWith(USER_STORAGE_KEY + "="))
      ?.split("=")[1];
    if (cookieUser) {
      setUserData(JSON.parse(decodeURIComponent(cookieUser)));
      return;
    }
  } else {
    // If user is authenticated, use Firebase user object
    const { displayName, email, photoURL, phoneNumber, userBio, uid } = user;
    setUserData({
        name: displayName || "User",
        email: email || "",
        mobile: phoneNumber || "Not provided",
        photoURL: photoURL || "",
        bio: userBio || "",
        uid: uid || "",
      });
    }
  }, []);

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
}, [weather, setWeather]);

  // Fetch friends list from Firestore (assuming you store friends as an array of user IDs in each user doc)
useEffect(() => {
  if (!currentUser) return;
  const fetchFriends = async () => {
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      setFriends(userDoc.data().friends || []);
    }
  };
  fetchFriends();
}, [currentUser]);

useEffect(() => {
  if (!currentUser) return;

  const fetchFriends = async () => {
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const friendsUIDs = userSnap.data().friends || [];

      const friendDocs = await Promise.all(
        friendsUIDs.map(uid => getDoc(doc(db, "users", uid)))
      );

      const fetchedFriends = friendDocs
        .filter(doc => doc.exists())
        .map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            name: data.name || "Unnamed",
            username: data.username || "",
            photoURL:
              data.photoURL ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${doc.id}`,
          };
        });

      setFriendsList(fetchedFriends);
    } catch (err) {
      console.error("Failed to fetch friends:", err);
    }
  };

  fetchFriends();
}, [currentUser]);

const filteredFriends = friendsList.filter((friend) => {
  const query = searchFriend.toLowerCase();
  return (
    friend.name?.toLowerCase().includes(query) ||
    friend.username?.toLowerCase().includes(query)
  );
});

const toggleFriendSelection = (friend) => {
  const alreadySelected = selectedFriends.find((f) => f.uid === friend.uid);
  if (alreadySelected) {
    setSelectedFriends((prev) => prev.filter((f) => f.uid !== friend.uid));
  } else {
    setSelectedFriends((prev) => [...prev, friend]);
  }
};


useEffect(() => {
    if (!currentUser) return;
    const fetchNicknames = async () => {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setNicknames(userDoc.data().nicknames || {});
      }
    };
    fetchNicknames();
  }, [currentUser]);


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

  const handleAddToChatList = async (userToAdd) => {
    if (!userToAdd || !userToAdd.uid) return;
  
    const chatId = [currentUser.uid, userToAdd.uid].sort().join('_');
  
    const userChatRef = doc(db, "userChats", currentUser.uid);
    const userChatSnap = await getDoc(userChatRef);
  
    if (!userChatSnap.exists() || !userChatSnap.data()[chatId]) {
      const currentUserChatData = {
        [chatId]: {
          userInfo: {
            uid: userToAdd.uid,
            displayName: userToAdd.displayName || "Unnamed User",
            photoURL: userToAdd.photoURL || "",
          },
          date: serverTimestamp(),
          lastMessage: {
            text: "Say Hi!",
          },
        },
      };
  
      const otherUserChatData = {
        [chatId]: {
          userInfo: {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "Unnamed User",
            photoURL: currentUser.photoURL || "",
          },
          date: serverTimestamp(),
          lastMessage: {
            text: "Say Hi!",
          },
        },
      };
  
      await setDoc(doc(db, "userChats", currentUser.uid), currentUserChatData, { merge: true });
      await setDoc(doc(db, "userChats", userToAdd.uid), otherUserChatData, { merge: true });
  
      // Optional: Create starter message
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: "Say Hi!",
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
    }
  
    setAddUserDialog(false);
    setSearchTerm('');
  };
  

  const handleAddUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchTerm('');
  };
  
  const handleRemoveUser = (uid) => {
    setSelectedUsers(prev => prev.filter(u => u.uid !== uid));
  };

const handleCreateGroup = async () => {
  if (!groupName || selectedFriends.length === 0) return;

  const currentUser = auth.currentUser;
  const allMembers = [...selectedFriends.map(f => f.uid), currentUser.uid];

  try {
    const groupRef = doc(collection(db, "groupChats")); // Auto-generates ID

    await setDoc(groupRef, {
      name: groupName,
      description: groupDescription,
      iconURL: groupIcon,
      emoji: "", // If you want to support emojis later
      members: allMembers,
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      inviteAccess: "all",
    });

    setGroupDialogOpen(false);
    setGroupName("");
    setGroupDescription("");
    setGroupIcon("");
    setSelectedFriends([]);

    setSnackbar({ open: true, message: "Group created successfully!" });

  } catch (error) {
    console.error("Error creating group:", error);
    setSnackbar({ open: true, message: "Failed to create group." });
  }
};


useEffect(() => {
  if (!currentUser) return;

  const unsubs = onSnapshot(doc(db, "userChats", currentUser.uid), (docSnap) => {
    if (docSnap.exists()) {
      const chatsData = docSnap.data();
      const sortedChats = Object.entries(chatsData).sort(
        (a, b) => b[1].date?.seconds - a[1].date?.seconds
      );
      setUsers(
        sortedChats.map(([chatId, data]) => ({
          ...data.userInfo,
          chatId,
          lastMessage: data.lastMessage?.text || '',
        }))
      );
    }
  });

  return () => unsubs();
}, [currentUser]);

  
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;
      const snapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      snapshot.forEach((doc) => {
        if (doc.id !== currentUser.uid) {
          usersList.push({ id: doc.id, ...doc.data() });
        }
      });
      setUsers(usersList);
    };
    fetchUsers();
  }, [currentUser]);

useEffect(() => {
  if (!currentUser || users.length === 0) return;

  const unsubscribes = users.map((user) => {
    const chatId = [currentUser.uid, user.id].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const msg = data.system
          ? `[System] ${data.text}`
          : data.text || 'No messages yet';
        const ts = data.timestamp?.toDate?.() || new Date(0);
        const unread =
          data.senderId !== currentUser.uid && !data.isRead ? 1 : 0;

        setLatestMessages((prev) => ({ ...prev, [user.id]: msg }));
        setUnreadCounts((prev) => ({ ...prev, [user.id]: unread }));
        setLatestTimestamps((prev) => ({ ...prev, [user.id]: ts }));

        if (unread) {
          setNotification({
            user: user.name || user.username || 'Unknown',
            message: msg,
          });
          setTimeout(() => setNotification(null), 3000);
        }
      });
    });
  });

  return () => unsubscribes.forEach((unsub) => unsub && unsub());
}, [users, currentUser]);


  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!currentUser) return;
      const q = query(collection(db, 'groupChats'), where('members', 'array-contains', currentUser.uid));
      const snapshot = await getDocs(q);
      const groups = [];
      snapshot.forEach((doc) => {
        groups.push({ id: doc.id, ...doc.data() });
      });
      setUserGroups(groups);
    };
    fetchUserGroups();
  }, [currentUser]);

useEffect(() => {
  if (!currentUser || userGroups.length === 0) return;

  const unsubscribes = userGroups.map((group) => {
    const q = query(
      collection(db, 'groupChat', group.id, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const isSystem = data.type === "system";

        const msg = {
          text: isSystem
            ? `${data.content}`
            : data.text || 'No messages yet',
          senderName: isSystem ? 'System' : data.senderName || 'Unknown',
        };

        const ts = data.timestamp?.toDate?.() || new Date(0);
        const unread = data.senderId !== currentUser.uid && !data.isRead ? 1 : 0;

        setLatestGroupMessages((prev) => ({ ...prev, [group.id]: msg }));
        setGroupUnreadCounts((prev) => ({ ...prev, [group.id]: unread }));
        setLatestGroupTimestamps((prev) => ({ ...prev, [group.id]: ts }));

        if (unread) {
          setNotification({ user: group.name, message: msg.text });
          setTimeout(() => setNotification(null), 3000);
        }
      });
    });
  });

  return () => unsubscribes.forEach((unsub) => unsub && unsub());
}, [userGroups, currentUser]);

  const goBack = () => {
    history("/");
  };


  const handleSelect = async (userId) => {
    if (!currentUser) return;
    const chatId = [currentUser.uid, userId].sort().join('_');
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'desc'), limit(20));
    const snapshot = await getDocs(q);

    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      if (data.senderId !== currentUser.uid && !data.isRead) {
        await updateDoc(doc(db, 'chats', chatId, 'messages', docSnap.id), { isRead: true });
      }
    });

    setUnreadCounts((prev) => ({ ...prev, [userId]: 0 }));
    navigate(`/chat/${userId}`);
  };

  const handleGroupClick = (groupId) => {
    setGroupUnreadCounts((prev) => ({ ...prev, [groupId]: 0 }));
    navigate(`/group/${groupId}`);
  };

  const formatTimestamp = (date) => {
    if (!(date instanceof Date) || isNaN(date)) return '';
    if (isToday(date)) return format(date, 'h:mm a');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  };

  const handleContextMenu = (event, chat) => {
    event.preventDefault();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      chat,
    });
  };

  // Fetch all users for search (excluding current user and already-friends)
useEffect(() => {
  if (searchTerm.trim() === '') return setSearchResults([]);
  const fetchUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const matches = [];
    usersSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (
        data.username?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        data.uid !== currentUser.uid &&
        !friends.includes(data.uid)
      ) {
        matches.push({ ...data, uid: docSnap.id });
      }
    });
    setSearchResults(matches);
  };
  fetchUsers();
}, [searchTerm, currentUser, friends]);

// Add friend logic
const handleAddFriend = async (userToAdd) => {
  if (!userToAdd || !userToAdd.uid) return;
  // Add each other as friends
  const userRef = doc(db, "users", currentUser.uid);
  const friendRef = doc(db, "users", userToAdd.uid);

  await updateDoc(userRef, {
    friends: [...friends, userToAdd.uid]
  });

  // Also add current user to the other user's friends
  const friendDoc = await getDoc(friendRef);
  const friendFriends = friendDoc.exists() ? (friendDoc.data().friends || []) : [];
  await updateDoc(friendRef, {
    friends: [...friendFriends, currentUser.uid]
  });

  setFriends(prev => [...prev, userToAdd.uid]);
  setAddUserDialog(false);
  setSearchTerm('');
};

useEffect(() => {
  const autoAddToSystemGroup = async () => {
    if (!currentUser?.uid) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      const userType = userData.type?.toLowerCase();

      // Group IDs from Firestore (must already exist!)
      const systemGroups = {
        beta: "bm-beta-testers-group",      // Replace with actual Firestore ID
        "dev beta": "bm-dev-beta-group"   // Replace with actual Firestore ID
      };

      const targetGroupId = systemGroups[userType];
      if (!targetGroupId) return;

      const groupRef = doc(db, "groupChats", targetGroupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) return;

      const groupData = groupSnap.data();

      if (!groupData.members.includes(currentUser.uid)) {
        await updateDoc(groupRef, {
          members: arrayUnion(currentUser.uid)
        });

        // Optionally: send a system message to the group
        await addDoc(collection(db, "groupChat", targetGroupId, "messages"), {
          type: "system",
          content: `${userData.name || "A user"} joined the ${groupData.name} group.`,
          timestamp: serverTimestamp(),
        });

        console.log(`✅ User added to ${groupData.name} group.`);
      }
    } catch (err) {
      console.error("❌ Failed to auto-add user to system group:", err);
    }
  };

  autoAddToSystemGroup();
}, [currentUser]);

// Only show chats with friends
const friendUsers = users.filter(u => friends.includes(u.id));

  if (currentUser === null) {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
        <CircularProgress color={theme.palette.primary.main} />
      </Box>
    </ThemeProvider>
  );
}

const combinedChats = [
  ...friendUsers.map((user) => ({
    type: 'user',
    id: user.id,
    name: nicknames[user.id] || user.name || user.username,
    photoURL: user.photoURL,
    lastMessage: latestMessages[user.id],
    timestamp: latestTimestamps[user.id] || new Date(0),
    unreadCount: unreadCounts[user.id] || 0,
  })),
  ...userGroups.map((group) => ({
    type: 'group',
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    iconURL: group.iconURL || "",
    lastMessage: latestGroupMessages[group.id]?.text,
    timestamp: latestGroupTimestamps[group.id] || new Date(0),
    unreadCount: groupUnreadCounts[group.id] || 0,
  })),
]
  .filter((chat) => chat.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  .sort((a, b) => b.timestamp - a.timestamp);


    if (onlyList) {
    // Only render the combined chats/groups list (no dialogs, no search, no floating button, etc)
    return (
      <div>
        {combinedChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => chat.type === 'user' ? handleSelect(chat.id) : handleGroupClick(chat.id)}
            style={{
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: chat.unreadCount > 0 ? WeatherBgdrop : '#00000000',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
          >
            {chat.type === 'group' ? (
              <Avatar
                src={chat.iconURL ? chat.iconURL : ""}
                sx={{
                  bgcolor: '#f0f0f0',
                  color: '#000',
                  fontSize: 28,
                  width: 48,
                  height: 48,
                  marginRight: 2,
                }}
              >
                  {(chat.iconURL || chat.emoji || chat.name?.[0]?.toUpperCase() || 'G')}
              </Avatar>
            ) : (
              <Avatar
                src={chat.photoURL || 'https://via.placeholder.com/50'}
                alt={chat.name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  marginRight: '20px',
                }}
              />
            )}

            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#FFFFFF' }}>
                {chat.name}
                  {["BM - Beta members", "BM - Dev Beta"].includes(chat.name) && (
                    <span style={{
                      marginLeft: 6,
                      fontSize: 14,
                      backgroundColor: '#00f72133',
                      padding: '2px 6px',
                      borderRadius: 6,
                      color: '#00f721',
                    }}>
                      {chat.name.includes("Dev") ? "🧪 Dev Beta" : "🔒 Beta"}
                    </span>
                  )}
              </p>
              <p
                style={{
                  margin: 0,
                  color: '#BDBDBD',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {(chat.lastMessage?.length > 30
                  ? chat.lastMessage.slice(0, 14) + '...'
                  : chat.lastMessage) || 'No messages yet'}
              </p>
            </div>

            {chat.unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: buttonWeatherBg,
                  color: '#212121',
                  padding: '4px 8px',
                  borderRadius: '50%',
                }}
              >
                {chat.unreadCount}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }


  return (
      <ThemeProvider theme={theme}>
        <DeviceGuard>
                  <BetaAccessGuard>
          <div style={{ padding: '20px', backgroundColor: '#02020200' }}>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
      <IconButton onClick={goBack} sx={{ mr: 2, width: '65px', fontSize: 3, borderRadius: 8, height: '50px', color: mode === "dark" ? "#fff" : "#000", backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0", }}>
        <ArrowBackIcon />
      </IconButton>
     
           <ProfilePic />
      </div>

      <Typography variant="h4" style={{ color: theme.palette.text.primary, fontWeight: "bolder", marginBottom: 12, mr: 2 }}>Chats</Typography>

    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 999,
        background: `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.default}e3, ${theme.palette.background.default}00)`,
        py: 2,
      }}
    >
            <TextField
        fullWidth
        type="text"
        placeholder="Search users or groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          marginBottom: '20px',
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
        LabelInputProps={{ style: { color: theme.palette.text.primary } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: theme.palette.text.primary }} />
            </InputAdornment>
          ),
        }}
      />
    </Box>

      {/* {notification && (
        <div
          style={{
            position: 'fixed',
            display: 'flex',
            flexDirection: 'row',
            top: '20px',
            right: '20px',
            backgroundColor: '#444444ea',
            backdropFilter: 'blur(80px)',
            color: '#f0f0f0',
            padding: '10px 20px',
            borderRadius: '12px',
            width: '80vw',
            height: 'auto',
            mx: "auto",
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.06)',
            fontSize: '14px',
            zIndex: 1000,
          }}
        >
          <Avatar src={notification.photoURL} style={{marginRight: '20px'}}></Avatar><div><strong style={{color: '#fff', fontSize: '16px'}}>{notification.user}</strong> <br></br> {notification.message}</div>
        </div>
      )} */}

      <div>
        
        {combinedChats.map((chat) => (
          
          <div
            key={chat.id}
            onClick={() => chat.type === 'user' ? handleSelect(chat.id) : handleGroupClick(chat.id)}
            onContextMenu={(e) => handleContextMenu(e, chat)}
            style={{
              padding: '12px',
              marginBottom: '10px',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#00000000',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
          >
            {chat.type === 'group' ? (
              <Avatar
                src={chat.iconURL ? chat.iconURL : ""}
                sx={{
                  bgcolor: theme.palette.primary.bg,
                  color: theme.palette.primary.main,
                  fontSize: 28,
                  width: 48,
                  height: 48,
                  marginRight: 2,
                }}
              >
                  {(chat.iconURL || chat.emoji || chat.name?.[0]?.toUpperCase() || 'G')}
              </Avatar>
            ) : (
              <Avatar
                src={chat.photoURL || 'https://via.placeholder.com/50'}
                alt={chat.name}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  marginRight: '20px',
                }}
              />
            )}

            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: theme.palette.text.primary }}>
                {chat.name}
                  {["BM - Beta members", "BM - Dev Beta"].includes(chat.name) && (
                    <span style={{
                      marginLeft: 6,
                      fontSize: 14,
                      backgroundColor: '#00f72133',
                      padding: '2px 6px',
                      borderRadius: 6,
                      color: '#00f721',
                    }}>
                      {chat.name.includes("Dev") ? "🧪 Dev Beta" : "🔒 Beta"}
                    </span>
                  )}
              </p>
              <p
                style={{
                  margin: 0,
                  color: theme.palette.text.secondary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {(chat.lastMessage?.length > 30
                  ? chat.lastMessage.slice(0, 26) + '...'
                  : chat.lastMessage) || 'No messages yet'}
              </p>

              <span style={{ fontSize: '12px', color: '#919191ff' }}>
                {formatTimestamp(chat.timestamp)}
              </span>
            </div>

            {chat.unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: theme.palette.primary.bg,
                  color: theme.palette.primary.main,
                  padding: '4px 8px',
                  borderRadius: '50%',
                }}
              >
                {chat.unreadCount}
              </span>
            )}
          </div>
        ))}

        <Box>
          {/* Floating Add Button */}
<IconButton
  onClick={() => setAddUserDialog(true)}
  sx={{
    position: 'fixed',
    bottom: 20,
    right: 20,
    width: '70px',
    height: '70px',
    background: theme.palette.primary.bg,
    borderRadius: '20px',
    fontSize: '38px',
    color: "#000",
    boxShadow: "none",
  }}
>
  +
</IconButton>

        </Box>
      </div>
<SwipeableDrawer
  anchor="bottom"
  open={membDialogOpen}
  onClose={() => setMembDialogOpen(false)}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      p: 3,
      backgroundColor: mode === "dark" ? "#00000000" : "#f1f1f156",
      backdropFilter: "blur(40px)",
      height: "75vh",
      zIndex: 999,
    },
  }}
>
      <>
        <TextField
          fullWidth
          placeholder="Search by username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            input: { color: mode === "dark" ? "#fff" : "#000" },
            backgroundColor: mode === "dark" ? "#3131314d" : "#d0d0d0a0",
            borderRadius: 1,
            mb: 2,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: mode === "dark" ? "#fff" : "#000" }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ overflowY: "auto", flex: 1 }}>
          {searchResults.map((user) => (
            <Box
              key={user.uid}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                bgcolor: "#1a1a1a3a",
                borderRadius: 2,
                px: 2,
                py: 1.5,
                mb: 1,
              }}
            >
              <Box display="flex" alignItems="center">
                <Avatar src={user.photoURL} sx={{ width: 40, height: 40, mr: 2 }} />
                <Typography color="white">{user.username}</Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                sx={{
                  color: buttonWeatherBg,
                  borderColor: buttonWeatherBg,
                  bgcolor: WeatherBgdrop,
                  borderRadius: 2,
                  px: 2,
                }}
                onClick={() => handleAddFriend(user)}
              >
                <PersonAddIcon sx={{ mr: 1 }} fontSize="small" />
                Add
              </Button>
            </Box>
          ))}
        </Box>
      </>
</SwipeableDrawer>

<Drawer
  anchor="bottom"
  open={groupDialogOpen}
  onClose={() => setGroupDialogOpen(false)}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      p: 3,
      backgroundColor: "#121212",
      height: "75vh",
    },
  }}
>
  <Typography variant="h6" fontWeight="bold" mb={2}>
    Create New Group
  </Typography>

  <TextField
    label="Group Name"
    fullWidth
    value={groupName}
    onChange={(e) => setGroupName(e.target.value)}
    placeholder="Enter group name"
    sx={{ mb: 2 }}
  />

  <TextField
    label="Group Icon (Emoji or Image URL)"
    fullWidth
    value={groupIcon}
    onChange={(e) => setGroupIcon(e.target.value)}
    placeholder="e.g. 😊 or https://img.com/icon.png"
    sx={{ mb: 2 }}
  />

  <TextField
    label="Group Description"
    fullWidth
    multiline
    rows={2}
    value={groupDescription}
    onChange={(e) => setGroupDescription(e.target.value)}
    placeholder="What’s this group about?"
    sx={{ mb: 3 }}
  />

  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
    Members ({selectedFriends.length})
  </Typography>

  <Box
    sx={{
      maxHeight: 180,
      overflowY: "auto",
      mb: 3,
      pr: 1,
      display: "flex",
      flexDirection: "column",
      gap: 1,
    }}
  >
    {selectedFriends.map((friend) => (
      <Box
        key={friend.uid}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 1,
          bgcolor: "#1E1E1E",
          borderRadius: 2,
        }}
      >
        <Avatar src={friend.photoURL || ""} />
        <Box>
          <Typography>{friend.name || friend.username}</Typography>
          <Typography variant="caption" color="text.secondary">
            @{friend.username}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>

  <Button
    variant="contained"
    color="primary"
    fullWidth
    sx={{ py: 1.4, borderRadius: 2, fontWeight: "bold" }}
    onClick={handleCreateGroup}
    disabled={!groupName || selectedFriends.length === 0}
  >
    Create Group
  </Button>
</Drawer>

<Drawer
  anchor="bottom"
  open={addUserDialog}
  onClose={() => setAddUserDialog(false)}
  transitionDuration={400}
  PaperProps={{
    sx: {
      bgcolor: mode === "dark" ? "#00000000" : "#f1f1f1b4",
      backdropFilter: "blur(40px)",
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      height: "100vh",
    },
  }}
>
  <Box sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}>
    {/* Header */}
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="h5" fontWeight="bold" color={theme.palette.text.primary}>
        New Chat
      </Typography>
      <IconButton onClick={() => setAddUserDialog(false)} sx={{ bgcolor: "#1F1F1F" }}>
        <CloseIcon sx={{ color: "#fff" }} />
      </IconButton>
    </Box>

<Box mt={3}>
  <TextField
  fullWidth
  placeholder="Search friends by name or username"
  value={searchFriend}
  onChange={(e) => setSearchFriend(e.target.value)}
  sx={{
    mb: 2,
    input: { color: mode === "dark" ? "#fff" : "#000" },
    backgroundColor: mode === "dark" ? "#1010104d" : "#d0d0d0a0",
  }}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <SearchIcon sx={{ color: "#777" }} />
      </InputAdornment>
    ),
  }}
/>

{!creatingGroup && (
  <Button
    variant="contained"
    fullWidth
    onClick={() => setCreatingGroup(true)}
    sx={{ 
      mb: 2,
      backgroundColor: "rgba(51, 51, 51, 0.0)",
      boxShadow: "none",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "left",
      gap: 2,
      color: mode === "dark" ? "#fff" : "#000"
    }}
  >
    <GroupAddIcon sx={{ p: 1.5, backgroundColor: theme.palette.primary.bg, borderRadius: 8, color: "#000000" }} />
    Create Group
  </Button>
)}

  <Button
    variant="contained"
    fullWidth
    onClick={() => 
      {setMembDialogOpen(true);
      setAddUserDialog(false);}
    }
    sx={{ 
      mb: 2,
      backgroundColor: "rgba(51, 51, 51, 0.0)",
      boxShadow: "none",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "left",
      gap: 2,
      color: mode === "dark" ? "#fff" : "#000"
    }}
  >
    <PersonAddIcon sx={{ p: 1.5, backgroundColor: theme.palette.primary.bg, borderRadius: 8, color: "#000000" }} />
    New Contact
  </Button>

  <Typography variant="subtitle1" color={mode === "dark" ? "#fff" : "#000"} gutterBottom>
    Your Friends
  </Typography>

{filteredFriends.map((friend) => {
  const isSelected = selectedGroupMembers.some((u) => u.uid === friend.uid);

  return (
    <Box
      key={friend.uid}
      onClick={() => {
        if (!creatingGroup) return;

        setSelectedGroupMembers((prev) =>
          isSelected
            ? prev.filter((u) => u.uid !== friend.uid)
            : [...prev, friend]
        );
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2,
        py: 1,
        mb: 1,
        borderRadius: 5,
        backgroundColor: isSelected ? theme.palette.primary.bgr : "#24242401",
        color: isSelected ? "#000" : "#fff",
        cursor: creatingGroup ? "pointer" : "default",
      }}
    >
      <Avatar src={friend.photoURL} />
      <Box>
        <Typography color={theme.palette.text.primary} fontWeight={500}>
          {friend.name || friend.username}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          @{friend.username}
        </Typography>
      </Box>
      {creatingGroup && isSelected && (
        <CheckCircleIcon sx={{ ml: "auto", color: theme.palette.primary.main }} />
      )}
    </Box>
  );
})}

</Box>

{creatingGroup && (
  <Box sx={{ mt: 2, display: "flex", flexDirection: "row", gap: 1 }}>
    <Button
    fullWidth
      variant="outlined"
      onClick={() => {
        setCreatingGroup(false);
        setSelectedGroupMembers([]); // Optional: clear selected
      }}
      sx={{
        py: 1,
        borderRadius: 8,
        backgroundColor: "#ff000005",
        color: "#ffa3a3",
        borderColor: "#ffa3a3",
      }}
    >
      Cancel
    </Button>

        <Button
        fullWidth
      variant="contained"
      disabled={selectedGroupMembers.length === 0}
      onClick={() => {
        setSelectedFriends([...selectedGroupMembers]);
        setGroupDialogOpen(true);
        setAddUserDialog(false);
      }}
      sx={{
        py: 1.5,
        borderRadius: 8,
        bgcolor: theme.palette.primary.bg,
        color: "#000",
        fontWeight: "bold",
        boxShadow: "none",
      }}
    >
      Continue
    </Button>
  </Box>
)}

  </Box>
</Drawer>

<Snackbar
  open={snackbar.open}
  autoHideDuration={3000}
  onClose={handleCloseSnackbar}
  anchorOrigin={{ vertical: "top", horizontal: "center" }}
>
  <MuiAlert
    elevation={6}
    variant="filled"
    onClose={handleCloseSnackbar}
    severity={snackbar.severity}
    sx={{ width: "100%" }}
  >
    {snackbar.message}
  </MuiAlert>
</Snackbar>

<Divider sx={{ mt: 4 }} />
<Box
  sx={{
    mt: 2,
    mb: 4,
    alignContent: "center",
    alignItems: "center",
    textAlign: "center",
    opacity: 0.5,
    fontSize: "0.75rem",
    userSelect: "none",
  }}
>
  <Typography variant="caption" color="text.secondary">
    Your Messages are end-to-end encrypted
  </Typography>
</Box>
          </div>
        </BetaAccessGuard>
        </DeviceGuard>
    </ThemeProvider>
  );
}

export default Chats;