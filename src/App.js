import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { messaging } from './firebase';
import { getToken, onMessage } from 'firebase/messaging';
import "./App.css";
import 'leaflet/dist/leaflet.css';
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chats from "./pages/Chats";
import Budgetmngr from "./pages/Budget"
import { UserProvider } from './contexts/UserContext';
import Chatroom from "./components/Chatroom";
import GroupChat from "./components/GroupChat";
import ProtectedRoute from "./components/ProtectedRoute";
import { WeatherProvider } from "./contexts/WeatherContext";

const vapidKey = 'BA3kLicUjBzLvrGk71laA_pRVYsf6LsGczyAzF-NTBWEmOE3r4_OT9YiVt_Mvzqm7dZCoPnht84wfX-WRzlaSLs'; // From Firebase console

export const requestPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey });
      console.log('FCM Token:', token);
      // Save this token to your Firestore to use for sending messages
    } else {
      console.log('Notification permission denied');
    }
  } catch (err) {
    console.error('Error getting permission or token:', err);
  }
};

onMessage(messaging, (payload) => {
  console.log('Foreground message received:', payload);
  // Optional: show custom toast/notification UI here
});

function App() {
  return (
    <WeatherProvider>
      <Router>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chat/:friendId" element={<Chatroom />} />
          <Route path="/group/:groupName" element={<GroupChat />}/>
          <Route path="/budget-mngr" element={<Budgetmngr />}/>
          <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
    </WeatherProvider>
  );
}

export default App;
