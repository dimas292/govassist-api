import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { config } from "./config";
import { corsOptions } from "./middleware/cors";
import { apiRateLimiter } from "./middleware/rateLimit";
import mediaRoutes from "./routes/media.routes";

const app = express();

app.set("trust proxy", config.trustProxy);
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (config.storage.driver === "local") {
  app.use("/uploads", express.static(config.storage.localDir, { fallthrough: false }));
}
app.use("/media", apiRateLimiter, mediaRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api", apiRateLimiter, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
