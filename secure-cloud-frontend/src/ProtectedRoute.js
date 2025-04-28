import React from 'react';
import { Navigate } from 'react-router-dom';
import { getToken } from './Auth'; // your auth.js must have getToken()

const ProtectedRoute = ({ children }) => {
  const token = getToken();

  if (!token) {
    // 🚨 No token? Redirect to login
    return <Navigate to="/" replace />;
  }

  // ✅ Has token? Allow access
  return children;
};

export default ProtectedRoute;
