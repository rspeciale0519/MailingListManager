import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import 'dotenv/config';
import { healthRoutes } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/user.js';
import { emailVerificationRoutes } from './routes/email-verification.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

const server = Fastify({
  logger: NODE_ENV === 'production' ? { level: 'info' } : true,
});

// Register Swagger for API documentation
await server.register(swagger, {
  openapi: {
    info: {
      title: 'Mailing List Manager API',
      description: 'Enterprise-grade mailing list management platform API documentation',
      version: '1.0.0',
      contact: {
        name: 'API Support',
        email: 'support@mailinglistmanager.com',
      },
    },
    externalDocs: {
      url: 'https://docs.mailinglistmanager.com',
      description: 'Full documentation',
    },
    servers: [
      {
        url:
          NODE_ENV === 'production'
            ? 'https://api.mailinglistmanager.com'
            : `http://localhost:${PORT}`,
        description: NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'User', description: 'User profile and account management' },
      { name: 'Contacts', description: 'Contact management' },
      { name: 'Lists', description: 'List management' },
      { name: 'Import', description: 'Data import operations' },
      { name: 'Export', description: 'Data export operations' },
      { name: 'Deduplication', description: 'Duplicate detection and merging' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
    },
  },
});

// Register Swagger UI
await server.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
});

// Register CORS
await server.register(cors, {
  origin: NODE_ENV === 'production' ? ['https://yourdomain.com'] : true, // Allow all origins in development
  credentials: true,
});

// Register routes
await server.register(healthRoutes, { prefix: '/api' });
await server.register(authRoutes, { prefix: '/api' });
await server.register(emailVerificationRoutes, { prefix: '/api' });
await server.register(userRoutes, { prefix: '/api' });

// Global error handler
server.setErrorHandler((error, _request, reply) => {
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
