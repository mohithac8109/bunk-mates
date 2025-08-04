import React, { useState, useEffect } from "react";
import { auth } from '../../firebase';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  limit
} from 'firebase/firestore';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Paper,
  IconButton,
  SwipeableDrawer,
  List,
  ListItem,
  ListItemText,
  Dialog,
  ThemeProvider,
  Stack,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Checkbox,
  ListItemButton,
  Divider,
  Drawer,
  CircularProgress,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Tooltip,
  InputAdornment,
  LinearProgress,
} from '@mui/material';

import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  Add as AddIcon,
  PhoneOutlined as PhoneOutlinedIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
  PersonAdd as PersonAddIcon,
  ContentCopy as ContentCopyIcon,
  ExitToAppOutlined as ExitToAppOutlinedIcon,
  LocationOn,
  AccessTime,
  Share as ShareIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
} from "@mui/icons-material";

import { QRCodeCanvas } from "qrcode.react";
import { useParams } from 'react-router-dom';  
import { useThemeToggle } from "../../contexts/ThemeToggleContext";
import { getTheme } from "../../theme";

const GroupInfoDrawer = ({
  profileOpen,
  setProfileOpen,
  createdByUser,
  tripInfo,
  timelineStats,
  memberInfo,
  currentUser,
  user,
  setGroupSettingsOpen,
  groupSettingsOpen,
  membersDrawerOpen,
  setMembersDrawerOpen,
  inviteDrawerOpen,
  setInviteDrawerOpen,
  setNotification,
  notification,
  addUserDialogOpen,
  setAddUserDialogOpen,
  navigate,
  // Additional props for internal state that might be simpler controlled internally
  onCloseGroupSettings,
  onCloseAddUserDialog,
  onCloseInviteDrawer,
  onCloseMembersDrawer,
}) => {
  const { groupName } = useParams();
  const [groupInfo, setGroupInfo] = useState({});
  const { mode, accent, } = useThemeToggle();
  const theme = getTheme(mode, accent);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedMemberToRemove, setSelectedMemberToRemove] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [groupIconType, setGroupIconType] = useState(groupInfo?.iconURL?.startsWith("http") ? "image" : "emoji");
  const [groupIconValue, setGroupIconValue] = useState(groupInfo?.iconURL || "");
  const [editingGroupInfo, setEditingGroupInfo] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [searchMembersText, setSearchMembersText] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);



const handleExitGroup = async () => {
  if (!user || !groupName) {
    console.warn("Missing user or groupName", { user, groupName });
    return;
  }

  try {
    const groupRef = doc(db, "groupChats", groupName); // groupName = doc ID
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      console.warn("Group does not exist");
      return;
    }

    const groupData = groupSnap.data();

    // ✅ Prevent exit for system groups
    if (groupData.isSystem) {
      alert("You cannot exit a system group like Beta or Dev Beta.");
      return;
    }

    // ✅ Remove user from group
    await updateDoc(groupRef, {
      members: arrayRemove(user.uid),
    });

    // ✅ Send system message
    await addDoc(collection(db, "groupChat", groupName, "messages"), {
      type: "system",
      content: `${user.displayName || "A user"} left the group.`,
      timestamp: serverTimestamp(),
    });

    console.log("✅ User removed from group.");
    navigate("/chats");
  } catch (err) {
    console.error("❌ Failed to exit group:", err.message);
  }
};

const handleRemoveMember = async (uidToRemove) => {
  if (!groupName || !uidToRemove) return;

  try {
    const groupRef = doc(db, "groupChats", groupName);

    // Step 1: Remove member
    await updateDoc(groupRef, {
      members: arrayRemove(uidToRemove),
    });

    // Step 2: Re-fetch group doc to check members length
    const updatedSnap = await getDoc(groupRef);
    const updatedData = updatedSnap.data();
    const remainingMembers = updatedData.members || [];

    // Step 3: If no members left, delete the group
    if (remainingMembers.length === 0) {
      await deleteDoc(groupRef);
      console.log("Group deleted due to no members remaining.");
      navigate("/chats");
      return;
    }

    // Step 4: Notify removed member in group messages
    await addDoc(collection(db, "groupChat", groupName, "messages"), {
      type: "system",
      content: `${memberInfo[uidToRemove]?.username || "A member"} was removed from the group.`,
      timestamp: serverTimestamp(),
    });

    console.log("Member removed and system message sent.");
  } catch (err) {
    console.error("Failed to remove member or delete group:", err.message);
  }
};

useEffect(() => {
  if (!groupName) return;

  const groupRef = doc(db, "groupChats", groupName);

  const unsubscribe = onSnapshot(groupRef, (docSnap) => {
    if (docSnap.exists()) {
      setGroupInfo(docSnap.data()); // ✅ keeps everything in sync
    }
  });

  return () => unsubscribe(); // cleanup on unmount
}, [groupName]);

const canAddMembers =
  groupInfo?.inviteAccess === "all" ||
  groupInfo?.createdBy === currentUser?.uid ||
  groupInfo?.admins?.includes(currentUser?.uid);

const canEditGroupInfo =
  groupInfo?.editAccess === "all" ||
  groupInfo?.createdBy === currentUser?.uid ||
  groupInfo?.admins?.includes(currentUser?.uid);


useEffect(() => {
  if (searchTerm.length < 2) {
    setSearchResults([]);
    return;
  }

  const fetchUsers = async () => {
    setSearchLoading(true);

    try {
      const q = query(collection(db, "users"), limit(50));
      const snapshot = await getDocs(q);

      const results = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const uid = doc.id;

        const isAlreadyInGroup = groupInfo?.members?.includes(uid);

        const matchesSearch =
          data.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.email?.toLowerCase().includes(searchTerm.toLowerCase());

        // Only include if not already a group member and matches search
        if (!isAlreadyInGroup && matchesSearch) {
          results.push({ uid, ...data });
        }
      });

      // Replace previous results with current search results
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  fetchUsers();
}, [searchTerm, groupInfo?.members]);

const handleUpdateGroupInfo = async () => {
  if (!groupName) {
    console.error("❌ No groupName found in URL.");
    return;
  }

  try {
    const groupRef = doc(db, "groupChats", groupName);
    const groupSnap = await getDoc(groupRef);

    if (!groupSnap.exists()) {
      console.error("❌ Group not found.");
      return;
    }

    const oldData = groupSnap.data();

    if (groupIconType === "emoji" && !groupIconValue) {
      alert("Please select an emoji.");
      return;
    }

    const newData = {
      name: groupInfo?.name?.trim() || groupName,
      description: groupInfo?.description?.trim() || "",
      iconURL: groupIconType === "image" ? groupIconValue : "",
      emoji: groupIconType === "emoji" ? groupIconValue : "",
    };

    await updateDoc(groupRef, newData);
    console.log("✅ Group info updated in Firestore.");

    // Get current user details
    const currentUser = auth.currentUser;
    const senderId = currentUser?.uid || "";
    const senderName =
      currentUser?.displayName ||
      currentUser?.email?.split("@")[0] ||
      "Someone";

    // Detect changes
    const changes = [];

    if (oldData.name !== newData.name) {
      changes.push(`renamed the group to "${newData.name}"`);
    }
    if (oldData.description !== newData.description) {
      changes.push("updated the description");
    }
    if (
      oldData.iconURL !== newData.iconURL ||
      oldData.emoji !== newData.emoji
    ) {
      changes.push("updated the group icon");
    }

    // Send system message if changes occurred
    if (changes.length > 0) {
      const messageText = `${senderName} ${changes.join(", ")}.`;

      await addDoc(collection(db, "groupChat", groupName, "messages"), {
        type: "system",
        content: messageText,
        senderId: senderId,
        senderName: senderName,
        timestamp: serverTimestamp(),
      });

      console.log("📢 System message sent:", messageText);
    }

    setEditingGroupInfo(false);
  } catch (err) {
    console.error("❌ Failed to update group info:", err.message);
  }
};

useEffect(() => {
  if (editingGroupInfo && groupInfo) {
    setGroupIconType(groupInfo.iconURL ? "image" : "emoji");
    setGroupIconValue(groupInfo.iconURL || groupInfo.emoji || "💬");
  }
}, [editingGroupInfo, groupInfo]);

const handleGroupIconUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const maxSizeInBytes = 250 * 1024; // 250 KB limit

  if (file.size > maxSizeInBytes) {
    alert("File size too large! Please select an image under 250KB.");
    return;
  }

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64DataUri = reader.result;
    setGroupIconValue(base64DataUri);  // Store as data URI
    setGroupIconType("image");         // Switch icon type to image
  };
  reader.readAsDataURL(file); // Convert to base64
};

const handlePermissionChange = async (field, value) => {
  const groupRef = doc(db, "groupChats", groupName);
  await updateDoc(groupRef, {
    [field]: value,
  });
};

const toggleAdminStatus = async (uid) => {
  if (!uid) {
    console.error("UID is undefined. Cannot update admin status.");
    return;
  }

  try {
    const groupRef = doc(db, "groupChats", groupName);
    const isAdmin = groupInfo?.admins?.includes(uid);

    await updateDoc(groupRef, {
      admins: isAdmin ? arrayRemove(uid) : arrayUnion(uid),
    });
  } catch (error) {
    console.error("Failed to update admin status:", error.message);
  }
};

const handleBatchAddUsers = async () => {
  if (!groupName || selectedUsers.length === 0) return;

  try {
    const user = auth.currentUser;
    const groupRef = doc(db, "groupChats", groupName);

    // Step 1: Add users to Firestore members array
    await updateDoc(groupRef, {
      members: arrayUnion(...selectedUsers),
    });

    // Step 2: Attempt to map selectedUsers to usernames from searchResults
    const localNames = searchResults
      ?.filter(u => u && selectedUsers.includes(u.uid))
      .map(u => u?.username || u?.displayName || u?.email);

    // Step 3: Fallback – fetch missing profiles from Firestore
    const missingUids = selectedUsers.filter(
      uid => !searchResults?.some(u => u?.uid === uid)
    );

    const fetchedNames = [];
    for (const uid of missingUids) {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        fetchedNames.push(data.username || data.displayName || data.email || uid.slice(0, 6));
      } else {
        fetchedNames.push(uid.slice(0, 6));
      }
    }

    const fullNameList = [...(localNames || []), ...fetchedNames];

    // Step 4: Identify the adder
    const addedBy = user?.displayName || user?.email || "Someone";
    const byText = user?.uid === groupInfo?.createdBy ? "You" : addedBy;

    // Step 5: Final message
    const message = `${byText} added ${fullNameList.join(", ")} to the group.`;

    // Step 6: Send system message
    await addDoc(collection(db, "groupChat", groupName, "messages"), {
      type: "system",
      content: message,
      timestamp: serverTimestamp(),
    });

    // Step 7: Reset UI
    setSelectedUsers([]);
    setSearchTerm('');
    setSearchResults([]);
    setAddUserDialogOpen(false);
    console.log("✅ Users added with proper system message.");
  } catch (err) {
    console.error("❌ Failed to add users:", err.message);
  }
};

const inviteLink = `${window.location.origin}/group-invite/${groupName}`; // or groupInfo.inviteToken

const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Join my group!',
        text: 'Here’s an invite to our group:',
        url: inviteLink
      });
    } catch (err) {
      // handle user cancellation or error
    }
  } else {
    navigator.clipboard.writeText(inviteLink);
    setNotification("📤 Link shared!");
  }
};

  if (!currentUser) return <div>Loading...</div>;

  return (
    <ThemeProvider theme={theme}>
      {profileOpen && (

          <Drawer
            anchor="bottom"
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            PaperProps={{
              sx: {
                height: "100vh",
                backgroundColor: mode === "dark" ? "#0c0c0c" : "#f1f1f1",
                backdropFilter: "blur(40px)",
                color: mode === "dark" ? "#fff" : "#000",
                boxShadow: "none",
                transition: "transform 0.3s ease",
              },
            }}
            disableSwipeToOpen={false}
            sx={{
              "& .MuiDrawer-paper": {
                transition: "transform 0.3s ease",
              },
            }}
          >
            {/* Main content as per the original code, refactored to use props and local state */}
            {/* Due to length, please place the full content here based on your existing code,
            replacing handlers and state access with props and local state declared above. */}
            <Box sx={{ p: 3, height: "100%", position: "relative", overflowY: "auto" }}>
              <Box display="flex" alignItems="center">
                <IconButton
                  onClick={() => setProfileOpen(false)}
                  sx={{ color: mode === "dark" ? "#ccc" : "#000" }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6" color={mode === "dark" ? "#ccc" : "#000"}>
                  Group Info
                </Typography>
              </Box>

              {/* Group Avatar, Name, Badges */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                  mt: 6,
                }}
              >
                <Avatar
                  src={groupInfo.iconURL || ""}
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: "48px",
                    mb: 2,
                    boxShadow: "0 0 15px rgba(26, 26, 26, 0.37)",
                    backgroundColor: "#232323",
                    color: mode === "dark" ? "#fff" : "#000",
                  }}
                >
                  {/* fallback */}
                  {groupInfo.iconURL || groupInfo.emoji || groupInfo.name?.[0]?.toUpperCase() || "G"}
                </Avatar>

                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {groupInfo.name || groupName}
                  {groupInfo.name === "BM - Beta members" && (
                    <Box
                      component="span"
                      sx={{
                        ml: 1,
                        px: 0.5,
                        py: 0.1,
                        fontSize: 11,
                        backgroundColor: "#00f72133",
                        color: "#00f721",
                        borderRadius: 1.5,
                      }}
                    >
                      🔒 Beta
                    </Box>
                  )}
                  {groupInfo.name === "BM - Dev Beta" && (
                    <Box
                      component="span"
                      sx={{
                        ml: 1,
                        px: 0.5,
                        py: 0.1,
                        fontSize: 11,
                        backgroundColor: "#66ccff33",
                        color: "#66ccff",
                        borderRadius: 1.5,
                      }}
                    >
                      🧪 Dev Beta
                    </Box>
                  )}
                </Typography>

                <Box width={"90vw"}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
                      mt: 2,
                      mb: 2,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 3,
                      boxShadow: "none",
                    }}
                  >
                    {groupInfo.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: mode === "dark" ? "#ccc" : "#000",
                          mt: 0.5,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {groupInfo.description}
                      </Typography>
                    )}

                    {createdByUser && (
                      <Typography
                        variant="caption"
                        sx={{ color: mode === "dark" ? "#bbb" : "#333", mb: 1 }}
                      >
                        Created by <strong>{createdByUser.name}</strong>
                      </Typography>
                    )}
                  </Box>

                  {/* Trip Info Card */}
                  {tripInfo && (
                    <Box
                      sx={{
                        background: `url(${groupInfo.iconURL})`,
                        backgroundSize: "cover",
                        backgroundColor: mode === "dark" ? "#f1f1f101" : "#e0e0e0",
                        backgroundPosition: "center",
                        color: mode === "dark" ? "#fff" : "#000",
                        borderRadius: 4,
                        boxShadow: "none",
                      }}
                    >
                      <Box sx={{ borderRadius: 4, backdropFilter: "blur(10px)", backgroundColor: mode === "dark" ? "#00000010" : "#ffffff00" }}>
                      <Box sx={{ p: 2 }}>
                        <Box display="flex" alignItems="start" gap={2} mb={1}>
                          <Box>
                            <Typography
                              variant="h6"
                              sx={{ color: "#ffffffff", fontWeight: 800, mb: 1 }}
                            >
                              {tripInfo.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#ffffffff",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <LocationOn sx={{ fontSize: 16, mr: 1 }} /> {tripInfo.from} →
                              {tripInfo.location}
                            </Typography>
                            {tripInfo.date && (
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#e7e7e7ff",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <AccessTime sx={{ fontSize: 16, mr: 1 }} /> {tripInfo.startDate} →
                                {tripInfo.date}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {timelineStats && (
                          <Box mb={1}>
                            <Typography variant="caption" sx={{ color: "#cbcbcbff" }}>
                              Timeline Progress: {timelineStats.completed} / {timelineStats.total}{" "}
                              complete
                            </Typography>
                            <LinearProgress
                              value={timelineStats.percent}
                              variant="determinate"
                              sx={{
                                mt: 0.5,
                                borderRadius: 20,
                                height: 7,
                                bgcolor: "#ffffff36",
                                "& .MuiLinearProgress-bar": { borderRadius: 20, bgcolor: "#ffffffff" },
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box></Box>
                  )}

                  {/* Buttons like Edit Group Info, Group Settings */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      mt: 2,
                      mx: "auto",
                      boxShadow: "none",
                    }}
                  >
                    {canEditGroupInfo && (
                      <Button
                        variant="contained"
                        onClick={() => setEditingGroupInfo(true)}
                        sx={{
                          backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
                          color: mode === "dark" ? "#fff" : "#000",
                          borderRadius: 3,
                          boxShadow: "none",
                          py: 1.4,
                          px: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "left",
                          gap: 1.5,
                        }}
                      >
                        <EditIcon sx={{ fontSize: 24 }} />
                        <Typography variant="body1" sx={{ fontSize: 16 }}>
                          Edit Group Info
                        </Typography>
                      </Button>
                    )}

                    {(groupInfo?.createdBy === currentUser?.uid ||
                      groupInfo?.admins?.includes(currentUser?.uid)) && (
                      <Button
                        variant="contained"
                        onClick={() => setGroupSettingsOpen(true)}
                        sx={{
                          backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
                          color: mode === "dark" ? "#fff" : "#000",
                          borderRadius: 3,
                          boxShadow: "none",
                          py: 1.4,
                          px: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "left",
                          gap: 1.5,
                        }}
                      >
                        <SettingsOutlinedIcon sx={{ fontSize: 24 }} />
                        <Typography variant="body1" sx={{ fontSize: 16 }}>
                          Group Settings
                        </Typography>
                      </Button>
                    )}
                  </Box>

                  {/* Members Count and Add Members */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      alignContent: "left",
                      backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e020",
                      p: 1,
                      mt: 2,
                      borderRadius: 3,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: mode === "dark" ? "#a5a5a5ff" : "#4f4f4fff",
                        fontWeight: 500,
                        p: 1,
                      }}
                    >
                      {groupInfo.members?.length || 0} Members
                    </Typography>

                    {canAddMembers && (
                      <Button
                        variant="contained"
                        onClick={() => setInviteDrawerOpen(true)}
                        sx={{
                          mt: 0,
                          backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
                          boxShadow: "none",
                          color: mode === "dark" ? "#fff" : "#000",
                          justifyContent: "left",
                          alignItems: "center",
                          borderRadius: 2,
                          gap: 1,
                          px: 1,
                          display: "flex",
                        }}
                      >
                        <AddIcon
                          sx={{
                            backgroundColor: mode === "dark" ? "#fff" : "#000",
                            color: mode === "dark" ? "#000" : "#fff",
                            padding: 1,
                            borderRadius: 8,
                          }}
                        />
                        Add Members
                      </Button>
                    )}

                    {/* Members List Preview */}
<List sx={{ width: "100%", maxHeight: "60vh", overflowY: "auto" }}>
  <Stack spacing={1} sx={{ mt: 0 }}>
    {(groupInfo.members || [])
      .slice(0, 5)
      .sort((a, b) => {
        const isCreatorA = a === groupInfo?.createdBy;
        const isCreatorB = b === groupInfo?.createdBy;
        if (isCreatorA && !isCreatorB) return -1;
        if (!isCreatorA && isCreatorB) return 1;

        const isAdminA = Array.isArray(groupInfo?.admins) && groupInfo.admins.includes(a);
        const isAdminB = Array.isArray(groupInfo?.admins) && groupInfo.admins.includes(b);
        if (isAdminA && !isAdminB) return -1;
        if (!isAdminA && isAdminB) return 1;

        const isCurrentUserA = a === currentUser.uid;
        const isCurrentUserB = b === currentUser.uid;
        if (isCurrentUserA && !isCurrentUserB) return -1;
        if (!isCurrentUserA && isCurrentUserB) return 1;

        return 0;
      })
      .map((memberUid) => {
        const member = memberInfo[memberUid];
        const isOwner = memberUid === groupInfo?.createdBy;
        const isAdmin =
          Array.isArray(groupInfo?.admins) && groupInfo.admins.includes(memberUid);
        const isCurrentUser = memberUid === currentUser.uid;

        return (
          <Box
            key={memberUid}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{ background: "#f1f1f111", p: 1, borderRadius: 2 }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              onClick={() => (window.location.href = `/chat/${memberUid}`)}
              sx={{ cursor: 'pointer' }}
            >
              <Avatar
                src={member?.photoURL}
                sx={{ width: 40, height: 40, mr: 1 }}
              />
              <Box>
                <Typography variant="body1">
                  {member?.name || memberUid.slice(0, 6)}{" "}
                  {isCurrentUser && <em>(You)</em>}
                  {(isOwner || isAdmin) && (
                    <Chip
                      label="Admin"
                      size="small"
                      sx={{
                        ml: 1,
                        background: mode === "dark" ? "#ffffff36" : "#00000036",
                        color: mode === "dark" ? "#fff" : "#000",
                        fontWeight: 600,
                        fontSize: "0.65rem",
                        height: 20,
                        borderRadius: 1.5,
                      }}
                    />
                  )}
                </Typography>
                <Typography variant="body2">
                  {member?.username || memberUid.slice(0, 6)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {(!isCurrentUser) && (
              <Tooltip title="Call">
                {member?.mobile ? (
                  <IconButton
                    onClick={() =>
                      window.open(`tel:${member.mobile}`, "_self")
                    }
                    sx={{
                      color: mode === "dark" ? "#fff" : "#000",
                      backgroundColor: mode === "dark" ? "#f1f1f111" : "#e0e0e0",
                      padding: 1,
                    }}
                  >
                    <PhoneOutlinedIcon />
                  </IconButton>
                ) : null}
              </Tooltip>)}
              {(groupInfo?.createdBy === user?.uid ||
                (groupInfo?.admins || []).includes(user?.uid)) &&
                !isOwner &&
                !isAdmin &&
                memberUid !== user?.uid && (
                  <Tooltip title="Remove User From Group">
                    <IconButton
                      onClick={() => {
                        setSelectedMemberToRemove(memberUid);
                        setConfirmDialogOpen(true);
                      }}
                      sx={{
                        color: mode === "dark" ? "#ffbbbb" : "#ff3333ff",
                        backgroundColor: "#ff000020",
                        padding: 1,
                      }}
                    >
                      <RemoveCircleOutlineIcon />
                    </IconButton>
                  </Tooltip>
                )}
            </Box>
          </Box>
        );
      })}
    {groupInfo.members?.length > 5 && (
      <Button
        variant="contained"
        size="small"
        sx={{
          mt: 2,
          height: 50,
          px: 2,
          backgroundColor: mode === "dark" ? "#f1f1f124" : "#13131324",
          boxShadow: "none",
          color: mode === "dark" ? "#fff" : "#000",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 2.5,
          gap: 1,
          display: "flex",
        }}
        onClick={() => setMembersDrawerOpen(true)}
      >
        <Typography variant="body1">
          View More ({groupInfo.members.length})
        </Typography>
        <ArrowForwardIosIcon sx={{ fontSize: 15 }} />
      </Button>
    )}
  </Stack>
</List>

                  </Box>
                    {/* Exit Group Button */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        mt: 2,
                        mx: "auto",
                      }}
                    >
                      {(!user || !groupName) ? (
                        <Typography>Loading group...</Typography>
                      ) : (
                        <Button
                          sx={{
                            backgroundColor: mode === "dark" ? "#f1f1f111" : "#ff000010",
                            color: "#ff6767",
                            fontSize: 16,
                            borderRadius: 3,
                            py: 1.4,
                            px: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "left",
                            gap: 1.5,
                          }}
                          justifyContent={"left"}
                          onClick={handleExitGroup}
                        >
                          <ExitToAppOutlinedIcon />
                          Exit Group
                        </Button>
                      )}
                    </Box>

                </Box>
              </Box>

              {/* Dialog to confirm remove member */}
              <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                PaperProps={{
                  sx: {
                    bgcolor: mode === "dark" ? "#00000061" : "#f1f1f161",
                    color: mode === "dark" ? "#fff" : "#222",
                    backdropFilter: "blur(20px)",
                    borderRadius: 4,
                    boxShadow: mode === "dark" ? "0 8px 32px #000b" : "0 8px 32px #8882",
                    p: 2,
                    minWidth: 320,
                    maxWidth: 400,
                  },
                }}
              >
                <DialogTitle
                  sx={{
                    color: mode === "dark" ? "#ff4444" : "#d32f2f",
                    fontWeight: 700,
                    fontSize: 20,
                    textAlign: "center",
                    pb: 1,
                    letterSpacing: 1,
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <RemoveCircleOutlineIcon
                    sx={{ mr: 1, color: mode === "dark" ? "#ff4444" : "#d32f2f" }}
                  />
                  Remove Member
                </DialogTitle>
                <DialogContent sx={{ textAlign: "center", py: 2 }}>
                  <Typography
                    sx={{
                      color: mode === "dark" ? "#fff" : "#222",
                      fontSize: 16,
                      mb: 2,
                    }}
                  >
                    Are you sure you want to remove this member from the group?
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: mode === "dark" ? "#9b9b9bff" : "#333" }}
                  >
                    This action cannot be undone.
                  </Typography>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                  <Button
                    onClick={() => setConfirmDialogOpen(false)}
                    variant="outlined"
                    sx={{
                      color: mode === "dark" ? "#fff" : "#222",
                      borderColor: mode === "dark" ? "#555" : "#ccc",
                      fontWeight: 600,
                      px: 3,
                      borderRadius: 8,
                      mr: 1,
                      backgroundColor: mode === "dark" ? "#23232300" : "#f7f7f700",
                      "&:hover": {
                        backgroundColor: mode === "dark" ? "#333" : "#e0e0e0",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      await handleRemoveMember(selectedMemberToRemove);
                      setConfirmDialogOpen(false);
                    }}
                    color="error"
                    variant="contained"
                    sx={{
                      fontWeight: 700,
                      px: 3,
                      borderRadius: 8,
                      bgcolor: "#ff4444",
                      color: mode === "dark" ? "#fff" : "#000",
                      boxShadow: "none",
                      "&:hover": {
                        bgcolor: "#d32f2f",
                      },
                    }}
                  >
                    Remove
                  </Button>
                </DialogActions>
              </Dialog>


<SwipeableDrawer
  anchor="bottom"
  open={inviteDrawerOpen}
  onClose={() => setInviteDrawerOpen(false)}
  onOpen={() => {}} // Required for SwipeableDrawer
  PaperProps={{
    sx: {
      p: { xs: 2, sm: 3 },
      bgcolor: mode === "dark" ? "#18181821" : "#f7f7f7",
      backdropFilter: "blur(80px)",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      boxShadow: "0 -2px 20px rgba(0,0,0,0.6)",
      minHeight: "40vh",
      maxWidth: 420,
      mx: "auto",
    },
  }}
>
  <Box
    sx={{
      width: 40,
      height: 5,
      backgroundColor: "#8b8b8bff",
      borderRadius: 3,
      mx: "auto",
      mb: 2,
      opacity: 0.7,
    }}
  />
  <Typography variant="h6" sx={{ color: mode === "dark" ? "#fff" : "#222", mb: 2, textAlign: "center", fontWeight: 700 }}>
    Invite to Group
  </Typography>

  <Button
    variant="contained"
    onClick={() => setAddUserDialogOpen(true)}
    fullWidth
    sx={{
      mt: 0,
      backgroundColor: mode === "dark" ? "#23232331" : "#e0e0e031",
      boxShadow: "none",
      color: mode === "dark" ? "#fff" : "#222",
      justifyContent: "left",
      alignItems: "center",
      borderRadius: 3,
      gap: 1.5,
      px: 2,
      py: 1.2,
      fontWeight: 600,
      fontSize: 16,
      mb: 2,
      "&:hover": {
        backgroundColor: mode === "dark" ? "#333" : "#f1f1f1"
      }
    }}
  >
    <PersonAddIcon sx={{ backgroundcolor: mode === "dark" ? "#fff" : "#000", color: "#000", padding: 1, borderRadius: 8 }} />
    Add Members
  </Button>

  <Divider sx={{ my: 2, borderColor: "#444", color: "#aaa" }}>
    Or add members directly
  </Divider>

  <Box
    sx={{
      mb: 4,
      backgroundColor: mode === "dark" ? "#23232331" : "#f1f1f131",
      color: mode === "dark" ? "#fff" : "#222",
      borderRadius: 3,
      gap: 1,
      px: 2,
      py: 1.5,
      display: "flex",
      alignItems: "center",
      boxShadow: "none",
    }}
  >
    <TextField
      value={inviteLink}
      fullWidth
      variant="standard"
      InputProps={{
        disableUnderline: true,
        sx: { color: mode === "dark" ? "#fff" : "#222", fontSize: 18 },
        endAdornment: (
          <IconButton
            onClick={() => {
              navigator.clipboard.writeText(inviteLink);
              setNotification("🔗 Invite link copied!");
            }}
            sx={{
              backgroundColor: mode === "dark" ? "#232323" : "#e0e0e0",
              color: mode === "dark" ? "#fff" : "#222",
              ml: 1,
              borderRadius: 8,
              "&:hover": {
                backgroundColor: mode === "dark" ? "#333" : "#f1f1f1"
              }
            }}
          >
            <ContentCopyIcon />
          </IconButton>
        ),
      }}
    />
  </Box>

  <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
    <Box sx={{ p: 2, backgroundcolor: mode === "dark" ? "#fff" : "#000", borderRadius: 3, boxShadow: "none" }}>
      <QRCodeCanvas value={inviteLink} size={180} />
    </Box>
  </Box>

  <Button
    variant="contained"
    onClick={handleShare}
    fullWidth
    sx={{
      bgcolor: mode === "dark" ? "#fff" : "#000",
      color: mode === "dark" ? "#000" : "#fff",
      fontWeight: 700,
      borderRadius: 2,
      py: 1.2,
      mb: 2,
      fontSize: 16,
      boxShadow: "none",
    }}
  >
    <ShareIcon sx={{ mr: 1, fontSize: 18 }} /> Share Invite Link
  </Button>

  <Snackbar
    open={Boolean(notification)}
    autoHideDuration={2500}
    onClose={() => setNotification(null)}
    message={notification}
    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    ContentProps={{
      sx: {
        bgcolor: mode === "dark" ? "#232323" : "#fff",
        color: mode === "dark" ? "#fff" : "#000",
        fontSize: 14,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        boxShadow: "none",
      },
    }}
  />
</SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={membersDrawerOpen}
  onClose={() => setMembersDrawerOpen(false)}
  PaperProps={{
    sx: {
      p: { xs: 2, sm: 3 },
      backgroundColor: mode === "dark" ? "#181818f2" : "#f7f7f7f2",
      color: mode === "dark" ? "#fff" : "#222",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      boxShadow: "0 -2px 20px rgba(0,0,0,0.18)",
      minHeight: "60vh",
      maxHeight: "80vh",
      mx: "auto",
      transition: "background 0.3s",
      backdropFilter: "blur(60px)",
    },
  }}
>
  <Box>
    <Box
      sx={{
        width: 40,
        height: 5,
        backgroundColor: mode === "dark" ? "#888" : "#bbb",
        borderRadius: 3,
        mx: "auto",
        mb: 2,
        opacity: 0.7,
      }}
    />
    <Typography
      variant="h6"
      sx={{
        mb: 2,
        textAlign: "center",
        fontWeight: 700,
        letterSpacing: 1,
        color: mode === "dark" ? "#fff" : "#222",
      }}
    >
      All Group Members
    </Typography>
    <TextField
      fullWidth
      placeholder="Search member"
      value={memberSearch}
      onChange={e => setMemberSearch(e.target.value)}
      sx={{
        mb: 2,
        input: { color: mode === "dark" ? "#fff" : "#222" },
        label: { color: "#ccc" },
        '& .MuiOutlinedInput-root': {
          '& fieldset': { borderColor: '#555' },
          '&:hover fieldset': { borderColor: '#888' },
          '&.Mui-focused fieldset': { borderColor: '#00f721' },
        },
        borderRadius: 2,
        backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#777" }} />
          </InputAdornment>
        ),
      }}
    />
  </Box>

  <List sx={{
    maxHeight: "60vh",
    overflowY: "auto",
    px: 1,
    py: 1,
    borderRadius: 3,
    boxShadow: "none",
  }}>
    <Stack spacing={1}>
      {(groupInfo.members || [])
        .filter(uid => {
          const m = memberInfo[uid];
          if (!m) return false;
          if (!memberSearch.trim()) return true;
          const low = memberSearch.toLowerCase();
          return (
            (m.name?.toLowerCase().includes(low)) ||
            (m.username?.toLowerCase().includes(low)) ||
            uid.toLowerCase().includes(low)
          );
        })
        .map(memberUid => {
          const member = memberInfo[memberUid];
          const isOwner = memberUid === groupInfo?.createdBy;
          const isAdmin = Array.isArray(groupInfo?.admins) && groupInfo.admins.includes(memberUid);
          const isCurrentUser = memberUid === currentUser.uid;
          return (
            <Box
              key={memberUid}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                background: mode === "dark" ? "#23232344" : "#f1f1f144",
                p: 1.2,
                borderRadius: 2,
                boxShadow: "0 1px 6px #0001",
                transition: "background 0.2s",
                "&:hover": {
                  background: mode === "dark" ? "#23232388" : "#e0e0e088",
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5} sx={{ cursor: "pointer" }} onClick={() => `window.location.href=/chat/${memberUid}`}>
                <Avatar src={member?.photoURL} sx={{
                  width: 40,
                  height: 40,
                  mr: 1,
                  boxShadow: "0 2px 8px #0002",
                  border: mode === "dark" ? "2px solid #444" : "2px solid #eee",
                }} />
                <Box>
                  <Typography variant='body1' sx={{ fontWeight: 600, color: mode === "dark" ? "#fff" : "#222" }}>
                    {member?.name || memberUid.slice(0, 6)}
                    {isCurrentUser && <em>(You)</em>}
                    {isOwner && (
                      <Chip label="Owner" size="small" sx={{ ml: 1, background: "#00f72144", color: mode === "dark" ? "#fff" : "#000", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 1 }} />
                    )}
                    {isAdmin && !isOwner && (
                      <Chip label="Admin" size="small" sx={{ ml: 1, background: mode === "dark" ? "#ffffff36" : "#00000036", color: mode === "dark" ? "#fff" : "#000", fontWeight: 600, fontSize: "0.65rem", height: 20, borderRadius: 1 }} />
                    )}
                  </Typography>
                  <Typography variant='body2' sx={{ color: mode === "dark" ? "#aaa" : "#333" }}>{member?.username || memberUid.slice(0, 6)}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {(!isCurrentUser) && (
                <Tooltip title="Call">
                  {member?.mobile ? (
                    <IconButton
                      onClick={() => `window.open(tel:${member.mobile}, '_self')`}
                      sx={{
                        color: mode === "dark" ? "#fff" : "#000",
                        backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
                        padding: 1,
                        borderRadius: 8,
                        "&:hover": {
                          backgroundColor: mode === "dark" ? "#333" : "#e0e0e0",
                        }
                      }}
                    >
                      <PhoneOutlinedIcon />
                    </IconButton>
                  ) : null}
                </Tooltip>
              )}
                {(groupInfo?.createdBy === user?.uid || (groupInfo?.admins || []).includes(user?.uid)) &&
                  memberUid !== groupInfo?.createdBy &&
                  !(groupInfo?.admins || []).includes(memberUid) &&
                  memberUid !== user?.uid && (
                    <Tooltip title="Remove User From Group">
                      <IconButton
                        onClick={() => {
                          setSelectedMemberToRemove(memberUid);
                          setConfirmDialogOpen(true);
                        }}
                        sx={{
                          color: mode === "dark" ? "#ffbbbb" : "#ff4747ff",
                          backgroundColor: "#ff000030",
                          padding: 1,
                          borderRadius: 2,
                          "&:hover": {
                            backgroundColor: "#ff4444",
                            color: mode === "dark" ? "#fff" : "#000",
                          }
                        }}
                      >
                        <RemoveCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                )}
              </Box>
            </Box>
          )
        })}
      {groupInfo.members?.length === 0 && (
        <Typography sx={{ color: "#aaa", mt: 2, textAlign: "center", fontStyle: "italic" }}>
          No members
        </Typography>
      )}
    </Stack>
  </List>
  <Box textAlign="center" mt={2}></Box>
</SwipeableDrawer>

<Drawer
  anchor="bottom"
  open={groupSettingsOpen}
  onClose={() => setGroupSettingsOpen(false)}
  PaperProps={{
    sx: {
      p: { xs: 3, sm: 4 },
      backgroundColor: mode === "dark" ? "#181818f2" : "#f7f7f7f2",
      color: mode === "dark" ? "#fff" : "#222",
      boxShadow: "0 -4px 32px rgba(0,0,0,0.18)",
      maxWidth: 480,
      mx: "auto",
      height: "95vh",
      backdropFilter: "blur(60px)",
      transition: "background 0.3s",
    },
  }}
>
  <Box display="flex" flexDirection="column" gap={3} maxHeight="93vh" overflowY="auto" mb={2}>
    <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
      <IconButton onClick={() => setGroupSettingsOpen(false)} sx={{ color: mode === "dark" ? "#fff" : "#000", mr: 1 }}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h5" sx={{ fontWeight: "bold", letterSpacing: 1 }}>
        Group Settings
      </Typography>
    </Box>

    {/* Section: Permission Toggles */}
    <Box sx={{
      p: 2,
      boxShadow: "none",
      mb: 2,
    }}>
      <Typography variant="h6" sx={{ mb: 2, color: mode === "dark" ? "#fff" : "#222", fontWeight: 700 }}>
        Permissions
      </Typography>
      <Stack spacing={3}>
        {/* Edit Access Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? "#ccc" : "#555", fontWeight: 600 }}>
            Who can edit group info?
          </Typography>
          <Stack direction="row" spacing={2}>
            {["admin", "all"].map((role) => (
              <Button
                key={role}
                variant={groupInfo?.editAccess === role ? "contained" : "outlined"}
                onClick={() => handlePermissionChange("editAccess", role)}
                sx={{
                  color: groupInfo?.editAccess === role ? mode === "dark" ? "#000" : "#fff" :  mode === "dark" ? "#fff" : "#000",
                  backgroundColor: groupInfo?.editAccess === role ?  mode === "dark" ? "#fff" : "#000" : "transparent",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  borderRadius: 8,
                  boxShadow: "none",
                  border: groupInfo?.editAccess === role ? "none" : "1.5px solid #555",
                  "&:hover": {
                    backgroundColor: groupInfo?.editAccess === role ? "#e0e0e0" : "#23232344",
                    boxShadow: "none",
                  },
                  transition: "background 0.2s",
                }}
              >
                {role === "admin" ? "Admins Only" : "All Members"}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Invite Access Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? "#ccc" : "#555", fontWeight: 600 }}>
            Who can add members?
          </Typography>
          <Stack direction="row" spacing={2}>
            {["admin", "all"].map((role) => (
              <Button
                key={role}
                variant={groupInfo?.inviteAccess === role ? "contained" : "outlined"}
                onClick={() => handlePermissionChange("inviteAccess", role)}
                sx={{
                  color: groupInfo?.inviteAccess === role ? mode === "dark" ? "#000" : "#fff" :  mode === "dark" ? "#fff" : "#000",
                  backgroundColor: groupInfo?.inviteAccess === role ?  mode === "dark" ? "#fff" : "#000" : "transparent",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  borderRadius: 8,
                  boxShadow: "none",
                  border: groupInfo?.inviteAccess === role ? "none" : "1.5px solid #555",
                  "&:hover": {
                    backgroundColor: groupInfo?.inviteAccess === role ? "#e0e0e0" : "#23232344",
                    boxShadow: "none",
                  },
                  transition: "background 0.2s",
                }}
              >
                {role === "admin" ? "Admins Only" : "All Members"}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Send Messages Access Section */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? "#ccc" : "#555", fontWeight: 600 }}>
            Who can send messages?
          </Typography>
          <Stack direction="row" spacing={2}>
            {["admin", "all"].map((role) => (
              <Button
                key={role}
                variant={groupInfo?.sendAccess === role ? "contained" : "outlined"}
                onClick={() => handlePermissionChange("sendAccess", role)}
                sx={{
                  color: groupInfo?.sendAccess === role ? mode === "dark" ? "#000" : "#fff" :  mode === "dark" ? "#fff" : "#000",
                  backgroundColor: groupInfo?.sendAccess === role ?  mode === "dark" ? "#fff" : "#000" : "transparent",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  borderRadius: 8,
                  boxShadow: "none",
                  border: groupInfo?.sendAccess === role ? "none" : "1.5px solid #555",
                  "&:hover": {
                    backgroundColor: groupInfo?.sendAccess === role ? "#e0e0e0" : "#23232344",
                    boxShadow: "none",
                  },
                  transition: "background 0.2s",
                }}
              >
                {role === "admin" ? "Admins Only" : "All Members"}
              </Button>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>

    {/* Section: Member List and Admin Toggle */}
    <Box mt={3} mb={3} sx={{
      background: mode === "dark" ? "#23232344" : "#f1f1f144",
      borderRadius: 3,
      p: 2,
      boxShadow: "none",
    }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: mode === "dark" ? "#fff" : "#222" }}>
          Members & Admins
        </Typography>
        <Button
          variant="contained"
          size="small"
          sx={{
            color: mode === "dark" ? "#fff" : "#000",
            backgroundColor: "#23232348",
            display: "flex",
            alignItems: "center",
            borderRadius: 2,
            boxShadow: "none",
            px: 2,
            py: 0.5,
            fontWeight: 600,
          }}
          onClick={() => setShowSearchBar(prev => !prev)}
        >
          {showSearchBar ? <CloseIcon sx={{ fontSize: "18px", mr: 1 }} /> : <SearchIcon sx={{ fontSize: "18px", mr: 1 }} />}
          {showSearchBar ? "Hide" : "Search"}
        </Button>
      </Box>

      {showSearchBar && (
        <TextField
          placeholder="Search members by name or email..."
          value={searchMembersText}
          onChange={(e) => setSearchMembersText(e.target.value)}
          size="small"
          fullWidth
          sx={{
            mb: 2,
            input: { color: mode === "dark" ? "#fff" : "#000" },
            '& label': { color: '#ccc' },
            '& .MuiOutlinedInput-root': {
              '& fieldset': { borderColor: '#555' },
              '&:hover fieldset': { borderColor: '#888' },
            },
            borderRadius: 4,
            backgroundColor: mode === "dark" ? "#23232344" : "#f1f1f144",
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#777" }} />
              </InputAdornment>
            ),
          }}
        />
      )}

      <Stack spacing={1} sx={{ maxHeight: "47vh", overflowY: "auto" }}>
        {(groupInfo?.members || [])
          .filter((uid) => {
            const m = memberInfo[uid];
            if (!searchMembersText) return true;
            const search = searchMembersText.toLowerCase();
            return (
              m?.name?.toLowerCase().includes(search) ||
              m?.email?.toLowerCase().includes(search) ||
              m?.username?.toLowerCase().includes(search)
            );
          })
          .map((uid) => {
            const member = memberInfo[uid];
            const isCreator = uid === groupInfo?.createdBy;
            const isAdmin = (groupInfo?.admins || []).includes(uid);
            const canChangeRole =
              !isCreator &&
              (groupInfo?.createdBy === currentUser?.uid ||
                (groupInfo?.admins || []).includes(currentUser?.uid));

            return (
              <Paper
                elevation={0}
                key={uid}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: mode === "dark" ? "#23232344" : "#f1f1f144",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  boxShadow: "0 1px 6px #0001",
                  transition: "background 0.2s",
                  "&:hover": {
                    background: mode === "dark" ? "#23232388" : "#e0e0e088",
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar src={member?.photoURL} sx={{
                    bgcolor: "#232323",
                    color: mode === "dark" ? "#fff" : "#000",
                    width: 40,
                    height: 40,
                    fontWeight: 700,
                    fontSize: 20,
                    boxShadow: "0 2px 8px #0002",
                    border: mode === "dark" ? "2px solid #444" : "2px solid #eee",
                  }}>
                    {member?.name?.[0]?.toUpperCase() || "U"}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: mode === "dark" ? "#fff" : "#222" }}>
                      {member?.name || member?.email}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#aaa" }}>
                      {member?.username || ""}
                    </Typography>
                  </Box>
                </Box>

                {canChangeRole ? (
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={isAdmin ? "admin" : "member"}
                      onChange={e => toggleAdminStatus(uid)}
                      sx={{
                        bgcolor: "transparent",
                        color: isAdmin ?  mode === "dark" ? "#fff" : "#000" :  mode === "dark" ? "#ccc" : "#555",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        borderRadius: 3,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: "#555"
                        }
                      }}
                      MenuProps={{
                        PaperProps: { sx: { bgcolor:  mode === "dark" ? "#000" : "#fff", color: mode === "dark" ? "#fff" : "#000", borderRadius: 3 } }
                      }}
                    >
                      <MenuItem value="member">Member</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={isCreator ? "Owner" : "Member"}
                    size="small"
                    sx={{
                      bgcolor: isAdmin ? "#00f72144" : mode === "dark" ? "#ffffff44" : "#00000044",
                      color: mode === "dark" ? "#fff" : "#000",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                      borderRadius: 1,
                    }}
                  />
                )}
              </Paper>
            );
          })}
      </Stack>
    </Box>
  </Box>
</Drawer>

<SwipeableDrawer
  anchor="bottom"
  open={editingGroupInfo}
  onClose={() => setEditingGroupInfo(false)}
  PaperProps={{
    sx: {
      p: 3,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      background: mode === "dark" ? "#111" : "#f1f1f1",
      color: mode === "dark" ? "#fff" : "#000",
    },
  }}
>
  <Typography variant="h6" sx={{ mb: 2 }}>
    Edit Group Details
  </Typography>

{/* Group Name */}
<TextField
  label="Group Name"
  fullWidth
  value={groupInfo?.name || ""}
  onChange={(e) =>
    setGroupInfo((prev) => ({ ...prev, name: e.target.value }))
  }
  sx={{ mb: 2, input: { color: mode === "dark" ? "#fff" : "#000" }, label: { color: mode === "dark" ? "#ccc" : "#555" } }}
/>

{/* Preview */}
<Box display="flex" justifyContent="center" mb={2}>
  {groupIconType === "emoji" ? (
    <Avatar sx={{ width: 80, height: 80, fontSize: 40, bgcolor: "#232323" }}>
      {groupIconValue || "📍"}
    </Avatar>
  ) : (
    <Avatar
      src={groupIconValue}
      sx={{ width: 80, height: 80, fontSize: 40, bgcolor: "#232323" }}
    />
  )}
</Box>

{/* Icon Type Toggle */}
<FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel sx={{ color: mode === "dark" ? "#ccc" : "#555" }}>Icon Type</InputLabel>
  <Select
    value={groupIconType}
    onChange={(e) => setGroupIconType(e.target.value)}
    sx={{ color: mode === "dark" ? "#fff" : "#000" }}
  >
    <MenuItem value="emoji">Emoji</MenuItem>
    <MenuItem value="image">Image URL</MenuItem>
  </Select>
</FormControl>

{/* Icon Selector */}
{groupIconType === "emoji" ? (
  <>
    <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? "#ccc" : "#555" }}>
      Choose an Emoji
    </Typography>
    <Grid container spacing={1} sx={{ mb: 2 }}>
      {["😀", "😎", "🔥", "🎉", "🚀", "🌍", "📚", "🧠", "🧳", "🍕", "🎮", "🏖️"].map(
        (emoji) => (
          <Grid item xs={3} sm={2} key={emoji}>
            <Button
              variant={groupIconValue === emoji ? "contained" : "outlined"}
              onClick={() => setGroupIconValue(emoji)}
              sx={{
                fontSize: 24,
                width: "100%",
                aspectRatio: "1",
                color: groupIconValue === emoji ? "#000" : "#fff",
                backgroundColor:
                  groupIconValue === emoji ? "#ffffffff20" : "#23232349",
                borderColor: "#555",
                borderRadius: 2,
              }}
            >
              {emoji}
            </Button>
          </Grid>
        )
      )}
    </Grid>
  </>
) : (
  <Box sx={{ mb: 2 }}>
    <TextField
      label="Image URL or Uploaded Image"
      value={groupIconValue}
      onChange={(e) => setGroupIconValue(e.target.value)}
      fullWidth
      sx={{ mb: 1, input: { color: mode === "dark" ? "#fff" : "#000" }, label: { color: mode === "dark" ? "#ccc" : "#555" } }}
    />

    <Button
      variant="contained"
      component="label"
      sx={{
        mt: 1,
        color: mode === "dark" ? "#fff" : "#000",
        background:"#f1f1f111",
        borderColor: "#f1f1f151",
        fontWeight: 600,
        textTransform: "none",
      }}
    >
      📁 Select Image
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={handleGroupIconUpload}
      />
    </Button>

    <Typography
      variant="caption"
      sx={{ color: "#888", mt: 1, display: "block" }}
    >
      Only images under 250KB allowed.
    </Typography>
  </Box>
)}

{/* Group Description */}
<TextField
  label="Group Description"
  fullWidth
  multiline
  rows={3}
  value={groupInfo?.description || ""}
  onChange={(e) =>
    setGroupInfo((prev) => ({ ...prev, description: e.target.value }))
  }
  sx={{ mb: 3, input: { color: mode === "dark" ? "#fff" : "#000" }, label: { color: mode === "dark" ? "#ccc" : "#555" } }}
/>


  {/* Buttons */}
  <Box display="flex" justifyContent="space-between" gap={2}>
    <Button
      variant="outlined"
      onClick={() => setEditingGroupInfo(false)}
      sx={{
        flex: 1,
        color: mode === "dark" ? "#fff" : "#000",
        borderColor: "#666",
        fontWeight: 500,
        backgroundColor: mode === "dark" ? "#0c0c0c" : "#f1f1f1",
        borderRadius: 8,
      }}
    >
      Cancel
    </Button>

    <Button
      variant="contained"
      onClick={handleUpdateGroupInfo}
      sx={{
        flex: 1,
        bgcolor: mode === "dark" ? "#ffffffff" : "#000000",
        color: mode === "dark" ? "#000" : "#fff",
        fontWeight: 600,
        borderRadius: 8,
      }}
    >
      Save Changes
    </Button>
  </Box>
</SwipeableDrawer>

<SwipeableDrawer
  anchor="bottom"
  open={addUserDialogOpen}
  onClose={() => {
    setAddUserDialogOpen(false);
    setSelectedUsers([]);
    setSearchTerm('');
  }}
  sx={{ maxWidth: 470 }}
  PaperProps={{
    sx: {
      height: '85vh',
      width: "91vw",
      borderTopRightRadius: 24,
      borderTopLeftRadius: 24,
      backgroundColor: mode === "dark" ? '#181818' : '#fff',
      color: mode === "dark" ? "#fff" : "#000",
      p: 2,
      mx: "auto",
      boxShadow: mode === "dark" 
        ? '0 0 20px rgba(0, 0, 0, 0.9)' 
        : '0 0 20px rgba(0, 0, 0, 0.2)',
    },
  }}
>
  <Typography 
    variant="h6" 
    sx={{ mb: 2, color: mode === "dark" ? "#fff" : "#000" }}
  >
    Select Users to Add
  </Typography>

  <TextField
    fullWidth
    label="Search by username or email"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    variant="outlined"
    sx={{
      mb: 2,
      input: { color: mode === "dark" ? "#fff" : "#000" },
      label: { color: mode === "dark" ? "#aaa" : "#555" },
      '& .MuiOutlinedInput-root': {
        '& fieldset': { borderColor: mode === "dark" ? '#555' : '#ccc' },
        '&:hover fieldset': { borderColor: mode === "dark" ? '#888' : '#888' },
        '&.Mui-focused fieldset': { borderColor: '#00f721' },
      },
    }}
  />

  {/* Search Results */}
  <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? '#aaa' : '#555' }}>
    Search Results
  </Typography>

  {searchLoading ? (
    <Box sx={{ textAlign: 'center', mt: 2 }}>
      <CircularProgress size={24} color="inherit" />
    </Box>
  ) : (
    <>
      <List dense>
        {searchResults.map((user) => (
          <ListItem key={user.uid} disablePadding>
            <ListItemButton
              onClick={() => {
                setSelectedUsers((prev) =>
                  prev.includes(user.uid)
                    ? prev.filter((id) => id !== user.uid)
                    : [...prev, user.uid]
                );
              }}
              sx={{
                color: mode === "dark" ? '#fff' : '#000',
                '&:hover': {
                  backgroundColor: mode === "dark" ? "#333" : "#f0f0f0",
                },
              }}
            >
              <Checkbox
                edge="start"
                checked={selectedUsers.includes(user.uid)}
                tabIndex={-1}
                sx={{ color: '#00f721' }}
              />
              <Avatar
                src={user.photoURL || ''}
                sx={{ width: 36, height: 36, mr: 2, bgcolor: mode === "dark" ? "#444" : "#ddd", color: mode === "dark" ? "#fff" : "#000" }}
              >
                {(user.username?.[0] || user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
              </Avatar>
              <ListItemText
                primary={user.username || user.name || user.email}
                secondary={user.email}
                primaryTypographyProps={{ color: mode === "dark" ? "#fff" : "#000" }}
                secondaryTypographyProps={{ color: mode === "dark" ? "#aaa" : "#666" }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {searchResults.length === 0 && searchTerm.length >= 2 && !searchLoading && (
        <Typography variant="body2" sx={{ color: mode === "dark" ? '#666' : '#999', mt: 1 }}>
          No users found.
        </Typography>
      )}
    </>
  )}

  {/* Selected Users Section */}
  <Divider sx={{ my: 2, borderColor: mode === "dark" ? '#444' : '#ccc' }} />
  <Typography variant="subtitle2" sx={{ mb: 1, color: mode === "dark" ? '#aaa' : '#555' }}>
    Selected Users ({selectedUsers.length})
  </Typography>
  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
    {selectedUsers.map(uid => {
      const user = searchResults.find(u => u.uid === uid) || { uid, username: 'Pending User', email: '', photoURL: '' };
      return (
        <Chip
          key={uid}
          avatar={
            <Avatar src={user.photoURL || ''} sx={{ bgcolor: mode === "dark" ? "#444" : "#ddd", color: mode === "dark" ? "#fff" : "#000" }}>
              {(user.username?.[0] || user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
            </Avatar>
          }
          label={user.username || user.name || user.email || uid}
          onDelete={() =>
            setSelectedUsers((prev) => prev.filter((id) => id !== uid))
          }
          sx={{
            bgcolor: mode === "dark" ? '#333' : '#eee',
            color: mode === "dark" ? "#fff" : "#000",
            borderColor: mode === "dark" ? '#555' : '#ccc',
            mb: 1,
          }}
        />
      );
    })}
  </Stack>

  {/* Action Buttons */}
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto' }}>
    <Button 
      onClick={() => setAddUserDialogOpen(false)} 
      sx={{ color: mode === "dark" ? '#aaa' : '#555' }}
      variant="text"
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      onClick={handleBatchAddUsers}
      disabled={selectedUsers.length === 0}
      sx={{ 
        bgcolor: '#00f721', 
        color: '#000', 
        fontWeight: 600,
        '&:hover': {
          bgcolor: '#00c218',
        }
      }}
    >
      Add Selected
    </Button>
  </Box>
</SwipeableDrawer>


            </Box>
            
          </Drawer>
      )}
    </ThemeProvider>
  );
};

export default GroupInfoDrawer;
