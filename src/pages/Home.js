import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { auth } from "../firebase"; // Assuming you have firebase auth
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Divider,
  CircularProgress,
  Stack,
  useTheme,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { signOut } from "firebase/auth";

// Create a custom Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#000000", // Black for main primary color
    },
    secondary: {
      main: "#FFFFFF", // White for secondary color
    },
    background: {
      default: "#FFFFFF", // White background for the page
      paper: "#FFFFFF", // White background for cards and AppBar
    },
    text: {
      primary: "#000000", // Black text
      secondary: "#5E5E5E", // Light grey text for secondary content
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h6: {
      fontWeight: "bold",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: "1.5",
    },
    body2: {
      fontSize: "0.875rem",
    },
  },
  shape: {
    borderRadius: 8, // Rounded edges for components like buttons and cards
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)", // Soft shadow for cards
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // No uppercased text on buttons
          fontWeight: 500,
          borderRadius: "8px", // Rounded button edges
        },
      },
    },
  },
});

const Home = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    mobile: "",
    photoURL: "",
  });
  const [loading, setLoading] = useState(true);

  // Navigate to Chats page
  const goToChats = () => {
    navigate("/chats");
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const { displayName, email, photoURL, phoneNumber } = user;
        setUserData({
          name: displayName,
          email: email,
          mobile: phoneNumber || "Not provided", // If no phone number is provided
          photoURL: photoURL || "",
        });
      } else {
        navigate("/login"); // If no user is authenticated, navigate to the login page
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase sign out
      navigate("/login"); // Navigate to login page after logout
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleProfileClick = () => {
    navigate("/profile"); // Navigate to profile page
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", minHeight: "100vh", flexDirection: "column", backgroundColor: theme.palette.background.default }}>
        {/* AppBar */}
        <AppBar position="static" sx={{ backgroundColor: theme.palette.background.paper }}>
          <Toolbar sx={{ justifyContent: "space-between", padding: "0 20px" }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
              BunkMate 🏖️
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                borderRadius: "8px",
                padding: "5px",
                backgroundColor: "#F1F1F1",
              }}
              onClick={handleMenuOpen}
            >
              <Avatar alt={userData.name} src={userData.photoURL || ""} sx={{ width: 40, height: 40, marginRight: 1 }} />
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body1" sx={{ fontWeight: "bold", color: theme.palette.text.primary }}>
                  {userData.name || "Username"}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary }}>
                  {userData.email || "Email"}
                </Typography>
              </Box>
              <ArrowDropDownIcon sx={{ color: theme.palette.text.primary }} />
            </Box>

            {/* Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ display: "flex", flexGrow: 1 }}>
          <Sidebar />
          <Container maxWidth="lg" sx={{ flexGrow: 1, paddingTop: 4 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
                <CircularProgress sx={{ color: theme.palette.primary.main }} />
              </Box>
            ) : (
              <Box sx={{ mt: 4 }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ backgroundColor: "#F9F9F9", borderRadius: "16px" }}>
                      <CardMedia
                        component="img"
                        alt="Trip Planning"
                        height="140"
                        image="https://source.unsplash.com/featured/?travel"
                      />
                      <CardContent sx={{ color: theme.palette.text.primary }}>
                        <Typography variant="h6">Plan Your Next Trip!</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Organize and plan the perfect trips with your friends. Share itineraries and collaborate easily.
                        </Typography>
                      </CardContent>
                      <Button
                        size="small"
                        sx={{
                          backgroundColor: theme.palette.primary.main,
                          color: "#FFFFFF",
                          "&:hover": { backgroundColor: "#333333" },
                        }}
                        onClick={() => navigate("/trip-planner")}
                      >
                        Start Planning
                      </Button>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ backgroundColor: "#F9F9F9", borderRadius: "16px" }}>
                      <CardMedia
                        component="img"
                        alt="Group Collaboration"
                        height="140"
                        image="https://source.unsplash.com/featured/?friends"
                      />
                      <CardContent sx={{ color: theme.palette.text.primary }}>
                        <Typography variant="h6">Collaborate with Friends</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Easily collaborate with your friends, share ideas, track expenses, and more.
                        </Typography>
                      </CardContent>
                      <Button
                        size="small"
                        sx={{
                          backgroundColor: theme.palette.primary.main,
                          color: "#FFFFFF",
                          "&:hover": { backgroundColor: "#333333" },
                        }}
                        onClick={() => navigate("/collaboration")}
                      >
                        Start Collaborating
                      </Button>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ backgroundColor: "#F9F9F9", borderRadius: "16px" }}>
                      <CardMedia
                        component="img"
                        alt="Expense Tracking"
                        height="140"
                        image="https://source.unsplash.com/featured/?budget"
                      />
                      <CardContent sx={{ color: theme.palette.text.primary }}>
                        <Typography variant="h6">Track Your Expenses</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Keep track of all your trip expenses, split costs with friends, and stay within budget.
                        </Typography>
                      </CardContent>
                      <Button
                        size="small"
                        sx={{
                          backgroundColor: theme.palette.primary.main,
                          color: "#FFFFFF",
                          "&:hover": { backgroundColor: "#333333" },
                        }}
                        onClick={() => navigate("/expenses")}
                      >
                        Track Expenses
                      </Button>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Home;
