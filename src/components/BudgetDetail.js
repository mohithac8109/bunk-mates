import { useState } from "react";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Paper,
  Button,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";

import { green, blue, red, grey } from "@mui/material/colors";

export default function BudgetDetail() {
  const [totalBudget, setTotalBudget] = useState(0);
  const [currentBudget, setCurrentBudget] = useState(0);
  const [members, setMembers] = useState([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberContribution, setNewMemberContribution] = useState("");
  const [newContribution, setNewContribution] = useState("");
  const [spendAmount, setSpendAmount] = useState("");
  const [spendAt, setSpendAt] = useState("");
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  const themeColors = {
    primary: blue[500],
    success: green[500],
    danger: red[500],
    background: grey[100],
  };

  const handleAddMember = () => {
    if (newMemberName && newMemberContribution) {
      const newMember = {
        name: newMemberName,
        contribution: parseInt(newMemberContribution),
      };
      const updatedTotal = totalBudget + parseInt(newMemberContribution);
      setMembers((prev) => [...prev, newMember]);
      setTotalBudget(updatedTotal);
      setCurrentBudget(updatedTotal - totalSpent);
      setNewMemberName("");
      setNewMemberContribution("");
    }
  };

  const handleRightClick = (e, member) => {
    e.preventDefault();
    setSelectedMember(member);
    setAnchorEl(e.currentTarget);
  };

  const handleEditContribution = () => {
    const updatedMembers = members.map((m) =>
      m.name === selectedMember.name
        ? { ...m, contribution: parseInt(newContribution) }
        : m
    );
    const updatedTotal = updatedMembers.reduce((a, b) => a + b.contribution, 0);
    setMembers(updatedMembers);
    setTotalBudget(updatedTotal);
    setCurrentBudget(updatedTotal - totalSpent);
    setAnchorEl(null);
    setNewContribution("");
  };

  const handleDeleteMember = () => {
    const updatedMembers = members.filter((m) => m.name !== selectedMember.name);
    const updatedTotal = updatedMembers.reduce((a, b) => a + b.contribution, 0);
    setMembers(updatedMembers);
    setTotalBudget(updatedTotal);
    setCurrentBudget(updatedTotal - totalSpent);
    setAnchorEl(null);
  };

  const handleSpendAmount = () => {
    const spend = parseInt(spendAmount);
    if (!isNaN(spend) && spendAt) {
      const newSpent = totalSpent + spend;
      setTotalSpent(newSpent);
      setCurrentBudget(totalBudget - newSpent);
      setTransactionHistory((prev) => [
        {
          spendAmount: spend,
          spendAt,
          dateTime: new Date().toLocaleString(),
        },
        ...prev,
      ]);
      setSpendAmount("");
      setSpendAt("");
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: themeColors.background, minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        💰 Group Name: Example Group
      </Typography>

      <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 5 }}>
        {[
          { label: "Current Budget", value: currentBudget, color: themeColors.success },
          { label: "Total Budget", value: totalBudget, color: themeColors.primary },
          { label: "Spent", value: totalSpent, color: themeColors.danger },
        ].map((item, idx) => (
          <Card
            key={idx}
            sx={{
              backgroundColor: item.color,
              color: "#fff",
              borderRadius: 3,
              minWidth: 180,
              textAlign: "center",
              boxShadow: 4,
            }}
          >
            <CardContent>
              <Typography variant="h6">{item.label}</Typography>
              <Typography variant="h4">₹ {item.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Box sx={{ mb: 4, textAlign: "center" }}>
        <Popup
          trigger={<Button variant="contained" sx={{ borderRadius: 2 }}>+ Add Expense</Button>}
          modal
          nested
        >
          {(close) => (
            <Box sx={{ p: 3, backgroundColor: "#fff", borderRadius: 2, minWidth: 300 }}>
              <Typography variant="h6" gutterBottom>
                Add a New Expense
              </Typography>
              <TextField label="Amount" fullWidth type="number" value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)} sx={{ mb: 2 }} />
              <TextField label="Spend At" fullWidth value={spendAt} onChange={(e) => setSpendAt(e.target.value)} sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" sx={{ backgroundColor: green[500], borderRadius: 2, mb: 1 }} onClick={handleSpendAmount}>
                Confirm Spend
              </Button>
              <Button fullWidth variant="outlined" onClick={close} sx={{ borderRadius: 2 }}>
                Close
              </Button>
            </Box>
          )}
        </Popup>
      </Box>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Add New Member
            </Typography>
            <TextField label="Name" fullWidth value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} sx={{ mb: 2 }} />
            <TextField label="Contribution" fullWidth type="number" value={newMemberContribution} onChange={(e) => setNewMemberContribution(e.target.value)} sx={{ mb: 2 }} />
            <Button fullWidth variant="contained" onClick={handleAddMember} sx={{ borderRadius: 2 }}>
              Add Member
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" gutterBottom>
          Members Contributions
        </Typography>
        <Grid container spacing={2}>
          {members.map((member, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#fff",
                  boxShadow: 2,
                  cursor: "context-menu",
                }}
                onContextMenu={(e) => handleRightClick(e, member)}
              >
                <Typography fontWeight="bold">{member.name}</Typography>
                <Chip label={`₹ ${member.contribution}`} variant="outlined" color="primary" sx={{ mt: 1 }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Transaction History
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: grey[300] }}>
              <TableRow>
                <TableCell><b>Amount</b></TableCell>
                <TableCell><b>Spent At</b></TableCell>
                <TableCell><b>Date & Time</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactionHistory.map((txn, idx) => (
                <TableRow key={idx}>
                  <TableCell>₹ {txn.spendAmount}</TableCell>
                  <TableCell>{txn.spendAt}</TableCell>
                  <TableCell>{txn.dateTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem>
          <TextField placeholder="New Contribution" size="small" type="number" value={newContribution} onChange={(e) => setNewContribution(e.target.value)} />
        </MenuItem>
        <MenuItem onClick={handleEditContribution}>Update</MenuItem>
        <MenuItem onClick={handleDeleteMember} sx={{ color: red[500] }}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
