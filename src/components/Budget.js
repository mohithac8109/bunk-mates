import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonBase,
  Drawer,
  Fab,
  Grid,
  Chip,
  Stack,
  IconButton
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Card from "@mui/material/Card";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase"; // Your Firebase config export
import { getAuth, onAuthStateChanged } from "firebase/auth";

function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie =
    name + "=" + encodeURIComponent(value) + "; expires=" + expires + "; path=/";
}

function getCookie(name) {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
}

const BudgetManager = () => {
  const [userId, setUserId] = useState(null);
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editIndex, setEditIndex] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false); // Whether drawer is in edit mode
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [ExpdrawerOpen, setExpDrawerOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    amount: "",
    contributor: "",
    contributors: [],
  });

const [addDrawerOpen, setAddDrawerOpen] = useState(false);
const [selectedBudgetIndex, setSelectedBudgetIndex] = useState(null);
const [newExpense, setNewExpense] = useState({
  amount: "",
  name: "",
  category: "",
  date: new Date().toISOString().slice(0, 10), // default today
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
});
const [addError, setAddError] = useState("");

const selectedBudget = selectedBudgetIndex !== null ? budgetItems[selectedBudgetIndex] : null;

const totalBudget = selectedBudget?.amount ?? 0;

const totalExpense = selectedBudget?.expenses?.reduce(
  (sum, exp) => sum + Number(exp.amount),
  0
) ?? 0;

const currentBudget = totalBudget - totalExpense;



  // On auth state change, save user info in localStorage & cookies as "bunkmateuser"
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const userData = JSON.stringify({ uid: user.uid, email: user.email });
        localStorage.setItem("bunkmateuser", userData);
        setCookie("bunkmateuser", userData, 7);
      } else {
        setUserId(null);
        setBudgetItems([]);
        setError("Please log in to manage your budget.");
        localStorage.removeItem("bunkmateuser");
        setCookie("bunkmateuser", "", -1);
      }
    });
    return () => unsubscribe();
  }, []);



  useEffect(() => {
    if (!userId) {
      const storedUser = localStorage.getItem("bunkmateuser");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed?.uid) {
            setUserId(parsed.uid);
            setError("");
            return;
          }
        } catch {}
      }
      const cookieUser = getCookie("bunkmateuser");
      if (cookieUser) {
        try {
          const parsed = JSON.parse(cookieUser);
          if (parsed?.uid) {
            setUserId(parsed.uid);
            setError("");
            return;
          }
        } catch {}
      }
      setLoading(false);
      setError("No logged in user found.");
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadBudget = async () => {
      setLoading(true);
      setError("");
      try {
        const docRef = doc(db, "budgets", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBudgetItems(docSnap.data().items || []);
        } else {
          setBudgetItems([]);
        }
      } catch (err) {
        setError("Failed to load budget data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadBudget();
  }, [userId]);

  const saveBudget = async (items) => {
    if (!userId) return;
    setSaving(true);
    setError("");
    try {
      const docRef = doc(db, "budgets", userId);
      await setDoc(docRef, { items }, { merge: true });
      setBudgetItems(items);
    } catch (err) {
      setError("Failed to save budget data.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };



  const handleEditSave = () => {
    if (!editCategory.trim() || !editAmount.trim() || isNaN(Number(editAmount))) {
      setError("Please enter a valid category and numeric amount.");
      return;
    }
    const updatedItems = [...budgetItems];
    updatedItems[editIndex] = {
      ...updatedItems[editIndex],
      category: editCategory.trim(),
      amount: parseFloat(editAmount),
    };
    saveBudget(updatedItems);
    setDialogOpen(false);
    setEditIndex(null);
    setEditCategory("");
    setEditAmount("");
    setError("");
  };


  const handleOpenExpDrawer = (index) => {
    setSelectedBudgetIndex(index);
    setSelectedIndex(index);
    setAddDrawerOpen(false);      // Close Add Drawer
    setExpDrawerOpen(true);       // Open Expense Drawer
  };


  // Calculate current balance for selected budget item
  const getCurrentBalance = (item) => {
    const totalExpenses = item.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    return item.amount - totalExpenses;
  };


const handleAddExpense = () => {
  const amountNum = parseFloat(newExpense.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    setAddError("Enter a valid positive amount.");
    return;
  }

  const updatedItems = [...budgetItems];
  const selected = updatedItems[selectedBudgetIndex];

  const expenseData = {
    ...newExpense,
    amount: amountNum,
    date: new Date(`${newExpense.date}T${newExpense.time}`).toISOString(),
  };

  if (!selected.expenses) selected.expenses = [];

  if (isEditMode && editIndex !== null) {
    selected.expenses[editIndex] = expenseData;
  } else {
    selected.expenses.push(expenseData);
  }

  saveBudget(updatedItems);

  // Reset form
  setNewExpense({
    amount: "",
    name: "",
    category: "",
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  setEditIndex(null);
  setIsEditMode(false);
  setAddError("");
};


const handleEditExpense = (index) => {
  const exp = budgetItems[selectedBudgetIndex]?.expenses?.[index];
  if (!exp) return;

  setNewExpense({
    amount: exp.amount,
    name: exp.name || "",
    category: exp.category || "",
    date: exp.date ? exp.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    time: exp.date
      ? new Date(exp.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  });

  setEditIndex(index);
  setIsEditMode(true);
  setAddDrawerOpen(true);
};


const handleDeleteExpense = (index) => {
  const updatedItems = [...budgetItems];
  updatedItems[selectedBudgetIndex].expenses.splice(index, 1);
  saveBudget(updatedItems);
};



  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: "#0c0c0c",
        color: "#fff",
        minHeight: "90vh",
        maxWidth: 600,
        mx: "auto",
        borderRadius: 3,
      }}
    >
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Budget Manager
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
          <CircularProgress color="success" />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : (
        <>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "#00ff00", fontWeight: "bold" }}
          >
            Total Budget: ₹{totalBudget.toFixed(2)}
          </Typography>

          {budgetItems.length === 0 ? (
            <Typography sx={{ fontStyle: "italic" }}>
              No budget items added yet.
            </Typography>
          ) : (
            <Grid container spacing={2}>
  {budgetItems.map((item, index) => {
    const balance = getCurrentBalance(item);
    return (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            backgroundColor: "#1e1e1e",
            borderRadius: 2,
            cursor: "pointer",
            transition: "0.3s",
            color: "#fff",
            "&:hover": {
              backgroundColor: "#292929",
            },
          }}
          onClick={() => handleOpenExpDrawer(index)}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {item.name}
          </Typography>
          <Typography variant="body2" color="white">
            {item.category}
          </Typography>
          <Typography variant="body2">
            ₹{item.amount} | Left: ₹{balance.toFixed(2)}
          </Typography>
          {item.contributors?.length > 0 && (
            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
              {item.contributors.map((c, i) => (
                <Chip
                  key={i}
                  label={c}
                  size="small"
                  sx={{ bgcolor: "#333", color: "#fff" }}
                />
              ))}
            </Stack>
          )}
        </Paper>
      </Grid>
    );
  })}
</Grid>

          )}

          {/* Edit Dialog */}
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Edit Budget Item</DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <TextField
                label="Category"
                fullWidth
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{ style: { color: "#00ff00" } }}
                variant="outlined"
              />
              <TextField
                label="Amount"
                fullWidth
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                InputProps={{ style: { color: "#00ff00" } }}
                variant="outlined"
              />
              {error && (
                <Typography color="error" sx={{ mt: 1 }}>
                  {error}
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" color="success" onClick={handleEditSave}>
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Expense Drawer */}
          {ExpdrawerOpen && selectedIndex !== null && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                right: 0,
                height: "100vh",
                bgcolor: "#121212",
                p: 3,
                display: "flex",
                flexDirection: "column",
                zIndex: 999,
                overflowY: "auto",
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="expense-drawer-title"
            >

<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
  <Typography variant="h6" sx={{ color: "#00ff00", fontWeight: "bold" }}>
            Exp_Name
  </Typography>
  <IconButton onClick={() => setExpDrawerOpen(false)} sx={{ color: "#00ff00" }}>
    <CloseIcon />
  </IconButton>
</Box>


              {/* Main Budget Overview Section */}
<Box sx={{ p: 2 }}>
{selectedBudget ? (
  <Box sx={{ p: 2 }}>
    {/* Current Budget Left Section */}
    <Card sx={{ mb: 2, p: 2, backgroundColor: "#1b1b1b", color: "#00ff00" }}>
      <Typography variant="h6" fontWeight="bold">
        Current Budget Left
      </Typography>
      <Typography variant="h4">
        ₹{currentBudget.toFixed(2)}
      </Typography>
    </Card>

    {/* Row: Total Expense & Total Budget */}
    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
      <Card sx={{ flex: 1, p: 2, backgroundColor: "#2c2c2c", color: "#ff4444" }}>
        <Typography variant="subtitle2">Total Expenses</Typography>
        <Typography variant="h6">₹{totalExpense.toFixed(2)}</Typography>
      </Card>
      {selectedBudget && (
  <Card sx={{ mb: 2, p: 2, backgroundColor: "#1b1b1b", color: "#00ff00" }}>
    <Typography variant="h6" fontWeight="bold">
      Current Budget
    </Typography>
    <Typography variant="h4">
      ₹{selectedBudget.amount.toFixed(2)}
    </Typography>
  </Card>
)}

    </Box>

    <Typography variant="subtitle1" sx={{ mt: 4, mb: 1, color: "#00ff00" }}>
  Existing Expenses
</Typography>

{selectedBudget?.expenses?.length > 0 ? (
  selectedBudget.expenses.map((expense, index) => (
    <Box
      key={index}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1,
        p: 1,
        border: "1px solid #333",
        borderRadius: 2,
        color: "#00ff00",
      }}
    >
      <Box>
        <Typography variant="body1">{expense.name || "Unnamed"}</Typography>
        <Typography variant="caption">
          ₹{expense.amount} | {expense.category || "No Category"} <br />
          {new Date(expense.date).toLocaleDateString()}{" "}
          {new Date(expense.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Typography>
      </Box>
      <Box>
        <IconButton
          size="small"
          onClick={() => handleEditExpense(index)}
          sx={{ color: "#00ccff" }}
        >
          ✏️
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleDeleteExpense(index)}
          sx={{ color: "#ff4444" }}
        >
          🗑️
        </IconButton>
      </Box>
    </Box>
  ))
) : (
  <Typography variant="body2" sx={{ color: "#888" }}>
    No expenses yet.
  </Typography>
)}

  </Box>
) : (
  <Typography sx={{ color: "#ccc", textAlign: "center", mt: 4 }}>
    Please select a budget to view details.
  </Typography>
)}

</Box>

            </Box>
          )}
<Fab
  color="success"
  sx={{
    position: "fixed",
    bottom: 24,
    right: 24,
    backgroundColor: "#00cc00",
    color: "#000",
    "&:hover": {
      backgroundColor: "#00ff00",
    },
  }}
  onClick={() => setAddDrawerOpen(true)}
  aria-label="Add Expense"
>
  <AddIcon />
</Fab>

{addDrawerOpen && (
  <Box
    sx={{
      position: "fixed",
      bottom: 0,
      left: 0,
      width: "100%",
      bgcolor: "#121212",
      p: 3,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      zIndex: 1000,
      boxShadow: "0 -4px 20px #00ff0044",
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
      <Typography variant="h6" sx={{ color: "#00ff00", fontWeight: "bold" }}>
        Add New Expense
      </Typography>
      <ButtonBase
        onClick={() => setAddDrawerOpen(false)}
        sx={{ color: "#00ff00", fontSize: 24, px: 1 }}
      >
        &times;
      </ButtonBase>
    </Box>

    <TextField
      label="Amount"
      type="number"
      fullWidth
      variant="outlined"
      size="small"
      sx={{ mb: 2 }}
      value={newExpense.amount}
      onChange={(e) =>
        setNewExpense({ ...newExpense, amount: e.target.value })
      }
      InputProps={{ style: { color: "#00ff00" } }}
    />

    <TextField
      label="Name"
      fullWidth
      variant="outlined"
      size="small"
      sx={{ mb: 2 }}
      value={newExpense.name}
      onChange={(e) =>
        setNewExpense({ ...newExpense, name: e.target.value })
      }
      InputProps={{ style: { color: "#00ff00" } }}
    />

    <TextField
      label="Category"
      fullWidth
      variant="outlined"
      size="small"
      sx={{ mb: 2 }}
      value={newExpense.category}
      onChange={(e) =>
        setNewExpense({ ...newExpense, category: e.target.value })
      }
      InputProps={{ style: { color: "#00ff00" } }}
    />

    <TextField
      label="Date"
      type="date"
      fullWidth
      variant="outlined"
      size="small"
      sx={{ mb: 2 }}
      value={newExpense.date}
      onChange={(e) =>
        setNewExpense({ ...newExpense, date: e.target.value })
      }
      InputLabelProps={{ shrink: true }}
      InputProps={{ style: { color: "#00ff00" } }}
    />

    <TextField
      label="Time"
      type="time"
      fullWidth
      variant="outlined"
      size="small"
      sx={{ mb: 2 }}
      value={newExpense.time}
      onChange={(e) =>
        setNewExpense({ ...newExpense, time: e.target.value })
      }
      InputLabelProps={{ shrink: true }}
      InputProps={{ style: { color: "#00ff00" } }}
    />

    {addError && (
      <Typography sx={{ color: "#ff4444", mb: 2 }}>{addError}</Typography>
    )}


<Button
  variant="contained"
  color="success"
  fullWidth
  onClick={() => {
    handleAddExpense();
    setAddDrawerOpen(false); // Close after save
  }}
>
  {isEditMode ? "Update Expense" : "Add Expense"}
</Button>


  </Box>
)}



        </>
      )}

      {saving && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            backgroundColor: "#004d00",
            borderRadius: 2,
            px: 2,
            py: 1,
            color: "#0f0",
            fontWeight: "bold",
            boxShadow: "0 0 10px #00ff00bb",
            userSelect: "none",
          }}
        >
          Saving...
        </Box>
      )}

      <Fab
  color="success"
  onClick={() => setDrawerOpen(true)}
  sx={{
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 988,
  }}
>
  <AddIcon />
</Fab>

<Drawer
  anchor="bottom"
  open={drawerOpen}
  onClose={() => {
    setDrawerOpen(false);
    setFormData({ name: "", category: "", amount: "", contributor: "", contributors: [] });
  }}
  PaperProps={{
    sx: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      backgroundColor: "#121212",
      padding: 3,
    },
  }}
>
  <Typography variant="h6" gutterBottom>
    Add New Budget
  </Typography>

  <Stack spacing={2}>
    <TextField
      label="Budget Name"
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      fullWidth
      variant="outlined"
      InputProps={{ style: { color: "#fff" } }}
      InputLabelProps={{ style: { color: "#aaa" } }}
    />
    <TextField
      label="Category"
      value={formData.category}
      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      fullWidth
      variant="outlined"
      InputProps={{ style: { color: "#fff" } }}
      InputLabelProps={{ style: { color: "#aaa" } }}
    />
    <TextField
      label="Amount"
      value={formData.amount}
      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
      fullWidth
      type="number"
      variant="outlined"
      InputProps={{ style: { color: "#fff" } }}
      InputLabelProps={{ style: { color: "#aaa" } }}
    />
    <TextField
      label="Add Contributor"
      value={formData.contributor}
      onChange={(e) => setFormData({ ...formData, contributor: e.target.value })}
      onKeyDown={(e) => {
        if (e.key === "Enter" && formData.contributor.trim()) {
          setFormData({
            ...formData,
            contributors: [...formData.contributors, formData.contributor.trim()],
            contributor: "",
          });
        }
      }}
      fullWidth
      variant="outlined"
      InputProps={{ style: { color: "#fff" } }}
      InputLabelProps={{ style: { color: "#aaa" } }}
    />
    <Stack direction="row" spacing={1} flexWrap="wrap">
      {formData.contributors.map((name, i) => (
        <Chip
          key={i}
          label={name}
          onDelete={() =>
            setFormData({
              ...formData,
              contributors: formData.contributors.filter((_, idx) => idx !== i),
            })
          }
          sx={{ bgcolor: "#333", color: "#fff" }}
        />
      ))}
    </Stack>

    <Button
      variant="contained"
      color="success"
      onClick={() => {
        const { name, category, amount, contributors } = formData;
        if (!name || !category || isNaN(Number(amount))) return;

        const newItem = {
          name,
          category,
          amount: parseFloat(amount),
          contributors,
          expenses: [],
        };

        const updatedItems = [...budgetItems, newItem];
        saveBudget(updatedItems);
        setDrawerOpen(false);
        setFormData({ name: "", category: "", amount: "", contributor: "", contributors: [] });
      }}
    >
      Save Budget
    </Button>
  </Stack>
</Drawer>

    </Box>
    
  );
};

export default BudgetManager;
