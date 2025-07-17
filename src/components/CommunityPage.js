import React, { useEffect } from "react";
import {
  Box,
  Typography,
  Container,
  AppBar,
  Toolbar,
  CssBaseline,
  Button,
} from "@mui/material";
import { Link } from "react-router-dom";

export default function CommunityPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <CssBaseline />

      {/* Header */}
      <AppBar position="static" color="transparent" sx={{ backgroundColor: "#111" }}>
        <Toolbar>
          <Typography variant="h6" color="#fff" sx={{ flexGrow: 1, fontWeight: "bolder" }}>
            BunkMate
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        sx={{
          minHeight: "90vh",
          backgroundColor: "#121212",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Community
          </Typography>
          <Typography variant="h6" color="#aaa" sx={{ mb: 3 }}>
            We're building something exciting...
          </Typography>
          <Typography variant="body1" sx={{ color: "#aaa", mb: 4 }}>
            Our community space is launching soon! You’ll be able to share trip experiences, connect with other travelers, and stay in the loop with updates.
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#666",
              fontStyle: "italic",
            }}
          >
            🚧 Launching Fall 2025 — Stay Tuned!
          </Typography>
        </Container>
          <Button component={Link} to="/" sx={{ backgroundColor: "#fff", borderRadius: 3, color: "#000", mt: 4 }}>
            Go To Home
          </Button>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 3,
          textAlign: "center",
          backgroundColor: "#1a1a1a",
          borderTop: "1px solid #333",
        }}
      >
        <Typography variant="body2" color="#aaa">
          &copy; {new Date().getFullYear()} BunkMate. All rights reserved.
        </Typography>
      </Box>
    </>
  );
}
