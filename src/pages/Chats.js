import React, { useEffect, useState, useCallback } from 'react';
import { auth, db } from '../firebase';
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
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Avatar, useTheme, IconButton, Dialog, createTheme, keyframes, Slide, Box, Typography, TextField, Button, ThemeProvider } from '@mui/material';
import { format, isToday, isYesterday } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CloseIcon from '@mui/icons-material/Close';
import ProfilePic from '../components/Profile';
import { weatherGradients, weatherColors, weatherbgColors, weatherIcons } from "../elements/weatherTheme";
import { useWeather } from "../contexts/WeatherContext";
import { Theme } from 'emoji-picker-react';
import { useSettings } from "../contexts/SettingsContext";
import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";

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
      main: "#00f721", // bright green solid for buttons and accents
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
      hover: "#00f721", // bright green hover for interactive elements
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
  const currentUser = auth.currentUser;
  const { weather, setWeather, weatherLoading, setWeatherLoading } = useWeather();
  const { settings, setTheme, setAccent, setAutoAccent } = useSettings();
  const [dynamicTheme, setDynamicTheme] = useState(theme);

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
    if (!groupName.trim() || selectedUsers.length === 0) return;
  
    const groupData = {
      name: groupName,
      emoji: groupEmoji,
      members: [...selectedUsers.map(u => u.uid), currentUser.uid],
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    };

    const groupRef = await addDoc(collection(db, 'groupChats'), groupData);
    setAddUserDialog(false);
    setGroupDialog(false);
    setSelectedUsers([]);
    setGroupName('');
    setGroupEmoji('💬');
  };

  useEffect(() => {
    const unsubs = onSnapshot(doc(db, "userChats", currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const chatsData = docSnap.data();
        const sortedChats = Object.entries(chatsData).sort((a, b) => b[1].date?.seconds - a[1].date?.seconds);
        setUsers(sortedChats.map(([chatId, data]) => ({
          ...data.userInfo,
          chatId,
          lastMessage: data.lastMessage?.text || '',
        })));
      }
    });
  
    return () => unsubs();
  }, []);
  
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
      const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'desc'), limit(1));

      return onSnapshot(q, (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          const msg = data.text || 'No messages yet';
          const ts = data.timestamp?.toDate?.() || new Date(0);
          const unread = data.senderId !== currentUser.uid && !data.isRead ? 1 : 0;

          setLatestMessages((prev) => ({ ...prev, [user.id]: msg }));
          setUnreadCounts((prev) => ({ ...prev, [user.id]: unread }));
          setLatestTimestamps((prev) => ({ ...prev, [user.id]: ts }));

          if (unread) {
            setNotification({ user: user.name || user.username, message: msg });
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
      const q = query(collection(db, 'groupChat', group.id, 'messages'), orderBy('timestamp', 'desc'), limit(1));

      return onSnapshot(q, (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          const msg = {
            text: data.text || 'No messages yet',
            senderName: data.senderName || 'Unknown',
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
    history(-1);
  };


  const handleSelect = async (userId) => {
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

// Only show chats with friends
const friendUsers = users.filter(u => friends.includes(u.id));


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
              backgroundColor: chat.unreadCount > 0 ? "#232526" : '#00000000',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
          >
            {chat.type === 'group' ? (
              <Avatar
                sx={{
                  bgcolor: '#f0f0f0',
                  color: '#000',
                  fontSize: 28,
                  width: 48,
                  height: 48,
                  marginRight: 2,
                }}
              >
                {chat.emoji || chat.name?.[0]?.toUpperCase() || ''}
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
              </p>
              <p style={{ margin: 0, color: '#BDBDBD' }}>
                {chat.lastMessage || 'No messages yet'}
              </p>
            </div>

            {chat.unreadCount > 0 && (
              <span
                style={{
                  backgroundColor: "#00f721",
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
          <div style={{ padding: '10px', backgroundColor: '#02020200' }}>
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
      <IconButton onClick={goBack} sx={{ mr: 2, width: '65px', fontSize: 3, borderRadius: 2, height: '50px', color: "#fff", backgroundColor: "#f1f1f111", }}>
        <ArrowBackIcon />
      </IconButton>
     
           <ProfilePic />
      </div>

      <Typography variant="h4" style={{ color: '#FFFFFF', fontWeight: "bolder", marginBottom: 12, mr: 2 }}>Chats</Typography>

      <input
        type="text"
        placeholder="Search users or groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: '14px 10px',
          width: '93%',
          marginBottom: '20px',
          borderRadius: '12px',
          backgroundColor: '#101010',
          color: '#fff',
          border: '1px solid rgb(24, 24, 24)',
        }}
        LabelInputProps={{ style: { color: '#fff' } }}
        InputProps={{ style: { color: '#fff' } }}
      />

      {notification && (
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
            width: '330px',
            height: 'auto',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.06)',
            fontSize: '14px',
            zIndex: 1000,
          }}
        >
          <Avatar src={notification.photoURL} style={{marginRight: '20px'}}></Avatar><div><strong style={{color: '#fff', fontSize: '16px'}}>{notification.user}</strong> <br></br> {notification.message}</div>
        </div>
      )}

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
              backgroundColor: chat.unreadCount > 0 ? WeatherBgdrop : '#00000000',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
            }}
          >
            {chat.type === 'group' ? (
              <Avatar
                sx={{
                  bgcolor: '#f0f0f0',
                  color: '#000',
                  fontSize: 28,
                  width: 48,
                  height: 48,
                  marginRight: 2,
                }}
              >
                {chat.emoji || chat.name?.[0]?.toUpperCase() || ''}
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
              </p>
              <p style={{ margin: 0, color: '#BDBDBD' }}>
                {chat.lastMessage || 'No messages yet'}
              </p>
              <span style={{ fontSize: '12px', color: '#BDBDBD' }}>
                {formatTimestamp(chat.timestamp)}
              </span>
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
    background: buttonWeatherBg,
    borderRadius: '15px',
    fontSize: '38px',
    color: "#000",
    boxShadow: 4,
    '&:hover': { background: buttonWeatherBg }
  }}
>
  +
</IconButton>

        </Box>
      </div>

      <Dialog open={groupDialog} backgroundColor="#000000" onClose={() => setGroupDialog(false)} fullWidth maxWidth="sm">
  <Box sx={{ bgcolor: '#0c0c0c', border: '1px solid 101010', p: 3 }}>
    <Typography variant="h6" color="#fff" sx={{ mb: 2 }}>Group Details</Typography>

    <TextField
      fullWidth
      label="Group Name"
      value={groupName}
      onChange={(e) => setGroupName(e.target.value)}
      sx={{ input: { color: '#fff', backgroundColor: '#1a1a1a', borderRadius: '10px' }, label: { color: '#fff' }, mb: 2 }}
    />


<Typography color="#fff" sx={{ ml: 2 }}>Group Emoji</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <EmojiEmotionsIcon sx={{ color: '#fff', mr: 1 }} />
      <TextField
        value={groupEmoji}
        onChange={(e) => setGroupEmoji(e.target.value)}
        sx={{ width: 60, input: { color: '#fff', backgroundColor: '#1a1a1a', borderRadius: '10px', width: '300px' } }}
      />
    </Box>

    <Typography variant="subtitle2" color="#fff">Members:</Typography>
    {selectedUsers.map(user => (
      <Box key={user.uid} sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
        <Avatar src={user.photoURL} sx={{ mr: 1 }} />
        <Typography color="#fff">{user.username}</Typography>
      </Box>
    ))}

    <Button
      variant="contained"
      fullWidth
      sx={{ mt: 3, bgcolor: buttonWeatherBg, color: '#000' }}
      onClick={handleCreateGroup}
    >
      Confirm & Create Group
    </Button>
  </Box>
</Dialog>


<Dialog
  fullScreen
  open={addUserDialog}
  onClose={() => setAddUserDialog(false)}
  TransitionComponent={Slide}
>
  <Box sx={{ bgcolor: '#0c0c0c', height: '100vh', p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="h6" fontSize="28px" color="white"><strong>Start New Group</strong></Typography>
      <IconButton sx={{bgcolor: '#2c2c2c', width: '45px' }} onClick={() => setAddUserDialog(false)}><CloseIcon sx={{ color: '#fff' }} /></IconButton>
    </Box>

    <TextField
      fullWidth
      placeholder="Search by username"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      sx={{ mb: 2, input: { color: '#fff' },
      padding: '1px 10px',
      width: '93%',
      marginBottom: '20px',
      borderRadius: '12px',
      backgroundColor: '#101010',
      border: '1px solid rgb(24, 24, 24)', }}
    />

    {searchResults.map(user => (
      <Box key={user.uid} sx={{ display: 'flex', alignItems: 'center', mb: 1, bgcolor: '#131313', padding: '10px', borderRadius: '20px' }}>
        <Avatar src={user.photoURL} sx={{ mr: 2 }} />
        <Typography color="#fff" sx={{ flex: 1 }}>{user.username}</Typography>
        <Button variant="outlined" sx={{ mr: 1, color: buttonWeatherBg, backgroundColor: WeatherBgdrop, borderColor: buttonWeatherBg, borderRadius: '10px' }} onClick={() => handleAddUser(user)}>Group</Button>
        <Button
          variant="outlined"
          sx={{ mr: 1, color: buttonWeatherBg, backgroundColor: WeatherBgdrop, borderColor: buttonWeatherBg, borderRadius: '10px' }}
          onClick={() => handleAddFriend(user)}
        >
          Add Friend
        </Button>
      </Box>
    ))}

    <Box sx={{ mt: 2 }}>
      <Typography color="#fff" variant="subtitle1">Selected Users:</Typography>
      {selectedUsers.map(user => (
        <Box key={user.uid} sx={{ display: 'flex', alignItems: 'center', my: 1, bgcolor: '#131313', padding: '10px', borderRadius: '20px' }}>
          <Avatar src={user.photoURL} sx={{ mr: 1 }} />
          <Typography color="#fff" sx={{ flex: 1 }}>{user.username}</Typography>
          <IconButton onClick={() => handleRemoveUser(user.uid)}><CloseIcon sx={{ color: buttonWeatherBg, backgroundColor: WeatherBgdrop, borderColor: buttonWeatherBg, borderRadius: '10px' }} /></IconButton>
        </Box>
      ))}
    </Box>

    <Button
      variant="contained"
      sx={{ mt: 4, bgcolor: buttonWeatherBg, color: '#000' }}
      onClick={() => setGroupDialog(true)}
      disabled={selectedUsers.length === 0}
    >
      Create Group Chat
    </Button>
  </Box>
</Dialog>

    </div>

    </ThemeProvider>
  );
}

export default Chats;