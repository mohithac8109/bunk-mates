import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  Paper,
  useTheme,
  Slide,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs from "dayjs";

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [eventType, setEventType] = useState("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [currentDate, setCurrentDate] = useState(dayjs());

  const theme = useTheme();

  const handleDateClick = (arg) => {
    setSelectedDate(arg.dateStr);
    setOpenDialog(true);
  };

  const handleAddEvent = () => {
    const newEvent = {
      title: `${eventType === "income" ? "Added" : eventType === "expense" ? "Spent" : "Reminder"} ₹${amount} ${description}`,
      date: selectedDate,
      color:
        eventType === "income"
          ? theme.palette.success.main
          : eventType === "expense"
          ? theme.palette.error.main
          : theme.palette.info.main,
    };
    setEvents([...events, newEvent]);
    setOpenDialog(false);
    setAmount("");
    setDescription("");
    setEventType("income");
  };

  const handleDateChange = (unit, value) => {
    const newDate = currentDate.set(unit, parseInt(value));
    setCurrentDate(newDate);
  };

  return (
    <Box
      sx={{
        p: 4,
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${theme.palette.background.default}, ${theme.palette.primary.light})`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarMonthIcon fontSize="large" color="primary" />
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              color: theme.palette.primary.main,
              textShadow: "1px 1px rgba(255,255,255,0.5)",
            }}
          >
            Budget Calendar
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <TextField
            select
            value={currentDate.month()}
            onChange={(e) => handleDateChange("month", e.target.value)}
            size="small"
            label="Month"
            variant="outlined"
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <MenuItem key={i} value={i}>
                {dayjs().month(i).format("MMMM")}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            value={currentDate.year()}
            onChange={(e) => handleDateChange("year", e.target.value)}
            size="small"
            label="Year"
            variant="outlined"
            sx={{
              backgroundColor: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            {Array.from({ length: 10 }, (_, i) => currentDate.year() - 5 + i).map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* Calendar */}
      <Paper
        elevation={4}
        sx={{
          borderRadius: 4,
          p: 2,
          backdropFilter: "blur(8px)",
          background: theme.palette.background.paper,
          boxShadow: theme.shadows[4],
        }}
      >
        <FullCalendar
          key={currentDate.format("YYYY-MM")}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={handleDateClick}
          initialDate={currentDate.format("YYYY-MM-DD")}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
        />
      </Paper>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        TransitionComponent={Slide}
        transitionDuration={400}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            background: theme.palette.background.paper,
            boxShadow: theme.shadows[10],
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: "bold", color: theme.palette.warning.main }}>
          ✨ Add Budget Event
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            margin="dense"
            sx={{ mb: 2 }}
          >
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
            <MenuItem value="reminder">Reminder</MenuItem>
          </TextField>
          <TextField
            fullWidth
            type="number"
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="dense"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="dense"
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            color="error"
            sx={{ fontWeight: "bold" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddEvent}
            variant="contained"
            color="primary"
            sx={{ fontWeight: "bold" }}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarPage;
