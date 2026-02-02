import express from "express";
import scheduledRoutes from "./routes/scheduled";
import deliveredRoutes from "./routes/delivered";
import healthRoutes from "./routes/health";
import failedRoutes from "./routes/failed";

const app = express();

app.use(express.json());

// Routes
app.use("/scheduled", scheduledRoutes);
app.use("/delivered", deliveredRoutes);
app.use("/health", healthRoutes);
app.use("/failed", failedRoutes);

export default app;
