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
  getDocs,
  updateDoc,
  arrayUnion,
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
    padding: '0',
    backgroundColor: '#2C387E00', // Dark indigo header
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
    height: '50px',
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
  
    // useEffect(() => {
    //   // Fetch the groupId from a data source or route params
    //   const fetchGroupId = async () => {
    //     const fetchedGroupId = await fetchGroupIdFromSomeSource(); // Replace with actual fetching logic
    //     setGroupId(fetchedGroupId);
    //   };
  
    //   fetchGroupId();
    // }, []);
  
    // // Make sure to check if the groupId is available before using it
    // if (!groupId) return <div>Loading...</div>;

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
            backgroundColor: '#121212b0',
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
              <Box key={date} sx={{ marginBottom: '20px' }}>
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
                      px: 1
                    }}
                  >
                    <Box sx={{ marginRight: '4px', marginLeft: '4px' }}>
                      <Avatar
                        src={msg.photoURL || 'https://via.placeholder.com/50'}
                        alt={msg.senderName}
                        sx={{ width: 40, height: 40 }}
                      >
                        {msg.photoURL && <AccountCircleIcon sx={{ fontSize: 52, color: '#e8e8e8' }} />}
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
            backgroundColor: 'rgba(12, 12, 12, 0.6)',
            backdropFilter: 'blur(20px)',
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
                mb: 2,
                boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)',
              }}
            >
              {groupEmoji || groupName?.[0]?.toUpperCase() || ''}
            </Avatar>

            <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
  {/* Add Member Button on top */}
  <ListItem button onClick={() => setAddMemberOpen(true)}>
  <ListItemAvatar>
    <Avatar sx={{ bgcolor: '#1ac635' }}>+</Avatar>
  </ListItemAvatar>
  <ListItemText
    primary={
      <Typography sx={{ fontWeight: 600, color: '#1ac635' }}>
        Add Member
      </Typography>
    }
  />
</ListItem>


  {/* Group Members List */}
  {/* Admin (Creator)
  {createdByUser && (
    <ListItem>
      <ListItemAvatar>
        <Avatar src={createdByUser.photoURL}>
          {createdByUser.name?.[0]?.toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 500, color: '#fff' }}>
              {createdByUser.name}
            </Typography>
            <Typography
              component="span"
              sx={{
                fontSize: 12,
                color: '#ffbb33',
                fontWeight: 500,
                marginLeft: 1,
              }}
            >
              (Admin)
            </Typography>
          </Box>
        }
        secondary={`@${createdByUser.username}`}
      />
    </ListItem>
  )} */}

  {/* Other Members */}
  {memberUsers.length > 0 ? (
    memberUsers
    ?.filter((user) => user.id == createdByUser?.id)
    .map((user) => (
      <ListItem
        key={user.id}
        button
        onClick={() => navigate(`/chat/${user.id}`)}
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

            {/* Buttons for Other Actions */}
            <Button variant="contained" sx={{ mt: 2 }}>Add Members</Button>
            <Typography variant="body2" sx={{ color: '#B0BEC5', mt: 2 }}>
              Group Invite Link: <a href={`https://yourapp.com/join/${groupName}`} style={{ color: '#1ac635' }}>https://yourapp.com/join/{groupName}</a>
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>Go To Trip</Button>
            <Typography variant="body2" sx={{ color: '#B0BEC5', mt: 1 }}>
              Linked Trip: {groupInfo.tripName || 'None'}
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2, backgroundColor: '#ff4d4d', '&:hover': { backgroundColor: '#ff1a1a' } }}
            >
              Exit Group
            </Button>
          </Box>
        </Box>
      </SwipeableDrawer>
    </motion.div>
  )}
</Box>

<Dialog fullScreen open={addMemberOpen} onClose={() => setAddMemberOpen(false)}>
  <AppBar sx={{ position: 'relative', bgcolor: '#1ac635' }}>
    <Toolbar>
      <IconButton edge="start" color="inherit" onClick={() => setAddMemberOpen(false)} aria-label="close">
        <CloseIcon />
      </IconButton>
      <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
        Add Members
      </Typography>
    </Toolbar>
  </AppBar>

  <Box sx={{ bgcolor: '#0c0c0c', height: '100%', p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="h6" fontSize="28px" color="white"><strong>Start New Group</strong></Typography>
      <IconButton sx={{ bgcolor: '#2c2c2c', width: '45px' }} onClick={() => setAddMemberOpen(false)}>
        <CloseIcon sx={{ color: '#fff' }} />
      </IconButton>
    </Box>

    <TextField
      fullWidth
      placeholder="Search by username"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      sx={{
        mb: 2,
        input: { color: '#fff' },
        padding: '1px 10px',
        width: '93%',
        marginBottom: '20px',
        borderRadius: '12px',
        backgroundColor: '#101010',
        border: '1px solid rgb(24, 24, 24)',
      }}
    />

    {searchResults.map((user) => (
      <Box key={user.uid} sx={{ display: 'flex', alignItems: 'center', mb: 1, bgcolor: '#131313', padding: '10px', borderRadius: '20px' }}>
        <Avatar src={user.photoURL} sx={{ mr: 2 }} />
        <Typography color="#fff" sx={{ flex: 1 }}>{user.username}</Typography>
        <Button
          variant="outlined"
          sx={{
            mr: 1,
            color: 'rgba(0, 255, 145, 0.86)',
            backgroundColor: 'rgba(0, 155, 89, 0.16)',
            borderColor: 'rgba(0, 255, 145, 0.86)',
            borderRadius: '10px',
          }}
          onClick={() => handleAddUser(user)}
        >
          Group
        </Button>
      </Box>
    ))}

    <Box sx={{ mt: 2 }}>
      <Typography color="#fff" variant="subtitle1">Selected Users:</Typography>
      {selectedUsers.map((user) => (
        <Box key={user.uid} sx={{ display: 'flex', alignItems: 'center', my: 1, bgcolor: '#131313', padding: '10px', borderRadius: '20px' }}>
          <Avatar src={user.photoURL} sx={{ mr: 1 }} />
          <Typography color="#fff" sx={{ flex: 1 }}>{user.username}</Typography>
          <IconButton onClick={() => handleRemoveUser(user.uid)}>
            <CloseIcon sx={{ color: 'rgba(0, 255, 145, 0.86)', backgroundColor: 'rgba(0, 155, 89, 0.16)', borderColor: 'rgba(0, 255, 145, 0.86)', borderRadius: '10px' }} />
          </IconButton>
        </Box>
      ))}
    </Box>

    <Button
      variant="contained"
      sx={{ mt: 4, bgcolor: '#00f721', color: '#000' }}
      onClick={async () => {
        // Handle adding users to the group
        await addUsersToGroup(selectedUsers);
        setAddMemberOpen(false); // Close the dialog after adding users
      }}
      disabled={selectedUsers.length === 0}
    >
      Confirm Add
    </Button>
  </Box>
</Dialog>


    </Box>
  );
}

export default GroupChat;