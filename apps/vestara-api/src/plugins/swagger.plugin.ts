import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

export default fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Vestara API",
        description: "Digital Investment Platform API",
        version: "1.0.0",
      },
      tags: [
        {
          name: "Auth",
          description: "Authentication endpoints",
        },
        {
          name: "Wallet",
          description: "Wallet operations",
        },
        {
          name: "Investment",
          description: "Investment operations",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
});