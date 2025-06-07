import React, { useEffect, useState } from 'react';
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
import { Avatar, IconButton, Dialog, Slide, Box, Typography, TextField, Button } from '@mui/material';
import { format, isToday, isYesterday } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import CloseIcon from '@mui/icons-material/Close';


function Chats() {
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
  const [themes, setThemes] = useState('light');
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

  const navigate = useNavigate();
  const currentUser = auth.currentUser;

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

  const combinedChats = [
    ...users.map((user) => ({
      type: 'user',
      id: user.id,
      name: user.name || user.username,
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

  return (
    <div style={{ padding: '10px', backgroundColor: '#02020200' }}>
      <div style={{display: 'flex', flexDirection: 'row'}}>
      <IconButton onClick={goBack} sx={{ mr: 1, color: '#fff' }}>
        <ArrowBackIcon />
      </IconButton>
      <h2 style={{ color: '#FFFFFF', fontSize: '32px' }}>Chats</h2>
      </div>

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
          border: '1px solid rgb(24, 24, 24)',
        }}
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
              backgroundColor: chat.unreadCount > 0 ? '#009b5929' : '#00000000',
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
                  backgroundColor: '#00ff92e8',
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
    bgcolor: '#00f721ba',
    borderRadius: '15px',
    fontSize: '38px',
    color: '#000',
    '&:hover': { bgcolor: '#00f721' }
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
      sx={{ mt: 3, bgcolor: '#AEEA00', color: '#000' }}
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
        <Button variant="outlined" sx={{ mr: 1, color: 'rgba(0, 255, 145, 0.86)', backgroundColor: 'rgba(0, 155, 89, 0.16)', borderColor: 'rgba(0, 255, 145, 0.86)', borderRadius: '10px' }} onClick={() => handleAddUser(user)}>Group</Button>
      </Box>
    ))}

    <Box sx={{ mt: 2 }}>
      <Typography color="#fff" variant="subtitle1">Selected Users:</Typography>
      {selectedUsers.map(user => (
        <Box key={user.uid} sx={{ display: 'flex', alignItems: 'center', my: 1, bgcolor: '#131313', padding: '10px', borderRadius: '20px' }}>
          <Avatar src={user.photoURL} sx={{ mr: 1 }} />
          <Typography color="#fff" sx={{ flex: 1 }}>{user.username}</Typography>
          <IconButton onClick={() => handleRemoveUser(user.uid)}><CloseIcon sx={{ color: 'rgba(0, 255, 145, 0.86)', backgroundColor: 'rgba(0, 155, 89, 0.16)', borderColor: 'rgba(0, 255, 145, 0.86)', borderRadius: '10px' }} /></IconButton>
        </Box>
      ))}
    </Box>

    <Button
      variant="contained"
      sx={{ mt: 4, bgcolor: '#00f721', color: '#000' }}
      onClick={() => setGroupDialog(true)}
      disabled={selectedUsers.length === 0}
    >
      Create Group Chat
    </Button>
  </Box>
</Dialog>

    </div>

    
  );
}

export default Chats;