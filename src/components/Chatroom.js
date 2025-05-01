import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Avatar, Typography, TextField, IconButton, CircularProgress,
  AppBar, Toolbar, Paper, Menu, MenuItem, Button
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, getDoc, deleteDoc
} from "firebase/firestore";
import { db, auth } from '../firebase';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function ChatRoom() {
  const { friendId } = useParams();
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [friendDetails, setFriendDetails] = useState({ name: 'Loading...', photoURL: '', status: 'offline' });
  const [editMessageId, setEditMessageId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMsg, setSelectedMsg] = useState(null);

  const chatId = [currentUser.uid, friendId].sort().join('_');
  const history = useNavigate(); // useNavigate provides navigation functions
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userDoc = await getDoc(doc(db, "users", friendId));
      if (userDoc.exists()) setFriendDetails(userDoc.data());
    };
    fetchUserDetails();
  }, [friendId]);

  useEffect(() => {
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        const msg = doc.data();
        msg.id = doc.id;
        msgs.push(msg);
      });
      setMessages(msgs);

      // Trigger notification if chat is out of focus
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.senderId !== currentUser.uid && !document.hasFocus()) {
        setNotification('New message received');
      }

      const lastMessage = msgs[msgs.length - 1];
      if (lastMessage && lastMessage.senderId !== currentUser.uid && !lastMessage.isRead) {
        updateDoc(doc(db, "chats", chatId, "messages", lastMessage.id), {
          isRead: true
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chatId]);

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
    history(-1); // Corrected to use the navigate function with -1
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Box sx={{ backgroundColor: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <AppBar position="static" color="transparent" elevation={1}>
        <Toolbar>
          <IconButton onClick={goBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
          </IconButton>
          <Avatar src={friendDetails.photoURL} alt={friendDetails.name} sx={{ mr: 2 }} />
          <Box>
            <Typography variant="h6" color="text.primary">{friendDetails.name}</Typography>
            <Typography variant="body2" color={friendDetails.status === 'online' ? 'green' : 'gray'}>
              {friendDetails.status}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUser.uid;

          // Check for date separation
          const showDate = index === 0 || getMessageDate(msg.timestamp) !== getMessageDate(messages[index - 1].timestamp);

          return (
            <Box key={msg.id}>
              {showDate && (
                <Typography variant="caption" sx={{ textAlign: 'center', color: 'gray', my: 2 }}>
                  {getMessageDate(msg.timestamp)}
                </Typography>
              )}
              <Box
                onContextMenu={(e) => handleContextMenu(e, msg)}
                onDoubleClick={() => isOwn && handleEdit(msg)}
                sx={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Paper
                  elevation={1}
                  sx={{
                    px: 2, py: 1,
                    maxWidth: '70%',
                    bgcolor: isOwn ? '#5c311f' : '#f1f1f1',
                    color: isOwn ? '#ffffff' : '#000000',
                    borderRadius: 2,
                    position: 'relative'
                  }}
                >
                  <Typography variant="body1">{msg.text}</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'gray', mt: 0.5 }}>
                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  {msg.reaction && (
                    <Typography variant="body2" sx={{ position: 'absolute', bottom: -10, right: 10 }}>
                      {msg.reaction}
                    </Typography>
                  )}
                  {isOwn && (
                    <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                      <DoneAllIcon
                        fontSize="small"
                        sx={{ color: msg.isRead ? '#2196f3' : '#9e9e9e' }}
                      />
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          );
        })}

        <div ref={messagesEndRef} /> {/* Scroll to this point */}
      </Box>

      {/* Input Field */}
      <Box component="form" onSubmit={sendMessage} sx={{
        p: 1,
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid #e0e0e0',
        bgcolor: '#fafafa'
      }}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={editMessageId ? "Editing message..." : "Type your message..."}
          fullWidth
          variant="outlined"
          size="small"
          sx={{ mr: 1 }}
        />
        <IconButton type="submit" color="primary" disabled={isSending}>
          {isSending ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>

      {/* Notification Snackbar */}
      {notification && (
        <Box sx={{
          position: 'fixed', bottom: 20, left: 20, padding: '10px', backgroundColor: '#000',
          color: '#fff', borderRadius: '5px', zIndex: 1000
        }}>
          <Typography variant="body2">{notification}</Typography>
        </Box>
      )}
    </Box>
  );
}

export default ChatRoom;
