import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <nav className="bg-gradient-to-r from-[#0D4D4D] to-[#FF6F61] p-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <h1>Excel Analytics</h1>
          {/* <svg width="100" height="40" viewBox="0 0 100 40" xmlns="">
            <g>
              {/* <h1>Excel Analytics</h1> */}
              {/* <text x="30" y="25" font-family="Arial, sans-serif" font-size="16" fill="#1E40AF" font-weight="bold">Excel Analytics</text>
              <rect x="5" y="10" width="5" height="20" fill="#6B21A8"/>
              <rect x="12" y="15" width="5" height="15" fill="#6B21A8"/>
              <rect x="19" y="5" width="5" height="25" fill="#6B21A8"/> 
            </g>
          </svg> */}
        </div>
        <div className="space-x-4">
          <Link to="/dashboard" className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 transform hover:scale-105">Dashboard</Link>
          <Link to="/admin" className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 transform hover:scale-105">Admin</Link>
          <button onClick={handleLogout} className="text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-300 transform hover:scale-105">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;