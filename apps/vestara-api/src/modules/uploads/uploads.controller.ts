import type { FastifyReply, FastifyRequest } from "fastify";

import type { UploadBody } from "./uploads.types.js";
import { UploadService } from "./uploads.service.js";

export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
  ) {}

  async upload(
    request: FastifyRequest<{ Body: UploadBody }>,
    reply: FastifyReply,
  ) {
    const { filename, content } = request.body ?? {};

    if (!filename || !content) {
      return reply.code(400).send({
        success: false,
        message: "filename and content are required",
      });
    }

    try {
      const result = await this.uploadService.uploadFile({
        filename,
        content,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      request.log.error(error);

      return reply.code(500).send({
        success: false,
        message: "Upload failed",
      });
    }
  }
}