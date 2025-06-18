import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Avatar, Typography, TextField, IconButton, CircularProgress,
  AppBar, Toolbar, Paper, Menu, MenuItem, Slide, Dialog, Divider, SwipeableDrawer, Stack, Chip
} from '@mui/material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Phone, Video, MoreVertical } from 'lucide-react';
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
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, getDoc, getDocs, where, deleteDoc
} from "firebase/firestore";
import { db, auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SaveIcon from '@mui/icons-material/Save';
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
  const [sharedBudgets, setSharedBudgets] = useState([]);

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

  // --- Fetch shared budgets ---
  useEffect(() => {
    const fetchBudgets = async () => {
      if (!currentUser || !friendId) return;
      const q = query(collection(db, "budgets"), where("contributors", "array-contains", currentUser.uid));
      const snapshot = await getDocs(q);
      const shared = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.contributors.includes(friendId)) {
          shared.push({ ...data, id: docSnap.id });
        }
      });
      setSharedBudgets(shared);
    };
    fetchBudgets();
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


  const handleScroll = () => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const atBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 100;
    setIsAtBottom(atBottom);

    if (atBottom) {
      setNewMessagesCount(0); // Reset if user scrolls down
    }
  };

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollEl) scrollEl.removeEventListener('scroll', handleScroll);
    };
  }, []);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const fetchCommonGroupsAndTrips = async () => {
      if (!currentUser || !friendDetails.uid) return;
  
      // Fetch common groups
      const groupQuery = query(
        collection(db, 'groupChats'),
        where('members', 'array-contains', currentUser.uid)
      );
      const groupSnapshot = await getDocs(groupQuery);
      const matchedGroups = groupSnapshot.docs
        .filter(doc => doc.data().members.includes(friendDetails.uid))
        .map(doc => doc.data().name); // or doc.id if you prefer
      setCommonGroups(matchedGroups);
  
      // Fetch common trips
      const tripQuery = query(
        collection(db, 'trips'),
        where('members', 'array-contains', currentUser.uid)
      );
      const tripSnapshot = await getDocs(tripQuery);
      const matchedTrips = tripSnapshot.docs
        .filter(doc => doc.data().members.includes(friendDetails.uid))
        .map(doc => doc.data().name);
      setCommonTrips(matchedTrips);
    };
  
    fetchCommonGroupsAndTrips();
  }, [currentUser, friendDetails.uid]);
  

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
        text: input.trim() + " (edited)",
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
    setInput(msg.text.replace(" (edited)", ""));
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
    <Box sx={{ backgroundColor: '#21212100', height: '98vh', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      
      {/* Header */}
      <AppBar position="fixed" sx={{ backgroundColor: '#01010140', backdropFilter: 'blur(30px)', padding: '10px 0px', zIndex: 1100 }} elevation={1}>
        <Toolbar>
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
        </Toolbar>
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
                      px: 2,
                      py: 1,
                      bgcolor: '#232323',
                      color: '#00f721',
                      borderRadius: '12px',
                      fontStyle: 'italic',
                      fontSize: '0.95em',
                      opacity: 0.85,
                      boxShadow: 'none'
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
                      }}
                    >
                      {msg.timestamp?.toDate().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
                          bgcolor: '#222',
                          borderRadius: '12px',
                          px: 1,
                          py: 0.6,
                          boxShadow: '0 2px 8px #0004',
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
                              padding: '10px 1px',
                            }}
                            onClick={(e) => {
                              setReactionAnchorEl(e.currentTarget);
                              setReactionMsg(msg);
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    {isOwn && (
                      <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                        <DoneAllIcon
                          fontSize="small"
                          sx={{ color: msg.isRead ? '#0099ff' : '#BDBDBD' }}
                        />
                      </Box>
                    )}
                  </Paper>
                  {!isAtBottom && newMessagesCount > 0 && (
                    <button
                      className="scroll-to-bottom-btn"
                      onClick={() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

      {/* Input Field */}
      <Box
        component="form"
        onSubmit={sendMessage}
        sx={{
          p: 1,
          display: 'flex',
          position: 'fixed',
          bottom: 0,
          width: '94vw',
          alignItems: 'center',
          borderTop: '0px solid #5E5E5E',
          bgcolor: '#01010140',
          backdropFilter: 'blur(30px)'
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
            zIndex: '1100',
            mr: 1,
            borderRadius: '40px',
            input: {
              color: '#FFFFFF',
              height: '40px',
              borderRadius: '40px'
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
        <IconButton type="submit" sx={{ backgroundColor: '#00f721', height: '50px', width: '50px' }} disabled={isSending}>
          {isSending ? <CircularProgress size={24} sx={{ color: '#000' }} /> : <SendIcon sx={{ color: '#000' }} />}
        </IconButton>
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            minWidth: 170,
            borderRadius: 2,
            bgcolor: "#181818",
            color: "#fff",
            boxShadow: "0 4px 24px #000a",
            p: 0.5,
          },
        }}
      >
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
              sx={{ color: "#ff4444", fontWeight: 500, fontSize: 15 }}
            >
              🗑️ Delete
            </MenuItem>
          </>
        )}
        <Divider sx={{ my: 0.5, bgcolor: "#333" }} />
        <MenuItem
          onClick={() => {
            handleReaction('❤️');
            handleMenuClose();
          }}
          sx={{ fontSize: 15 }}
        >
          ❤️ React
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleReaction('😂');
            handleMenuClose();
          }}
          sx={{ fontSize: 15 }}
        >
          😂 React
        </MenuItem>
        <MenuItem
          onClick={() => {
            navigator.clipboard.writeText(selectedMsg?.text || "");
            setNotification("Message copied!");
            handleMenuClose();
          }}
          sx={{ fontSize: 15 }}
        >
          📋 Copy Text
        </MenuItem>
        {selectedMsg?.text && selectedMsg.text.length > 10 && (
          <MenuItem
            onClick={() => {
              window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedMsg.text)}`, "_blank");
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
            <MenuItem key={emoji} disabled>
              {emoji} {users.includes(currentUser.uid) ? "(You)" : ""}
            </MenuItem>
          ))}
        <Divider sx={{ my: 0.5, bgcolor: "#333" }} />
        <MenuItem
          onClick={() => setShowEmojiPicker(true)}
          sx={{ fontSize: 15, display: 'flex', alignItems: 'center' }}
        >
          <EmojiEmotionsIcon sx={{ mr: 1 }} /> Add Reaction
        </MenuItem>
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
        PaperProps={{
          sx: {
            bgcolor: '#222',
            borderRadius: 3,
            boxShadow: '0 4px 24px #000a',
            p: 1,
          }
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
              bottom: 20,
              left: 20,
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
          <SwipeableDrawer
            anchor="bottom"
            open={openProfile}
            onClose={() => setOpenProfile(false)}
            onOpen={() => {}}
            PaperProps={{
              sx: {
                height: '85vh',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                backgroundColor: '#0c0c0c0a',
                backdropFilter: 'blur(70px)',
                color: '#fff',
              }
            }}
          >
            <Box sx={{ p: 3, position: 'relative', height: '100%', overflowY: 'auto' }}>
              {/* Drag Indicator */}
              <Box sx={{ width: 40, height: 5, backgroundColor: '#555', borderRadius: 3, mx: 'auto', mb: 2 }} />

              {/* Close Button */}
              <IconButton
                onClick={() => setOpenProfile(false)}
                sx={{ position: 'absolute', top: 10, right: 10, color: '#ccc' }}
              >
                <CloseIcon />
              </IconButton>

              {/* Profile Content */}
              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', mt: 2 }}>
                <Avatar
                  src={friendDetails.photoURL}
                  sx={{ width: 90, height: 90, mb: 2 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  {friendDetails.name}
                </Typography>
                <Typography variant="subtitle1" sx={{ color: '#aaa', mb: 0.5 }}>
                  @{friendDetails.username}
                </Typography>
                {friendDetails.email && (
                  <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                    <strong>Email:</strong> {friendDetails.email}
                  </Typography>
                )}
                {friendDetails.phone && (
                  <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                    <strong>Phone:</strong> {friendDetails.phone}
                  </Typography>
                )}
                {friendDetails.bio && (
                  <Typography variant="body2" sx={{ color: '#aaa', mb: 0.5 }}>
                    <strong>Bio:</strong> {friendDetails.bio}
                  </Typography>
                )}
                {/* Show common groups and trips if available */}
                {commonGroups && commonGroups.length > 0 && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', mb: 0.5 }}>Common Groups:</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {commonGroups.map((group, i) => (
                        <Chip key={i} label={group} size="small" sx={{ bgcolor: '#222', color: '#fff' }} />
                      ))}
                    </Stack>
                  </Box>
                )}
                {commonTrips && commonTrips.length > 0 && (
                  <Box sx={{ width: '100%', mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', mb: 0.5 }}>Common Trips:</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {commonTrips.map((trip, i) => (
                        <Chip key={i} label={trip} size="small" sx={{ bgcolor: '#222', color: '#fff' }} />
                      ))}
                    </Stack>
                  </Box>
                )}
                <Box sx={{ width: '100%', mt: 2, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: '#fff', mb: 0.5 }}>Nickname:</Typography>
                  {editNickname ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ bgcolor: '#222', borderRadius: 1, input: { color: '#fff' } }}
                      />
                      <IconButton onClick={handleSaveNickname} color="success">
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={() => { setEditNickname(false); setNickname(nickname); }} color="error">
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ color: '#aaa' }}>
                        {nickname || <span style={{ color: '#555' }}>No nickname set</span>}
                      </Typography>
                      <IconButton onClick={() => setEditNickname(true)} color="primary" size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {/* Shared Budgets */}
                {sharedBudgets.length > 0 && (
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#fff', mb: 0.5 }}>Shared Budgets:</Typography>
                    <Stack direction="column" spacing={1}>
                      {sharedBudgets.map(budget => (
                        <Paper
                          key={budget.id}
                          sx={{
                            bgcolor: '#1a1a1a',
                            color: '#fff',
                            p: 2,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: '#222' }
                          }}
                          onClick={() => handleBudgetClick(budget.id)}
                          elevation={2}
                        >
                          <CreditCardIcon sx={{ mr: 2, color: '#00f721' }} />
                          <Box>
                            <Typography variant="subtitle1" sx={{ color: '#fff' }}>{budget.name}</Typography>
                            <Typography variant="body2" sx={{ color: '#aaa' }}>
                              Contributors: {budget.contributors.length}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 2 }}>
                  <IconButton
                    color="primary"
                    sx={{ bgcolor: '#222', color: '#00e676', borderRadius: 2 }}
                    onClick={() => window.open(`mailto:${friendDetails.email}`, '_blank')}
                    disabled={!friendDetails.email}
                  >
                    <EmailOutlinedIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    sx={{ bgcolor: '#222', color: '#00b0ff', borderRadius: 2 }}
                    onClick={() => window.open(`tel:${friendDetails.phone}`, '_blank')}
                    disabled={!friendDetails.phone}
                  >
                    <PhoneOutlinedIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    sx={{ bgcolor: '#222', color: '#fff', borderRadius: 2 }}
                    onClick={() => setOpenProfile(false)}
                  >
                    <ChatOutlinedIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    sx={{ bgcolor: '#222', borderRadius: 2 }}
                    onClick={handleClearChat}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    sx={{ bgcolor: '#222', borderRadius: 2 }}
                    onClick={handleRemoveFriend}
                  >
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                </Stack>
              </Box>
            </Box>
          </SwipeableDrawer>
        </motion.div>
      </Box>
    </Box>
  );
}

export default ChatRoom;