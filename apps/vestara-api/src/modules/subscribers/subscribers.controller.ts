import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { SubscribersService } from "./subscribers.service.js";

export class SubscribersController {
  constructor(
    private readonly subscribersService: SubscribersService,
  ) {}

  async findAll(
    _request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const subscribers =
        await this.subscribersService.findAll();

      return reply.code(200).send({
        success: true,
        count: subscribers.length,
        data: subscribers,
      });
    } catch (error) {
      _request.log.error(error);

      return reply.code(500).send({
        success: false,
        message: "Failed to fetch subscribers",
      });
    }
  }
}