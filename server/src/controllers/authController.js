import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SENDGRID_API_KEY = (process.env.SENDGRID_API_KEY || "")
  .trim()
  .replace(/^['"]|['"]$/g, "");
const SENDGRID_FROM_EMAIL =
  process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_FROM || "";
const SENDGRID_ALLOW_SELF_SIGNED =
  process.env.SENDGRID_ALLOW_SELF_SIGNED === "true";

let sendgridHttpsAgent = null;

if (SENDGRID_ALLOW_SELF_SIGNED && !IS_PRODUCTION) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn("NODE_TLS_REJECT_UNAUTHORIZED=0 enabled for non-production SendGrid TLS bypass.");
}

const buildSendGridHttpsAgent = () => {
  const caCertPath = process.env.SENDGRID_CA_CERT_PATH;
  const allowSelfSigned = SENDGRID_ALLOW_SELF_SIGNED;

  if (!caCertPath && !(allowSelfSigned && !IS_PRODUCTION)) {
    return null;
  }

  const agentOptions = {};

  if (caCertPath) {
    const resolvedPath = path.isAbsolute(caCertPath)
      ? caCertPath
      : path.resolve(process.cwd(), caCertPath);

    if (fs.existsSync(resolvedPath)) {
      agentOptions.ca = fs.readFileSync(resolvedPath);
    } else {
      console.warn(
        `SENDGRID_CA_CERT_PATH file not found at: ${resolvedPath}. SendGrid will use default trust store.`
      );
    }
  }

  if (allowSelfSigned && !IS_PRODUCTION) {
    agentOptions.rejectUnauthorized = false;
    console.warn("SENDGRID_ALLOW_SELF_SIGNED=true active in non-production mode.");
  }

  return new https.Agent(agentOptions);
};

if (SENDGRID_ALLOW_SELF_SIGNED && !IS_PRODUCTION) {
  console.warn("SENDGRID_ALLOW_SELF_SIGNED=true active in non-production mode.");
}

sendgridHttpsAgent = buildSendGridHttpsAgent();

const sendOtpEmailViaSendGridApi = (payload) => {
  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        protocol: "https:",
        hostname: "api.sendgrid.com",
        path: "/v3/mail/send",
        method: "POST",
        agent: sendgridHttpsAgent || undefined,
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
      (response) => {
        let raw = "";

        response.on("data", (chunk) => {
          raw += chunk;
        });

        response.on("end", () => {
          const statusCode = response.statusCode || 0;

          if (statusCode >= 200 && statusCode < 300) {
            resolve({ statusCode, body: raw });
            return;
          }

          reject(
            new Error(
              `SendGrid API error (${statusCode}): ${raw || "No response body"}`
            )
          );
        });
      }
    );

    request.on("error", (error) => reject(error));
    request.write(JSON.stringify(payload));
    request.end();
  });
};

const sendOtpEmail = async (to, otp) => {
  if (!to) return { delivered: false, reason: "recipient-missing" };

  if (!SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY is missing.");
    return { delivered: false, reason: "sendgrid-key-missing" };
  }

  if (!SENDGRID_FROM_EMAIL) {
    console.error("SENDGRID_FROM_EMAIL or EMAIL_FROM is missing.");
    return { delivered: false, reason: "sendgrid-from-missing" };
  }

  try {
    await sendOtpEmailViaSendGridApi({
      personalizations: [
        {
          to: [{ email: to }],
          subject: "Your VMS login OTP",
        },
      ],
      from: {
        email: SENDGRID_FROM_EMAIL,
      },
      content: [
        {
          type: "text/plain",
          value: `Your login OTP is ${otp}. It expires in 5 minutes.`,
        },
        {
          type: "text/html",
          value: `
            <div style="font-family: Arial, sans-serif; color: #111;">
              <h2>Login verification code</h2>
              <p>Your One-Time Password for Visitor Management System login is:</p>
              <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${otp}</p>
              <p>This code expires in 5 minutes.</p>
            </div>
          `,
        },
      ],
    });

    return { delivered: true, reason: "sendgrid-success" };
  } catch (error) {
    const errorMessage = error?.message || "Unknown OTP email error";

    console.error("OTP email error:", errorMessage);
    return { delivered: false, reason: "sendgrid-delivery-failed" };
  }
};

const buildToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: "1d",
  });
};

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
  try {
    const { email, password, portal } = req.body;

    const normalizedEmail = email?.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (portal === "visitor" && (user.role === "admin" || user.role === "security")) {
      return res.status(403).json({
        message: "Admin and Security users cannot access the visitor portal. Please use the staff portal.",
      });
    }

    if (portal === "staff" && user.role === "visitor") {
      return res.status(403).json({
        message: "Visitors cannot access the staff portal. Please use the visitor portal.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(400).json({ message: "Invalid password" });

    const otp = `${Math.floor(100000 + Math.random() * 900000)}`;
    const otpHash = await bcrypt.hash(otp, 10);

    user.otpCodeHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    user.otpRequestedAt = new Date();
    await user.save();

    const otpDelivery = await sendOtpEmail(user.email, otp);
    if (!otpDelivery.delivered) {
      return res.status(500).json({ message: "Failed to send OTP email. Please try again." });
    }

    return res.status(200).json({
      otpRequired: true,
      message: "OTP sent to your email",
      email: user.email,
      userId: user._id,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Login failed" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.otpCodeHash || !user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP not requested or already used" });
    }

    if (new Date() > user.otpExpiresAt) {
      user.otpCodeHash = null;
      user.otpExpiresAt = null;
      user.otpRequestedAt = null;
      await user.save();
      return res.status(400).json({ message: "OTP expired. Please login again." });
    }

    const isOtpValid = await bcrypt.compare(otp, user.otpCodeHash);
    if (!isOtpValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otpCodeHash = null;
    user.otpExpiresAt = null;
    user.otpRequestedAt = null;
    await user.save();

    const token = buildToken(user);
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.otpCodeHash;
    delete userObj.otpExpiresAt;
    delete userObj.otpRequestedAt;

    return res.status(200).json({ token, user: userObj });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

export const getProfile = async( req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message})
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters" });
    }

    if (phone && phone.trim().length > 0) {
      const phoneRegex = /^[\d\s()+-]+$/;
      if (!phoneRegex.test(phone.trim()) || phone.trim().length < 7) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }
    }

    const updateData = {
      name: name.trim(),
      phone: phone ? phone.trim() : null,
    };

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};