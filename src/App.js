import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Chats from "./pages/Chats";
import { UserProvider } from './contexts/UserContext';
import Chatroom from "./components/Chatroom";
import GroupChat from "./components/GroupChat";
import ProtectedRoute from "./components/ProtectedRoute"; // we'll create this

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/chat/:friendId" element={<Chatroom />} />
        <Route path="/group/:groupName" element={<GroupChat />}/>
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
