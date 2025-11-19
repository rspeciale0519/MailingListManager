import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';
import { healthRoutes } from './routes/health.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = Fastify({
  logger: process.env.NODE_ENV === 'production' ? { level: 'info' } : true,
});

// Register CORS
await server.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : true, // Allow all origins in development
  credentials: true,
});

// Register routes
await server.register(healthRoutes, { prefix: '/api' });

// Global error handler
server.setErrorHandler((error, request, reply) => {
  server.log.error(error);

  reply.status(error.statusCode || 500).send({
    error: {
      message: error.message,
      statusCode: error.statusCode || 500,
    },
  });
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
