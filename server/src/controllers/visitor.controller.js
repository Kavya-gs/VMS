import Visitor from "../models/visitor.model.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import sgMail from "@sendgrid/mail";
import QRCode from "qrcode";

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   }
// });

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

// const sendVisitorCheckInEmail = async (visitor) => {
//   const html = `
//     <div style="font-family: Arial, sans-serif; color: #111;">
//       <h2>Visitor Check-In Confirmed</h2>
//       <p>The visitor <strong>${visitor.name}</strong> has been checked in successfully.</p>
//       <p><strong>Purpose:</strong> ${visitor.purpose}</p>
//       <p><strong>Host:</strong> ${visitor.personToMeet}</p>
//       <p><strong>Check-in time:</strong> ${visitor.checkInTime ? new Date(visitor.checkInTime).toLocaleString() : new Date().toLocaleString()}</p>
//     </div>
//   `;

//   await sendEmail(visitor.email, "Visitor Checked In", html);
// };

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
    // Apply restriction ONLY for visitor role
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

    console.log("REQ.USER", req.user);

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
    }

    res.status(201).json(visitor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch all visitors
export const getVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// for all visitors which are inside
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

    const securityRecipients = await getSecurityEmails();
    if (securityRecipients.length > 0) {
      await sendEmail(
        securityRecipients.join(", "),
        `Visitor Checked Out: ${visitor.name}`,
        `<div style="font-family: Arial, sans-serif; color: #111;"><h2>Visitor Checked Out</h2><p>The visitor <strong>${visitor.name}</strong> has checked out.</p><p><strong>Host:</strong> ${visitor.personToMeet}</p><p><strong>Checkout time:</strong> ${new Date(visitor.checkOutTime).toLocaleString()}</p></div>`,
      );
    }

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

// for approvals page -> when user status is approved
export const approveVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    // Generate QR token valid for 24 hours
    // const { qrToken, qrTokenExpiry } = createQrForVisitor(visitor._id);
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

    res.json(updatedVisitor);
  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ message: "Error approving visitor" });
  }
};

//when user status is rejected
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

export const getNotifications = async (req, res) => {
  try {
    const visits = await Visitor.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(20);

    const notifications = visits.map((visit) => {
      let message = "Visitor status updated";
      if (visit.status === "approved")
        message = "Your visitor request is approved.";
      if (visit.status === "pending")
        message = "Your visitor request is pending approval.";
      if (visit.status === "rejected")
        message = "Your visitor request is rejected.";
      if (visit.status === "checked-in") message = "Visitor has checked in.";
      if (visit.status === "checked-out") message = "Visitor has checked out.";

      return {
        id: visit._id,
        name: visit.name,
        purpose: visit.purpose,
        personToMeet: visit.personToMeet,
        status: visit.status,
        message,
        createdAt: visit.createdAt,
        updatedAt: visit.updatedAt,
      };
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Failed to fetch notifications", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
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

      // Prevent invalid date crash
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
