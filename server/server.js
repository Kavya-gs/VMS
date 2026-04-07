import "dotenv/config"; 
import cors from "cors";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import { scanExpiredVisitsAndNotify } from "./src/controllers/visitor.controller.js";

// dotenv.config();
connectDB();

app.use(cors());
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await scanExpiredVisitsAndNotify();
  setInterval(scanExpiredVisitsAndNotify, 60 * 60 * 1000);
});
