import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Grid, CircularProgress } from "@mui/material";
import { db } from "../firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";

const ChatroomsList = () => {
  const [chatrooms, setChatrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchChatrooms = async () => {
    setLoading(true);
    try {
      const chatroomsRef = collection(db, "chats");
      const querySnapshot = await getDocs(chatroomsRef);
      const chatroomsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setChatrooms(chatroomsData);
    } catch (error) {
      console.error("Error fetching chatrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatrooms(); // Fetch all chatrooms when the component mounts
  }, []);

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" gutterBottom>
        Available Chatrooms
      </Typography>
      {loading ? (
        <CircularProgress sx={{ alignSelf: "center" }} />
      ) : (
        <Grid container spacing={2}>
          {chatrooms.map((chatroom) => (
            <Grid item xs={12} sm={6} key={chatroom.id}>
              <Button
                component={Link}
                to={`/chat/${chatroom.id}`}
                variant="outlined"
                fullWidth
              >
                {chatroom.name}
              </Button>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ChatroomsList;
