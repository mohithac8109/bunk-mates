import React, { useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" color="black" sx={{ flexGrow: 1, fontWeight: "bolder" }}>
            BunkMate
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ bgcolor: "#fff" }}>
        <Paper elevation={2} sx={{ py: 8, px: 2, boxShadow: "none" }}>
          <Typography variant="h3" fontWeight={600} gutterBottom>
            Privacy Policy
          </Typography>

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Last updated: July 17, 2025
          </Typography>

          <Divider sx={{ my: 3 }} />

          <PolicySection
            title="1. Introduction"
            content="At BunkMate, your privacy is our top priority. This Privacy Policy outlines how we collect, use, and protect your personal data while you use our app. By using BunkMate, you agree to the terms described in this policy."
          />

          <PolicySection
            title="2. Information We Collect"
            content="We collect various types of information to provide and improve our services:"
            list={[
              "Email address, username, and profile photo during registration",
              "Trip information including names, members, checklists, and locations",
              "Messages, notes, reminders, budgets, and uploaded media",
              "Device identifiers, IP address, and general usage behavior",
              "Approximate location for weather and maps functionality",
              "FCM Token for push notifications",
            ]}
          />

          <PolicySection
            title="3. How We Use Your Information"
            content="Your data is used strictly for providing and improving app functionality:"
            list={[
              "Creating and managing your account",
              "Allowing trip planning and collaborative features",
              "Sending you push notifications and reminders",
              "Enabling real-time chat and group communication",
              "Displaying weather and location-based info",
              "Detecting and preventing abuse or violations",
            ]}
          />

          <PolicySection
            title="4. Data Sharing and Disclosure"
            content="We do not sell your personal data. We only share your data in the following cases:"
            list={[
              "With trip members (for group chats, budgets, and collaboration)",
              "With Firebase services (for storage, auth, messaging)",
              "With OpenWeatherMap (for weather forecasts)",
              "With law enforcement if legally required",
            ]}
          />

          <PolicySection
            title="5. Data Retention"
            content="We retain your data as long as your account is active or as needed to provide our services. You may request deletion of your data at any time."
          />

          <PolicySection
            title="6. Data Security"
            content="We use strong technical and organizational measures to protect your data, including:"
            list={[
              "Firebase Authentication and role-based access control",
              "End-to-end TLS encryption in transit",
              "Firestore rules for strict read/write permissions",
              "Regular audit and security updates",
            ]}
          />

          <PolicySection
            title="7. Your Rights"
            content="You have the right to:"
            list={[
              "Access and update your personal information",
              "Delete your account and associated data",
              "Request information about the data we hold",
              "Withdraw consent at any time",
            ]}
          />

          <PolicySection
            title="8. Cookies and Tracking"
            content="We do not use tracking cookies. However, Firebase and third-party libraries may collect anonymized data for analytics and performance improvements."
          />

          <PolicySection
            title="9. Children’s Privacy"
            content="BunkMate is not intended for use by children under 13. We do not knowingly collect data from anyone under 13 years of age. If you believe we have collected data from a minor, please contact us."
          />

          <PolicySection
            title="10. Changes to This Policy"
            content="We may update this policy occasionally. Changes will be reflected on this page and we may notify you via email or in-app messaging when appropriate."
          />

          <PolicySection
            title="11. Third-Party Services Used"
            content="BunkMate uses the following services:"
            list={[
              "Firebase Authentication (Apache 2.0 License)",
              "Firestore & Firebase Messaging",
              "Material UI (MIT License)",
              "React.js (MIT License)",
              "OpenWeatherMap API",
              "Google Fonts & Material Icons",
            ]}
          />

          <PolicySection
            title="12. Contact Us"
            content="For questions or requests related to privacy and data, contact us at:"
          />

          <Typography variant="body1" fontWeight={500}>
            Email: jayendrachoudhary.am@gmail.com
          </Typography>
        

<Box sx={{ mt: 5, textAlign: "center" }}>
  <Typography variant="body2">
    Read our{" "}
    <Link to="/terms" style={{ color: "#1976d2", textDecoration: "underline" }}>
      Terms & Conditions
    </Link>{" "}
    for legal usage guidelines.
  </Typography>
</Box>
        </Paper>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: "#f5f5f5",
          py: 3,
          textAlign: "center",
          borderTop: "1px solid #ddd",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} BunkMate. All rights reserved.
        </Typography>
      </Box>
    </>
  );
}

// Reusable Section Component
function PolicySection({ title, content, list }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ mb: list ? 1.5 : 0 }}>
        {content}
      </Typography>
      {list && (
        <List dense disablePadding sx={{ pl: 2 }}>
          {list.map((item, idx) => (
            <ListItem key={idx} sx={{ py: 0.5 }}>
              <ListItemText primary={item} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
