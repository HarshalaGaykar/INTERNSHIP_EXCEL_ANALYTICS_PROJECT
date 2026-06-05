const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // Assuming this checks for logged-in users
const User = require("../models/User"); // Assuming you have a User model
const Upload = require("../models/Upload"); // For file upload stats

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.role || req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied. Admin privileges required." });
  }
  next();
};

// Get admin stats
router.get("/stats", [auth, isAdmin], async (req, res) => {
  try {
    const totalActiveUsers = await User.countDocuments({ isBlocked: false });
    const totalFilesUploaded = await Upload.countDocuments();
    const mostUsedChartTypes = await Upload.aggregate([
      { $unwind: "$visualizations" },
      { $group: { _id: "$visualizations.type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).then(results => results.map(r => ({ type: r._id, count: r.count })));

    res.json({
      totalUsersLoggedIn: totalActiveUsers,
      totalFilesUploaded,
      mostUsedChartTypes,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ msg: "Failed to load admin stats", error: error.message });
  }
});

// Get all users
router.get("/users", [auth, isAdmin], async (req, res) => {
  try {
    const users = await User.find().select("username role isBlocked _id");
    res.json(users);
  } catch (error) {
    console.error("Users fetch error:", error);
    res.status(500).json({ msg: "Failed to load users", error: error.message });
  }
});

// Block a user
router.put("/users/:userId/block", [auth, isAdmin], async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ msg: "You cannot block your own admin account" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlocked: true },
      { new: true }
    ).select("username role isBlocked");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User blocked", user });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ msg: "Failed to block user", error: error.message });
  }
});

// Unblock a user
router.put("/users/:userId/unblock", [auth, isAdmin], async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isBlocked: false },
      { new: true }
    ).select("username role isBlocked");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ msg: "User unblocked", user });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ msg: "Failed to unblock user", error: error.message });
  }
});

// Delete a user
router.delete("/users/:userId", [auth, isAdmin], async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ msg: "You cannot delete your own admin account" });
    }
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    await Upload.deleteMany({ userId: user._id });
    res.json({ msg: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ msg: "Failed to delete user", error: error.message });
  }
});

module.exports = router;
