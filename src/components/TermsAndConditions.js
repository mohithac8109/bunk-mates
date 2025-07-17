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
  Link as MuiLink,
} from "@mui/material";
import { Link } from "react-router-dom";

export default function TermsAndConditions() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* Header */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" color="#000000" sx={{ flexGrow: 1, fontWeight: "bolder" }}>
            BunkMate
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ bgcolor: "#fff" }}>
        <Paper elevation={2} sx={{ py: 8, px: 2, boxShadow: "none" }}>
          <Typography variant="h3" fontWeight={600} gutterBottom>
            Terms & Conditions
          </Typography>

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Last updated: July 17, 2025
          </Typography>

          <Divider sx={{ my: 3 }} />

          <TOSSection
            title="1. Acceptance of Terms"
            content="By accessing or using BunkMate, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our application."
          />

          <TOSSection
            title="2. Eligibility"
            content="You must be at least 13 years old to use BunkMate. By using the app, you represent and warrant that you meet this requirement."
          />

          <TOSSection
            title="3. User Accounts & Security"
            list={[
              "You are responsible for maintaining the confidentiality of your login credentials.",
              "You agree to notify us immediately of any unauthorized use of your account.",
              "We are not liable for any loss or damage resulting from unauthorized access to your account.",
            ]}
          />

          <TOSSection
            title="4. App Features & Limitations"
            content="BunkMate provides tools such as group chats, trip planning, reminders, budgeting, and file sharing."
            list={[
              "Some features may be limited based on your device or network capabilities.",
              "Offline functionality may vary by region and OS support.",
              "We reserve the right to modify or disable any feature without prior notice.",
            ]}
          />

          <TOSSection
            title="5. User Conduct"
            list={[
              "You agree not to use the app for unlawful or abusive purposes.",
              "You shall not harass, bully, threaten, or impersonate others.",
              "You shall not upload malicious code, spam, or inappropriate content.",
            ]}
          />

          <TOSSection
            title="6. Content Ownership & Rights"
            content="You retain ownership of all content you post on BunkMate. By using the app, you grant us a limited license to display and process your content as necessary to provide app functionality."
            list={[
              "You must have rights to any media or text you upload.",
              "We do not claim ownership of your content but reserve the right to moderate or remove harmful material.",
            ]}
          />

          <TOSSection
            title="7. Intellectual Property"
            content="All intellectual property related to BunkMate, including branding, UI design, source code, and graphics, is owned by BunkMate or its licensors. You may not reproduce, copy, or distribute any part of the app without written permission."
          />

          <TOSSection
            title="8. Third-Party Services"
            list={[
              "BunkMate integrates third-party APIs such as Firebase, OpenWeatherMap, and Google Maps.",
              "We are not responsible for any data handled by these third-party services.",
              "Use of these services is subject to their individual privacy policies and terms.",
            ]}
          />

          <TOSSection
            title="9. Termination"
            list={[
              "We may suspend or permanently terminate access if you violate these terms.",
              "You may discontinue use at any time by uninstalling the app.",
              "Termination may result in loss of access to your account and stored content.",
            ]}
          />

          <TOSSection
            title="10. Disclaimers & Limitation of Liability"
            list={[
              "BunkMate is provided on an 'as is' and 'as available' basis.",
              "We do not guarantee that the app will be error-free, secure, or uninterrupted.",
              "We are not liable for any indirect or consequential damages arising from your use of the app.",
            ]}
          />

          <TOSSection
            title="11. Indemnification"
            content="You agree to indemnify and hold BunkMate, its affiliates, employees, and licensors harmless from any claims, liabilities, or damages arising out of your use of the app, your content, or your violation of these terms."
          />

          <TOSSection
            title="12. Changes to Terms"
            content="We reserve the right to update these Terms and Conditions at any time. We will notify users of significant changes via the app or email. Continued use of the app after updates means you accept the revised terms."
          />

          <TOSSection
            title="13. Governing Law"
            content="These terms shall be governed by and construed in accordance with the laws of your local jurisdiction, without regard to conflict of law principles."
          />

          <TOSSection
            title="14. Contact Us"
            content="For questions or concerns regarding these Terms and Conditions:"
          />
          <Typography variant="body1" fontWeight={500}>
            Email: jayendrachoudhary.am@gmail.com
          </Typography>

          {/* Navigation to Privacy Policy */}
          <Box sx={{ mt: 5, textAlign: "center" }}>
            <Typography variant="body2">
              Read our{" "}
              <MuiLink component={Link} to="/privacy-policy" color="primary" underline="hover">
                Privacy Policy
              </MuiLink>{" "}
              to learn how we handle your data.
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
function TOSSection({ title, content, list }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      {content && (
        <Typography variant="body1" sx={{ mb: list ? 1.5 : 0 }}>
          {content}
        </Typography>
      )}
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
