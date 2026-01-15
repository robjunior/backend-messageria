import express from "express";
import scheduledRoutes from "./routes/scheduled";
import deliveredRoutes from "./routes/delivered";
import healthRoutes from "./routes/health";

const app = express();

app.use(express.json());

// Routes
app.use("/scheduled", scheduledRoutes);
app.use("/delivered", deliveredRoutes);
app.use("/health", healthRoutes);

export default app;
