import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
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
} from '@mui/material';
import { styled } from '@mui/system';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

// Generate a consistent color per user based on their name
const generateUserColor = (userName) => {
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    hash = userName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = '#' + ((hash >> 24) & 0xffffff).toString(16).padStart(6, '0');
  return color;
};

const MessageContainer = styled(Box)({
    flex: 1,
    overflowY: 'auto',
    padding: '0',
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
    padding: '14px 16px',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    maxWidth: '70%',
    alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
    marginBottom: '12px',
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
    padding: '15px',
    backgroundColor: '#2C387E', // Dark indigo header
    borderBottom: '1px solid rgba(66, 66, 66, 0.16)',
    color: '#FFFFFF',
  });
  
  const InputContainer = styled(Box)({
    display: 'flex',
    padding: '10px',
    backgroundColor: '#1E1E1E00',
    backdropFilter: 'blur(30px)',
    borderTop: '1px solid #42424200',
  });
  
  const TextInput = styled(TextField)({
    flex: 1,
    height: '40px',
    borderRadius: '30px',
    backgroundColor: '#1E1E1E00',
    '& .MuiOutlinedInput-root': {
      borderRadius: '30px',
      color: '#FFFFFF',
      '& fieldset': {
        borderColor: '#424242',
      },
      '&:hover fieldset': {
        borderColor: '#757575',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3F51B5',
      },
    },
    '& input': {
      color: '#FFFFFF',
    },
  });
  
  const SendButton = styled(Button)({
    backgroundColor: '#1ac635',
    color: '#000',
    fontSize: '20px',
    borderRadius: '50px',
    padding: '12px',
    width: '30px',
    height: '40px',
    marginLeft: '10px',
    '&:hover': {
      backgroundColor: '#303F9F',
    },
  });
  

function GroupChat() {
  const { name, groupName } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageStatus, setMessageStatus] = useState({});
  const [groupInfo, setGroupInfo] = useState({});
  const [userColors, setUserColors] = useState({});
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

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
          setGroupInfo(docSnap.data());
        }
      } catch (error) {
        console.error('Failed to fetch group info:', error);
      }
    };

    fetchGroupInfo();

    return () => unsubscribe();
  }, [currentUser, navigate, groupName]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const message = {
      text: newMsg.trim(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
      timestamp: serverTimestamp(),
      status: 'sent',
      read: false,
    };

    const docRef = await addDoc(
      collection(db, 'groupChat', groupName, 'messages'),
      message
    );

    setMessageStatus((prev) => ({
      ...prev,
      [docRef.id]: 'sent',
    }));

    setNewMsg('');
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

  return (
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
            backgroundColor: '#121212e3',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #ccc',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            height: '64px',
            boxShadow: '0 2px 4px rgba(48, 48, 48, 0)',
          }}
        >
          <IconButton onClick={handleBackButton} sx={{ mr: 1 }} style={{color: '#fff'}}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar
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
            {groupEmoji || groupName?.[0]?.toUpperCase() || ''}
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {groupInfo.name || groupName}
            </Typography>
            {groupInfo.createdBy?.name && (
              <Typography variant="caption" sx={{ color: '#888' }}>
                Created by {groupInfo.createdBy.name}
              </Typography>
            )}
          </Box>
        </Box>
      </GroupHeader>

      <Box sx={{
        flexGrow: 1,
        padding: '0',
        paddingTop: '50px',
        overflowY: 'auto',
        marginBottom: '5px', // optional if you have a fixed input/footer
      }}>
        <MessageContainer>
          {loading ? (
            <Typography variant="body1" sx={{ textAlign: 'center', color: '#888' }}>
              Loading messages...
            </Typography>
          ) : (
            Object.keys(groupedMessages).map((date) => (
              <Box key={date} sx={{ marginBottom: '20px' }}>
                <Typography variant="body2" sx={{ color: '#aaa', bgcolor: '#f2f2f2', textAlign: 'center', marginBottom: '10px' }}>
                  {date}
                </Typography>
                {groupedMessages[date].map((msg) => (
                  <Box
                    key={msg.id}
                    sx={{
                      display: 'flex',
                      flexDirection: msg.senderId === currentUser.uid ? 'row-reverse' : 'row',
                      marginBottom: '15px',
                      alignItems: 'flex-end',
                      gap: 1,
                      px: 1
                    }}
                  >
                    <Box sx={{ marginRight: '10px', marginLeft: '10px' }}>
                      <Avatar
                        src={msg.photoURL || ''}
                        alt={msg.senderName}
                        sx={{ width: 40, height: 40 }}
                      >
                        {!msg.photoURL && <AccountCircleIcon sx={{ fontSize: 52, color: '#e8e8e8' }} />}
                      </Avatar>
                    </Box>

                    <MessageBubble isCurrentUser={msg.senderId === currentUser.uid} status={msg.status}>
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
                      <Typography variant="body2">{msg.text}</Typography>
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
                      </Box>
                    </MessageBubble>
                  </Box>
                ))}
              </Box>
            ))
          )}
          <div ref={bottomRef} />
        </MessageContainer>
      </Box>

      <InputContainer>
        <TextInput
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
          variant="outlined"
          size="small"
        />
        <SendButton onClick={sendMessage}>➤</SendButton>
      </InputContainer>
    </Box>
  );
}

export default GroupChat;
