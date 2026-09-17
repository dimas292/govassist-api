import app from "./app";
import { config } from "./config";
import prisma from "./config/database";

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");

    const server = app.listen(config.port, () => {
      console.log(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`API base: http://localhost:${config.port}/api`);
    });

    let shuttingDown = false;
    const shutdown = (signal: NodeJS.Signals) => {
      if (shuttingDown) return;
      shuttingDown = true;
      console.log(`${signal} received. Stopping HTTP server...`);

      const forceTimer = setTimeout(() => {
        console.error("Graceful shutdown timed out. Closing active connections.");
        server.closeAllConnections();
        process.exit(1);
      }, config.shutdownTimeoutMs);
      forceTimer.unref();

      server.close(async (error) => {
        clearTimeout(forceTimer);
        try {
          await prisma.$disconnect();
          console.log("Database disconnected. Shutdown complete.");
        } catch (disconnectError) {
          console.error("Failed to disconnect database:", disconnectError);
          process.exitCode = 1;
        }
        if (error) {
          console.error("Failed to close HTTP server:", error);
          process.exitCode = 1;
        }
      });

      server.closeIdleConnections();
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();
