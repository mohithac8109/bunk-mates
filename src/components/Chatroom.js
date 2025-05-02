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
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, getDoc, getDocs, where, deleteDoc
} from "firebase/firestore";
import { db, auth } from '../firebase';
import { onAuthStateChanged } from "firebase/auth";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

  const handleReaction = async (reaction) => {
    if (selectedMsg) {
      await updateDoc(doc(db, "chats", chatId, "messages", selectedMsg.id), {
        reaction
      });
      handleMenuClose();
    }
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
            <Typography variant="h6" color="#fff" fontSize="18px">{friendDetails.name}</Typography>
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

          {msg.reaction && (
            <Typography
              variant="body2"
              sx={{
                position: 'absolute',
                backgroundColor: '#272727',
                width: '18px',
                borderRadius: '40px',
                bottom: -10,
                right: 10,
              }}
            >
              {msg.reaction}
            </Typography>
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
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { setReplyingTo(selectedMsg); handleMenuClose();}}>Reply</MenuItem>
        <MenuItem onClick={() => handleEdit(selectedMsg)}>Edit</MenuItem>
        <MenuItem onClick={() => handleDelete(selectedMsg?.id)}>Delete</MenuItem>
        <MenuItem onClick={() => handleReaction('❤️')}>❤️ React</MenuItem>
        <MenuItem onClick={() => handleReaction('😂')}>😂 React</MenuItem>
      </Menu>

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
      backgroundColor: '#121212',
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
      <Typography variant="h6">{friendDetails.name}</Typography>
      <Typography variant="subtitle1" sx={{ color: '#aaa' }}>@{friendDetails.username}</Typography>
      <Typography variant="body2" sx={{ color: friendDetails.status === 'online' ? '#00e676' : '#888' }}>
        {friendDetails.status}
      </Typography>
    </Box>

    <Divider sx={{ my: 3, backgroundColor: '#333' }} />

    {/* Common Groups */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>Common Groups</Typography>
      {commonGroups.length > 0 ? (
        commonGroups.map(group => (
          <Typography key={group} sx={{ my: 0.5 }}>• {group}</Typography>
        ))
      ) : (
        <Typography sx={{ color: '#888' }}>No common groups</Typography>
      )}
    </Box>

    {/* Trips Together */}
    <Box>
      <Typography variant="h6" gutterBottom>Trips Together</Typography>
      {commonTrips.length > 0 ? (
        commonTrips.map(trip => (
          <Typography key={trip} sx={{ my: 0.5 }}>• {trip}</Typography>
        ))
      ) : (
        <Typography sx={{ color: '#888' }}>No trips together</Typography>
      )}
    </Box>
  </Box>
</SwipeableDrawer>
</motion.div>
      </Box>
    </Box>
  );
}

export default ChatRoom;
