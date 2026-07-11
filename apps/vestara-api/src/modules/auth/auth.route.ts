import { FastifyInstance } from "fastify";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { verifyToken } from "./auth.utils.js";

const repo = new AuthRepository();
const service = new AuthService(repo);

export default async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (req, reply) => {
    const result = await service.register(req.body as any);
    return reply.send(result);
  });

  app.post("/auth/login", async (req, reply) => {
    const result = await service.login(req.body as any);
    return reply.send(result);
  });

  app.get("/auth/me", async (req, reply) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Missing token" });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);

    const user = await service.me(payload.userId);
    return reply.send(user);
  });
}