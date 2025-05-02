import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
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
} from '@mui/material';
import { styled } from '@mui/system';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';


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
  
  const InputContainer = styled(Box)({
    display: 'flex',
    position: 'fixed',
    bottom: '0',
    width: '95.5vw',
    padding: '10px',
    backgroundColor: '#21212100',
    backdropFilter: 'blur(40px)',
    borderTop: '1px solid #42424200',
  });
  
  const TextInput = styled(TextField)({
    flex: 1,
    height: '50px',
    borderRadius: '30px',
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
      height: '35px'
    },
  });
  
  const SendButton = styled(Button)({
    backgroundColor: '#1ac635',
    color: '#000',
    fontSize: '20px',
    borderRadius: '50px',
    padding: '12px',
    width: '40px',
    height: '40px',
    marginLeft: '10px',
    '&:hover': {
      backgroundColor: '#0c5c18',
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
  const [createdByUser, setCreatedByUser] = useState(null);
  const [memberUsers, setMemberUsers] = useState([]);
  const currentUser = auth.currentUser;
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const messageContainerRef = useRef(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupId, setGroupId] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, message: null });
  const [replyTo, setReplyTo] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const controls = useAnimation();
  
    
    const handleExitGroup = async () => {
      const user = auth.currentUser;
      if (!user || !groupId) return;
    
      try {
        const groupRef = doc(db, 'groupChats', groupId); // <-- 'groupChats' used as the collection
    
        // Remove user from 'members' array
        await updateDoc(groupRef, {
          members: arrayRemove(user.uid),
        });
    
        console.log('User exited the group.');
    
        // Optional: Navigate away or update state
        navigate('/chats'); // Or setGroupOpen(false), etc.
      } catch (error) {
        console.error('Failed to exit group:', error.message);
      }
    };
    


  async function addUsersToGroup(users) {
    try {
      // Assume `groupId` is the ID of your group
      const groupRef = doc(db, 'groups', groupId);
  
      // Update the group document by adding the selected users to the 'members' array
      await updateDoc(groupRef, {
        members: arrayUnion(...users.map(user => user.uid)),
      });
  
      console.log('Users added successfully!');
    } catch (error) {
      console.error('Error adding users to group: ', error);
    }
  }

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
  
  const handleDelete = (messageId) => {
    // Implement actual delete logic here with Firebase
    console.log(`Deleted message: ${messageId}`);
    setContextMenu({ ...contextMenu, visible: false });
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
            backgroundColor: '#21212100',
            backdropFilter: 'blur(40px)',
            borderBottom: '1px solid #ccccc00',
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
          <Box
          onClick={() => setProfileOpen(true)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          >
          <Avatar
            onClick={() => setProfileOpen(true)}
            sx={{
              bgcolor: '#333333',
              color: '#000',
              fontSize: 24,
              width: 48,
              height: 48,
              border: '2px solid rgb(7, 7, 7)',
              marginRight: 2,
              cursor: 'pointer',
            }}
          >
            {groupEmoji || groupName?.[0]?.toUpperCase() || ''}
          </Avatar>
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', alignItems: 'center', textOverflow: 'ellipsis' }}
            >
              {groupInfo.name || groupName}
            </Typography>
          </Box>
          </Box>
        </Box>
      </GroupHeader>


      <Box sx={{
        flexGrow: 1,
        paddingTop: '60px',
        overflowY: 'auto',
        marginBottom: '0px', // optional if you have a fixed input/footer
      }}>
        <MessageContainer>


        <Box sx={{ display: 'flex', flexDirection: 'column', margin: '20px', backgroundColor: '#009b5912', borderRadius: '20px', alignItems: 'center', textAlign: 'center', padding: '25px', border: '1.2px solid #009b59ad', maxWidth: '100%' }}>
        <Avatar
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
            {groupEmoji || groupName?.[0]?.toUpperCase() || ''}
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
  </Typography>

  {createdByUser && (
    <Typography variant="caption" sx={{ color: '#B0BEC5', mb: 0.5 }}>
      <strong sx={{color: '#fff'}}>Created by:</strong> {createdByUser.name}
    </Typography>
  )}

  <Typography variant="caption" sx={{ color: '#B0BEC5' }}>
  <br></br><strong sx={{color: '#fff'}}>{groupInfo.members?.length || 0} Members</strong>
  </Typography>

  <Typography variant="caption" sx={{ color: '#B0BEC5' }}>
  <br></br><strong sx={{color: '#fff'}}>Members Joined:</strong><br></br> {memberUsers.map((user) => user.name).join(', ') || 'None'}
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
                {groupedMessages[date].map((msg) => (
                    
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
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true,
      message: msg,
    });
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
                      <Typography variant="body2">{msg.text}</Typography>
                      
                      
    <Box sx={{ mt: 1 }}>
      {msg.reactions &&
        Object.entries(msg.reactions).map(([uid, emoji]) => (
          <span key={uid} style={{ marginRight: 6 }}>{emoji}</span>
        ))}
    </Box>

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
                    </motion.div>
                  </Box>
                ))}
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

{contextMenu.visible && (
  <Box
    sx={{
      position: 'fixed',
      top: contextMenu.y,
      left: contextMenu.x,
      bgcolor: '#2b2b2b',
      borderRadius: 2,
      boxShadow: 4,
      zIndex: 1300,
      p: 1,
    }}
    onMouseLeave={() => setContextMenu({ ...contextMenu, visible: false })}
  >
    <Button onClick={() => handleReply(contextMenu.message)}>Reply</Button>
    <Button onClick={() => handleAddReaction(contextMenu.message, '❤️')}>❤️</Button>
    <Button onClick={() => handleDelete(contextMenu.message.id)} color="error">Delete</Button>
  </Box>
)}
          <div ref={bottomRef} />
        </MessageContainer>
      </Box>
    
      {replyTo && (
    <Paper sx={{ p: 1, position: 'relative', bottom: '55px', width: '95vw', bgcolor: '#2b2b2bb0', mb: 1, borderLeft: '4px solid #00f721', backdropFilter: 'blur(30px)' }}>
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
  
      <InputContainer>
        <TextInput
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
          variant="outlined"
          size="small"
        />
        <SendButton sx={{ backgroundColor: '#00f721', height: '50px', width: '50px' }} onClick={sendMessage}>
        <SendIcon sx={{ color: '#000' }} />
        </SendButton>
      </InputContainer>



      <Box>
  {profileOpen && (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <SwipeableDrawer
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
            height: '85vh',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
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
        <Box sx={{ p: 3, height: '100%', position: 'relative', overflowY: 'auto' }}>
          {/* Drag Indicator */}
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

          {/* Close Button */}
          <IconButton
            onClick={() => setProfileOpen(false)}
            sx={{ position: 'absolute', top: 10, right: 10, color: '#ccc' }}
          >
            <CloseIcon />
          </IconButton>

          {/* Profile Content */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', mt: 4 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                fontSize: '48px',
                mb: 2,
                boxShadow: '0 0 15px rgba(26, 26, 26, 0.37)',
              }}
            >
              {groupEmoji || groupName?.[0]?.toUpperCase() || ''}
            </Avatar>

            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {groupInfo.name || groupName}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: '#00e676',
                fontWeight: 500,
              }}
            >
              {groupInfo.members?.length || 0} Members
            </Typography><br></br>

            {createdByUser && (
              <Typography variant="subtitle1" sx={{ color: '#bbb', mb: 1 }}>
                <strong>Created by:</strong> @{createdByUser.username}
              </Typography>
            )}

            {/* Members List */}
            <List sx={{ width: '100%', maxHeight: '60vh', overflowY: 'auto' }}>

  {/* Other Members */}
  {memberUsers.length > 0 ? (
    memberUsers
    ?.filter((user) => user.id == createdByUser?.id)
    .map((user) => (
      <ListItem
        key={user.id}
        button
        onClick={() => navigate(`/chat/${user.id}`)}
        sx={{
            backgroundColor: '#131313ba',
            marginBottom: '10px',
            borderRadius: '20px'
        }}
      >
        <ListItemAvatar>
          <Avatar src={user.photoURL}>
            {user.name?.[0]?.toUpperCase()}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
            sx={{ color: '#fff' }}
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 500, color: '#fff' }}>
                {user.name}
              </Typography>
            </Box>
          }
          secondary={
            <Typography sx={{ color: '#bdbebf', fontSize: '12px' }}>
              @{user.username}
            </Typography>
          }
        />
      </ListItem>
    ))
  ) : (
    <Typography variant="body2" sx={{ color: '#ccc', textAlign: 'center', mt: 2 }}>
      No members found.
    </Typography>
  )}
</List>

          </Box>
        </Box>
      </SwipeableDrawer>
    </motion.div>
  )}
</Box>
    </Box>
  );
}

export default GroupChat;