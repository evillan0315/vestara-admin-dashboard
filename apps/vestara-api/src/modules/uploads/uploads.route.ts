import type { FastifyPluginAsync } from "fastify";

import { UploadRepository } from "./uploads.repository.js";
import { UploadService } from "./uploads.service.js";

interface UploadBody {
  filename: string;
  content: string;
  contentType?: string;
  folder?: string;
}

const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  //
  // Dependency Injection
  //
  const uploadRepository = new UploadRepository();
  const uploadService = new UploadService(uploadRepository);

  /**
   * Upload file (JSON/text/blob content)
   */
  fastify.post<{ Body: UploadBody }>("/uploads", async (request, reply) => {
    const { filename, content, contentType, folder } = request.body ?? {};

    if (!filename || !content) {
      return reply.code(400).send({
        success: false,
        message: "filename and content are required",
      });
    }

    try {
      const result = await uploadService.uploadFile({
        filename,
        content,
        contentType,
        folder,
      });

      return reply.code(201).send({
        success: true,
        data: result,
      });
    } catch (err) {
      fastify.log.error(err);

      return reply.code(500).send({
        success: false,
        message: "Upload failed",
      });
    }
  });

  /**
   * Optional: list uploaded records (if repository supports it)
   */
  fastify.get("/uploads", async (_request, reply) => {
    try {
      const files = await uploadRepository.findAll?.();

      return reply.send({
        success: true,
        data: files ?? [],
      });
    } catch (err) {
      fastify.log.error(err);

      return reply.code(500).send({
        success: false,
        message: "Failed to fetch uploads",
      });
    }
  });
};

export default uploadRoutes;