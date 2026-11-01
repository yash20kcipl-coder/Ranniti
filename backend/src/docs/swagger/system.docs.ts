export const systemPaths = {
  '/health': {
    get: {
      tags: ['System'],
      summary: 'System health check',
      description: 'Returns server and database connection status.',
      responses: {
        '200': {
          description: 'System is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'OK' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/sync/manifest': {
    post: {
      tags: ['System'],
      summary: 'Fetch sync manifest',
      description: 'Returns data change manifest for offline sync across clients.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                lastSyncTimestamp: { type: 'string', format: 'date-time', example: '2026-10-01T00:00:00.000Z' },
                entityTypes: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['voters', 'booths', 'elections'],
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Sync manifest retrieved successfully',
        },
        '401': {
          description: 'Unauthorized',
        },
      },
    },
  },
  '/uploads': {
    post: {
      tags: ['System'],
      summary: 'Upload a single file (image / document)',
      description: 'Upload an image, logo, avatar or document. Field name must be `file`.',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'The file to upload',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'File uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      url: { type: 'string', example: 'http://localhost:10001/uploads/images/abc.jpg' },
                      path: { type: 'string', example: '/uploads/images/abc.jpg' },
                      filename: { type: 'string', example: 'abc.jpg' },
                      size: { type: 'number', example: 1048576 },
                    },
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Missing file or invalid format',
        },
      },
    },
  },
  '/app-versions': {
    get: {
      tags: ['System'],
      summary: 'Check latest app version (Public)',
      description: 'Endpoint accessed by mobile apps during startup to detect mandatory or recommended updates.',
      responses: {
        '200': {
          description: 'Latest app version details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        platform: { type: 'string', example: 'android' },
                        version: { type: 'string', example: '1.2.0' },
                        buildNumber: { type: 'number', example: 12 },
                        isMandatory: { type: 'boolean', example: false },
                        downloadUrl: { type: 'string', example: 'https://play.google.com/store/apps/details?id=com.ranniti' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
