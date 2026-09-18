/**
 * Declarative catalogue of every TAMVA API surface the UI exposes.
 * A single generic list/detail engine renders all of these, so adding an
 * endpoint is a config change rather than a new page.
 */

export type FieldType = "text" | "email" | "password" | "number" | "select" | "textarea" | "json" | "datetime";

export interface FieldDef {
  name: string;
  label?: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  help?: string;
  defaultValue?: string;
}

export interface QueryDef {
  name: string;
  label?: string;
  placeholder?: string;
  options?: string[];
}

export interface ActionContext {
  id?: string;
  row?: Record<string, unknown>;
  values?: Record<string, unknown>;
}

export interface ActionDef {
  key: string;
  label: string;
  method: "POST" | "PATCH" | "DELETE";
  buildPath: (ctx: ActionContext) => string;
  fields?: FieldDef[];
  confirm?: string;
  danger?: boolean;
  successMessage?: string;
  /** Response contains a one-time secret worth surfacing verbatim. */
  reveal?: string;
}

export interface RelatedDef {
  label: string;
  url: (id: string) => string;
  listKey?: string;
  columns?: string[];
  rowActions?: ActionDef[];
}

export interface ResourceDef {
  key: string;
  label: string;
  singular: string;
  group: string;
  icon: string;
  description: string;
  scopes?: string[];
  roles?: string[];
  /** Some resources are lookup-only (no collection endpoint). */
  lookupOnly?: boolean;
  list?: {
    url: string;
    listKey?: string;
    query?: QueryDef[];
    columns?: string[];
  };
  listActions?: ActionDef[];
  detail?: {
    url: (id: string) => string;
    related?: RelatedDef[];
    /** Key to surface as the page heading. */
    titleKey?: string;
  };
  create?: { url: string; fields: FieldDef[]; successMessage?: string; reveal?: string };
  actions?: ActionDef[];
  rowActions?: ActionDef[];
  rowId?: (row: Record<string, unknown>) => string;
  /** Render response as a raw JSON tree instead of a table. */
  json?: boolean;
  /** Singleton collection endpoints (status/summary). */
  singleton?: boolean;
}

const STATUS = ["ACTIVE", "INACTIVE", "DISABLED"];
const RISK_MARKS = ["NONE", "WATCH", "SUSPICIOUS", "BANNED"];
const CASE_STATUS = ["OPEN", "INVESTIGATING", "ESCALATED", "RESOLVED", "CLOSED"];
const SEVERITY = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const DIRECTIONS = ["INFLOW", "OUTFLOW"];
const CONSENT_PURPOSES = [
  "FRAUD_RISK_ASSESSMENT",
  "CREDIT_RISK_ASSESSMENT",
  "ACCOUNT_VERIFICATION",
  "FINANCIAL_PROFILING",
];

export const RESOURCES: ResourceDef[] = [
  // ------------------------------ Overview ------------------------------
  {
    key: "health",
    label: "Health",
    singular: "probe",
    group: "Overview",
    icon: "activity",
    description: "Liveness probe — 200 when the API process is running.",
    json: true,
    singleton: true,
    list: { url: "/health" },
  },
  {
    key: "ready",
    label: "Readiness",
    singular: "probe",
    group: "Overview",
    icon: "heart-pulse",
    description: "Readiness probe — checks database connectivity (503 if down).",
    json: true,
    singleton: true,
    list: { url: "/ready" },
  },

  // ------------------------------ Monitor -------------------------------
  {
    key: "risk-events",
    label: "Risk Events",
    singular: "risk event",
    group: "Monitor",
    icon: "shield-alert",
    description: "Risk events scored by the baseline ruleset with their decisions.",
    scopes: ["risk:read"],
    list: {
      url: "/v1/risk/events",
      listKey: "events",
      columns: ["id", "customer_id", "status", "risk_level", "decision", "score", "created_at"],
    },
    detail: { url: (id) => `/v1/risk/events/${id}`, titleKey: "id" },
  },
  {
    key: "evaluations",
    label: "Evaluations",
    singular: "evaluation",
    group: "Monitor",
    icon: "gauge",
    description: "Feature-explained risk evaluations with per-signal contributions.",
    scopes: ["risk:read"],
    list: {
      url: "/v1/risk/evaluations",
      listKey: "evaluations",
      columns: ["id", "customer_id", "score", "risk_level", "decision", "model_version", "created_at"],
    },
    detail: { url: (id) => `/v1/risk/evaluations/${id}`, titleKey: "id" },
    create: {
      url: "/v1/risk/evaluate",
      successMessage: "Risk evaluation completed.",
      fields: [
        { name: "customer_id", label: "Customer ID", required: true, placeholder: "cus_..." },
        { name: "account_id", label: "Account ID", placeholder: "acc_..." },
        { name: "amount", label: "Amount", required: true, placeholder: "8000.00" },
        { name: "currency", label: "Currency", defaultValue: "GHS" },
        { name: "channel", label: "Channel", defaultValue: "BANK_TRANSFER" },
        { name: "occurred_at", label: "Occurred At", type: "datetime" },
      ],
    },
  },
  {
    key: "cases",
    label: "Cases",
    singular: "case",
    group: "Monitor",
    icon: "folder-search",
    description: "Investigations opened automatically or manually from risk events.",
    scopes: ["cases:read"],
    list: {
      url: "/v1/cases",
      listKey: "cases",
      query: [
        { name: "status", label: "Status", options: CASE_STATUS },
        { name: "severity", label: "Severity", options: SEVERITY },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["id", "status", "severity", "assignee_id", "risk_event_id", "created_at"],
    },
    detail: {
      url: (id) => `/v1/cases/${id}`,
      titleKey: "id",
      related: [],
    },
    actions: [
      {
        key: "assign",
        label: "Assign",
        method: "POST",
        buildPath: ({ id }) => `/v1/cases/${id}/assign`,
        successMessage: "Case assigned.",
        fields: [{ name: "assignee_id", label: "Assignee ID", required: true, placeholder: "usr_..." }],
      },
      {
        key: "note",
        label: "Add Note",
        method: "POST",
        buildPath: ({ id }) => `/v1/cases/${id}/notes`,
        successMessage: "Note added.",
        fields: [{ name: "note", label: "Note", type: "textarea", required: true }],
      },
      {
        key: "resolve",
        label: "Resolve",
        method: "POST",
        buildPath: ({ id }) => `/v1/cases/${id}/resolve`,
        successMessage: "Case resolved.",
        fields: [
          { name: "resolution", label: "Resolution", type: "textarea", required: true },
          {
            name: "outcome",
            label: "Outcome",
            type: "select",
            options: ["FALSE_POSITIVE", "CONFIRMED_FRAUD", "INCONCLUSIVE"],
          },
          { name: "confirmed_fraud", label: "Confirmed Fraud", type: "select", options: ["false", "true"], defaultValue: "false" },
        ],
      },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    singular: "customer",
    group: "Monitor",
    icon: "users",
    description: "Customer records with identifiers, accounts and financial profile.",
    scopes: ["customers:read"],
    list: {
      url: "/v1/customers",
      listKey: "customers",
      query: [{ name: "limit", label: "Limit", placeholder: "50" }],
      columns: ["id", "status", "created_at"],
    },
    detail: {
      url: (id) => `/v1/customers/${id}`,
      titleKey: "id",
      related: [
        {
          label: "Financial Profile",
          url: (id) => `/v1/customers/${id}/profile`,
        },
        {
          label: "Network (1-hop ego graph)",
          url: (id) => `/v1/network/customers/${id}`,
        },
      ],
    },
    create: {
      url: "/v1/customers",
      successMessage: "Customer created.",
      fields: [
        { name: "name", label: "Name", placeholder: "Kwame Asante" },
        {
          name: "identifiers",
          label: "Identifiers (JSON array)",
          type: "json",
          defaultValue: '[{"type":"PHONE","value":"+233501234567"}]',
        },
        {
          name: "accounts",
          label: "Accounts (JSON array)",
          type: "json",
          defaultValue:
            '[{"account_number":"1029384756","account_name":"Main Wallet","type":"WALLET","currency":"GHS","balance":4500}]',
        },
      ],
    },
  },
  {
    key: "network",
    label: "Network",
    singular: "relationship",
    group: "Monitor",
    icon: "share-2",
    description: "CUSTOMER ↔ COUNTERPARTY relationships derived from beneficiaries.",
    scopes: ["network:read"],
    list: {
      url: "/v1/network",
      listKey: "relationships",
      query: [
        { name: "customer_id", label: "Customer ID", placeholder: "cus_..." },
        { name: "type", label: "Type", placeholder: "TRANSACTIONAL" },
      ],
    },
    detail: { url: (id) => `/v1/network/${id}`, titleKey: "id" },
    listActions: [
      {
        key: "build",
        label: "Rebuild Network",
        method: "POST",
        buildPath: () => `/v1/network/build`,
        successMessage: "Network rebuild requested.",
      },
    ],
  },
  {
    key: "audit",
    label: "Audit Trail",
    singular: "audit event",
    group: "Monitor",
    icon: "scroll-text",
    description: "Immutable tenant audit trail, filterable by action, actor and resource.",
    scopes: ["audit:read"],
    list: {
      url: "/v1/audit",
      listKey: "events",
      query: [
        { name: "action", label: "Action", placeholder: "case.resolve" },
        { name: "actor_id", label: "Actor ID", placeholder: "usr_..." },
        { name: "resource_type", label: "Resource Type", placeholder: "case" },
        { name: "resource_id", label: "Resource ID", placeholder: "case_..." },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
    },
    json: true,
  },
  {
    key: "audit-summary",
    label: "Audit Summary",
    singular: "summary",
    group: "Monitor",
    icon: "pie-chart",
    description: "Counts of audit events grouped by action.",
    scopes: ["audit:read"],
    json: true,
    singleton: true,
    list: {
      url: "/v1/audit/summary",
      query: [{ name: "action_like", label: "Action contains", placeholder: "case" }],
    },
  },

  // ------------------------------ Identity ------------------------------
  {
    key: "passports",
    label: "Passports",
    singular: "passport",
    group: "Identity",
    icon: "id-card",
    description: "Portable, anonymised customer data passports and their shares.",
    scopes: ["passports:read"],
    lookupOnly: true,
    detail: {
      url: (id) => `/v1/passports/${id}`,
      titleKey: "id",
      related: [
        {
          label: "Shares",
          url: (id) => `/v1/passports/${id}/shares`,
          listKey: "shares",
          columns: ["id", "recipient_institution_id", "purpose", "status", "access_count", "created_at"],
          rowActions: [
            {
              key: "consume",
              label: "Consume",
              method: "POST",
              buildPath: ({ row }) => `/v1/passports/shares/${row?.id}/consume`,
              successMessage: "Share consumed.",
              fields: [{ name: "access_token", label: "Access Token", required: true }],
            },
            {
              key: "revoke",
              label: "Revoke",
              method: "POST",
              buildPath: ({ row }) => `/v1/passports/shares/${row?.id}/revoke`,
              danger: true,
              confirm: "Revoke this passport share?",
              successMessage: "Share revoked.",
            },
          ],
        },
      ],
    },
    create: {
      url: "/v1/passports/build",
      successMessage: "Passport built.",
      fields: [{ name: "customer_id", label: "Customer ID", required: true, placeholder: "cus_..." }],
    },
    actions: [
      {
        key: "share",
        label: "Create Share",
        method: "POST",
        buildPath: ({ id }) => `/v1/passports/${id}/shares`,
        successMessage: "Share created — copy the access token now.",
        reveal: "access_token",
        fields: [
          { name: "recipient_institution_id", label: "Recipient Institution ID", required: true, placeholder: "inst_..." },
          { name: "purpose", label: "Purpose", type: "select", options: CONSENT_PURPOSES, required: true },
          {
            name: "scopes",
            label: "Scopes (JSON array)",
            type: "json",
            defaultValue: '["profile:read"]',
          },
          {
            name: "data_categories",
            label: "Data Categories (JSON array)",
            type: "json",
            defaultValue: '["PROFILE","TRANSACTIONS"]',
          },
        ],
      },
    ],
  },
  {
    key: "consents",
    label: "Consents",
    singular: "consent",
    group: "Identity",
    icon: "file-signature",
    description: "Customer consent records authorising data access by purpose and category.",
    scopes: ["consents:read"],
    list: {
      url: "/v1/consents",
      listKey: "consents",
      columns: ["id", "customer_id", "provider_institution_id", "purpose", "status", "expires_at", "created_at"],
    },
    detail: { url: (id) => `/v1/consents/${id}`, titleKey: "id" },
    create: {
      url: "/v1/consents",
      successMessage: "Consent created.",
      fields: [
        { name: "customer_id", label: "Customer ID", required: true, placeholder: "cus_..." },
        { name: "provider_institution_id", label: "Provider Institution ID", required: true, placeholder: "inst_..." },
        { name: "purpose", label: "Purpose", type: "select", options: CONSENT_PURPOSES, required: true },
        { name: "scopes", label: "Scopes (JSON array)", type: "json", defaultValue: '["customers:read","transactions:read"]' },
        { name: "data_categories", label: "Data Categories (JSON array)", type: "json", defaultValue: '["TRANSACTIONS","BALANCE"]' },
        { name: "channel", label: "Channel", defaultValue: "API" },
        { name: "policy_version", label: "Policy Version", defaultValue: "policy-2026.09.1" },
      ],
    },
    actions: [
      {
        key: "revoke",
        label: "Revoke",
        method: "POST",
        buildPath: ({ id }) => `/v1/consents/${id}/revoke`,
        danger: true,
        confirm: "Revoke this consent?",
        successMessage: "Consent revoked.",
        fields: [{ name: "reason", label: "Reason", type: "textarea" }],
      },
    ],
  },
  {
    key: "connections",
    label: "Connections",
    singular: "connection",
    group: "Identity",
    icon: "cable",
    description: "External provider connections that pull customer data on a schedule.",
    scopes: ["connections:read"],
    list: {
      url: "/v1/connections",
      listKey: "connections",
      query: [{ name: "customer_id", label: "Customer ID", placeholder: "cus_..." }],
      columns: ["id", "customer_id", "provider_code", "status", "health", "sync_count", "next_sync_at"],
    },
    detail: { url: (id) => `/v1/connections/${id}`, titleKey: "id" },
    create: {
      url: "/v1/connections",
      successMessage: "Connection created.",
      fields: [
        { name: "customer_id", label: "Customer ID", required: true, placeholder: "cus_..." },
        { name: "provider_code", label: "Provider Code", required: true, placeholder: "momo-mtn" },
        { name: "provider_name", label: "Provider Name", placeholder: "MTN Mobile Money" },
        { name: "external_account_ref", label: "External Account Ref", placeholder: "msisdn:+233..." },
        { name: "consent_id", label: "Consent ID", placeholder: "cns_..." },
        { name: "sync_interval_hours", label: "Sync Interval (hours)", type: "number", defaultValue: "24" },
      ],
    },
    actions: [
      {
        key: "sync",
        label: "Sync Now",
        method: "POST",
        buildPath: ({ id }) => `/v1/connections/${id}/sync`,
        successMessage: "Sync triggered.",
        fields: [{ name: "sync_interval_hours", label: "Sync Interval (hours)", type: "number", defaultValue: "24" }],
      },
      {
        key: "revoke",
        label: "Revoke",
        method: "POST",
        buildPath: ({ id }) => `/v1/connections/${id}/revoke`,
        danger: true,
        confirm: "Deactivate this connection?",
        successMessage: "Connection revoked.",
      },
    ],
  },
  {
    key: "devices",
    label: "Devices",
    singular: "device",
    group: "Identity",
    icon: "smartphone",
    description: "Customer devices and their trust status.",
    scopes: ["devices:read"],
    list: {
      url: "/v1/devices",
      listKey: "devices",
      query: [
        { name: "customer_id", label: "Customer ID", placeholder: "cus_..." },
        { name: "status", label: "Status", placeholder: "ACTIVE" },
      ],
      columns: ["id", "customer_id", "type", "os", "status", "last_seen_at", "created_at"],
    },
    detail: { url: (id) => `/v1/devices/${id}`, titleKey: "id" },
    create: {
      url: "/v1/devices",
      successMessage: "Device registered.",
      fields: [
        { name: "customer_id", label: "Customer ID", required: true, placeholder: "cus_..." },
        { name: "token", label: "Device Token", required: true, placeholder: "device-token-123" },
        { name: "type", label: "Type", defaultValue: "MOBILE" },
        { name: "os", label: "OS", defaultValue: "iOS" },
      ],
    },
    actions: [
      {
        key: "compromise",
        label: "Mark Compromised",
        method: "POST",
        buildPath: ({ id }) => `/v1/devices/${id}/compromise`,
        danger: true,
        confirm: "Mark this device as COMPROMISED?",
        successMessage: "Device marked compromised.",
      },
    ],
  },
  {
    key: "beneficiaries",
    label: "Beneficiaries",
    singular: "beneficiary",
    group: "Identity",
    icon: "user-check",
    description: "Saved transfer beneficiaries with risk marks.",
    scopes: ["beneficiaries:read"],
    list: {
      url: "/v1/beneficiaries",
      listKey: "beneficiaries",
      query: [
        { name: "customer_id", label: "Customer ID", placeholder: "cus_..." },
        { name: "risk_mark", label: "Risk Mark", options: RISK_MARKS },
      ],
      columns: ["id", "customer_id", "name", "type", "status", "risk_mark", "created_at"],
    },
    detail: { url: (id) => `/v1/beneficiaries/${id}`, titleKey: "id" },
    actions: [
      {
        key: "risk",
        label: "Update Risk Mark",
        method: "PATCH",
        buildPath: ({ id }) => `/v1/beneficiaries/${id}`,
        successMessage: "Beneficiary updated.",
        fields: [
          { name: "risk_mark", label: "Risk Mark", type: "select", options: RISK_MARKS },
          { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE", "BANNED"] },
        ],
      },
    ],
  },

  // -------------------------------- Money -------------------------------
  {
    key: "transactions",
    label: "Transactions",
    singular: "transaction",
    group: "Money",
    icon: "arrow-left-right",
    description: "Normalised transactions ingested from providers.",
    scopes: ["transactions:read"],
    list: {
      url: "/v1/transactions",
      listKey: "transactions",
      query: [
        { name: "customer_id", label: "Customer ID", placeholder: "cus_..." },
        { name: "account_id", label: "Account ID", placeholder: "acc_..." },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["id", "type", "direction", "amount", "currency", "channel", "occurred_at"],
    },
    detail: { url: (id) => `/v1/transactions/${id}`, titleKey: "id" },
    create: {
      url: "/v1/transactions",
      successMessage: "Transaction ingested.",
      fields: [
        { name: "provider", label: "Provider", required: true, defaultValue: "mock-bank" },
        { name: "provider_event_id", label: "Provider Event ID", required: true, placeholder: "mock-evt-0001" },
        { name: "account_id", label: "Account ID", placeholder: "acc_..." },
        { name: "customer_id", label: "Customer ID", placeholder: "cus_..." },
        { name: "type", label: "Type", defaultValue: "SALARY" },
        { name: "direction", label: "Direction", type: "select", options: DIRECTIONS, required: true },
        { name: "amount", label: "Amount", required: true, placeholder: "2500.00" },
        { name: "currency", label: "Currency", defaultValue: "GHS" },
        { name: "occurred_at", label: "Occurred At", type: "datetime" },
        { name: "channel", label: "Channel", defaultValue: "BANK_TRANSFER" },
        { name: "reference", label: "Reference", placeholder: "SALARY-SEPT" },
        {
          name: "counterparty",
          label: "Counterparty (JSON)",
          type: "json",
          defaultValue: '{"type":"ACCOUNT","identifier":"ACC-EMP01","name":"Employer Corp"}',
        },
      ],
    },
  },
  {
    key: "ledger",
    label: "Ledger",
    singular: "ledger entry",
    group: "Money",
    icon: "book-open",
    description: "Immutable double-entry ledger entries — must never be mutated.",
    scopes: ["ledger:read"],
    list: {
      url: "/v1/ledger",
      listKey: "entries",
      query: [
        { name: "customer_id", label: "Customer ID", placeholder: "cus_..." },
        { name: "account_id", label: "Account ID", placeholder: "acc_..." },
        { name: "category", label: "Category", placeholder: "TRANSFER" },
        { name: "direction", label: "Direction", options: DIRECTIONS },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["id", "transaction_id", "account_id", "category", "direction", "amount", "currency", "method", "created_at"],
    },
    detail: { url: (id) => `/v1/ledger/${id}`, titleKey: "id" },
    rowActions: [
      {
        key: "reverse",
        label: "Reverse",
        method: "POST",
        buildPath: ({ row }) => `/v1/ledger/${row?.id}/reverse`,
        successMessage: "Reversal entry posted.",
        fields: [{ name: "reason", label: "Reason", type: "textarea" }],
      },
    ],
    actions: [
      {
        key: "reverse",
        label: "Reverse Entry",
        method: "POST",
        buildPath: ({ id }) => `/v1/ledger/${id}/reverse`,
        successMessage: "Reversal entry posted.",
        fields: [{ name: "reason", label: "Reason", type: "textarea" }],
      },
    ],
  },
  {
    key: "accounts",
    label: "Accounts",
    singular: "account",
    group: "Money",
    icon: "wallet",
    description: "Customer accounts with balances and per-account ledger.",
    scopes: ["accounts:read"],
    list: {
      url: "/v1/accounts",
      listKey: "accounts",
      query: [
        { name: "customer_id", label: "Customer ID", placeholder: "cus_..." },
        { name: "status", label: "Status", options: ["ACTIVE", "FROZEN", "CLOSED"] },
        { name: "currency", label: "Currency", placeholder: "GHS" },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["id", "customer_id", "type", "currency", "status", "balance", "available_balance", "created_at"],
    },
    detail: {
      url: (id) => `/v1/accounts/${id}`,
      titleKey: "id",
      related: [{ label: "Account Ledger", url: (id) => `/v1/accounts/${id}/ledger`, listKey: "entries" }],
    },
    rowActions: [
      {
        key: "close",
        label: "Close",
        method: "POST",
        buildPath: ({ row }) => `/v1/accounts/${row?.id}/close`,
        danger: true,
        confirm: "Close this account?",
        successMessage: "Account closed.",
        fields: [{ name: "reason", label: "Reason", type: "textarea" }],
      },
    ],
    actions: [
      {
        key: "close",
        label: "Close Account",
        method: "POST",
        buildPath: ({ id }) => `/v1/accounts/${id}/close`,
        danger: true,
        confirm: "Close this account?",
        successMessage: "Account closed.",
        fields: [{ name: "reason", label: "Reason", type: "textarea" }],
      },
    ],
  },
  {
    key: "exchange-rates",
    label: "Exchange Rates",
    singular: "rate",
    group: "Money",
    icon: "repeat",
    description: "Currency pairs and their current rates.",
    scopes: ["exchange-rates:read"],
    list: {
      url: "/v1/exchange-rates",
      listKey: "rates",
      query: [
        { name: "base_currency", label: "Base", placeholder: "USD" },
        { name: "quote_currency", label: "Quote", placeholder: "NGN" },
      ],
      columns: ["base_currency", "quote_currency", "rate", "rate_source", "updated_at"],
    },
    rowId: (row) => `${row.base_currency}-${row.quote_currency}`,
    detail: { url: (id) => `/v1/exchange-rates/${id.replace("-", "/")}`, titleKey: "base_currency" },
    create: {
      url: "/v1/exchange-rates",
      successMessage: "Exchange rate saved.",
      fields: [
        { name: "base_currency", label: "Base Currency", required: true, placeholder: "USD" },
        { name: "quote_currency", label: "Quote Currency", required: true, placeholder: "NGN" },
        { name: "rate", label: "Rate", required: true, placeholder: "1550.00" },
        { name: "rate_source", label: "Source", defaultValue: "MOCK" },
      ],
    },
  },

  // --------------------------------- Data --------------------------------
  {
    key: "source-events",
    label: "Source Events",
    singular: "source event",
    group: "Data",
    icon: "inbox",
    description: "Raw ingestion events and their processing status.",
    scopes: ["source-events:read"],
    list: {
      url: "/v1/source-events",
      listKey: "events",
      query: [
        { name: "status", label: "Status", placeholder: "COMPLETED" },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["id", "provider", "event_type", "status", "created_at"],
    },
    detail: { url: (id) => `/v1/source-events/${id}`, titleKey: "id" },
  },
  {
    key: "financial-institutions",
    label: "Institutions",
    singular: "institution",
    group: "Data",
    icon: "landmark",
    description: "Registered provider institutions available to connections.",
    scopes: ["financial-institutions:read"],
    list: { url: "/v1/financial-institutions", listKey: "institutions", columns: ["id", "name", "code", "status", "base_url"] },
    detail: { url: (id) => `/v1/financial-institutions/${id}`, titleKey: "name" },
    create: {
      url: "/v1/financial-institutions",
      successMessage: "Institution registered.",
      fields: [
        { name: "name", label: "Name", required: true, placeholder: "Test Provider" },
        { name: "code", label: "Code", required: true, placeholder: "TPB" },
        { name: "base_url", label: "Base URL", placeholder: "https://api.tpb.example" },
      ],
    },
  },

  // ------------------------------- Registry ------------------------------
  {
    key: "rules",
    label: "Rules",
    singular: "rule",
    group: "Registry",
    icon: "list-checks",
    description: "Baseline risk rules in the registry.",
    scopes: ["registry:read"],
    list: {
      url: "/v1/rules",
      listKey: "rules",
      query: [
        { name: "status", label: "Status", options: STATUS },
        { name: "category", label: "Category", placeholder: "" },
      ],
    },
    rowId: (row) => String(row.code),
    detail: { url: (id) => `/v1/rules/${id}`, titleKey: "code" },
  },
  {
    key: "rulesets",
    label: "Rulesets",
    singular: "ruleset",
    group: "Registry",
    icon: "layers",
    description: "Versioned rulesets with resolved rule entries.",
    scopes: ["registry:read"],
    list: { url: "/v1/rulesets", listKey: "rulesets", query: [{ name: "status", label: "Status", options: STATUS }] },
    rowId: (row) => String(row.version),
    detail: { url: (id) => `/v1/rulesets/${id}`, titleKey: "version" },
  },
  {
    key: "policies",
    label: "Policies",
    singular: "policy",
    group: "Registry",
    icon: "scale",
    description: "Decision policies mapping scores to decisions.",
    scopes: ["registry:read"],
    list: { url: "/v1/policies", listKey: "policies", query: [{ name: "status", label: "Status", options: STATUS }] },
    rowId: (row) => String(row.version),
    detail: { url: (id) => `/v1/policies/${id}`, titleKey: "version" },
  },
  {
    key: "models",
    label: "Models",
    singular: "model",
    group: "Registry",
    icon: "brain",
    description: "Risk models and their versions.",
    scopes: ["registry:read"],
    list: { url: "/v1/models", listKey: "models" },
    detail: {
      url: (id) => `/v1/models/${id}`,
      titleKey: "code",
      related: [{ label: "Versions", url: (id) => `/v1/models/${id}/versions`, listKey: "versions" }],
    },
  },

  // ------------------------------- Platform ------------------------------
  {
    key: "partners",
    label: "Partner Apps",
    singular: "partner app",
    group: "Platform",
    icon: "plug-zap",
    description: "Partner applications, their scopes and client secrets.",
    scopes: ["partners:read"],
    list: {
      url: "/v1/partners",
      listKey: "apps",
      columns: ["id", "name", "type", "status", "client_id", "created_at"],
    },
    create: {
      url: "/v1/partners",
      successMessage: "Partner app created — copy the client secret now.",
      reveal: "client_secret",
      fields: [
        { name: "name", label: "Name", required: true, placeholder: "Analytics App" },
        { name: "description", label: "Description", placeholder: "Reads transaction + risk data" },
        { name: "type", label: "Type", type: "select", options: ["SERVER", "MOBILE", "BROWSER"], defaultValue: "SERVER" },
        { name: "scopes", label: "Scopes (JSON array)", type: "json", defaultValue: '["transactions:read","risk:read"]' },
      ],
    },
    rowActions: [
      {
        key: "rotate",
        label: "Rotate Secret",
        method: "POST",
        buildPath: ({ row }) => `/v1/partners/${row?.id}/rotate-secret`,
        confirm: "Rotate the client secret? The old one stops working immediately.",
        successMessage: "Client secret rotated — copy the new secret now.",
        reveal: "client_secret",
      },
      {
        key: "status",
        label: "Set Status",
        method: "POST",
        buildPath: ({ row }) => `/v1/partners/${row?.id}/status`,
        successMessage: "Partner status updated.",
        fields: [{ name: "status", label: "Status", type: "select", options: ["ACTIVE", "DISABLED"], required: true }],
      },
    ],
  },
  {
    key: "worker-status",
    label: "Worker",
    singular: "worker",
    group: "Platform",
    icon: "cog",
    roles: ["INTERNAL_ADMIN", "INSTITUTION_ADMIN"],
    description: "Outbox dispatcher telemetry and manual dispatch.",
    json: true,
    singleton: true,
    list: { url: "/v1/worker/status" },
    listActions: [
      {
        key: "dispatch",
        label: "Dispatch Now",
        method: "POST",
        buildPath: () => `/v1/worker/dispatch`,
        successMessage: "Dispatch cycle triggered.",
        fields: [{ name: "batch_size", label: "Batch Size", type: "number", defaultValue: "100" }],
      },
    ],
  },
  {
    key: "dead-letters",
    label: "Dead Letters",
    singular: "dead letter",
    group: "Platform",
    icon: "mail-warning",
    roles: ["INTERNAL_ADMIN", "INSTITUTION_ADMIN"],
    description: "Events quarantined after exhausting delivery retries.",
    list: {
      url: "/v1/worker/dead-letters",
      listKey: "dead_letters",
      query: [
        { name: "status", label: "Status", placeholder: "QUARANTINED" },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
    },
    rowActions: [
      {
        key: "retry",
        label: "Retry",
        method: "POST",
        buildPath: ({ row }) => `/v1/worker/dead-letters/${row?.id}/retry`,
        successMessage: "Dead-letter event re-enqueued.",
      },
    ],
  },

  // ------------------------------- Admin --------------------------------
  {
    key: "admin-summary",
    label: "Platform Summary",
    singular: "summary",
    group: "Admin",
    icon: "shield-check",
    roles: ["INTERNAL_ADMIN"],
    description: "Platform-wide counters: institutions, users, outbox, dead letters and risk.",
    json: true,
    singleton: true,
    list: { url: "/v1/admin/summary" },
  },
  {
    key: "admin-institutions",
    label: "All Institutions",
    singular: "institution",
    group: "Admin",
    icon: "buildings",
    roles: ["INTERNAL_ADMIN"],
    description: "Every institution on the platform, with user counts.",
    list: {
      url: "/v1/admin/institutions",
      listKey: "institutions",
      query: [
        { name: "status", label: "Status", options: STATUS },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["id", "name", "slug", "type", "country", "status", "user_count", "created_at"],
    },
    rowId: (row) => String(row.id),
    actions: [
      {
        key: "update",
        label: "Update Institution",
        method: "PATCH",
        buildPath: ({ id }) => `/v1/admin/institutions/${id}`,
        successMessage: "Institution updated.",
        fields: [
          { name: "name", label: "Name" },
          { name: "type", label: "Type", placeholder: "PARTNER" },
          { name: "country", label: "Country", placeholder: "GH" },
          { name: "status", label: "Status", type: "select", options: ["ACTIVE", "DISABLED", "SUSPENDED"] },
        ],
      },
    ],
    rowActions: [
      {
        key: "create-user",
        label: "Create User",
        method: "POST",
        buildPath: ({ row }) => `/v1/admin/institutions/${row?.id}/users`,
        successMessage: "User created.",
        fields: [
          { name: "email", label: "Email", type: "email", required: true },
          { name: "name", label: "Name", required: true },
          { name: "password", label: "Password", type: "password", required: true },
          {
            name: "role_code",
            label: "Role",
            type: "select",
            options: ["INSTITUTION_ADMIN", "ANALYST", "VIEWER", "AUDITOR"],
            defaultValue: "ANALYST",
          },
        ],
      },
      {
        key: "update",
        label: "Update",
        method: "PATCH",
        buildPath: ({ row }) => `/v1/admin/institutions/${row?.id}`,
        successMessage: "Institution updated.",
        fields: [
          { name: "name", label: "Name" },
          { name: "country", label: "Country", placeholder: "GH" },
          { name: "status", label: "Status", type: "select", options: ["ACTIVE", "DISABLED", "SUSPENDED"] },
        ],
      },
    ],
  },
  {
    key: "admin-users",
    label: "All Users",
    singular: "user",
    group: "Admin",
    icon: "user-cog",
    roles: ["INTERNAL_ADMIN"],
    description: "Every platform user, cross-institution.",
    list: {
      url: "/v1/admin/users",
      listKey: "users",
      query: [
        { name: "institution_id", label: "Institution ID", placeholder: "inst_..." },
        { name: "status", label: "Status", options: ["ACTIVE", "DISABLED"] },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["id", "email", "name", "role_code", "status", "institution_id", "created_at"],
    },
    rowId: (row) => String(row.id),
    rowActions: [
      {
        key: "update",
        label: "Update User",
        method: "PATCH",
        buildPath: ({ row }) => `/v1/admin/users/${row?.id}`,
        successMessage: "User updated.",
        fields: [
          { name: "name", label: "Name" },
          { name: "status", label: "Status", type: "select", options: ["ACTIVE", "DISABLED"] },
          {
            name: "role_code",
            label: "Role",
            type: "select",
            options: ["INSTITUTION_ADMIN", "ANALYST", "VIEWER", "AUDITOR"],
          },
          { name: "password", label: "Password", type: "password", placeholder: "Only set to rotate" },
        ],
      },
    ],
  },
  {
    key: "admin-audit",
    label: "Platform Audit",
    singular: "audit event",
    group: "Admin",
    icon: "scroll-text",
    roles: ["INTERNAL_ADMIN"],
    description: "Cross-institution audit trail.",
    list: {
      url: "/v1/admin/audit",
      listKey: "events",
      query: [
        { name: "action", label: "Action", placeholder: "admin.user.update" },
        { name: "institution_id", label: "Institution ID", placeholder: "inst_..." },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["occurred_at", "actor_id", "action", "resource_type", "resource_id", "success", "ip_address"],
    },
    json: true,
  },
  {
    key: "admin-outbox",
    label: "Platform Outbox",
    singular: "outbox event",
    group: "Admin",
    icon: "inbox",
    roles: ["INTERNAL_ADMIN"],
    description: "Outbox events across all institutions.",
    list: {
      url: "/v1/admin/outbox",
      listKey: "events",
      query: [
        { name: "status", label: "Status", options: ["PENDING", "PUBLISHED", "FAILED"] },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["created_at", "event_type", "producer", "status", "retry_count", "locked_at", "last_error"],
    },
  },
  {
    key: "admin-outbox-dead",
    label: "Platform Dead Letters",
    singular: "dead letter",
    group: "Admin",
    icon: "mail-warning",
    roles: ["INTERNAL_ADMIN"],
    description: "Quarantined events across all institutions.",
    list: {
      url: "/v1/admin/outbox/dead",
      listKey: "events",
      query: [
        { name: "status", label: "Status", options: ["QUARANTINED", "REQUEUED"] },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["failed_at", "event_type", "status", "error"],
    },
    rowActions: [
      {
        key: "redispatch",
        label: "Redispatch",
        method: "POST",
        buildPath: ({ row }) => `/v1/admin/outbox/dead/${row?.id}/redispatch`,
        danger: true,
        confirm: "Requeue this quarantined event for dispatch?",
        successMessage: "Event requeued.",
      },
    ],
  },
  {
    key: "admin-risk",
    label: "Platform Risk",
    singular: "evaluation",
    group: "Admin",
    icon: "gauge",
    roles: ["INTERNAL_ADMIN"],
    description: "Risk evaluations across all institutions.",
    list: {
      url: "/v1/admin/risk",
      listKey: "evaluations",
      query: [
        { name: "level", label: "Level", options: SEVERITY },
        { name: "limit", label: "Limit", placeholder: "50" },
      ],
      columns: ["decisioned_at", "institution_id", "customer_id", "risk_score", "risk_level", "decision", "reason_codes"],
    },
    json: true,
  },

  // -------------------------------- System -------------------------------
  {
    key: "users",
    label: "Users",
    singular: "user",
    group: "System",
    icon: "user-cog",
    description: "Users in this institution and their roles.",
    scopes: ["users:read"],
    list: {
      url: "/v1/users",
      listKey: "users",
      columns: ["id", "email", "name", "role_code", "status", "created_at"],
    },
    detail: { url: (id) => `/v1/users/${id}`, titleKey: "email" },
    create: {
      url: "/v1/users",
      successMessage: "User created.",
      fields: [
        { name: "email", label: "Email", type: "email", required: true, placeholder: "analyst@example.com" },
        { name: "name", label: "Name", required: true, placeholder: "Analyst One" },
        { name: "password", label: "Password", type: "password", required: true, placeholder: "StrongPass123!" },
        {
          name: "role_code",
          label: "Role",
          type: "select",
          options: ["INTERNAL_ADMIN", "INSTITUTION_ADMIN", "ANALYST", "VIEWER"],
          required: true,
        },
      ],
    },
    actions: [
      {
        key: "update",
        label: "Update User",
        method: "PATCH",
        buildPath: ({ id }) => `/v1/users/${id}`,
        successMessage: "User updated.",
        fields: [
          { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE", "SUSPENDED"] },
          {
            name: "role_code",
            label: "Role",
            type: "select",
            options: ["INTERNAL_ADMIN", "INSTITUTION_ADMIN", "ANALYST", "VIEWER"],
          },
        ],
      },
    ],
    rowActions: [
      {
        key: "update",
        label: "Edit",
        method: "PATCH",
        buildPath: ({ row }) => `/v1/users/${row?.id}`,
        successMessage: "User updated.",
        fields: [
          { name: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE", "SUSPENDED"] },
          {
            name: "role_code",
            label: "Role",
            type: "select",
            options: ["INTERNAL_ADMIN", "INSTITUTION_ADMIN", "ANALYST", "VIEWER"],
          },
        ],
      },
    ],
  },
  {
    key: "institution-me",
    label: "My Institution",
    singular: "institution",
    group: "System",
    icon: "building-2",
    scopes: ["institutions:read"],
    description: "The institution bound to the current tenant context.",
    json: true,
    singleton: true,
    list: { url: "/v1/institutions/me" },
  },
  {
    key: "institutions",
    label: "Institutions",
    singular: "institution",
    group: "System",
    icon: "building",
    roles: ["INTERNAL_ADMIN"],
    description: "All institutions on the platform (internal admin only).",
    list: {
      url: "/v1/institutions",
      listKey: "institutions",
      columns: ["id", "name", "slug", "country", "status", "created_at"],
    },
    detail: { url: (id) => `/v1/institutions/${id}`, titleKey: "name" },
    actions: [
      {
        key: "update",
        label: "Update Institution",
        method: "PATCH",
        buildPath: ({ id }) => `/v1/institutions/${id}`,
        successMessage: "Institution updated.",
        fields: [
          { name: "name", label: "Name" },
          { name: "country", label: "Country", placeholder: "NG" },
          { name: "status", label: "Status", type: "select", options: STATUS },
        ],
      },
    ],
  },
  {
    key: "roles",
    label: "Roles",
    singular: "role",
    group: "System",
    icon: "shield",
    description: "Available roles and the scopes they grant.",
    scopes: ["roles:read"],
    json: true,
    list: { url: "/v1/roles", listKey: "roles" },
  },
  {
    key: "scopes",
    label: "Scopes",
    singular: "scope",
    group: "System",
    icon: "key-round",
    scopes: ["scopes:read"],
    description: "All platform scopes.",
    json: true,
    list: { url: "/v1/scopes", listKey: "scopes" },
  },
];

export const RESOURCE_GROUPS = [
  "Overview",
  "Monitor",
  "Identity",
  "Money",
  "Data",
  "Registry",
  "Platform",
  "Admin",
  "System",
] as const;

export function resourceByKey(key: string): ResourceDef | undefined {
  return RESOURCES.find((r) => r.key === key);
}
