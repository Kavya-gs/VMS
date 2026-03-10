import express from "express";
import cors from "cors";
import visitorRoutes from "./routes/visitor.routes.js"
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Visitor Management API");
});

app.use("/api/visitors", visitorRoutes);

app.use("/api/dashboard", dashboardRoutes);


export default app;