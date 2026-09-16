import app from "./app";
import { config } from "./config";
import prisma from "./config/database";

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    app.listen(config.port, () => {
      console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`API base: http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();
