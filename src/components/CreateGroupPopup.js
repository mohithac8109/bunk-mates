// src/components/CreateGroupPopup.jsx
import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { useUser } from "../contexts/UserContext";

const CreateGroupPopup = ({ closePopup }) => {
  const { user } = useUser();
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName || !members) return alert("Please fill all fields!");

    const memberList = members.split(",").map((u) => u.trim());
    if (!memberList.includes(user.username)) memberList.push(user.username); // auto add creator

    try {
      setLoading(true);
      const chatRef = collection(db, "chats");

      await addDoc(chatRef, {
        chatId: `${groupName}_${Date.now()}`,
        groupName,
        members: memberList,
        messages: [],
        createdAt: serverTimestamp(),
        isGroup: true,
      });

      alert("Group created!");
      closePopup();
    } catch (err) {
      console.error(err.message);
      alert("Error creating group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: "30%",
      left: "30%",
      padding: "20px",
      backgroundColor: "white",
      border: "2px solid black"
    }}>
      <h3>Create Group</h3>
      <input
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
      <input
        placeholder="Add members by username, separated by commas"
        value={members}
        onChange={(e) => setMembers(e.target.value)}
      />
      <button onClick={handleCreateGroup} disabled={loading}>
        {loading ? "Creating..." : "Create Group"}
      </button>
      <button onClick={closePopup}>Cancel</button>
    </div>
  );
};

export default CreateGroupPopup;
