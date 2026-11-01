export const mobilePaths = {
  // --- AUTH & MPIN ---
  '/mobile/auth/login': {
    post: {
      tags: ['Mobile - Auth'],
      summary: 'Mobile password login',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mobile', 'password'],
              properties: {
                mobile: { type: 'string', example: '9870032873' },
                password: { type: 'string', example: '1234' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Login successful' } },
    },
  },
  '/mobile/auth/send-otp': {
    post: {
      tags: ['Mobile - Auth'],
      summary: 'Send SMS OTP for mobile verification',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mobile'],
              properties: {
                mobile: { type: 'string', example: '9870032873' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OTP sent' } },
    },
  },
  '/mobile/auth/verify-otp': {
    post: {
      tags: ['Mobile - Auth'],
      summary: 'Verify OTP and issue mobile JWT session token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mobile', 'otp'],
              properties: {
                mobile: { type: 'string', example: '9870032873' },
                otp: { type: 'string', example: '123456' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'OTP verified & token returned' } },
    },
  },
  '/mobile/auth/verify-mpin': {
    post: {
      tags: ['Mobile - Auth'],
      summary: 'Quick unlock using 4-digit or 6-digit MPIN',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mobile', 'mpin'],
              properties: {
                mobile: { type: 'string', example: '9870032873' },
                mpin: { type: 'string', example: '1234' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'MPIN verified' } },
    },
  },
  '/mobile/auth/setup-mpin': {
    post: {
      tags: ['Mobile - Auth'],
      summary: 'Set or update user MPIN',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mpin'],
              properties: {
                mpin: { type: 'string', example: '1234' },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'MPIN updated' } },
    },
  },
  '/mobile/auth/profile': {
    get: {
      tags: ['Mobile - Auth'],
      summary: 'Get volunteer profile, permissions, and assigned booths',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Volunteer profile details' } },
    },
    put: {
      tags: ['Mobile - Auth'],
      summary: 'Update volunteer profile info',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Profile updated' } },
    },
  },

  // --- MOBILE VOTERS ---
  '/mobile/voters': {
    get: {
      tags: ['Mobile - Voters'],
      summary: 'Field volunteer voter lookup & list',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' } },
        { in: 'query', name: 'boothId', schema: { type: 'integer' } },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: { '200': { description: 'Voters list' } },
    },
    post: {
      tags: ['Mobile - Voters'],
      summary: 'Add voter from field app',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Voter created' } },
    },
  },
  '/mobile/voters/societies': {
    get: {
      tags: ['Mobile - Voters'],
      summary: 'List societies / residential areas in booth',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Societies list' } },
    },
  },
  '/mobile/voters/{id}': {
    get: {
      tags: ['Mobile - Voters'],
      summary: 'Get full voter profile',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Voter profile' } },
    },
    put: {
      tags: ['Mobile - Voters'],
      summary: 'Update voter phone, sentiment, or tags',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Voter updated' } },
    },
  },
  '/mobile/voters/{id}/family': {
    get: {
      tags: ['Mobile - Voters'],
      summary: 'Get family members associated with voter',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Family members list' } },
    },
  },

  // --- BOOTHS ---
  '/mobile/booths': {
    get: {
      tags: ['Mobile - Booths'],
      summary: 'Get polling booths assigned to the logged-in volunteer',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Assigned booths list' } },
    },
  },

  // --- TEAM ---
  '/mobile/team': {
    get: {
      tags: ['Mobile - Team'],
      summary: 'Get team members list & contact info',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Team directory' } },
    },
    post: {
      tags: ['Mobile - Team'],
      summary: 'Onboard a new field volunteer or cadre member',
      security: [{ bearerAuth: [] }],
      responses: { '201': { description: 'Team member onboarded' } },
    },
  },

  // --- DASHBOARD ---
  '/mobile/dashboard': {
    get: {
      tags: ['Mobile - Dashboard'],
      summary: 'Get volunteer home screen metrics & progress indicators',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Dashboard metrics' } },
    },
  },

  // --- FAMILY MAPPING ---
  '/mobile/family-mapping/families': {
    get: {
      tags: ['Mobile - Family Mapping'],
      summary: 'List mapped households in volunteer booth',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Families list' } },
    },
  },
  '/mobile/family-mapping/families/{headId}': {
    get: {
      tags: ['Mobile - Family Mapping'],
      summary: 'Get family members under head of family',
      security: [{ bearerAuth: [] }],
      parameters: [{ in: 'path', name: 'headId', required: true, schema: { type: 'string' } }],
      responses: { '200': { description: 'Family members' } },
    },
  },

  // --- ELECTION & POLL DAY ---
  '/mobile/election/voters': {
    get: {
      tags: ['Mobile - Election'],
      summary: 'Get poll day voter list with marked turnout status',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Voters turnout list' } },
    },
  },
  '/mobile/election/mark-voted': {
    post: {
      tags: ['Mobile - Election'],
      summary: 'Mark voter as voted on poll day',
      security: [{ bearerAuth: [] }],
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
      responses: { '200': { description: 'Voting status recorded' } },
    },
  },
  '/mobile/election/batch-sync': {
    post: {
      tags: ['Mobile - Election'],
      summary: 'Batch sync offline marked votes to server',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['records'],
              properties: {
                records: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      voterId: { type: 'integer' },
                      hasVoted: { type: 'boolean' },
                      votedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Batch sync processed' } },
    },
  },
  '/mobile/election/booth-turnout': {
    get: {
      tags: ['Mobile - Election'],
      summary: 'Get live polling turnout for assigned booths',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Turnout statistics' } },
    },
  },
  '/mobile/election/whatsapp-templates': {
    get: {
      tags: ['Mobile - Election'],
      summary: 'Get WhatsApp outreach message templates for quick sharing',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Templates list' } },
    },
  },

  // --- CONTACT SYNC & INTERACTIONS ---
  '/mobile/voters/sync-contacts': {
    post: {
      tags: ['Mobile - Contact Sync'],
      summary: 'Sync device contacts with voter list to discover relationships',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['contacts'],
              properties: {
                contacts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      phone: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Contacts matched & synced' } },
    },
  },
  '/mobile/voters/synced-contacts': {
    get: {
      tags: ['Mobile - Contact Sync'],
      summary: 'Get synced phonebook contacts mapped to voters',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Synced contacts list' } },
    },
  },
  '/mobile/voters/interactions/log': {
    post: {
      tags: ['Mobile - Contact Sync'],
      summary: 'Log volunteer outreach interaction (call, WhatsApp, door-to-door visit)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['voterId', 'type'],
              properties: {
                voterId: { type: 'integer' },
                type: { type: 'string', enum: ['call', 'whatsapp', 'visit', 'sms'] },
                notes: { type: 'string' },
                sentiment: { type: 'string', enum: ['supportive', 'neutral', 'opposed', 'undecided'] },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Interaction recorded' } },
    },
  },

  // --- ACCESS ---
  '/mobile/roles': {
    get: {
      tags: ['Mobile - Access'],
      summary: 'Get list of mobile user roles',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Roles list' } },
    },
  },
  '/mobile/role-access': {
    get: {
      tags: ['Mobile - Access'],
      summary: 'Get granular feature permission flags for logged-in user',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Feature access matrix' } },
    },
  },
};
