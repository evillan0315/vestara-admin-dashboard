import type { FastifyPluginAsync } from "fastify";

import { SubscribersController } from "./subscribers.controller.js";
import { SubscribersRepository } from "./subscribers.repository.js";
import { SubscribersService } from "./subscribers.service.js";

const subscribersRoutes: FastifyPluginAsync = async (
  fastify,
) => {
  //
  // Dependency injection
  //
  const repository = new SubscribersRepository();

  const service = new SubscribersService(
    repository,
  );

  const controller = new SubscribersController(
    service,
  );

  fastify.get(
    "/subscribers",
    controller.findAll.bind(controller),
  );
};

export default subscribersRoutes;