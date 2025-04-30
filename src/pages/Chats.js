import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, query, orderBy, limit, onSnapshot, doc, updateDoc, addDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Person } from '@mui/icons-material'; // Import the Material Icon

function Chats() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [latestMessages, setLatestMessages] = useState({});
  const [latestTimestamps, setLatestTimestamps] = useState({});
  const [notification, setNotification] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupEmoji, setGroupEmoji] = useState('😊');
  const [userGroups, setUserGroups] = useState([]);
  const [groupUnreadCounts, setGroupUnreadCounts] = useState({});
  const [latestGroupMessages, setLatestGroupMessages] = useState({});
  const [latestGroupTimestamps, setLatestGroupTimestamps] = useState({});
  const [themes, setThemes] = useState('light');
  const [favoriteChats, setFavoriteChats] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]);
  const [swipeAction, setSwipeAction] = useState(null);

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
      const q = query(collection(db, 'groupChats', group.id, 'messages'), orderBy('timestamp', 'desc'), limit(1));

      return onSnapshot(q, (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          const msg = data.text || 'No messages yet';
          const ts = data.timestamp?.toDate?.() || new Date(0);
          const unread = data.senderId !== currentUser.uid && !data.isRead ? 1 : 0;

          setLatestGroupMessages((prev) => ({ ...prev, [group.id]: msg }));
          setGroupUnreadCounts((prev) => ({ ...prev, [group.id]: unread }));
          setLatestGroupTimestamps((prev) => ({ ...prev, [group.id]: ts }));

          if (unread) {
            setNotification({ user: group.name, message: msg });
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

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName || selectedUsers.length === 0) return;

    const groupData = {
      name: groupName,
      emoji: groupEmoji,
      members: [...selectedUsers, currentUser.uid],
      createdAt: new Date(),
      createdBy: currentUser.uid,
    };

    const groupRef = await addDoc(collection(db, 'groupChats'), groupData);
    navigate(`/group/${groupRef.id}`);
  };

  const toggleUserSelection = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const toggleTheme = () => {
    setThemes((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const sortedUsers = [...users]
    .filter((user) => {
      const name = user.name || user.username || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      const timeA = latestTimestamps[a.id] || new Date(0);
      const timeB = latestTimestamps[b.id] || new Date(0);
      return timeB - timeA;
    });

  const sortedGroups = [...userGroups].sort((a, b) => {
    const timeA = latestGroupTimestamps[a.id] || new Date(0);
    const timeB = latestGroupTimestamps[b.id] || new Date(0);
    return timeB - timeA;
  });

  const handleSwipeReply = (message) => {
    setSwipeAction(message);
  };

  // Function to get profile picture (either Google login or Firestore)
  const getUserProfilePic = (user) => {
    return user.photoURL || auth.currentUser?.photoURL || 'https://via.placeholder.com/50';
  };

  return (
    <div style={{ padding: '20px', backgroundColor: themes === 'light' ? '#fff' : '#333', transition: 'background-color 0.3s' }}>
      <h2 style={{ color: themes === 'light' ? '#333' : '#fff' }}>Chats</h2>

      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: '8px',
          width: '100%',
          marginBottom: '20px',
          borderRadius: '6px',
          border: '1px solid #ccc',
        }}
      />

      <button
        onClick={() => setShowGroupForm(!showGroupForm)}
        style={{
          marginBottom: '20px',
          padding: '10px 15px',
          borderRadius: '6px',
          backgroundColor: '#4caf50',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        ➕ Create Group Chat
      </button>

      {showGroupForm && (
        <form
          onSubmit={handleGroupSubmit}
          style={{ marginBottom: '30px', padding: '15px', background: '#eee', borderRadius: '10px' }}
        >
          <input
            type="text"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
            style={{ padding: '8px', width: '100%', marginBottom: '10px' }}
          />

          <input
            type="text"
            placeholder="Choose group emoji (e.g. 🎉)"
            value={groupEmoji}
            onChange={(e) => setGroupEmoji(e.target.value)}
            style={{ padding: '8px', width: '100%', marginBottom: '10px' }}
          />

          <label style={{ fontWeight: 'bold' }}>Select members:</label>
          <div style={{ maxHeight: '150px', overflowY: 'auto', margin: '10px 0' }}>
            {users.map((user) => (
              <div key={user.id} style={{ marginBottom: '5px' }}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                  />{' '}
                  {user.name || user.username}
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            ✅ Create Group
          </button>
        </form>
      )}

      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#444',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            zIndex: 1000,
          }}
        >
          <strong>{notification.user}</strong>: {notification.message}
        </div>
      )}

      <h3>Personal Chats</h3>
      {sortedUsers.map((user) => {
        const unread = unreadCounts[user.id] || 0;
        const profilePic = getUserProfilePic(user); // Get profile pic from Firestore or Google
        return (
          <div
            key={user.id}
            onClick={() => handleSelect(user.id)}
            style={{
              backgroundColor: unread > 0 ? '#fff4e4' : '#eef',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.3s',
            }}
          >
            <img
              src={profilePic}
              alt={`${user.name || user.username} profile`}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                marginRight: '10px',
              }}
            />
            <div style={{ flex: 1 }}>
              <strong>{user.name || user.username}</strong>
              <div style={{ fontSize: '13px', color: '#555', marginTop: '5px' }}>
                {latestMessages[user.id] || 'No messages yet'}
              </div>
            </div>
            {unread > 0 && (
              <span
                style={{
                  backgroundColor: '#ff0000',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                {unread}
              </span>
            )}
          </div>
        );
      })}

      <h3 style={{ marginTop: '40px' }}>Group Chats</h3>
      {sortedGroups.map((group) => {
        const unread = groupUnreadCounts[group.id] || 0;
        const groupEmoji = group.emoji || '😊'; // Default to smiley emoji
        return (
          <div
            key={group.id}
            onClick={() => handleGroupClick(group.id)}
            style={{
              backgroundColor: unread > 0 ? '#f9f2ff' : '#eef',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '24px', marginRight: '10px' }}>{groupEmoji}</div>
            <div style={{ flex: 1 }}>
              <strong>{group.name}</strong>
              <div style={{ fontSize: '13px', color: '#555', marginTop: '5px' }}>
                {latestGroupMessages[group.id] || 'No messages yet'}
              </div>
            </div>
            {unread > 0 && (
              <span
                style={{
                  backgroundColor: '#ff0000',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                {unread}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Chats;
