import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (role && role !== "visitor") {
      return res.status(403).json({
        message: "Self-registration supports visitor role only",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "visitor",
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({
      message: "User registered successfully",
      user: userObj,
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const createStaffUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const allowedRoles = ["admin", "security"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Role must be either admin or security",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const userObj = user.toObject();
    delete userObj.password;

    return res.status(201).json({
      message: "Staff user created successfully",
      user: userObj,
    });
  } catch (error) {
    console.error("CREATE STAFF ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    "secretkey",
    { expiresIn: "1d" }
  );

  const userObj = user.toObject();
  delete userObj.password;

  res.json({ token, user: userObj });
};

export const getProfile = async( req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message})
  }
}