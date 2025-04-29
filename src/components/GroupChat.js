import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function GroupChat() {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const q = query(
      collection(db, 'groupChat', 'general', 'messages'),
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

    return () => unsubscribe();
  }, [currentUser, navigate]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    await addDoc(collection(db, 'groupChat', 'general', 'messages'), {
      text: newMsg.trim(),
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
      timestamp: serverTimestamp()
    });

    setNewMsg('');
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!currentUser) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Group Chat - General</h2>

      <div style={{
        height: '60vh',
        overflowY: 'auto',
        background: '#f0f0f0',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '10px'
      }}>
        {loading ? (
          <p>Loading messages...</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} style={{
              marginBottom: '12px',
              backgroundColor: msg.senderId === currentUser.uid ? '#d1f5d3' : '#ffffff',
              padding: '10px',
              borderRadius: '8px'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{msg.senderName}</div>
              <div style={{ fontSize: '15px' }}>{msg.text}</div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          type="text"
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            fontSize: '15px'
          }}
        />
        <button type="submit" style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default GroupChat;
