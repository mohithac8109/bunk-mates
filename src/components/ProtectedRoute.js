import React from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

function getUserFromStorage() {
  try {
    const storedUser = localStorage.getItem("bunkmateuser");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.uid) return parsed;
    }
    const cookieUser = document.cookie
      .split("; ")
      .find((row) => row.startsWith("bunkmateuser="))
      ?.split("=")[1];
    if (cookieUser) {
      const parsed = JSON.parse(decodeURIComponent(cookieUser));
      if (parsed?.uid) return parsed;
    }
  } catch {}
  return null;
}

const ProtectedRoute = ({ children }) => {
  const user = auth.currentUser;
  const storedUser = getUserFromStorage();

  if (!user && !storedUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;