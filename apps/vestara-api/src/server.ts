import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config();

const isVercel = process.env.VERCEL === "1";

async function startServer(): Promise<void> {
  try {
    const port = Number(process.env.PORT ?? 3000);

    await app.listen({
      port,
      host: "0.0.0.0",
    });

    app.log.info(`Server running at http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

/**
 * Only start server in non-Vercel environments
 */
if (!isVercel) {
  startServer();
}