const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  const token =
    req.cookies?.token ||
    req.header("x-auth-token") ||
    (req.header("authorization")?.startsWith("Bearer ") ? req.header("authorization").slice(7) : null);

  if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role isBlocked");

    if (!user) return res.status(401).json({ msg: "User no longer exists" });
    if (user.isBlocked) return res.status(403).json({ msg: "Your account is blocked" });

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = auth;
