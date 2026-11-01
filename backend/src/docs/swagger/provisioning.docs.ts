export const provisioningPaths = {
  '/provisioning/{tenantId}/status': {
    get: {
      tags: ['Provisioning'],
      summary: 'Get tenant database provisioning and migration progress',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Provisioning status and step progress' } },
    },
  },
  '/provisioning/{tenantId}/start': {
    post: {
      tags: ['Provisioning'],
      summary: 'Start tenant database creation, schema migration, and master data copy',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Provisioning pipeline started' } },
    },
  },
  '/provisioning/{tenantId}/sync-incremental': {
    post: {
      tags: ['Provisioning'],
      summary: 'Trigger incremental synchronization from master DB to tenant DB',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Incremental sync initiated' } },
    },
  },
  '/provisioning/{tenantId}/remove-constituencies': {
    post: {
      tags: ['Provisioning'],
      summary: 'De-assign constituencies and purge related voter data in tenant DB',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'tenantId', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Constituencies removed' } },
    },
  },
};
