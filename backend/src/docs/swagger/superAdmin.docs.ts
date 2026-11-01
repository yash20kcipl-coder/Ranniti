export const superAdminPaths = {
  // --- DASHBOARD ---
  '/super-admin/dashboard/metrics': {
    get: {
      tags: ['SuperAdmin - Dashboard'],
      summary: 'Get platform aggregated KPIs',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Platform metrics (tenants, total voters, system load)' },
      },
    },
  },
  '/super-admin/dashboard/imports': {
    get: {
      tags: ['SuperAdmin - Dashboard'],
      summary: 'Get live and recent background bulk import jobs',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'List of bulk import jobs with progress & completion status' },
      },
    },
  },
  '/super-admin/dashboard/audit-feed': {
    get: {
      tags: ['SuperAdmin - Dashboard'],
      summary: 'Get recent security and audit logs',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'List of security events, logins, and schema actions' },
      },
    },
  },

  // --- TENANTS ---
  '/super-admin/tenants': {
    get: {
      tags: ['SuperAdmin - Tenants'],
      summary: 'List all tenant users / accounts',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by name, phone, or email' },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
      ],
      responses: {
        '200': { description: 'Paginated list of tenants' },
      },
    },
    post: {
      tags: ['SuperAdmin - Tenants'],
      summary: 'Provision a new Tenant and isolated tenant database',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['name', 'phone', 'stateId'],
              properties: {
                name: { type: 'string', example: 'Pawan Kalyan Campaign' },
                phone: { type: 'string', example: '9876543210' },
                email: { type: 'string', example: 'pawan@campaign.com' },
                stateId: { type: 'integer', example: 1 },
                districtId: { type: 'integer', example: 12 },
                pcId: { type: 'integer', example: 5 },
                acId: { type: 'integer', example: 101 },
                avatar: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Tenant registered & provisioning initiated' },
      },
    },
  },
  '/super-admin/tenants/{id}': {
    get: {
      tags: ['SuperAdmin - Tenants'],
      summary: 'Get tenant details by ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Tenant profile details' } },
    },
    put: {
      tags: ['SuperAdmin - Tenants'],
      summary: 'Update tenant user details',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                avatar: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Tenant updated successfully' } },
    },
    delete: {
      tags: ['SuperAdmin - Tenants'],
      summary: 'Delete tenant account',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Tenant deleted successfully' } },
    },
  },
  '/super-admin/tenants/{id}/status': {
    get: {
      tags: ['SuperAdmin - Tenants'],
      summary: 'Get tenant provisioning status',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Provisioning status (pending, provisioning, ready, failed)' } },
    },
    patch: {
      tags: ['SuperAdmin - Tenants'],
      summary: 'Update tenant status (active, suspended, inactive)',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Status updated' } },
    },
  },
  '/super-admin/tenants/{id}/db-sync-status': {
    get: {
      tags: ['SuperAdmin - Tenants'],
      summary: 'Check tenant DB schema and migration parity against master DB',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Database sync status comparison' } },
    },
  },

  // --- ROLES ---
  '/super-admin/tenant-roles': {
    get: {
      tags: ['SuperAdmin - Roles'],
      summary: 'List tenant role templates',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Roles list' } },
    },
    post: {
      tags: ['SuperAdmin - Roles'],
      summary: 'Create tenant role template',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['roleName', 'permissions'],
              properties: {
                roleName: { type: 'string', example: 'Booth President' },
                permissions: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Role created' } },
    },
  },
  '/super-admin/tenant-roles/{id}': {
    get: {
      tags: ['SuperAdmin - Roles'],
      summary: 'Get role by ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Role details' } },
    },
    put: {
      tags: ['SuperAdmin - Roles'],
      summary: 'Update role template',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Role updated' } },
    },
    delete: {
      tags: ['SuperAdmin - Roles'],
      summary: 'Delete role template',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Role deleted' } },
    },
  },
  '/super-admin/tenant-roles/{id}/set-default': {
    patch: {
      tags: ['SuperAdmin - Roles'],
      summary: 'Set default role for new tenant signups',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Default role updated' } },
    },
  },

  // --- SETTINGS ---
  '/super-admin/settings': {
    get: {
      tags: ['SuperAdmin - Settings'],
      summary: 'Get system-wide platform settings',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Settings' } },
    },
    put: {
      tags: ['SuperAdmin - Settings'],
      summary: 'Update platform settings',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Settings updated' } },
    },
  },

  // --- APP VERSIONS ---
  '/super-admin/app-versions': {
    get: {
      tags: ['SuperAdmin - App Versions'],
      summary: 'List mobile app versions and release flags',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'App versions list' } },
    },
  },
  '/super-admin/app-versions/{id}': {
    put: {
      tags: ['SuperAdmin - App Versions'],
      summary: 'Update app version (toggle mandatory update, edit changelog)',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'App version updated' } },
    },
  },

  // --- CENTRAL VOTERS ---
  '/super-admin/voters': {
    get: {
      tags: ['SuperAdmin - Voters'],
      summary: 'Search & filter central voters directory',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search voter by name, EPIC, or phone' },
        { in: 'query', name: 'acId', schema: { type: 'integer' } },
        { in: 'query', name: 'boothId', schema: { type: 'integer' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 25 } },
      ],
      responses: { '200': { description: 'Paginated voter records' } },
    },
    post: {
      tags: ['SuperAdmin - Voters'],
      summary: 'Create voter record',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['firstName', 'epicNo', 'acId'],
              properties: {
                firstName: { type: 'string', example: 'Rajesh' },
                lastName: { type: 'string', example: 'Kumar' },
                epicNo: { type: 'string', example: 'ABC1234567' },
                phone: { type: 'string', example: '9876543210' },
                gender: { type: 'string', enum: ['M', 'F', 'O'] },
                age: { type: 'integer', example: 34 },
                acId: { type: 'integer', example: 101 },
                boothId: { type: 'integer', example: 1 },
                avatar: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Voter created' } },
    },
  },
  '/super-admin/voters/stats': {
    get: {
      tags: ['SuperAdmin - Voters'],
      summary: 'Get central voter statistics and demographics',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Voter statistics' } },
    },
  },
  '/super-admin/voters/export': {
    get: {
      tags: ['SuperAdmin - Voters'],
      summary: 'Export filtered voters as Excel spreadsheet (.xlsx)',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Binary .xlsx spreadsheet file' } },
    },
  },
  '/super-admin/voters/{id}': {
    get: {
      tags: ['SuperAdmin - Voters'],
      summary: 'Get voter profile by ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Voter profile' } },
    },
    put: {
      tags: ['SuperAdmin - Voters'],
      summary: 'Update voter profile',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Voter updated' } },
    },
    delete: {
      tags: ['SuperAdmin - Voters'],
      summary: 'Delete voter record',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Voter deleted' } },
    },
  },

  // --- MASTERS ---
  '/super-admin/masters/sync': {
    post: {
      tags: ['SuperAdmin - Masters'],
      summary: 'Auto-sync master data tables',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Sync completed' } },
    },
  },
  '/super-admin/masters/bulk-import/jobs': {
    get: {
      tags: ['SuperAdmin - Masters'],
      summary: 'Get all master bulk import jobs and tracking status',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Jobs list' } },
    },
  },
  '/super-admin/masters/bulk-import-file/{category}': {
    post: {
      tags: ['SuperAdmin - Masters'],
      summary: 'Upload and start high-volume bulk import spreadsheet (.xlsx)',
      description: 'Accepts .xlsx files up to 200MB. Category can be states, districts, pcs, acs, talukas, villages, wards, booths, parties, religions, castes, or voters.',
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
      responses: { '200': { description: 'Bulk import job queued' } },
    },
  },
  '/super-admin/masters/sample-template/{category}': {
    get: {
      tags: ['SuperAdmin - Masters'],
      summary: 'Download sample Excel (.xlsx) template for bulk importing',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'category', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Excel template file' } },
    },
  },
  '/super-admin/masters/states': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List states', security: [{ bearerAuth: [] }], responses: { '200': { description: 'States list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create state', security: [{ bearerAuth: [] }], responses: { '201': { description: 'State created' } } },
  },
  '/super-admin/masters/districts': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List districts', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Districts list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create district', security: [{ bearerAuth: [] }], responses: { '201': { description: 'District created' } } },
  },
  '/super-admin/masters/pcs': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List Parliamentary Constituencies', security: [{ bearerAuth: [] }], responses: { '200': { description: 'PCs list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create Parliamentary Constituency', security: [{ bearerAuth: [] }], responses: { '201': { description: 'PC created' } } },
  },
  '/super-admin/masters/acs': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List Assembly Constituencies', security: [{ bearerAuth: [] }], responses: { '200': { description: 'ACs list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create Assembly Constituency', security: [{ bearerAuth: [] }], responses: { '201': { description: 'AC created' } } },
  },
  '/super-admin/masters/talukas': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List talukas', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Talukas list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create taluka', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Taluka created' } } },
  },
  '/super-admin/masters/villages': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List villages', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Villages list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create village', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Village created' } } },
  },
  '/super-admin/masters/wards': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List wards', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Wards list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create ward', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Ward created' } } },
  },
  '/super-admin/masters/booths': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List polling booths', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Booths list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create polling booth', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Booth created' } } },
  },
  '/super-admin/masters/booths/options': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'Get booth dropdown options', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Booth options' } } },
  },
  '/super-admin/masters/parties': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List political parties', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Parties list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create party with logo upload', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Party created' } } },
  },
  '/super-admin/masters/religions': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List religions', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Religions list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create religion', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Religion created' } } },
  },
  '/super-admin/masters/castes': {
    get: { tags: ['SuperAdmin - Masters'], summary: 'List castes', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Castes list' } } },
    post: { tags: ['SuperAdmin - Masters'], summary: 'Create caste', security: [{ bearerAuth: [] }], responses: { '201': { description: 'Caste created' } } },
  },
};
