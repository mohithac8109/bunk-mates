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

function Chats() {
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [latestMessages, setLatestMessages] = useState({});
  const [notification, setNotification] = useState(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupEmoji, setGroupEmoji] = useState('😊');
  const [userGroups, setUserGroups] = useState([]);

  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      querySnapshot.forEach((doc) => {
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
    if (!currentUser) return;

    const unsubscribes = users.map((user) => {
      const chatId = [currentUser.uid, user.id].sort().join('_');
      const q = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      return onSnapshot(q, (querySnapshot) => {
        let unreadCount = 0;
        let latestMessage = null;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!latestMessage) latestMessage = data;
          if (data.senderId !== currentUser.uid && !data.isRead) {
            unreadCount++;
          }
        });

        setLatestMessages((prev) => ({
          ...prev,
          [user.id]: latestMessage?.text || 'No messages yet',
        }));

        setUnreadCounts((prev) => ({
          ...prev,
          [user.id]: unreadCount,
        }));

        if (latestMessage?.senderId !== currentUser.uid && unreadCount === 1) {
          setNotification({
            user: user.name || user.username,
            message: latestMessage.text,
          });

          setTimeout(() => setNotification(null), 3000);
        }
      });
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [users, currentUser]);

  const handleSelect = async (userId) => {
    const chatId = [currentUser.uid, userId].sort().join('_');
    const chatRef = collection(db, 'chats', chatId, 'messages');

    const q = query(chatRef, orderBy('timestamp', 'desc'), limit(20));
    const snapshot = await getDocs(q);

    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      if (data.senderId !== currentUser.uid && !data.isRead) {
        const msgRef = doc(db, 'chats', chatId, 'messages', docSnap.id);
        await updateDoc(msgRef, { isRead: true });
      }
    });

    setUnreadCounts((prev) => ({
      ...prev,
      [userId]: 0,
    }));

    navigate(`/chat/${userId}`);
  };

  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupName || selectedUsers.length === 0) return;

    const groupMembers = [...selectedUsers, currentUser.uid];
    const groupData = {
      name: groupName,
      emoji: groupEmoji,
      members: groupMembers,
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

  const handleGroupClick = (groupId) => {
    navigate(`/group/${groupId}`);
  };

  if (!currentUser) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Chats</h2>

      <button
        style={{
          marginBottom: '20px',
          padding: '10px 15px',
          borderRadius: '6px',
          backgroundColor: '#4caf50',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={() => setShowGroupForm(!showGroupForm)}
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
          <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '10px', marginBottom: '10px' }}>
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

      <h3 style={{ marginTop: '40px' }}>Groups You Are In</h3>
      {userGroups.length > 0 ? (
        userGroups.map((group) => (
          <div
            key={group.id}
            onClick={() => handleGroupClick(group.id)}
            style={{
              backgroundColor: '#eef',
              padding: '10px',
              marginBottom: '10px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <strong>{group.emoji} {group.name}</strong>
          </div>
        ))
      ) : (
        <p>No groups yet.</p>
      )}

      <h3 style={{ marginTop: '30px' }}>Friends</h3>
      {users.length > 0 ? (
        users.map((user) => {
          const unread = unreadCounts[user.id] || 0;
          return (
            <div
              key={user.id}
              onClick={() => handleSelect(user.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '15px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: unread > 0 ? '#ffe4e4' : '#f5f5f5',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <img
                src={user.photoURL || ''}
                alt="profile"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  marginRight: '15px',
                }}
              />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.name || 'No Name'}</div>
                <div style={{ fontSize: '13px', color: '#888' }}>@{user.username || 'unknown'}</div>
                <div style={{ fontSize: '13px', color: '#555' }}>
                  {latestMessages[user.id] || 'No messages yet'}
                </div>
              </div>
              {unread > 0 && (
                <div
                  style={{
                    backgroundColor: 'red',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    position: 'absolute',
                    right: '10px',
                  }}
                >
                  {unread}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <p>No friends found.</p>
      )}
    </div>
  );
}

export default Chats;
