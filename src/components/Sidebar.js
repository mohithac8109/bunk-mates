// Sidebar.js
import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Chats from "../pages/Chats"; // Assuming Chats is a component that lists chat rooms or friends

const Sidebar = () => {
  const navigate = useNavigate();

  // Handle navigation to chats
  const goToChats = () => {
    navigate("/chats");
  };

  return (
    <Box
      sx={{
        width: 250, 
        bgcolor: "#040404",
        display: "flex",
        flexDirection: "column",
        padding: 2,
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        
      </Typography>
      <Chats onlyList />
    </Box>
  );
};

export default Sidebar;
