import { db, messaging } from '../firebase'; // Import Firestore and Firebase Messaging
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getToken } from 'firebase/messaging';
import { auth } from '../firebase';

// Function to create a new chatroom
export const createChatRoom = async (participantId) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User is not authenticated');
  }

  try {
    // Create a new chat document with the current user and the participant
    const chatRef = await addDoc(collection(db, 'chats'), {
      participants: [user.uid, participantId], // Add both participants to the chat
      createdAt: serverTimestamp(),
    });

    // After chatroom creation, notify the other user
    await sendChatNotification(participantId, chatRef.id);
    
    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw new Error('Failed to create chat room');
  }
};

// Function to send a notification to the other participant
export const sendChatNotification = async (participantId, chatroomId) => {
  try {
    // Get the FCM token for the participant (the other user)
    const participantToken = await getParticipantToken(participantId);
    
    if (participantToken) {
      const message = {
        to: participantToken,
        notification: {
          title: 'New Chat Request',
          body: 'You have a new message!',
        },
        data: {
          chatroomId, // Include the chatroom ID so the recipient can navigate to the chat
        },
      };

      // Send notification using Firebase Cloud Messaging
      await messaging.send(message);
      console.log('Notification sent successfully');
    } else {
      console.error('No FCM token found for the participant');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Function to get the FCM token for a user (to send notifications)
const getParticipantToken = async (participantId) => {
  try {
    const userDocRef = doc(db, 'users', participantId); // Get the user document from Firestore
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data().fcmToken; // Get the FCM token stored in the user's Firestore document
    } else {
      console.error('No such user');
      return null;
    }
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    return null;
  }
};
