import Visitor from "../models/visitor.model.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
import QRCode from "qrcode";
import { createNotificationForRoles } from "./notifications.controller.js";

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
        type: "image/png",
        disposition: "inline",
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

const QR_SECRET = process.env.QR_SECRET || "qr-secret-key";

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

    let attachments = [];
    let qrImgTag = "<p>Your QR code is available in the app.</p>";

    if (qrDataUri) {
      try {
        const base64Data = qrDataUri.split("base64,")[1];

        attachments.push({
          filename: "qrcode.png",
          content: base64Data,
          encoding: "base64",
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

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Visitor Approved</h2>
        <p>Your visitor request for <strong>${visitor.name}</strong> has been approved.</p>
        <p><strong>Purpose:</strong> ${visitor.purpose}</p>
        <p><strong>Host:</strong> ${visitor.personToMeet}</p>
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
        <p>Present this QR code at the gate when checking in.</p>
      </div>
    `;

    const success = await sendEmail(
      visitor.email,
      "Visitor Approved - QR Code",
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

    const visitor = await Visitor.create({
      ...req.body,
      userId: req.user.id,
      status: defaultStatus,

      checkInTime:
        req.user.role === "security" || req.user.role === "admin"
          ? new Date()
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

      const qrDataUri = await generateQrDataUri(qrToken);
      await sendVisitorApprovalEmail(visitor, qrDataUri);

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
    }

    res.status(201).json(visitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.status(200).json(visitors);
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

    visitor.checkOutTime = new Date();
    visitor.status = "checked-out";

    await visitor.save();
    await sendVisitorCheckOutEmail(visitor);

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

    res.status(200).json(visitor);
  } catch (error) {
    console.error("Checkout Error:", error);

    res.status(500).json({
      message: "Checkout failed",
      error: error.message,
    });
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

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        qrToken,
        qrTokenExpiry,
        expiryNotified: false,
        checkInTime: new Date(),
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

    res.json(updatedVisitor);
  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ message: "Error approving visitor" });
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

    res.json(updatedVisitor);
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

    res.json(visits);
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

    res.status(200).json(visitors);
  } catch (error) {
    console.error("Date Filter Error:", error);
    res.status(500).json({ message: error.message });
  }
};
