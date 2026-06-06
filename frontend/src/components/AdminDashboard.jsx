import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, FileText, LogOut, Shield, Users } from "lucide-react";
import api from "../api";

const StatCard = ({ title, value, icon: Icon, accent = "#4A90E2" }) => (
  <div className="bg-[#2A2A3D] border border-[#4A90E2]/60 rounded-xl p-5 shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-[#B0B0B0]">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
      <div className="p-3 rounded-full bg-[#1C1C2D]" style={{ color: accent }}>
        <Icon size={26} />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalFilesUploaded: 0,
    totalVisualizations: 0,
    mostUsedChartTypes: [],
    recentUploads: [],
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const me = await api.get("/auth/me");
      if (me.data.role !== "admin") {
        navigate("/dashboard");
        return;
      }

      const [statsRes, usersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error("Error fetching admin data:", err.response?.data || err.message);
      setError(err.response?.data?.msg || "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.username, user.role, user.isBlocked ? "blocked" : "active"]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [users, search]);

  const updateUserStatus = async (userId, action) => {
    try {
      await api.put(`/admin/users/${userId}/${action}`);
      setUsers((current) =>
        current.map((user) =>
          user._id === userId ? { ...user, isBlocked: action === "block" } : user
        )
      );
    } catch (err) {
      alert(err.response?.data?.msg || `Failed to ${action} user.`);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user and their uploads?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((current) => current.filter((user) => user._id !== userId));
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to delete user.");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (_) {}
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) return <div className="text-center p-6 text-white">Loading admin dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#1C1C2D] text-white font-[Arial,sans-serif]">
      <nav className="bg-[#2A2A3D] p-4 shadow-lg sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-[#B0B0B0]">Monitor users, uploads, and chart activity.</p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 border border-[#4A90E2] text-[#4A90E2] rounded-lg hover:bg-[#4A90E2] hover:text-white">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </nav>

      <main className="container mx-auto p-6 space-y-6">
        {error && <div className="bg-red-900/40 border border-red-400 text-red-100 p-4 rounded-lg">{error}</div>}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard title="Total Users" value={stats.totalUsers || 0} icon={Users} />
          <StatCard title="Active Users" value={stats.activeUsers || 0} icon={Shield} accent="#22C55E" />
          <StatCard title="Blocked Users" value={stats.blockedUsers || 0} icon={Shield} accent="#F97316" />
          <StatCard title="Files Uploaded" value={stats.totalFilesUploaded || 0} icon={FileText} />
          <StatCard title="Visualizations" value={stats.totalVisualizations || 0} icon={BarChart} accent="#A78BFA" />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#2A2A3D] rounded-xl p-5 border border-[#4A90E2]/60">
            <h2 className="text-xl font-semibold mb-4">Most Used Chart Types</h2>
            {(stats.mostUsedChartTypes || []).length ? (
              <div className="space-y-3">
                {stats.mostUsedChartTypes.map((item) => (
                  <div key={item.type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.type}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 bg-[#1C1C2D] rounded-full overflow-hidden">
                      <div className="h-full bg-[#4A90E2]" style={{ width: `${Math.min(100, item.count * 20)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#B0B0B0]">No visualizations saved yet.</p>
            )}
          </div>

          <div className="bg-[#2A2A3D] rounded-xl p-5 border border-[#4A90E2]/60">
            <h2 className="text-xl font-semibold mb-4">Recent Uploads</h2>
            {(stats.recentUploads || []).length ? (
              <div className="space-y-3 max-h-72 overflow-auto">
                {stats.recentUploads.map((upload) => (
                  <div key={upload._id} className="flex justify-between gap-4 border-b border-[#4A90E2]/30 pb-2">
                    <div>
                      <p className="font-medium">{upload.filename}</p>
                      <p className="text-xs text-[#B0B0B0]">by {upload.username}</p>
                    </div>
                    <p className="text-xs text-[#B0B0B0]">{new Date(upload.uploadedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#B0B0B0]">No uploads yet.</p>
            )}
          </div>
        </section>

        <section className="bg-[#2A2A3D] rounded-xl p-5 border border-[#4A90E2]/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold">User Management</h2>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="bg-[#1C1C2D] border border-[#4A90E2] rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1C1C2D]">
                <tr>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Uploads</th>
                  <th className="p-3">Charts</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-[#4A90E2]/30">
                    <td className="p-3 font-medium">{user.username}</td>
                    <td className="p-3 capitalize">{user.role}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.isBlocked ? "bg-red-500/20 text-red-200" : "bg-green-500/20 text-green-200"}`}>
                        {user.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="p-3">{user.uploadCount || 0}</td>
                    <td className="p-3">{user.visualizationCount || 0}</td>
                    <td className="p-3">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateUserStatus(user._id, user.isBlocked ? "unblock" : "block")}
                          className="px-3 py-1 rounded bg-[#4A90E2] hover:bg-[#6BB9F4]"
                        >
                          {user.isBlocked ? "Unblock" : "Block"}
                        </button>
                        <button onClick={() => deleteUser(user._id)} className="px-3 py-1 rounded bg-[#FF4D4D] hover:bg-[#FF6666]">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
