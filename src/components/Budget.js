import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Divider,
  Paper,
  CircularProgress,
  Grow,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonBase,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
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
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [editIndex, setEditIndex] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);

  // Expense input inside drawer
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseError, setExpenseError] = useState("");

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

  const handleAddItem = () => {
    if (!newCategory.trim() || !newAmount.trim() || isNaN(Number(newAmount))) {
      setError("Please enter a valid category and numeric amount.");
      return;
    }
    const newItem = {
      category: newCategory.trim(),
      amount: parseFloat(newAmount),
      expenses: [], // Initialize empty expenses array
    };
    const updatedItems = [...budgetItems, newItem];
    saveBudget(updatedItems);
    setNewCategory("");
    setNewAmount("");
    setError("");
  };

  const handleDeleteItem = (index) => {
    if (selectedIndex === index) {
      setDrawerOpen(false);
      setSelectedIndex(null);
    }
    const updatedItems = budgetItems.filter((_, i) => i !== index);
    saveBudget(updatedItems);
  };

  const openEditDialog = (index) => {
    setEditIndex(index);
    setEditCategory(budgetItems[index].category);
    setEditAmount(budgetItems[index].amount.toString());
    setDialogOpen(true);
    setError("");
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

  // Calculate total budget
  const totalBudget = budgetItems.reduce((acc, item) => acc + item.amount, 0);

  // Drawer open handler for budget item click
  const handleOpenDrawer = (index) => {
    setSelectedIndex(index);
    setExpenseAmount("");
    setExpenseError("");
    setDrawerOpen(true);
  };

  // Calculate current balance for selected budget item
  const getCurrentBalance = (item) => {
    const totalExpenses = item.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    return item.amount - totalExpenses;
  };

  // Add expense handler inside drawer
  const handleAddExpense = () => {
    if (!expenseAmount.trim() || isNaN(Number(expenseAmount)) || Number(expenseAmount) <= 0) {
      setExpenseError("Please enter a valid positive expense amount.");
      return;
    }

    const amountNum = parseFloat(expenseAmount);
    const item = budgetItems[selectedIndex];
    const totalExpenses = item.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const currentBalance = item.amount - totalExpenses;

    if (amountNum > currentBalance) {
      setExpenseError("Expense exceeds current balance.");
      return;
    }

    const newExpense = {
      amount: amountNum,
      date: new Date().toISOString(),
    };

    const updatedItems = [...budgetItems];
    if (!updatedItems[selectedIndex].expenses) {
      updatedItems[selectedIndex].expenses = [];
    }
    updatedItems[selectedIndex].expenses.push(newExpense);

    saveBudget(updatedItems);
    setExpenseAmount("");
    setExpenseError("");
  };

  // Delete expense from expense history
  const handleDeleteExpense = (expenseIndex) => {
    const updatedItems = [...budgetItems];
    updatedItems[selectedIndex].expenses.splice(expenseIndex, 1);
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
        boxShadow: "0 0 10px #00f72166",
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

          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            <TextField
              label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{ style: { color: "#00ff00" } }}
              variant="outlined"
            />
            <TextField
              label="Amount"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              size="small"
              sx={{ width: 120 }}
              type="number"
              InputProps={{ style: { color: "#00ff00" } }}
              variant="outlined"
            />
            <Button
              variant="contained"
              color="success"
              onClick={handleAddItem}
              sx={{ px: 3 }}
            >
              Add
            </Button>
          </Box>

          {budgetItems.length === 0 ? (
            <Typography sx={{ fontStyle: "italic" }}>
              No budget items added yet.
            </Typography>
          ) : (
            <Box>
              {budgetItems.map((item, index) => {
                const balance = getCurrentBalance(item);
                return (
                  <Grow
                    in={true}
                    style={{ transformOrigin: "0 0 0" }}
                    timeout={300 + index * 200}
                    key={index}
                  >
                    <Paper
                      elevation={4}
                      sx={{
                        mb: 2,
                        p: 2,
                        backgroundColor: "#111",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: selectedIndex === index ? "2px solid #00ff00" : "none",
                        "&:hover": { backgroundColor: "#222" },
                      }}
                      onClick={() => handleOpenDrawer(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleOpenDrawer(index);
                        }
                      }}
                      aria-label={`Budget category ${item.category}, amount ₹${item.amount}`}
                    >
                      <Box>
                        <Typography
                          sx={{ fontWeight: "bold", fontSize: 16, color: "#00ff00" }}
                        >
                          {item.category}
                        </Typography>
                        <Typography sx={{ fontSize: 14, opacity: 0.8 }}>
                          Budget: ₹{item.amount.toFixed(2)}
                        </Typography>
                        <Typography sx={{ fontSize: 14, opacity: 0.8, mt: 0.5 }}>
                          Balance: ₹{balance.toFixed(2)}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Edit Category & Amount">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(index);
                            }}
                            color="success"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Category">
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  `Delete budget category "${item.category}"? This will remove all its expenses.`
                                )
                              ) {
                                handleDeleteItem(index);
                              }
                            }}
                            color="error"
                            size="small"
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  </Grow>
                );
              })}
            </Box>
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
          {drawerOpen && selectedIndex !== null && (
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
                zIndex: 1500,
                overflowY: "auto",
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="expense-drawer-title"
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  id="expense-drawer-title"
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#00ff00" }}
                >
                  {budgetItems[selectedIndex].category} Expenses
                </Typography>
                <ButtonBase
                  onClick={() => {
                    setDrawerOpen(false);
                    setSelectedIndex(null);
                  }}
                  sx={{
                    color: "#00ff00",
                    fontWeight: "bold",
                    fontSize: 24,
                    cursor: "pointer",
                    px: 1,
                  }}
                  aria-label="Close expense drawer"
                >
                  &times;
                </ButtonBase>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 14, mb: 1 }}>
                  Budget Amount: ₹{budgetItems[selectedIndex].amount.toFixed(2)}
                </Typography>
                <Typography sx={{ fontSize: 14, mb: 2 }}>
                  Current Balance: ₹{getCurrentBalance(budgetItems[selectedIndex]).toFixed(2)}
                </Typography>

                <TextField
                  label="Add Expense Amount"
                  type="number"
                  fullWidth
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  InputProps={{ style: { color: "#00ff00" } }}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
                {expenseError && (
                  <Typography color="error" sx={{ mb: 1 }}>
                    {expenseError}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={handleAddExpense}
                  disabled={saving}
                >
                  Add Expense
                </Button>
              </Box>

              <Divider sx={{ mb: 2, borderColor: "#00ff00aa" }} />

              <Typography
                variant="subtitle1"
                sx={{ mb: 1, fontWeight: "bold", color: "#00ff00" }}
              >
                Expense History
              </Typography>

              {budgetItems[selectedIndex].expenses?.length === 0 ? (
                <Typography sx={{ fontStyle: "italic", color: "#ccc" }}>
                  No expenses added yet.
                </Typography>
              ) : (
                budgetItems[selectedIndex].expenses
                  .slice()
                  .reverse()
                  .map((expense, i) => {
                    const revIndex =
                      budgetItems[selectedIndex].expenses.length - 1 - i;
                    const date = new Date(expense.date);
                    return (
                      <Box
                        key={revIndex}
                        sx={{
                          mb: 1,
                          p: 1,
                          backgroundColor: "#222",
                          borderRadius: 1,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box>
                          <Typography sx={{ color: "#00ff00", fontWeight: "bold" }}>
                            ₹{expense.amount.toFixed(2)}
                          </Typography>
                          <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
                            {date.toLocaleString()}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteExpense(revIndex)}
                          aria-label={`Delete expense of ₹${expense.amount.toFixed(2)}`}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })
              )}
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
    </Box>
  );
};

export default BudgetManager;
