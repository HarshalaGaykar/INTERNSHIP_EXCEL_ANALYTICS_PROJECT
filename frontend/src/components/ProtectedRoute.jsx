import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, role }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const checkAuth = () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const isExpired = decoded.exp && decoded.exp * 1000 <= Date.now();
        if (!isExpired && (!role || decoded.role === role)) {
          setIsAuthorized(true);
        } else if (isExpired) {
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Token decoding error:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [token, role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D4D4D] via-[#FF6F61] to-[#2F2F4F] text-white flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
