import express from "express";
import cors from "cors";
import visitorRoutes from "./routes/visitor.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

const allowedOrigins = [
  "https://vms-1-w3th.onrender.com",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const isAllowedOrigin =
        allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin);

      if (isAllowedOrigin) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Visitor Management API");
});

app.use("/api/visitors", visitorRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/notifications", notificationRoutes);


export default app;