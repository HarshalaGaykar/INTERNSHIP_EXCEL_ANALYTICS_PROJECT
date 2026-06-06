const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Upload = require("../models/Upload");
const UploadData = require("../models/UploadData");
const UploadVisualization = require("../models/UploadVisualization");

const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied. Admin privileges required." });
  }
  next();
};

router.get("/stats", [auth, isAdmin], async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      totalFilesUploaded,
      totalVisualizations,
      mostUsedChartTypes,
      recentUploads,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isBlocked: false }),
      User.countDocuments({ isBlocked: true }),
      Upload.countDocuments(),
      UploadVisualization.countDocuments(),
      UploadVisualization.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Upload.find()
        .sort({ uploadedAt: -1 })
        .limit(8)
        .populate("userId", "username")
        .lean(),
    ]);

    res.json({
      totalUsers,
      activeUsers,
      blockedUsers,
      totalUsersLoggedIn: activeUsers,
      totalFilesUploaded,
      totalVisualizations,
      mostUsedChartTypes: mostUsedChartTypes.map((item) => ({
        type: item._id || "Unknown",
        count: item.count,
      })),
      recentUploads: recentUploads.map((upload) => ({
        _id: upload._id,
        filename: upload.filename,
        username: upload.userId?.username || "Deleted user",
        uploadedAt: upload.uploadedAt,
      })),
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ msg: "Failed to load admin stats", error: error.message });
  }
});

router.get("/users", [auth, isAdmin], async (req, res) => {
  try {
    const users = await User.find().select("username role isBlocked createdAt _id").lean();
    const userIds = users.map((user) => user._id);
    const uploadCounts = await Upload.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ]);
    const uploadIdsByUser = await Upload.find({ userId: { $in: userIds } }).select("_id userId").lean();
    const uploadCountMap = Object.fromEntries(uploadCounts.map((item) => [item._id.toString(), item.count]));
    const uploadsByUser = uploadIdsByUser.reduce((groups, upload) => {
      const key = upload.userId.toString();
      groups[key] = groups[key] || [];
      groups[key].push(upload._id);
      return groups;
    }, {});

    const visualizationCounts = await Promise.all(
      users.map(async (user) => {
        const uploadIds = uploadsByUser[user._id.toString()] || [];
        const count = uploadIds.length
          ? await UploadVisualization.countDocuments({ uploadId: { $in: uploadIds } })
          : 0;
        return [user._id.toString(), count];
      })
    );
    const visualizationCountMap = Object.fromEntries(visualizationCounts);

    res.json(
      users.map((user) => ({
        ...user,
        uploadCount: uploadCountMap[user._id.toString()] || 0,
        visualizationCount: visualizationCountMap[user._id.toString()] || 0,
      }))
    );
  } catch (error) {
    console.error("Users fetch error:", error);
    res.status(500).json({ msg: "Failed to load users", error: error.message });
  }
});

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

router.delete("/users/:userId", [auth, isAdmin], async (req, res) => {
  try {
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ msg: "You cannot delete your own admin account" });
    }
    const user = await User.findByIdAndDelete(req.params.userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    const uploads = await Upload.find({ userId: user._id }).select("_id").lean();
    const uploadIds = uploads.map((upload) => upload._id);
    await Promise.all([
      Upload.deleteMany({ userId: user._id }),
      UploadData.deleteMany({ uploadId: { $in: uploadIds } }),
      UploadVisualization.deleteMany({ uploadId: { $in: uploadIds } }),
    ]);
    res.json({ msg: "User deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ msg: "Failed to delete user", error: error.message });
  }
});

module.exports = router;
