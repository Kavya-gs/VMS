import Visitor from "../models/visitor.model.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { createNotificationForRoles, createNotificationForUser } from "./notifications.controller.js";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM, 
      subject,
      text: "Notification from Visitor Management System",
      html,
      attachments: attachments.map((att) => ({
        content: att.content,
        filename: att.filename,
        type: att.type || "application/octet-stream",
        disposition: att.disposition || "attachment",
        content_id: att.cid,
      })),
    };

    await sgMail.send(msg);

    console.log("✅ Email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ SendGrid Error:", error.response?.body || error.message);
    return false;
  }
};

const OTP_EXPIRY_MS = 5 * 60 * 1000;

const generateRandomPassword = () => {
  return crypto.randomBytes(5).toString("hex");
};

const generateOtpCode = () => {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
};

const sendVisitorCredentialsEmail = async (visitor, password, otp) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>Visitor Login Credentials</h2>
      <p>Dear ${visitor.name || "Visitor"},</p>
      <p>Your visit has been manually checked in by our security team.</p>
      <p><strong>Email:</strong> ${visitor.email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p><strong>OTP:</strong> ${otp}</p>
      <p>You can use these credentials to log in to the Visitor Management System.</p>
      <p>The OTP expires in 5 minutes.</p>
    </div>
  `;

  return await sendEmail(visitor.email, "Your VMS login credentials", html);
};

const QR_SECRET = process.env.QR_SECRET || "qr-secret-key";

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const isObjectIdString = (value) =>
  typeof value === "string" && OBJECT_ID_REGEX.test(value);

const dataUriToBuffer = (dataUri) => {
  if (!dataUri || typeof dataUri !== "string") return null;
  const parts = dataUri.split("base64,");
  if (parts.length < 2) return null;
  return Buffer.from(parts[1], "base64");
};

const generateVisitorCardPdfBase64 = async (visitor, qrDataUri) => {
  return await new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer.toString("base64"));
      });
      doc.on("error", reject);

      doc.roundedRect(30, 30, 535, 760, 16).fillAndStroke("#f8fafc", "#e2e8f0");
      doc.fillColor("#0f172a").fontSize(22).text("Visitor ID Card", 55, 60);

      doc.fillColor("#334155").fontSize(12);
      doc.text(`Name: ${visitor.name || "N/A"}`, 55, 110);
      doc.text(`Email: ${visitor.email || "N/A"}`, 55, 132);
      doc.text(`Purpose: ${visitor.purpose || "N/A"}`, 55, 154);
      doc.text(`Host: ${visitor.hostName || visitor.personToMeet || "N/A"}`, 55, 176);
      doc.text(`Card ID: ${visitor.temporaryCardId || "TBD"}`, 55, 198);
      doc.text(
        `Valid until: ${visitor.expectedCheckOut ? new Date(visitor.expectedCheckOut).toLocaleString() : "N/A"}`,
        55,
        220,
      );

      const photoBuffer = dataUriToBuffer(visitor.photo);
      if (photoBuffer) {
        doc.image(photoBuffer, 380, 90, {
          width: 140,
          height: 180,
          fit: [140, 180],
          align: "center",
          valign: "center",
        });
      } else {
        doc.rect(380, 90, 140, 180).stroke("#94a3b8");
        doc.fillColor("#64748b").fontSize(10).text("Photo pending", 418, 175);
      }

      const qrBuffer = dataUriToBuffer(qrDataUri);
      if (qrBuffer) {
        doc.image(qrBuffer, 55, 300, {
          width: 130,
          height: 130,
        });
        doc.fillColor("#475569").fontSize(10).text("Scan at security gate", 55, 436);
      }

      doc.fontSize(11).fillColor("#1e293b").text(
        "This ID card is issued by Visitor Management System. Please carry this document during the visit.",
        55,
        470,
        { width: 470, lineGap: 4 },
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const attachHostName = async (visitor) => {
  if (!visitor) return visitor;

  const plainVisitor = typeof visitor.toObject === "function" ? visitor.toObject() : { ...visitor };
  const hostRaw = plainVisitor.personToMeet;

  if (!hostRaw) {
    return { ...plainVisitor, hostName: "Unassigned" };
  }

  if (isObjectIdString(hostRaw)) {
    const hostUser = await User.findById(hostRaw).select("name");
    return {
      ...plainVisitor,
      hostName: hostUser?.name || hostRaw,
    };
  }

  return {
    ...plainVisitor,
    hostName: hostRaw,
  };
};

const attachHostNames = async (visitors = []) => {
  if (visitors.length === 0) return visitors;

  const plainVisitors = visitors.map((visitor) =>
    typeof visitor.toObject === "function" ? visitor.toObject() : { ...visitor }
  );

  const hostIds = [
    ...new Set(
      plainVisitors
        .map((visitor) => visitor.personToMeet)
        .filter((value) => isObjectIdString(value))
    ),
  ];

  let hostMap = new Map();
  if (hostIds.length > 0) {
    const hostUsers = await User.find({ _id: { $in: hostIds } }).select("_id name");
    hostMap = new Map(hostUsers.map((hostUser) => [hostUser._id.toString(), hostUser.name]));
  }

  return plainVisitors.map((visitor) => ({
    ...visitor,
    hostName: isObjectIdString(visitor.personToMeet)
      ? hostMap.get(visitor.personToMeet) || visitor.personToMeet
      : visitor.personToMeet || "Unassigned",
  }));
};

const finalizeCheckout = async ({ visitor, actor, checkoutChannel }) => {
  visitor.checkOutTime = new Date();
  visitor.status = "checked-out";
  visitor.checkoutAuthorizedBy = actor.id;
  visitor.checkoutChannel = checkoutChannel;

  await visitor.save();
  await sendVisitorCheckOutEmail(visitor);

  await createNotificationForRoles(["admin", "security"], {
    visitorId: visitor._id,
    type: "check-out",
    title: "Visitor Checked Out",
    message: `${visitor.name} has checked out. Purpose: ${visitor.purpose}`,
    visitorName: visitor.name,
    visitorEmail: visitor.email,
    purpose: visitor.purpose,
    personToMeet: visitor.personToMeet,
  });

  await createNotificationForUser(visitor.userId, {
    visitorId: visitor._id,
    type: "check-out",
    title: "Checkout Confirmed",
    message: `You have been checked out successfully at ${new Date(visitor.checkOutTime).toLocaleString()}.`,
    visitorName: visitor.name,
    visitorEmail: visitor.email,
    purpose: visitor.purpose,
    personToMeet: visitor.personToMeet,
  });
};

const generateQrDataUri = async (value) => {
  try {
    return await QRCode.toDataURL(value);
  } catch (error) {
    console.error("QR generation failed:", error);
    return null;
  }
};

const createQrForVisitor = (visitorId, expectedCheckOut) => {
  const expiryTime = new Date(expectedCheckOut);

  const secondsUntilExpiry = Math.floor(
    (expiryTime.getTime() - Date.now()) / 1000,
  );

  if (secondsUntilExpiry <= 0) {
    throw new Error("Invalid expiry time");
  }

  const qrToken = jwt.sign({ visitorId, type: "qr" }, QR_SECRET, {
    expiresIn: secondsUntilExpiry,
  });

  return {
    qrToken,
    qrTokenExpiry: expiryTime,
  };
};

const generateTemporaryCardId = () => {
  return `VC-${Math.floor(100000 + Math.random() * 900000)}`;
};

const getSecurityEmails = async () => {
  const users = await User.find({
    role: "security",
    email: { $exists: true, $ne: "" },
  });
  return users.map((user) => user.email).filter(Boolean);
};

const sendSecurityAlertEmail = async (subject, html) => {
  try {
    const securityEmails = await getSecurityEmails();

    if (securityEmails.length === 0) {
      console.log("No security emails found");
      return false;
    }

    for (const email of securityEmails) {
      const success = await sendEmail(email, subject, html);
      if (success) {
        console.log(`Security alert sent to ${email}`);
      } else {
        console.log(`Failed to send security alert to ${email}`);
      }
    }
    return true;
  } catch (error) {
    console.error("Security alert email error:", error);
    return false;
  }
};

const sendVisitorApprovalEmail = async (visitor, qrDataUri) => {
  try {
    console.log("Approval email triggered for:", visitor.email);

    if (!visitor.email) {
      console.log(" No email found for visitor");
      return;
    }

    const enrichedVisitor = await attachHostName(visitor);
    let attachments = [];
    let qrImgTag = "<p>Your QR code is available in the app.</p>";

    if (qrDataUri) {
      try {
        const base64Data = qrDataUri.split("base64,")[1];

        attachments.push({
          filename: "qrcode.png",
          content: base64Data,
          type: "image/png",
          disposition: "inline",
          cid: "qrcode",
        });

        qrImgTag = `
          <p><strong>QR Code:</strong></p>
          <img src="cid:qrcode" style="max-width: 300px;" />
        `;
      } catch (err) {
        console.error("QR attachment failed:", err);
      }
    }

    try {
      const cardPdfBase64 = await generateVisitorCardPdfBase64(enrichedVisitor, qrDataUri);
      attachments.push({
        filename: `visitor-id-card-${visitor.temporaryCardId || visitor._id}.pdf`,
        content: cardPdfBase64,
        type: "application/pdf",
        disposition: "attachment",
      });
    } catch (pdfError) {
      console.error("Visitor ID card PDF generation failed:", pdfError);
    }

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Visitor Approved</h2>
        <p>Your visitor request for <strong>${visitor.name}</strong> has been approved.</p>
        <p><strong>Purpose:</strong> ${visitor.purpose}</p>
        <p><strong>Host:</strong> ${enrichedVisitor.hostName || visitor.personToMeet}</p>
        <p><strong>Expected check-in:</strong> ${
          visitor.expectedCheckIn
            ? new Date(visitor.expectedCheckIn).toLocaleString()
            : "N/A"
        }</p>
        <p><strong>Expected checkout:</strong> ${
          visitor.expectedCheckOut
            ? new Date(visitor.expectedCheckOut).toLocaleString()
            : "N/A"
        }</p>
        ${qrImgTag}
        <p>Your Visitor ID card is attached as a PDF for quick access at the gate.</p>
      </div>
    `;

    const success = await sendEmail(
      visitor.email,
      "Visitor Approved - ID Card Attached",
      html,
      attachments,
    );

    if (success) {
      console.log("Approval email sent successfully");
    } else {
      console.log("Approval email failed");
    }
  } catch (error) {
    console.error(" Approval email failed:", error);
  }
};

const sendVisitorRejectionEmail = async (visitor) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>Visitor Request Rejected</h2>
      <p>We are sorry to inform you that the visitor request for <strong>${visitor.name}</strong> has been rejected.</p>
      <p><strong>Purpose:</strong> ${visitor.purpose}</p>
      <p><strong>Host:</strong> ${visitor.personToMeet}</p>
      <p>If you believe this is a mistake, please contact support.</p>
    </div>
  `;

  await sendEmail(visitor.email, "Visitor Request Rejected", html);
};

const sendVisitorCheckOutEmail = async (visitor) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>Visitor Checked Out</h2>
      <p>The visitor <strong>${visitor.name}</strong> has been checked out successfully.</p>
      <p><strong>Purpose:</strong> ${visitor.purpose}</p>
      <p><strong>Host:</strong> ${visitor.personToMeet}</p>
      <p><strong>Checkout time:</strong> ${visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleString() : new Date().toLocaleString()}</p>
    </div>
  `;

  await sendEmail(visitor.email, "Visitor Checked Out", html);
};

const notifySecurityOfExpiredVisit = async (visitor) => {
  try {
    if (visitor.expiryNotified) return;

    const recipients = await getSecurityEmails();
    if (recipients.length === 0) return;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Visitor QR Expired</h2>
        <p>The visitor <strong>${visitor.name}</strong> has an expired QR token and has not checked out.</p>
        <p><strong>Purpose:</strong> ${visitor.purpose}</p>
        <p><strong>Host:</strong> ${visitor.personToMeet}</p>
        <p><strong>Expected check-in:</strong> ${visitor.expectedCheckIn ? new Date(visitor.expectedCheckIn).toLocaleString() : "N/A"}</p>
        <p><strong>Expected checkout:</strong> ${visitor.expectedCheckOut ? new Date(visitor.expectedCheckOut).toLocaleString() : "N/A"}</p>
        <p>Please review and follow up with the visitor.</p>
      </div>
    `;

    await sendEmail(
      recipients.join(", "),
      `Expired Visitor QR: ${visitor.name}`,
      html,
    );
    await Visitor.findByIdAndUpdate(visitor._id, { expiryNotified: true });
  } catch (error) {
    console.error("Expired visit notification error:", error);
  }
};

export const scanExpiredVisitsAndNotify = async () => {
  try {
    const expiredVisits = await Visitor.find({
      status: "approved",
      checkOutTime: null,
      qrTokenExpiry: { $lt: new Date() },
      expiryNotified: false,
    });

    for (const visitor of expiredVisits) {
      await notifySecurityOfExpiredVisit(visitor);
    }
  } catch (error) {
    console.error("Expired visit scanner error:", error);
  }
};

export const createVisitor = async (req, res) => {
  try {
    if (req.user.role === "visitor") {
      const existingVisit = await Visitor.findOne({
        userId: req.user.id,
        status: "approved",
        checkInTime: { $ne: null },
        checkOutTime: null,
      });

      if (existingVisit) {
        return res.status(400).json({
          message: "You already have an active visit. Please checkout first.",
        });
      }
    }

    const defaultStatus =
      req.user.role === "security" || req.user.role === "admin"
        ? "approved"
        : "pending";

    const { expectedCheckIn, expectedCheckOut } = req.body;

    if (
      expectedCheckIn &&
      expectedCheckOut &&
      new Date(expectedCheckOut) <= new Date(expectedCheckIn)
    ) {
      return res.status(400).json({
        message: "Expected checkout must be later than expected check-in.",
      });
    }

    const normalizedName = req.body.name?.trim() || req.user.name || "Guest Visitor";
    const normalizedEmail = (req.body.email || req.user.email || "").trim().toLowerCase();
    let visitorUserId = req.user.id;

    if (req.user.role === "security" || req.user.role === "admin") {
      if (!normalizedEmail) {
        return res.status(400).json({
          message: "Visitor email is required for manual check-in.",
        });
      }

      let visitorUser = await User.findOne({ email: normalizedEmail });

      if (visitorUser && visitorUser.role !== "visitor") {
        return res.status(400).json({
          message: "The provided email belongs to a staff account. Use a visitor email.",
        });
      }

      let generatedPassword = null;

      if (!visitorUser) {
        generatedPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        visitorUser = await User.create({
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          role: "visitor",
        });
      } else {
        if (!visitorUser.password) {
          generatedPassword = generateRandomPassword();
          visitorUser.password = await bcrypt.hash(generatedPassword, 10);
        }
        visitorUser.name = normalizedName;
        await visitorUser.save();
      }

      const otp = generateOtpCode();
      const otpHash = await bcrypt.hash(otp, 10);
      visitorUser.otpCodeHash = otpHash;
      visitorUser.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
      visitorUser.otpRequestedAt = new Date();
      await visitorUser.save();

      const visitorCredentialsSent = await sendVisitorCredentialsEmail(
        { name: normalizedName, email: normalizedEmail },
        generatedPassword || "(your existing password)",
        otp,
      );

      if (!visitorCredentialsSent) {
        return res.status(500).json({
          message: "Failed to send visitor credentials email. Please verify email settings and retry.",
        });
      }

      visitorUserId = visitorUser._id;
    }

    const checkInType =
      req.user.role === "security"
        ? "security"
        : req.user.role === "admin"
          ? "admin"
          : "self";

    const visitor = await Visitor.create({
      ...req.body,
      name: normalizedName,
      email: normalizedEmail,
      userId: visitorUserId,
      status: defaultStatus,
      temporaryCardId:
        defaultStatus === "approved"
          ? generateTemporaryCardId()
          : null,
      photo: null,
      cardIssuedAt: null,
      checkInTime:
        req.user.role === "security" || req.user.role === "admin"
          ? new Date()
          : null,
      checkInType,
      checkInApprovedBy:
        req.user.role === "security" || req.user.role === "admin"
          ? req.user.id
          : null,
    });

    if (defaultStatus === "approved") {
      const { qrToken, qrTokenExpiry } = createQrForVisitor(
        visitor._id,
        visitor.expectedCheckOut,
      );

      visitor.qrToken = qrToken;
      visitor.qrTokenExpiry = qrTokenExpiry;
      visitor.expiryNotified = false;

      await visitor.save();

      if (req.user.role === "security" || req.user.role === "admin") {
        await createNotificationForRoles(["admin"], {
          visitorId: visitor._id,
          type: "check-in-request",
          title: "Visitor Check-In",
          message: `${visitor.name} has checked in. Purpose: ${visitor.purpose}`,
          visitorName: visitor.name,
          visitorEmail: visitor.email,
          purpose: visitor.purpose,
          personToMeet: visitor.personToMeet,
        });
      }

      // Final ID card and appointment email will be sent after visitor photo is captured.
    } else {
      await createNotificationForRoles(["admin"], {
        visitorId: visitor._id,
        type: "check-in-request",
        title: "New Visitor Request",
        message: `New visitor request from ${visitor.name}. Purpose: ${visitor.purpose}`,
        visitorName: visitor.name,
        visitorEmail: visitor.email,
        purpose: visitor.purpose,
        personToMeet: visitor.personToMeet,
      });

      await createNotificationForUser(visitor.userId, {
        visitorId: visitor._id,
        type: "check-in-request",
        title: "Visit Request Submitted",
        message: `Your visit request for ${visitor.purpose} has been submitted for approval.`,
        visitorName: visitor.name,
        visitorEmail: visitor.email,
        purpose: visitor.purpose,
        personToMeet: visitor.personToMeet,
      });
    }

    const visitorWithHost = await attachHostName(visitor);
    res.status(201).json(visitorWithHost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    const withHostNames = await attachHostNames(visitors);
    res.status(200).json(withHostNames);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkoutVisitor = async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    if (
      visitor.userId.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "security"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (visitor.status !== "approved") {
      return res
        .status(400)
        .json({ message: "Visitor must be approved before checkout." });
    }

    const isPrivileged =
      req.user.role === "admin" || req.user.role === "security";

    if (
      visitor.qrTokenExpiry &&
      new Date() > visitor.qrTokenExpiry &&
      !isPrivileged
    ) {
      await notifySecurityOfExpiredVisit(visitor);
      return res.status(400).json({
        message: "QR code expired. Please request a new approval.",
      });
    }

    await finalizeCheckout({
      visitor,
      actor: req.user,
      checkoutChannel: isPrivileged ? "staff-assisted" : "self-service",
    });

    const checkoutAlertHtml = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Visitor Checked Out</h2>
        <p>The following visitor has successfully checked out:</p>
        <p><strong>Visitor Name:</strong> ${visitor.name}</p>
        <p><strong>Email:</strong> ${visitor.email}</p>
        <p><strong>Purpose:</strong> ${visitor.purpose}</p>
        <p><strong>Person to Meet:</strong> ${visitor.personToMeet}</p>
        <p><strong>Check-in Time:</strong> ${visitor.checkInTime ? new Date(visitor.checkInTime).toLocaleString() : "N/A"}</p>
        <p><strong>Check-out Time:</strong> ${visitor.checkOutTime ? new Date(visitor.checkOutTime).toLocaleString() : "N/A"}</p>
        <p style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-left: 4px solid #ef4444;">
          <strong>Status:</strong> Visitor has exited the premises.
        </p>
      </div>
    `;
    await sendSecurityAlertEmail(`Visitor Checked Out: ${visitor.name}`, checkoutAlertHtml);

    const visitorWithHost = await attachHostName(visitor);
    res.status(200).json(visitorWithHost);
  } catch (error) {
    console.error("Checkout Error:", error);

    res.status(500).json({
      message: "Checkout failed",
      error: error.message,
    });
  }
};

export const requestCheckout = async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    if (visitor.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (visitor.status !== "approved") {
      return res
        .status(400)
        .json({ message: "Visitor must be approved for checkout" });
    }

    if (!visitor.checkInTime) {
      return res
        .status(400)
        .json({ message: "Visitor has not checked in yet" });
    }

    if (visitor.checkOutTime) {
      return res
        .status(400)
        .json({ message: "Visitor has already checked out" });
    }

    // Create a notification for security team to approve checkout
    await createNotificationForRoles(["security"], {
      visitorId: visitor._id,
      type: "checkout-request",
      title: "Checkout Request",
      message: `${visitor.name} has requested checkout approval. Checked in since ${new Date(visitor.checkInTime).toLocaleString()}`,
      visitorName: visitor.name,
      visitorEmail: visitor.email,
      purpose: visitor.purpose,
      personToMeet: visitor.personToMeet,
    });

    res.status(200).json({
      message: "Checkout request sent to security for approval"
    });
  } catch (error) {
    console.error("Checkout request error:", error);
    res.status(500).json({
      message: "Failed to send checkout request",
      error: error.message,
    });
  }
};

export const securityCheckoutVisitor = async (req, res) => {
  try {
    const { qrToken, temporaryCardId, visitorId } = req.body;

    let resolvedVisitorId = visitorId || null;

    if (!resolvedVisitorId && qrToken) {
      try {
        const decoded = jwt.verify(qrToken, QR_SECRET);
        resolvedVisitorId = decoded.visitorId;
      } catch (tokenError) {
        const decoded = jwt.decode(qrToken);
        if (decoded?.visitorId) {
          resolvedVisitorId = decoded.visitorId;
        }
      }
    }

    let visitor = null;

    if (resolvedVisitorId) {
      visitor = await Visitor.findById(resolvedVisitorId);
    } else if (temporaryCardId) {
      visitor = await Visitor.findOne({ temporaryCardId: temporaryCardId.trim() });
    }

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found for the scanned input." });
    }

    if (visitor.status !== "approved") {
      return res.status(400).json({ message: "Visitor is not currently eligible for checkout." });
    }

    await finalizeCheckout({
      visitor,
      actor: req.user,
      checkoutChannel: "security-scan",
    });

    const visitorWithHost = await attachHostName(visitor);

    res.status(200).json({
      message: "Security checkout completed.",
      visitor: visitorWithHost,
    });
  } catch (error) {
    console.error("Security checkout error:", error);
    res.status(500).json({ message: "Security checkout failed" });
  }
};

export const getVisitorStats = async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const visitorsInside = await Visitor.countDocuments({
      checkOutTime: null,
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const visitorsToday = await Visitor.countDocuments({
      checkInTime: { $gte: startOfToday },
    });

    const checkedOutToday = await Visitor.countDocuments({
      checkOutTime: { $gte: startOfToday },
    });
    res.status(200).json({
      totalVisitors,
      visitorsInside,
      visitorsToday,
      checkedOutToday,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    const { qrToken, qrTokenExpiry } = createQrForVisitor(
      visitor._id,
      visitor.expectedCheckOut,
    );

    const temporaryCardId = visitor.temporaryCardId || generateTemporaryCardId();

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        qrToken,
        qrTokenExpiry,
        expiryNotified: false,
        checkInTime: new Date(),
        temporaryCardId,
      },
      { returnDocument: "after" },
    );

    const qrDataUri = await generateQrDataUri(qrToken);
    await sendVisitorApprovalEmail(updatedVisitor, qrDataUri);

    const securityAlertHtml = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Visitor Approved - Check-In Alert</h2>
        <p>The following visitor has been approved and may be checking in:</p>
        <p><strong>Visitor Name:</strong> ${updatedVisitor.name}</p>
        <p><strong>Email:</strong> ${updatedVisitor.email}</p>
        <p><strong>Purpose:</strong> ${updatedVisitor.purpose}</p>
        <p><strong>Person to Meet:</strong> ${updatedVisitor.personToMeet}</p>
        <p><strong>Expected Check-in:</strong> ${updatedVisitor.expectedCheckIn ? new Date(updatedVisitor.expectedCheckIn).toLocaleString() : "N/A"}</p>
        <p><strong>Expected Check-out:</strong> ${updatedVisitor.expectedCheckOut ? new Date(updatedVisitor.expectedCheckOut).toLocaleString() : "N/A"}</p>
        <p style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-left: 4px solid #10b981;">
          <strong>Action Required:</strong> Please ensure smooth check-in process for this visitor.
        </p>
      </div>
    `;
    await sendSecurityAlertEmail(`Visitor Approved: ${updatedVisitor.name}`, securityAlertHtml);

    await createNotificationForRoles(["admin", "security"], {
      visitorId: updatedVisitor._id,
      type: "check-in-approved",
      title: "Visitor Approved",
      message: `Visitor ${updatedVisitor.name} has been approved. Purpose: ${updatedVisitor.purpose}`,
      visitorName: updatedVisitor.name,
      visitorEmail: updatedVisitor.email,
      purpose: updatedVisitor.purpose,
      personToMeet: updatedVisitor.personToMeet,
    });

    await createNotificationForUser(updatedVisitor.userId, {
      visitorId: updatedVisitor._id,
      type: "check-in-approved",
      title: "Visit Approved",
      message: `Your visit request has been approved for ${updatedVisitor.purpose}.`,
      visitorName: updatedVisitor.name,
      visitorEmail: updatedVisitor.email,
      purpose: updatedVisitor.purpose,
      personToMeet: updatedVisitor.personToMeet,
    });

    const visitorWithHost = await attachHostName(updatedVisitor);
    res.json(visitorWithHost);
  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ message: "Error approving visitor" });
  }
};

export const uploadVisitorPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { photo } = req.body;

    if (!photo || typeof photo !== "string") {
      return res.status(400).json({ message: "Photo is required." });
    }

    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    const isOwner = visitor.userId?.toString() === req.user.id;
    const isPrivileged = req.user.role === "security" || req.user.role === "admin";

    if (!isPrivileged && !isOwner) {
      return res.status(403).json({ message: "Not allowed to upload photo for this visitor." });
    }

    visitor.photo = photo;
    visitor.cardIssuedAt = new Date();

    if (!visitor.qrToken || !visitor.qrTokenExpiry) {
      const { qrToken, qrTokenExpiry } = createQrForVisitor(
        visitor._id,
        visitor.expectedCheckOut,
      );
      visitor.qrToken = qrToken;
      visitor.qrTokenExpiry = qrTokenExpiry;
    }

    if (!visitor.temporaryCardId) {
      visitor.temporaryCardId = generateTemporaryCardId();
    }

    await visitor.save();

    const qrDataUri = visitor.qrToken ? await generateQrDataUri(visitor.qrToken) : null;
    if (visitor.status === "approved") {
      await sendVisitorApprovalEmail(visitor, qrDataUri);
      await createNotificationForUser(visitor.userId, {
        visitorId: visitor._id,
        type: "check-in-approved",
        title: "Your Visitor ID Card is Ready",
        message: `Your visitor ID card and appointment details have been emailed to you.`,
        visitorName: visitor.name,
        visitorEmail: visitor.email,
        purpose: visitor.purpose,
        personToMeet: visitor.personToMeet,
      });
    }

    const visitorWithHost = await attachHostName(visitor);
    res.status(200).json(visitorWithHost);
  } catch (error) {
    console.error("Photo upload error:", error);
    res.status(500).json({ message: "Failed to upload visitor photo." });
  }
};

export const getVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    if (
      req.user.role === "visitor" &&
      visitor.userId?.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const visitorWithHost = await attachHostName(visitor);
    res.status(200).json(visitorWithHost);
  } catch (error) {
    console.error("Get visitor error:", error);
    res.status(500).json({ message: "Error fetching visitor." });
  }
};

export const rejectVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", checkOutTime: new Date() },
      { new: true },
    );

    await sendVisitorRejectionEmail(updatedVisitor);

    const rejectionAlertHtml = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Visitor Request Rejected</h2>
        <p>The following visitor request has been rejected:</p>
        <p><strong>Visitor Name:</strong> ${updatedVisitor.name}</p>
        <p><strong>Email:</strong> ${updatedVisitor.email}</p>
        <p><strong>Purpose:</strong> ${updatedVisitor.purpose}</p>
        <p><strong>Person to Meet:</strong> ${updatedVisitor.personToMeet}</p>
        <p style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-left: 4px solid #ef4444;">
          <strong>Status:</strong> This visitor is NOT allowed to enter the premises.
        </p>
      </div>
    `;
    await sendSecurityAlertEmail(`Visitor Rejected: ${updatedVisitor.name}`, rejectionAlertHtml);

    await createNotificationForRoles(["admin", "security"], {
      visitorId: updatedVisitor._id,
      type: "rejection",
      title: "Visitor Rejected",
      message: `Visitor ${updatedVisitor.name} has been rejected. Purpose: ${updatedVisitor.purpose}`,
      visitorName: updatedVisitor.name,
      visitorEmail: updatedVisitor.email,
      purpose: updatedVisitor.purpose,
      personToMeet: updatedVisitor.personToMeet,
    });

    await createNotificationForUser(updatedVisitor.userId, {
      visitorId: updatedVisitor._id,
      type: "rejection",
      title: "Visit Rejected",
      message: `Your visit request for ${updatedVisitor.purpose} was rejected.`,
      visitorName: updatedVisitor.name,
      visitorEmail: updatedVisitor.email,
      purpose: updatedVisitor.purpose,
      personToMeet: updatedVisitor.personToMeet,
    });

    const visitorWithHost = await attachHostName(updatedVisitor);
    res.json(visitorWithHost);
  } catch (error) {
    console.error("Rejection Error:", error);
    res.status(500).json({ message: "Error rejecting visitor" });
  }
};

export const getMyVisits = async (req, res) => {
  try {
    const visits = await Visitor.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    const withHostNames = await attachHostNames(visits);
    res.json(withHostNames);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visits" });
  }
};

export const getVisitorByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = {};

    if (startDate && endDate) {
      const from = new Date(startDate);
      const to = new Date(endDate);

      to.setHours(23, 59, 59, 999);

      if (!isNaN(from) && !isNaN(to)) {
        filter.createdAt = {
          $gte: from,
          $lte: to,
        };
      }
    }

    const visitors = await Visitor.find(filter).sort({ createdAt: -1 });
    const withHostNames = await attachHostNames(visitors);

    res.status(200).json(withHostNames);
  } catch (error) {
    console.error("Date Filter Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyCheckInOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const visitor = await Visitor.findById(id);
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    // Only allow OTP verification for visitors with checkInType 'security'
    if (visitor.checkInType !== "security") {
      return res.status(400).json({ message: "OTP verification not required for this check-in type" });
    }

    const user = await User.findById(visitor.userId);
    if (!user) {
      return res.status(404).json({ message: "Associated user not found" });
    }

    // Verify OTP against user's stored OTP hash
    const isOtpValid = await bcrypt.compare(otp, user.otpCodeHash);
    if (!isOtpValid) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Mark OTP as verified in visitor document
    visitor.otpVerified = true;
    await visitor.save();

    // Clear OTP from user after verification
    user.otpCodeHash = null;
    user.otpExpiresAt = null;
    user.otpRequestedAt = null;
    await user.save();

    res.status(200).json({ 
      message: "OTP verified successfully",
      visitor 
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: error.message });
  }
};
