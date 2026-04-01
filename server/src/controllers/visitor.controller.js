import Visitor from "../models/visitor.model.js";

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

    if (
      visitor.userId.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "security"
    ) {
      return res.status(403).json({ message: "Not allowed" });
    }

    visitor.checkOutTime = new Date();

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
  const visitor = await Visitor.findByIdAndUpdate(
    req.params.id,
    {status: "approved"},
    {new: true}
  )
  res.json(visitor);
};

//when user status is rejected
export const rejectVisitor = async(req, res) => {
  const visitor = await Visitor.findByIdAndUpdate(
    req.params.id,
    {status: "rejected"},
    {new: true}
  )
  res.json(visitor);
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