import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Avatar, Typography, TextField, IconButton, CircularProgress,
  AppBar, Toolbar, Paper, Menu, MenuItem
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
  const history = useNavigate();
  const messagesEndRef = useRef(null);

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

      const lastMessage = msgs[msgs.length - 1];
      if (lastMessage && lastMessage.senderId !== currentUser.uid && !lastMessage.isRead) {
        updateDoc(doc(db, "chats", chatId, "messages", lastMessage.id), {
          isRead: true
        });
      }
    });
    return () => unsubscribe();
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
    history(-1);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <Box sx={{ backgroundColor: '#21212100', height: '98vh', display: 'flex', flexDirection: 'column', color: '#fff' }}>
      
      {/* Header */}
      <AppBar position="fixed" sx={{ backgroundColor: '#0000009c', backdropFilter: 'blur(30px)', padding: '10px 0px', zIndex: 1100 }} elevation={1}>
        <Toolbar>
          <IconButton onClick={goBack} sx={{ mr: 1, color: '#fff' }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar src={friendDetails.photoURL} alt={friendDetails.name} sx={{ mr: 2, height: '50px', width: '50px' }} />
          <Box>
            <Typography variant="h6" color="#fff" fontSize="18px">{friendDetails.name}</Typography>
            <Typography variant="h6" color="#d1d1d1" fontSize="13px">@{friendDetails.username}</Typography>
            <Typography variant="body2" sx={{ color: friendDetails.status === 'online' ? '#AEEA00' : '#BDBDBD' }}>
              {friendDetails.status}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        p: 2,
        pt: '72px',
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#5E5E5E',
          borderRadius: '4px'
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent'
        }
      }}>
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUser.uid;
          const showDate = index === 0 || getMessageDate(msg.timestamp) !== getMessageDate(messages[index - 1].timestamp);

          return (
            <Box key={msg.id}>
              {showDate && (
                <Typography variant="caption" sx={{ textAlign: 'center', color: '#BDBDBD', my: 2 }}>
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
                    bgcolor: isOwn ? '#005c4b' : '#353535',
                    borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    color: '#FFFFFF',
                    position: 'relative'
                  }}
                >
                  <Typography variant="body1">{msg.text}</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#BDBDBD', mt: 0.5 }}>
                    {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                  {msg.reaction && (
                    <Typography variant="body2" sx={{ position: 'absolute', backgroundColor: '#272727', width: '18px', borderRadius: '40px', bottom: -10, right: 10 }}>
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
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input Field */}
      <Box
        component="form"
        onSubmit={sendMessage}
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          borderTop: '0px solid #5E5E5E',
          bgcolor: '#30303000',
          backdropFilter: 'blur(10px)',
          borderRadius: '40px'
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
        <MenuItem onClick={() => handleEdit(selectedMsg)}>Edit</MenuItem>
        <MenuItem onClick={() => handleDelete(selectedMsg?.id)}>Delete</MenuItem>
        <MenuItem onClick={() => handleReaction('❤️')}>❤️ React</MenuItem>
        <MenuItem onClick={() => handleReaction('😂')}>😂 React</MenuItem>
      </Menu>

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
