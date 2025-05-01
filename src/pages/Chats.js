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
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@mui/material';
import { format, isToday, isYesterday } from 'date-fns';

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
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chat: null });

  const navigate = useNavigate();
  const currentUser = auth.currentUser;

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
      <h2 style={{ color: '#FFFFFF', fontSize: '32px' }}>Chats</h2>

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
      </div>
    </div>
  );
}

export default Chats;
