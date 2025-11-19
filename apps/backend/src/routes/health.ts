import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function healthRoutes(server: FastifyInstance) {
  // Basic health check
  server.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  });

  // Detailed health check
  server.get('/health/detailed', async (request: FastifyRequest, reply: FastifyReply) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: 'pending', // Will check Prisma connection
        redis: 'pending',    // Will check Redis connection
      },
    };

    // TODO: Add actual service health checks once Prisma is set up

    return reply.status(200).send(health);
  });
}
