import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const decoded = jwt.verify(token, "secretkey");

  req.user = decoded;

  next();
};

export default authMiddleware;