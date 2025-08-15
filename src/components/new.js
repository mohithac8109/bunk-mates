
  useEffect(() => {
    if (!id) return;

    fetchTripData();

    const unsubChecklist = onSnapshot(collection(db, `trips/${id}/checklist`), (snapshot) => {
      setChecklist(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubPhotos = onSnapshot(collection(db, `trips/${id}/photos`), (snap) => {
      setPhotos(snap.docs.map(doc => doc.data().url));
    });

    const unsubTimeline = onSnapshot(collection(db, `trips/${id}/timeline`), (snap) => {
      const events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = events.sort((a, b) => new Date(a.time) - new Date(b.time));
      setTimeline(sorted);
    });

    return () => {
      unsubChecklist();
      unsubPhotos();
      unsubTimeline();
    };
  }, [id]);

  
const handleChecklistFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const validTypes = ['text/plain', 'text/markdown', 'text/x-markdown'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|md)$/i)) {
    setSnackbar({ open: true, message: "Unsupported file type. Please upload .txt or .md files." });
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    // Split lines and filter out empty lines and trim
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length > 0) {
      setChecklistDrafts(lines);
    } else {
      setSnackbar({ open: true, message: "No valid checklist items found in file." });
    }
  };
  reader.readAsText(file);
};

// Update a single draft checklist item
const updateChecklistDraft = (index, value) => {
  setChecklistDrafts(prev => {
    const updated = [...prev];
    updated[index] = value;
    return updated;
  });
};

// Remove a draft checklist item
const removeChecklistDraft = (index) => {
  setChecklistDrafts(prev => prev.filter((_, i) => i !== index));
};

// Add empty draft checklist item
const addEmptyChecklistDraft = () => {
  setChecklistDrafts(prev => [...prev, ""]);
};

// Save all draft checklist items to Firestore, then clear and close drawer
const addAllChecklistItems = async () => {
  if (checklistDrafts.length === 0) {
    setSnackbar({ open: true, message: "No checklist items to add." });
    return;
  }
  setUploadingBatch(true);
  try {
    const batchPromises = checklistDrafts.map(text =>
      addDoc(collection(db, `trips/${id}/checklist`), { text, completed: false })
    );
    await Promise.all(batchPromises);
    setSnackbar({ open: true, message: `${checklistDrafts.length} checklist item(s) added!` });
    setChecklistDrafts([]);
    setChecklistDrawerOpen(false);
  } catch (error) {
    setSnackbar({ open: true, message: "Failed to add checklist items." });
    console.error(error);
  }
  setUploadingBatch(false);
};

const fetchTripData = async () => {
  if (!id) return;

  // Fetch trip details
  const docRef = doc(db, "trips", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const tripData = docSnap.data();

  // Fetch group chat iconURL
  const groupChatRef = doc(db, "groupChats", id);
  const groupChatSnap = await getDoc(groupChatRef);
  const groupChatData = groupChatSnap.exists() ? groupChatSnap.data() : null;

  const iconURL = groupChatData?.iconURL || null;

  // Combine trip data with iconURL
  const combinedData = {
    ...tripData,
    iconURL
  };

  // Set full trip state
  setTrip(combinedData);
  setEditTrip(tripData); // preserve separate edit state

  // Load members
  if (tripData.members?.length) {
    loadMemberDetails(tripData.members);
  }

  // Fallback image if no icon
  const imageQuery = tripData.name || tripData.location || "travel";
  const imageUrl = await fetchCoverImage(imageQuery);
  setCoverImage(imageUrl);

  // Fetch personal budget
  fetchBudget(tripData.name);

  // Fetch weather
  if (tripData.location) {
    try {
      const weatherData = await getWeather(tripData.location); // From WeatherContext
      setWeather(weatherData); // assume you have `const [weather, setWeather] = useState(null)`
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    }
  }
};

const loadMemberDetails = (uids) => {
  const userDetailsUnsubs = [];

  const members = [];

  uids.forEach(uid => {
    const userDocRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userDocRef, snapshot => {
      if (snapshot.exists()) {
        // update or add member info
        const userData = { uid: snapshot.id, ...snapshot.data() };

        const index = members.findIndex(m => m.uid === uid);
        if (index !== -1) {
          members[index] = userData;
        } else {
          members.push(userData);
        }

        // trigger state update (force new array for react state change detection)
        setMemberDetails([...members]);
      }
    });
    userDetailsUnsubs.push(unsubscribe);
  });

  // Optional: return unsubscribe functions to clean up listeners if needed
  return () => userDetailsUnsubs.forEach(unsub => unsub());
};

  // Fetch budget & expenses for this trip from budgets collection (budgets/{userUid} document)
  const fetchBudget = async (tripName) => {
    if (!currentUseruid) return;

    const budgetDocRef = doc(db, "budgets", currentUseruid);
    const budgetSnap = await getDoc(budgetDocRef);

    if (budgetSnap.exists()) {
      const data = budgetSnap.data();
      const items = data.items || [];

      // Find budget item matching current tripId
      const tripBudget = items.find(item => item.tripId === id);

      if (tripBudget) {
        // Calculate total used amount by summing expenses amount
        const totalUsed = (tripBudget.expenses || []).reduce(
          (sum, exp) => sum + (exp.amount || 0),
          0
        );

        setBudget({
          total: tripBudget.amount,
          used: totalUsed,
          contributors: tripBudget.contributors || [],
          expenses: tripBudget.expenses || []
        });

        // Also initialize editBudget so user can edit it in budget drawer
        setEditBudget({
          total: tripBudget.amount,
          contributors: tripBudget.contributors || []
        });
      } else {
        setBudget(null);
        setEditBudget({ total: "", contributors: [] });
      }
    }
  };

  const handleSaveEdit = async () => {
  if (!trip || !id) return;

  try {
    const tripRef = doc(db, "trips", id);
    await updateDoc(tripRef, {
      name: editTrip.name,
      location: editTrip.location,
      startDate: editTrip.startDate,
      endDate: editTrip.endDate,
      from: editTrip.from || "",
      to: editTrip.to || ""
    });

    setTrip(prev => ({
      ...prev,
      name: editTrip.name,
      location: editTrip.location,
      startDate: editTrip.startDate,
      endDate: editTrip.endDate,
      from: editTrip.from,
      to: editTrip.to
    }));

    setSnackbar({ open: true, message: "Trip updated successfully!" });
    setEditMode(false);
  } catch (err) {
    console.error("Error updating trip:", err);
    setSnackbar({ open: true, message: "Failed to save changes." });
  }
};

const handleDeleteTrip = async () => {
  try {
    setConfirmDeleteOpen(false);

    // Delete trip document
    await deleteDoc(doc(db, "trips", id));

    // Delete group chat
    await deleteDoc(doc(db, "groupChats", id));

    // Remove from all users' budgets
    const budgetDocs = await getDocs(collection(db, "budgets"));
    await Promise.all(
      budgetDocs.docs.map(async (snap) => {
        const data = snap.data();
        const updatedItems = (data.items || []).filter(item => item.tripId !== id);
        if (updatedItems.length !== (data.items || []).length) {
          await updateDoc(doc(db, "budgets", snap.id), { items: updatedItems });
        }
      })
    );

    setSnackbar({ open: true, message: "Trip deleted successfully!" });
    setTimeout(() => navigate("/"), 1500);
  } catch (err) {
    console.error("Failed to delete trip:", err);
    setSnackbar({ open: true, message: "Error deleting trip." });
  }
};



  const handleEditSave = async () => {
    if (!currentUseruid) return;

    try {
      const budgetDocRef = doc(db, "budgets", currentUseruid);
      const budgetSnap = await getDoc(budgetDocRef);
      if (!budgetSnap.exists()) {
        setSnackbar({ open: true, message: "Budget document not found." });
        return;
      }
      const data = budgetSnap.data();
      const items = data.items || [];

      const tripBudgetIndex = items.findIndex(item => item.tripId === id);

      const updatedItem = {
        name: trip?.name || "",
        amount: parseInt(editBudget.total),
        category: "General",
        contributors: editBudget.contributors,
        expenses: items[tripBudgetIndex]?.expenses || [],
        tripId: id,
      };

      if (tripBudgetIndex !== -1) {
        items[tripBudgetIndex] = updatedItem;
      } else {
        items.push(updatedItem);
      }

      await updateDoc(budgetDocRef, { items });

      setBudget({
        total: updatedItem.amount,
        used: updatedItem.expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        contributors: updatedItem.contributors,
        expenses: updatedItem.expenses
      });

      setBudgetDrawerOpen(false);
      setSnackbar({ open: true, message: "Budget updated successfully!" });
    } catch (error) {
      console.error("Error updating budget:", error);
      setSnackbar({ open: true, message: "Failed to update budget." });
    }
  };

    // Timeline handlers
const addTimelineEvent = async () => {
  if (!newEvent.title || !newEvent.time) return;

  try {
    await addDoc(collection(db, `trips/${id}/timeline`), {
      ...newEvent,
      completed: false, // Default to incomplete
    });
    setNewEvent({ title: "", time: "", note: "" });
    setTimelineDrawerOpen(false);
  } catch (error) {
    console.error("Error adding timeline event:", error);
  }
};

const deleteTimelineEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, `trips/${id}/timeline`, eventId));
  } catch (error) {
    console.error("Error deleting timeline event:", error);
  }
};

// ✅ Toggle event completion manually by admin
const toggleEventCompleted = async (event) => {
  try {
    const eventRef = doc(db, `trips/${id}/timeline`, event.id);
    await updateDoc(eventRef, {
      completed: !event.completed,
    });
  } catch (error) {
    console.error("Failed to toggle event completion:", error);
  }
};


      const saveBudget = async () => {
        if (!trip) return;
    
        const userBudgetRef = doc(db, "budgets", currentUseruid);
        const userBudgetSnap = await getDoc(userBudgetRef);
    
        let existingData = { items: [] };
        if (userBudgetSnap.exists()) {
          existingData = userBudgetSnap.data();
          if (!Array.isArray(existingData.items)) existingData.items = [];
        }
    
        const updatedItems = [...existingData.items];
        const index = updatedItems.findIndex((item) => item.tripId === id);
    
        const newItem = {
          name: trip.name,
          amount: Number(editBudget.total),
          category: "General",
          contributors: editBudget.contributors.map((c) => ({
            name: c.name,
            amount: Number(c.amount),
            uid: c.uid || "",
          })),
          expenses: budget?.expenses || [],
          tripId: id,
        };
    
        if (index !== -1) {
          updatedItems[index] = newItem;
        } else {
          updatedItems.push(newItem);
        }
    
        await setDoc(userBudgetRef, { items: updatedItems }, { merge: true });
    
        setBudgetDrawerOpen(false);
        await fetchBudget(id);
        setSnackbar({ open: true, message: "Budget saved successfully!" });
      };

  // Expense adding function - saves expense to Firestore budget doc
  const addExpense = async () => {
    if (!currentUseruid) {
      setSnackbar({ open: true, message: "User not authenticated." });
      return;
    }
    if (!newExpense.name || !newExpense.amount || !newExpense.date || !newExpense.time) {
      setSnackbar({ open: true, message: "Please fill all fields." });
      return;
    }

    try {
      const budgetDocRef = doc(db, "budgets", currentUseruid);
      const budgetSnap = await getDoc(budgetDocRef);

      if (!budgetSnap.exists()) {
        setSnackbar({ open: true, message: "Budget document not found." });
        return;
      }

      const data = budgetSnap.data();
      const items = data.items || [];

      const tripBudgetIndex = items.findIndex(item => item.tripId === id);

      if (tripBudgetIndex === -1) {
        setSnackbar({ open: true, message: "Budget for this trip not found." });
        return;
      }

      const expenseDateTime = new Date(`${newExpense.date}T${newExpense.time}`).toISOString();

      const expenseItem = {
        name: newExpense.name,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category || "General",
        date: newExpense.date,
        time: newExpense.time,
        dateTime: expenseDateTime,
      };

      items[tripBudgetIndex].expenses = items[tripBudgetIndex].expenses || [];
      items[tripBudgetIndex].expenses.push(expenseItem);

      await updateDoc(budgetDocRef, { items });

      // Update local budget state immediately
      const totalUsed = items[tripBudgetIndex].expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      setBudget(prev => ({
        ...prev,
        expenses: items[tripBudgetIndex].expenses,
        used: totalUsed,
      }));

      setSnackbar({ open: true, message: "Expense added successfully!" });
      setExpenseDrawerOpen(false);
      setNewExpense({ name: "", amount: "", category: "", date: "", time: "" });
    } catch (error) {
      console.error("Error adding expense:", error);
      setSnackbar({ open: true, message: "Failed to add expense." });
    }
  };

  const addTask = async () => {
    if (!newTask) return;
    await addDoc(collection(db, `trips/${id}/checklist`), {
      text: newTask,
      completed: false,
    });
    setNewTask("");
  };

  const toggleTask = async (task) => {
    await updateDoc(doc(db, `trips/${id}/checklist`, task.id), {
      completed: !task.completed
    });
  };

const fetchCoverImage = async (location) => {
  // Combine 'travel' + location for the search query
  const query = location ? `travel ${trip?.location}` : "travel";

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&client_id=MGCA3bsEUNBsSG6XbcqnJXckFB4dDyN5ZPKVBrD0FeQ`
    );
    const data = await response.json();
    return data?.urls?.regular || "";
  } catch (error) {
    console.error("Failed to fetch cover image:", error);
    return "";
  }
};


  const inviteLink = `${window.location.origin}/join?trip=${id}`;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    trip?.from || ""
  )}&destination=${encodeURIComponent(trip?.to || "")}`;

  const goBack = () => {
    history("/trips");  
  };