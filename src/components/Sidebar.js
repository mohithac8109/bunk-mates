// Sidebar.js
import React from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

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
        height: "100vh",
        bgcolor: "#040404",
        display: "flex",
        flexDirection: "column",
        padding: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        
      </Typography>
      <Button variant="contained" color="primary" onClick={goToChats}>
        Chats
      </Button>
    </Box>
  );
};

export default Sidebar;
