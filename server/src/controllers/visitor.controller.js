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

export const checkoutVistior = async( req, res) => {
    try {
        const visitors = await Visitor.findByIdAndUpdate(
            req.params.id,
            { checkOutTime: new Date()},
            { new: true }
        );
        res.status(200).json(Visitor);
    } catch (error) {
        res.status(500).json({message: error.message})
    }
};