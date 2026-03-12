import Visitor from "../models/visitor.model.js";

// create a visitor
export const createVisitor = async( req, res) => {
    try {
        const visitor = await Visitor.create(req.body);
        res.status(201).json(visitor);
    } catch (error) {
        res.status(500).json({message: error.message});
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

export const getVisitorStats = async(req,res) => {
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