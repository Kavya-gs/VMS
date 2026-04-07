import Visitor from "../models/visitor.model.js";
import jwt from "jsonwebtoken";

// create a visitor
export const createVisitor = async (req, res) => {
  try {
    console.log("REQ.USER", req.user);

    // Security users can add visitors without waiting for admin approval
    const defaultStatus =
      req.user.role === "security" || req.user.role === "admin"
        ? "approved"
        : "pending";

    const visitor = await Visitor.create({
      ...req.body,
      userId: req.user.id,
      status: defaultStatus,
    });

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
      return res.status(400).json({ message: "Visitor must be approved before checkout." });
    }

    // Validate QR token expiry
    if (visitor.qrTokenExpiry && new Date() > visitor.qrTokenExpiry) {
      return res.status(400).json({ message: "QR code expired. Please request a new approval." });
    }

    visitor.checkOutTime = new Date();
    visitor.status = "checked-out";

    await visitor.save();

    res.status(200).json(visitor);

  } catch (error) {

    console.error("Checkout Error:", error);

    res.status(500).json({
      message: "Checkout failed",
      error: error.message
    });
  }
};

export const getVisitorStats = async(req, res) => {
    try {
        const totalVisitors = await Visitor.countDocuments();
    const visitorsInside = await Visitor.countDocuments({
        checkOutTime: null
    });

    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const visitorsToday = await Visitor.countDocuments({
        createdAt: { $gte: startOfToday }
    })

    const checkedOutToday = await Visitor.countDocuments({
        checkOutTime: { $gte: startOfToday }
    })
    res.status(200).json({
        totalVisitors,
        visitorsInside,
        visitorsToday,
        checkedOutToday
    });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// for approvals page -> when user status is approved
export const approveVisitor = async(req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    // Generate QR token valid for 24 hours
    const qrToken = jwt.sign(
      { visitorId: visitor._id, type: "qr" },
      "qr-secret-key",
      { expiresIn: "24h" }
    );

    const qrTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { 
        status: "approved",
        qrToken: qrToken,
        qrTokenExpiry: qrTokenExpiry
      },
      { returnDocument: "after" }
    );
    
    res.json(updatedVisitor);
  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ message: "Error approving visitor" });
  }
};

//when user status is rejected
export const rejectVisitor = async(req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    
    if (!visitor) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { returnDocument: "after" }
    );
    
    res.json(updatedVisitor);
  } catch (error) {
    console.error("Rejection Error:", error);
    res.status(500).json({ message: "Error rejecting visitor" });
  }
}

export const getMyVisits = async (req, res) => {
  try {
    const visits = await Visitor.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

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
      if (visit.status === "approved") message = "Your visitor request is approved.";
      if (visit.status === "pending") message = "Your visitor request is pending approval.";
      if (visit.status === "rejected") message = "Your visitor request is rejected.";
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

      // ✅ Prevent invalid date crash
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