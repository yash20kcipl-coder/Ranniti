export const tenantPaths = {
  // --- USERS & VOLUNTEERS ---
  '/tenant/users': {
    get: {
      tags: ['Tenant - Users'],
      summary: 'List tenant admin users and staff',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Users list' } },
    },
    post: {
      tags: ['Tenant - Users'],
      summary: 'Create tenant user / volunteer',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['name', 'phone', 'roleId'],
              properties: {
                name: { type: 'string', example: 'Ravi Teja' },
                phone: { type: 'string', example: '9876543210' },
                email: { type: 'string', example: 'ravi@campaign.com' },
                roleId: { type: 'integer', example: 2 },
                boothIds: { type: 'array', items: { type: 'integer' } },
                avatar: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'User created' } },
    },
  },
  '/tenant/users/volunteers': {
    get: {
      tags: ['Tenant - Users'],
      summary: 'List all field volunteers',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Volunteers list' } },
    },
  },
  '/tenant/users/volunteers/coverage': {
    get: {
      tags: ['Tenant - Users'],
      summary: 'Get volunteer booth coverage analytics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Booth coverage stats' } },
    },
  },
  '/tenant/users/team': {
    get: {
      tags: ['Tenant - Users'],
      summary: 'Get team hierarchy members',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Team list' } },
    },
  },
  '/tenant/users/{id}': {
    get: {
      tags: ['Tenant - Users'],
      summary: 'Get user details by ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'User profile' } },
    },
    put: {
      tags: ['Tenant - Users'],
      summary: 'Update user profile',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'User updated' } },
    },
    delete: {
      tags: ['Tenant - Users'],
      summary: 'Delete user',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'User deleted' } },
    },
  },
  '/tenant/users/{id}/status': {
    patch: {
      tags: ['Tenant - Users'],
      summary: 'Toggle user active/inactive status',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Status updated' } },
    },
  },

  // --- TENANT VOTERS ---
  '/tenant/voters': {
    get: {
      tags: ['Tenant - Voters'],
      summary: 'Search & filter constituency voters',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search voter by name, EPIC, phone' },
        { in: 'query', name: 'boothId', schema: { type: 'integer' } },
        { in: 'query', name: 'wardId', schema: { type: 'integer' } },
        { in: 'query', name: 'villageId', schema: { type: 'integer' } },
        { in: 'query', name: 'gender', schema: { type: 'string', enum: ['M', 'F', 'O'] } },
        { in: 'query', name: 'voterType', schema: { type: 'string' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 25 } },
      ],
      responses: { '200': { description: 'Voters list' } },
    },
    post: {
      tags: ['Tenant - Voters'],
      summary: 'Add voter to constituency database',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['firstName', 'epicNo', 'acId'],
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                epicNo: { type: 'string' },
                phone: { type: 'string' },
                age: { type: 'integer' },
                gender: { type: 'string' },
                acId: { type: 'integer' },
                boothId: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Voter created' } },
    },
  },
  '/tenant/voters/stats': {
    get: {
      tags: ['Tenant - Voters'],
      summary: 'Get constituency voter demographics & party affiliation metrics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Constituency voter statistics' } },
    },
  },
  '/tenant/voters/export': {
    get: {
      tags: ['Tenant - Voters'],
      summary: 'Export filtered constituency voters to Excel (.xlsx)',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Binary .xlsx spreadsheet file' } },
    },
  },
  '/tenant/voters/family-mapping/auto-group': {
    post: {
      tags: ['Tenant - Voters'],
      summary: 'Auto-cluster and map voter families by house number and address',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Family grouping process completed' } },
    },
  },
  '/tenant/voters/family-mapping/families': {
    get: {
      tags: ['Tenant - Voters'],
      summary: 'List families and households',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Families list' } },
    },
  },
  '/tenant/voters/family-mapping/families/{headId}': {
    get: {
      tags: ['Tenant - Voters'],
      summary: 'Get family members under head of family',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'headId', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Family members list' } },
    },
  },
  '/tenant/voters/{id}': {
    get: {
      tags: ['Tenant - Voters'],
      summary: 'Get voter details by ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Voter profile' } },
    },
    put: {
      tags: ['Tenant - Voters'],
      summary: 'Update voter profile (tags, contact info, voter sentiment)',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Voter updated' } },
    },
    delete: {
      tags: ['Tenant - Voters'],
      summary: 'Delete voter',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Voter deleted' } },
    },
  },

  // --- ELECTIONS ---
  '/tenant/elections': {
    get: {
      tags: ['Tenant - Elections'],
      summary: 'List elections',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Elections list' } },
    },
    post: {
      tags: ['Tenant - Elections'],
      summary: 'Create election',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Election created' } },
    },
  },
  '/tenant/elections/default': {
    get: {
      tags: ['Tenant - Elections'],
      summary: 'Get currently active / default election',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Default election details' } },
    },
  },
  '/tenant/elections/{id}/turnout': {
    get: {
      tags: ['Tenant - Elections'],
      summary: 'Get live booth-wise voting turnout',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Live turnout statistics' } },
    },
  },
  '/tenant/elections/{id}/voter-status': {
    post: {
      tags: ['Tenant - Elections'],
      summary: 'Record voting status on poll day (voted / not voted)',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['voterId', 'hasVoted'],
              properties: {
                voterId: { type: 'integer' },
                hasVoted: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Voter status recorded' } },
    },
  },

  // --- SETTINGS & WHATSAPP TEMPLATES ---
  '/tenant/settings': {
    get: {
      tags: ['Tenant - Settings'],
      summary: 'Get tenant campaign settings',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Settings' } },
    },
    put: {
      tags: ['Tenant - Settings'],
      summary: 'Update campaign settings',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Settings updated' } },
    },
  },
  '/tenant/settings/whatsapp/templates': {
    get: {
      tags: ['Tenant - Settings'],
      summary: 'List tenant WhatsApp message templates',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Templates list' } },
    },
    post: {
      tags: ['Tenant - Settings'],
      summary: 'Create custom WhatsApp template',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Template created' } },
    },
  },

  // --- ANALYTICS ---
  '/tenant/analytics': {
    get: {
      tags: ['Tenant - Analytics'],
      summary: 'Get volunteer outreach and field campaign analytics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Analytics data' } },
    },
  },

  // --- BULK IMPORT ---
  '/tenant/bulk-import/jobs': {
    get: {
      tags: ['Tenant - Bulk Import'],
      summary: 'List tenant bulk import jobs',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Import jobs list' } },
    },
  },
  '/tenant/bulk-import/file/{category}': {
    post: {
      tags: ['Tenant - Bulk Import'],
      summary: 'Upload Excel (.xlsx) file to start bulk voter or master import',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'category', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: { file: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: { '200': { description: 'Import job created' } },
    },
  },
  '/tenant/bulk-import/sample-template/{category}': {
    get: {
      tags: ['Tenant - Bulk Import'],
      summary: 'Download sample Excel (.xlsx) import template',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'category', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Excel template' } },
    },
  },

  // --- DATA & STATS ---
  '/tenant/data/stats': {
    get: {
      tags: ['Tenant - Data'],
      summary: 'Get aggregate constituency metrics and statistics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Stats data' } },
    },
  },
  '/tenant/data/booths': {
    get: {
      tags: ['Tenant - Data'],
      summary: 'Get tenant booths and voter summary counts',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Booths summary' } },
    },
  },
  '/tenant/data/constituencies': {
    get: {
      tags: ['Tenant - Data'],
      summary: 'Get assigned constituency details (AC / PC)',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Constituency info' } },
    },
  },
};
