import fs from 'fs';
import path from 'path';
import { config } from './index';
import swaggerJsDoc from 'swagger-jsdoc';
import { allSwaggerPaths, swaggerTags } from '../docs/swagger';

const swaggerOptions: swaggerJsDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ranniti API Documentation',
      version: '1.0.0',
      description: 'API documentation for Ranniti Campaign & Voter Management System backend.',
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Local API v1 Server',
      },
      {
        url: '/api/v1',
        description: 'Relative API v1 (Current Host)',
      },
    ],
    tags: swaggerTags,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT token here (Swagger automatically adds the Bearer prefix).',
        },
        tenantDbHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-tenant-db',
          description: 'Optional Tenant DB override header (e.g. ranniti_tenant_divyesh_1750)',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    paths: allSwaggerPaths,
  },
  apis: [
    path.join(__dirname, '../routes/**/*.{ts,js}'),
    path.join(__dirname, '../provisioning/routes/**/*.{ts,js}'),
    path.join(__dirname, '../controllers/**/*.{ts,js}'),
  ],
};

export const swaggerSpec = swaggerJsDoc(swaggerOptions);

let customCss = '';
try {
  customCss = fs.readFileSync(path.join(__dirname, 'swagger.css'), 'utf-8');
} catch {
  customCss = '';
}

export const swaggerCustomCss = customCss;

let customJs = '';
try {
  customJs = fs.readFileSync(path.join(__dirname, 'swagger.auth-hook.js'), 'utf-8');
} catch {
  customJs = '';
}

export const swaggerAuthHookJs = customJs;

export const swaggerUiOptions = {
  customSiteTitle: 'Ranniti API Documentation',
  customCss: swaggerCustomCss,
  customJsStr: swaggerAuthHookJs,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: -1,
  },
};

