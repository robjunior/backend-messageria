import express from "express";
import scheduledRoutes from "./routes/scheduled";
import deliveredRoutes from "./routes/delivered";
import healthRoutes from "./routes/health";
import failedRoutes from "./routes/failed";
import orgRoutes from "./routes/orgs";
import authRoutes from "./routes/auth";

const app = express();

app.use(express.json());
app.use("/orgs", orgRoutes);
app.use("/auth", authRoutes);

// Routes
app.use("/scheduled", scheduledRoutes);
app.use("/delivered", deliveredRoutes);
app.use("/health", healthRoutes);
app.use("/failed", failedRoutes);

export default app;
