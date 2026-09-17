/**
 * Full TAMVA API surface, generated from the backend api-tester catalogue.
 * Used by the API Reference page, the request console and global search.
 */

export interface EndpointItem {
  id: string;
  method: string;
  path: string;
  title: string;
  desc: string;
  auth: boolean;
  scopes: string[];
  roles: string[];
  params: string[];
  query: string[];
  body: unknown;
}

export interface EndpointGroup {
  group: string;
  items: EndpointItem[];
}

export const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    "group": "Health",
    "items": [
      {
        "id": "health",
        "method": "GET",
        "path": "/health",
        "title": "Liveness Probe",
        "desc": "Returns 200 when the process is up and running.",
        "auth": false,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      },
      {
        "id": "ready",
        "method": "GET",
        "path": "/ready",
        "title": "Readiness Probe",
        "desc": "Checks database connectivity. Returns 503 if the DB is unreachable.",
        "auth": false,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Auth",
    "items": [
      {
        "id": "register",
        "method": "POST",
        "path": "/v1/auth/register",
        "title": "Register Institution",
        "desc": "Register a new institution and its first administrator user.",
        "auth": false,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "institution_name": "My Bank",
          "institution_slug": "my-bank",
          "name": "Admin User",
          "email": "admin@mybank.com",
          "password": "SecurePass123!"
        }
      },
      {
        "id": "login",
        "method": "POST",
        "path": "/v1/auth/login",
        "title": "Login (User)",
        "desc": "Authenticate a human user and receive a JWT bearer token.",
        "auth": false,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "email": "admin@tamva.local",
          "password": "StrongPass123!"
        }
      },
      {
        "id": "client",
        "method": "POST",
        "path": "/v1/auth/client",
        "title": "Login (Partner App)",
        "desc": "Authenticate a partner application using client credentials.",
        "auth": false,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "client_id": "app_demo",
          "client_secret": "demo-secret-123!"
        }
      },
      {
        "id": "me",
        "method": "GET",
        "path": "/v1/auth/me",
        "title": "Current Actor",
        "desc": "Returns the authenticated actor's profile, roles, and scopes from the JWT.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Customers",
    "items": [
      {
        "id": "create-customer",
        "method": "POST",
        "path": "/v1/customers",
        "title": "Create Customer",
        "desc": "Create a new customer record in the acting institution's tenant. Optionally include identifiers and accounts.",
        "auth": true,
        "scopes": [
          "customers:read"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "name": "Kwame Asante",
          "identifiers": [
            {
              "type": "PHONE",
              "value": "+233501234567"
            },
            {
              "type": "NATIONAL_ID",
              "value": "GHA-123456789-0"
            }
          ],
          "accounts": [
            {
              "account_number": "1029384756",
              "account_name": "Main Wallet",
              "type": "WALLET",
              "currency": "GHS",
              "balance": 4500,
              "available_balance": 3800
            }
          ]
        }
      },
      {
        "id": "get-customer",
        "method": "GET",
        "path": "/v1/customers/:customerId",
        "title": "Get Customer",
        "desc": "Fetch a customer by ID with their identifiers and accounts.",
        "auth": true,
        "scopes": [
          "customers:read"
        ],
        "roles": [],
        "params": [
          "customerId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "customer-profile",
        "method": "GET",
        "path": "/v1/customers/:customerId/profile",
        "title": "Financial Profile",
        "desc": "Compute the financial profile for a customer from their ledger data.",
        "auth": true,
        "scopes": [
          "profile:read"
        ],
        "roles": [],
        "params": [
          "customerId"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Consents",
    "items": [
      {
        "id": "create-consent",
        "method": "POST",
        "path": "/v1/consents",
        "title": "Create Consent",
        "desc": "Create a consent record linking a customer to a recipient institution for a specific purpose and set of data scopes.",
        "auth": true,
        "scopes": [
          "consents:write"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "customer_id": "cus_xxx",
          "provider_institution_id": "inst_xxx",
          "purpose": "FRAUD_RISK_ASSESSMENT",
          "scopes": [
            "customers:read",
            "transactions:read"
          ],
          "data_categories": [
            "TRANSACTIONS",
            "BALANCE"
          ],
          "channel": "API",
          "policy_version": "policy-2026.09.1"
        }
      },
      {
        "id": "get-consent",
        "method": "GET",
        "path": "/v1/consents/:consentId",
        "title": "Get Consent",
        "desc": "Fetch a consent record by ID with its grants.",
        "auth": true,
        "scopes": [
          "consents:read"
        ],
        "roles": [],
        "params": [
          "consentId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "revoke-consent",
        "method": "POST",
        "path": "/v1/consents/:consentId/revoke",
        "title": "Revoke Consent",
        "desc": "Revoke an active consent. Optionally provide a reason.",
        "auth": true,
        "scopes": [
          "consents:write"
        ],
        "roles": [],
        "params": [
          "consentId"
        ],
        "query": [],
        "body": {
          "reason": "Customer requested data deletion"
        }
      }
    ]
  },
  {
    "group": "Transactions",
    "items": [
      {
        "id": "ingest-txn",
        "method": "POST",
        "path": "/v1/transactions",
        "title": "Ingest Transaction",
        "desc": "Ingest a normalised transaction. Idempotent on (provider, provider_event_id) — replaying the same event returns DUPLICATE.",
        "auth": true,
        "scopes": [
          "transactions:write"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "provider": "mock-bank",
          "provider_event_id": "mock-evt-0001",
          "account_id": "acc_xxx",
          "customer_id": "cus_xxx",
          "type": "SALARY",
          "direction": "INFLOW",
          "amount": "2500.00",
          "currency": "GHS",
          "occurred_at": "2026-09-01T09:00:00.000Z",
          "channel": "BANK_TRANSFER",
          "reference": "SALARY-SEPT",
          "counterparty": {
            "type": "ACCOUNT",
            "identifier": "ACC-EMP01",
            "name": "Employer Corp"
          }
        }
      },
      {
        "id": "get-txn",
        "method": "GET",
        "path": "/v1/transactions/:transactionId",
        "title": "Get Transaction",
        "desc": "Fetch a normalised transaction with its parties and ledger entries.",
        "auth": true,
        "scopes": [
          "transactions:read"
        ],
        "roles": [],
        "params": [
          "transactionId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "list-txn",
        "method": "GET",
        "path": "/v1/transactions",
        "title": "List Transactions",
        "desc": "List transactions for the tenant, filterable by customer or account, cursor-paginated.",
        "auth": true,
        "scopes": [
          "transactions:read"
        ],
        "roles": [],
        "params": [],
        "query": [
          "customer_id",
          "account_id",
          "limit"
        ],
        "body": null
      }
    ]
  },
  {
    "group": "Risk",
    "items": [
      {
        "id": "risk-evaluate",
        "method": "POST",
        "path": "/v1/risk/evaluate",
        "title": "Evaluate Risk",
        "desc": "Evaluate a risk event: computes features from ledger history, runs baseline rules, and returns a 0-1000 score, level (LOW/MEDIUM/HIGH/CRITICAL) and decision (APPROVE/REVIEW/BLOCK). Opens a case for HIGH or CRITICAL results.",
        "auth": true,
        "scopes": [
          "risk:evaluate"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "customer_id": "cus_xxx",
          "account_id": "acc_xxx",
          "amount": "8000.00",
          "currency": "GHS",
          "channel": "BANK_TRANSFER",
          "occurred_at": "2026-09-15T14:00:00.000Z"
        }
      },
      {
        "id": "get-evaluation",
        "method": "GET",
        "path": "/v1/risk/evaluations/:evaluationId",
        "title": "Get Evaluation",
        "desc": "Fetch a risk evaluation with its per-feature signals (reason, severity, contribution).",
        "auth": true,
        "scopes": [
          "risk:read"
        ],
        "roles": [],
        "params": [
          "evaluationId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "get-risk-event",
        "method": "GET",
        "path": "/v1/risk/events/:eventId",
        "title": "Get Risk Event",
        "desc": "Fetch a risk event with its evaluations and any auto-opened case.",
        "auth": true,
        "scopes": [
          "risk:read"
        ],
        "roles": [],
        "params": [
          "eventId"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Connections",
    "items": [
      {
        "id": "create-connection",
        "method": "POST",
        "path": "/v1/connections",
        "title": "Create Connection",
        "desc": "Connects a customer to an external provider (e.g. a mobile money network) to pull their data. Optionally bound to an ACTIVE consent authorising TRANSACTIONS/BALANCE. Picks up the next sync schedule.",
        "auth": true,
        "scopes": [
          "connections:write"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "customer_id": "cus_xxx",
          "provider_code": "momo-mtn",
          "provider_name": "MTN Mobile Money",
          "external_account_ref": "msisdn:+233xxxxxxxxx",
          "consent_id": "cns_xxx",
          "sync_interval_hours": 24
        }
      },
      {
        "id": "get-connection",
        "method": "GET",
        "path": "/v1/connections/:connectionId",
        "title": "Get Connection",
        "desc": "Fetch a single connection with its resolved financial institution.",
        "auth": true,
        "scopes": [
          "connections:read"
        ],
        "roles": [],
        "params": [
          "connectionId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "list-connections",
        "method": "GET",
        "path": "/v1/connections",
        "title": "List Connections",
        "desc": "List connections for the tenant, optionally filtered by customer.",
        "auth": true,
        "scopes": [
          "connections:read"
        ],
        "roles": [],
        "params": [],
        "query": [
          "customer_id"
        ],
        "body": null
      },
      {
        "id": "sync-connection",
        "method": "POST",
        "path": "/v1/connections/:connectionId/sync",
        "title": "Sync Connection",
        "desc": "Trigger a connector pull for this connection: increments sync_count, marks health SYNCED, schedules the next sync.",
        "auth": true,
        "scopes": [
          "connections:write"
        ],
        "roles": [],
        "params": [
          "connectionId"
        ],
        "query": [],
        "body": {
          "sync_interval_hours": 24
        }
      },
      {
        "id": "revoke-connection",
        "method": "POST",
        "path": "/v1/connections/:connectionId/revoke",
        "title": "Revoke Connection",
        "desc": "Deactivate a connection. Syncing a revoked connection is rejected.",
        "auth": true,
        "scopes": [
          "connections:write"
        ],
        "roles": [],
        "params": [
          "connectionId"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Passports",
    "items": [
      {
        "id": "build-passport",
        "method": "POST",
        "path": "/v1/passports/build",
        "title": "Build Passport",
        "desc": "Builds (or refreshes) the customer’s data passport: anonymised identifiers, account balances, financial profile and transaction counts, computed from the ledger. One live ACTIVE passport per customer.",
        "auth": true,
        "scopes": [
          "passports:write"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "customer_id": "cus_xxx"
        }
      },
      {
        "id": "get-passport",
        "method": "GET",
        "path": "/v1/passports/:passportId",
        "title": "Get Passport",
        "desc": "Fetch passport metadata (status, version, data categories, expiry).",
        "auth": true,
        "scopes": [
          "passports:read"
        ],
        "roles": [],
        "params": [
          "passportId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "create-share",
        "method": "POST",
        "path": "/v1/passports/:passportId/shares",
        "title": "Create Share",
        "desc": "Shares the passport with a recipient institution for a purpose. Gated by an ACTIVE consent from the customer to this institution for the same purpose. Returns a one-time access_token the recipient uses to consume it.",
        "auth": true,
        "scopes": [
          "passports:write"
        ],
        "roles": [],
        "params": [
          "passportId"
        ],
        "query": [],
        "body": {
          "recipient_institution_id": "inst_xxx",
          "purpose": "FINANCIAL_PROFILING",
          "scopes": [
            "profile:read"
          ],
          "data_categories": [
            "PROFILE",
            "TRANSACTIONS"
          ]
        }
      },
      {
        "id": "list-shares",
        "method": "GET",
        "path": "/v1/passports/:passportId/shares",
        "title": "List Shares",
        "desc": "List all shares of a passport with their access stats.",
        "auth": true,
        "scopes": [
          "passports:read"
        ],
        "roles": [],
        "params": [
          "passportId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "consume-share",
        "method": "POST",
        "path": "/v1/passports/shares/:shareId/consume",
        "title": "Consume Share",
        "desc": "The recipient consumes the share with its access_token. Returns the anonymised data subset and increments access_count.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "shareId"
        ],
        "query": [],
        "body": {
          "access_token": "hex token from create share"
        }
      },
      {
        "id": "revoke-share",
        "method": "POST",
        "path": "/v1/passports/shares/:shareId/revoke",
        "title": "Revoke Share",
        "desc": "Revoke a share: further consumption is rejected.",
        "auth": true,
        "scopes": [
          "passports:write"
        ],
        "roles": [],
        "params": [
          "shareId"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Cases",
    "items": [
      {
        "id": "list-cases",
        "method": "GET",
        "path": "/v1/cases",
        "title": "List Cases",
        "desc": "List risk cases for the tenant, filterable by status / severity / assignee.",
        "auth": true,
        "scopes": [
          "cases:read"
        ],
        "roles": [],
        "params": [],
        "query": [
          "status",
          "severity",
          "assignee_id",
          "limit"
        ],
        "body": null
      },
      {
        "id": "get-case",
        "method": "GET",
        "path": "/v1/cases/:caseId",
        "title": "Get Case",
        "desc": "Case detail: risk event, evidence, and the full action log.",
        "auth": true,
        "scopes": [
          "cases:read"
        ],
        "roles": [],
        "params": [
          "caseId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "assign-case",
        "method": "POST",
        "path": "/v1/cases/:caseId/assign",
        "title": "Assign Case",
        "desc": "Assign the case to an analyst id (recorded in the action log).",
        "auth": true,
        "scopes": [
          "cases:write"
        ],
        "roles": [],
        "params": [
          "caseId"
        ],
        "query": [],
        "body": {
          "assignee_id": "usr_xxx"
        }
      },
      {
        "id": "note-case",
        "method": "POST",
        "path": "/v1/cases/:caseId/notes",
        "title": "Add Case Note",
        "desc": "Append an analyst note to the case timeline.",
        "auth": true,
        "scopes": [
          "cases:write"
        ],
        "roles": [],
        "params": [
          "caseId"
        ],
        "query": [],
        "body": {
          "note": "Check with the customer on the source of funds."
        }
      },
      {
        "id": "resolve-case",
        "method": "POST",
        "path": "/v1/cases/:caseId/resolve",
        "title": "Resolve Case",
        "desc": "Resolve the case with a resolution summary and confirmed-fraud flag. Publishes case.resolved.",
        "auth": true,
        "scopes": [
          "cases:write"
        ],
        "roles": [],
        "params": [
          "caseId"
        ],
        "query": [],
        "body": {
          "resolution": "Verified salary credit",
          "outcome": "FALSE_POSITIVE",
          "confirmed_fraud": false
        }
      }
    ]
  },
  {
    "group": "Audit",
    "items": [
      {
        "id": "audit-list",
        "method": "GET",
        "path": "/v1/audit",
        "title": "Query Audit Trail",
        "desc": "Query the tenant audit trail, filterable by action / actor / resource.",
        "auth": true,
        "scopes": [
          "audit:read"
        ],
        "roles": [],
        "params": [],
        "query": [
          "action",
          "actor_id",
          "resource_type",
          "resource_id",
          "limit"
        ],
        "body": null
      },
      {
        "id": "audit-summary",
        "method": "GET",
        "path": "/v1/audit/summary",
        "title": "Audit Summary",
        "desc": "Counts of audit events grouped by action (optionally filtered by action_like).",
        "auth": true,
        "scopes": [
          "audit:read"
        ],
        "roles": [],
        "params": [],
        "query": [
          "action_like"
        ],
        "body": null
      }
    ]
  },
  {
    "group": "Partners",
    "items": [
      {
        "id": "list-partners",
        "method": "GET",
        "path": "/v1/partners",
        "title": "List Partner Apps",
        "desc": "List partner applications registered to this institution with their scopes.",
        "auth": true,
        "scopes": [
          "partners:read"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      },
      {
        "id": "create-partner",
        "method": "POST",
        "path": "/v1/partners",
        "title": "Create Partner App",
        "desc": "Register a partner application. Returns the client_id and a one-time client_secret for POST /v1/auth/client.",
        "auth": true,
        "scopes": [
          "partners:write"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "name": "Analytics App",
          "description": "Reads transaction + risk data",
          "type": "SERVER",
          "scopes": [
            "transactions:read",
            "risk:read"
          ]
        }
      },
      {
        "id": "rotate-partner-secret",
        "method": "POST",
        "path": "/v1/partners/:appId/rotate-secret",
        "title": "Rotate Client Secret",
        "desc": "Rotate a partner application client secret. The new plaintext secret is returned once.",
        "auth": true,
        "scopes": [
          "partners:write"
        ],
        "roles": [],
        "params": [
          "appId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "partner-status",
        "method": "POST",
        "path": "/v1/partners/:appId/status",
        "title": "Set Partner Status",
        "desc": "Enable or disable a partner application.",
        "auth": true,
        "scopes": [
          "partners:write"
        ],
        "roles": [],
        "params": [
          "appId"
        ],
        "query": [],
        "body": {
          "status": "DISABLED"
        }
      }
    ]
  },
  {
    "group": "Worker",
    "items": [
      {
        "id": "worker-status",
        "method": "GET",
        "path": "/v1/worker/status",
        "title": "Outbox Worker Status",
        "desc": "Live telemetry of the outbox dispatcher: poll cadence, totals, and the recent dispatch ring buffer.",
        "auth": true,
        "scopes": [],
        "roles": [
          "INTERNAL_ADMIN",
          "INSTITUTION_ADMIN"
        ],
        "params": [],
        "query": [],
        "body": null
      },
      {
        "id": "worker-dispatch",
        "method": "POST",
        "path": "/v1/worker/dispatch",
        "title": "Dispatch Now",
        "desc": "Trigger one dispatch cycle immediately. PENDING events are delivered to subscribers (claim is CAS-safe against concurrent workers).",
        "auth": true,
        "scopes": [],
        "roles": [
          "INTERNAL_ADMIN",
          "INSTITUTION_ADMIN"
        ],
        "params": [],
        "query": [],
        "body": {
          "batch_size": 100
        }
      },
      {
        "id": "worker-dlq-list",
        "method": "GET",
        "path": "/v1/worker/dead-letters",
        "title": "Dead-Letter Queue",
        "desc": "List quarantined events that failed delivery after all retries.",
        "auth": true,
        "scopes": [],
        "roles": [
          "INTERNAL_ADMIN",
          "INSTITUTION_ADMIN"
        ],
        "params": [],
        "query": [
          "status",
          "limit"
        ],
        "body": null
      },
      {
        "id": "worker-dlq-retry",
        "method": "POST",
        "path": "/v1/worker/dead-letters/:deadLetterId/retry",
        "title": "Retry Dead-Letter Event",
        "desc": "Re-enqueue a quarantined event to the outbox as PENDING.",
        "auth": true,
        "scopes": [],
        "roles": [
          "INTERNAL_ADMIN",
          "INSTITUTION_ADMIN"
        ],
        "params": [
          "deadLetterId"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Financial Institutions",
    "items": [
      {
        "id": "fi-list",
        "method": "GET",
        "path": "/v1/financial-institutions",
        "title": "List Institutions",
        "desc": "List registered provider institutions.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      },
      {
        "id": "fi-get",
        "method": "GET",
        "path": "/v1/financial-institutions/:institutionId",
        "title": "Get Institution",
        "desc": "Retrieve by id or code.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "institutionId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "fi-register",
        "method": "POST",
        "path": "/v1/financial-institutions",
        "title": "Register Institution",
        "desc": "Register or upsert a provider.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "name": "Test Provider",
          "code": "TPB",
          "base_url": "https://api.tpb.example"
        }
      }
    ]
  },
  {
    "group": "Devices",
    "items": [
      {
        "id": "devices-list",
        "method": "GET",
        "path": "/v1/devices",
        "title": "List Devices",
        "desc": "List devices with optional customer/status filters.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [
          "customer_id",
          "status"
        ],
        "body": null
      },
      {
        "id": "devices-get",
        "method": "GET",
        "path": "/v1/devices/:deviceId",
        "title": "Get Device",
        "desc": "Retrieve a single device by id.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "deviceId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "devices-register",
        "method": "POST",
        "path": "/v1/devices",
        "title": "Register Device",
        "desc": "Register a new device for a customer.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "customer_id": "",
          "token": "device-token-123",
          "type": "MOBILE",
          "os": "iOS"
        }
      },
      {
        "id": "devices-compromise",
        "method": "POST",
        "path": "/v1/devices/:deviceId/compromise",
        "title": "Compromise Device",
        "desc": "Mark device as COMPROMISED.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "deviceId"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Beneficiaries",
    "items": [
      {
        "id": "bene-list",
        "method": "GET",
        "path": "/v1/beneficiaries",
        "title": "List Beneficiaries",
        "desc": "List with optional customer/type/risk_mark filters.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [
          "customer_id",
          "risk_mark"
        ],
        "body": null
      },
      {
        "id": "bene-get",
        "method": "GET",
        "path": "/v1/beneficiaries/:beneficiaryId",
        "title": "Get Beneficiary",
        "desc": "Retrieve a single beneficiary by id.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "beneficiaryId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "bene-risk",
        "method": "PATCH",
        "path": "/v1/beneficiaries/:beneficiaryId",
        "title": "Update Risk Mark",
        "desc": "Set or clear risk_mark on a beneficiary.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "beneficiaryId"
        ],
        "query": [],
        "body": {
          "risk_mark": "SUSPICIOUS",
          "status": "BANNED"
        }
      }
    ]
  },
  {
    "group": "Network",
    "items": [
      {
        "id": "net-list",
        "method": "GET",
        "path": "/v1/network",
        "title": "List Relationships",
        "desc": "List network relationships for the tenant.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [
          "customer_id",
          "type"
        ],
        "body": null
      },
      {
        "id": "net-get",
        "method": "GET",
        "path": "/v1/network/:relationshipId",
        "title": "Get Relationship",
        "desc": "Retrieve a single network relationship.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "relationshipId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "net-ego",
        "method": "GET",
        "path": "/v1/network/customers/:customerId",
        "title": "Ego Graph",
        "desc": "Get the 1-hop neighborhood for a customer.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "customerId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "net-build",
        "method": "POST",
        "path": "/v1/network/build",
        "title": "Build Network",
        "desc": "Recompute CUSTOMER to COUNTERPARTY edges from beneficiaries.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": {}
      }
    ]
  },
  {
    "group": "Exchange Rates",
    "items": [
      {
        "id": "fx-list",
        "method": "GET",
        "path": "/v1/exchange-rates",
        "title": "List Rates",
        "desc": "List exchange rates with optional base/quote filters.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [
          "base_currency",
          "quote_currency"
        ],
        "body": null
      },
      {
        "id": "fx-get",
        "method": "GET",
        "path": "/v1/exchange-rates/:base/:quote",
        "title": "Get Current Rate",
        "desc": "Get the current rate for a currency pair.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "base",
          "quote"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "fx-set",
        "method": "POST",
        "path": "/v1/exchange-rates",
        "title": "Set Rate",
        "desc": "Create or update an exchange rate.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "base_currency": "USD",
          "quote_currency": "NGN",
          "rate": "1550.00",
          "rate_source": "MOCK"
        }
      }
    ]
  },
  {
    "group": "Source Events",
    "items": [
      {
        "id": "se-list",
        "method": "GET",
        "path": "/v1/source-events",
        "title": "List Source Events",
        "desc": "List ingestion events with optional provider/status filters.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [
          "status",
          "limit"
        ],
        "body": null
      },
      {
        "id": "se-get",
        "method": "GET",
        "path": "/v1/source-events/:eventId",
        "title": "Get Source Event",
        "desc": "Retrieve a single source event by id.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "eventId"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Registry: Rules",
    "items": [
      {
        "id": "rules-list",
        "method": "GET",
        "path": "/v1/rules",
        "title": "List Rules",
        "desc": "List all rules in the registry.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [
          "status",
          "category"
        ],
        "body": null
      },
      {
        "id": "rules-get",
        "method": "GET",
        "path": "/v1/rules/:code",
        "title": "Get Rule",
        "desc": "Retrieve a rule by code.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "code"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Registry: Rulesets",
    "items": [
      {
        "id": "rulesets-list",
        "method": "GET",
        "path": "/v1/rulesets",
        "title": "List Rulesets",
        "desc": "List all rulesets.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [
          "status"
        ],
        "body": null
      },
      {
        "id": "rulesets-get",
        "method": "GET",
        "path": "/v1/rulesets/:version",
        "title": "Get Ruleset",
        "desc": "Get a ruleset by version with resolved rule entries.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "version"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Registry: Policies",
    "items": [
      {
        "id": "policies-list",
        "method": "GET",
        "path": "/v1/policies",
        "title": "List Decision Policies",
        "desc": "List all decision policies.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [
          "status"
        ],
        "body": null
      },
      {
        "id": "policies-get",
        "method": "GET",
        "path": "/v1/policies/:version",
        "title": "Get Policy",
        "desc": "Get a decision policy by version.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "version"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Registry: Models",
    "items": [
      {
        "id": "models-list",
        "method": "GET",
        "path": "/v1/models",
        "title": "List Models",
        "desc": "List all risk models.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      },
      {
        "id": "models-get",
        "method": "GET",
        "path": "/v1/models/:modelId",
        "title": "Get Model",
        "desc": "Get a model by id or code.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "modelId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "models-versions",
        "method": "GET",
        "path": "/v1/models/:modelId/versions",
        "title": "Model Versions",
        "desc": "List versions for a model.",
        "auth": true,
        "scopes": [],
        "roles": [],
        "params": [
          "modelId"
        ],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Admin: Users",
    "items": [
      {
        "id": "users-list",
        "method": "GET",
        "path": "/v1/users",
        "title": "List Users",
        "desc": "List users in this institution.",
        "auth": true,
        "scopes": [
          "users:read"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      },
      {
        "id": "users-create",
        "method": "POST",
        "path": "/v1/users",
        "title": "Create User",
        "desc": "Create a user in this institution and assign a role.",
        "auth": true,
        "scopes": [
          "users:write"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": {
          "email": "analyst@example.com",
          "name": "Analyst One",
          "password": "StrongPass123!",
          "role_code": "ANALYST"
        }
      },
      {
        "id": "users-get",
        "method": "GET",
        "path": "/v1/users/:userId",
        "title": "Get User",
        "desc": "Get a user by id.",
        "auth": true,
        "scopes": [
          "users:read"
        ],
        "roles": [],
        "params": [
          "userId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "users-update",
        "method": "PATCH",
        "path": "/v1/users/:userId",
        "title": "Update User",
        "desc": "Update a user role or status.",
        "auth": true,
        "scopes": [
          "users:write"
        ],
        "roles": [],
        "params": [
          "userId"
        ],
        "query": [],
        "body": {
          "status": "ACTIVE",
          "role_code": "ANALYST"
        }
      }
    ]
  },
  {
    "group": "Admin: Institutions",
    "items": [
      {
        "id": "inst-me",
        "method": "GET",
        "path": "/v1/institutions/me",
        "title": "Get My Institution",
        "desc": "Get the institution bound to the current tenant context.",
        "auth": true,
        "scopes": [
          "institutions:read"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      },
      {
        "id": "inst-list",
        "method": "GET",
        "path": "/v1/institutions",
        "title": "List Institutions",
        "desc": "List all institutions (platform internal admin only).",
        "auth": true,
        "scopes": [],
        "roles": [
          "INTERNAL_ADMIN"
        ],
        "params": [],
        "query": [],
        "body": null
      },
      {
        "id": "inst-get",
        "method": "GET",
        "path": "/v1/institutions/:institutionId",
        "title": "Get Institution",
        "desc": "Get an institution by id (platform internal admin only).",
        "auth": true,
        "scopes": [],
        "roles": [
          "INTERNAL_ADMIN"
        ],
        "params": [
          "institutionId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "inst-update",
        "method": "PATCH",
        "path": "/v1/institutions/:institutionId",
        "title": "Update Institution",
        "desc": "Update institution profile fields.",
        "auth": true,
        "scopes": [
          "institutions:write"
        ],
        "roles": [],
        "params": [
          "institutionId"
        ],
        "query": [],
        "body": {
          "name": "Demo Institution",
          "country": "NG",
          "status": "ACTIVE"
        }
      }
    ]
  },
  {
    "group": "Admin: Roles & Scopes",
    "items": [
      {
        "id": "roles-list",
        "method": "GET",
        "path": "/v1/roles",
        "title": "List Roles",
        "desc": "List available roles and their scopes.",
        "auth": true,
        "scopes": [
          "roles:read"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      },
      {
        "id": "scopes-list",
        "method": "GET",
        "path": "/v1/scopes",
        "title": "List Scopes",
        "desc": "List all platform scopes.",
        "auth": true,
        "scopes": [
          "scopes:read"
        ],
        "roles": [],
        "params": [],
        "query": [],
        "body": null
      }
    ]
  },
  {
    "group": "Ledger",
    "items": [
      {
        "id": "ledger-list",
        "method": "GET",
        "path": "/v1/ledger",
        "title": "List Ledger Entries",
        "desc": "List immutable ledger entries for this institution.",
        "auth": true,
        "scopes": [
          "ledger:read"
        ],
        "roles": [],
        "params": [],
        "query": [
          "customer_id",
          "account_id",
          "category",
          "direction",
          "limit"
        ],
        "body": null
      },
      {
        "id": "ledger-get",
        "method": "GET",
        "path": "/v1/ledger/:entryId",
        "title": "Get Ledger Entry",
        "desc": "Get a single ledger entry by id.",
        "auth": true,
        "scopes": [
          "ledger:read"
        ],
        "roles": [],
        "params": [
          "entryId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "ledger-reverse",
        "method": "POST",
        "path": "/v1/ledger/:entryId/reverse",
        "title": "Reverse Ledger Entry",
        "desc": "Post a compensating entry (opposite direction) referencing the original. The original row is never mutated.",
        "auth": true,
        "scopes": [
          "ledger:write"
        ],
        "roles": [],
        "params": [
          "entryId"
        ],
        "query": [],
        "body": {
          "reason": "Chargeback"
        }
      }
    ]
  },
  {
    "group": "Accounts",
    "items": [
      {
        "id": "accounts-list",
        "method": "GET",
        "path": "/v1/accounts",
        "title": "List Accounts",
        "desc": "List accounts for this institution.",
        "auth": true,
        "scopes": [
          "accounts:read"
        ],
        "roles": [],
        "params": [],
        "query": [
          "customer_id",
          "status",
          "currency",
          "limit"
        ],
        "body": null
      },
      {
        "id": "accounts-get",
        "method": "GET",
        "path": "/v1/accounts/:accountId",
        "title": "Get Account",
        "desc": "Get an account by id.",
        "auth": true,
        "scopes": [
          "accounts:read"
        ],
        "roles": [],
        "params": [
          "accountId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "accounts-ledger",
        "method": "GET",
        "path": "/v1/accounts/:accountId/ledger",
        "title": "Account Ledger",
        "desc": "List ledger entries for an account.",
        "auth": true,
        "scopes": [
          "ledger:read"
        ],
        "roles": [],
        "params": [
          "accountId"
        ],
        "query": [],
        "body": null
      },
      {
        "id": "accounts-close",
        "method": "POST",
        "path": "/v1/accounts/:accountId/close",
        "title": "Close Account",
        "desc": "Close an account.",
        "auth": true,
        "scopes": [
          "accounts:write"
        ],
        "roles": [],
        "params": [
          "accountId"
        ],
        "query": [],
        "body": {
          "reason": "Customer request"
        }
      }
    ]
  }
];

export const ENDPOINT_COUNT = ENDPOINT_GROUPS.reduce((n,g)=>n+g.items.length,0);
