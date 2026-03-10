import Visitor from "../models/visitor.model.js";

export const getDashboardStats = async(req, res) => {
    try{
        const today = new Date();
        today.setHours(0,0,0,0);
    const totalVisitorsToday = await Visitor.countDocuments({
        createdAt: {$gte: today}
    });

    const checkedInVisitors = await Visitor.countDocuments({
        checkOutTime: null
    });

    const checkedOutVisitors = await Visitor.countDocuments({
        checkOutTime: {$ne: null}
    })
    
    res.json({
        totalVisitorsToday,
        checkedInVisitors,
        checkedOutVisitors
    })
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
}