# API Specification
## Mailing List Manager SaaS Platform

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Base URL:** `https://api.mailinglistmanager.com/v1`

---

## Table of Contents
1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Organizations](#organizations-endpoints)
   - [Users](#users-endpoints)
   - [Lists](#lists-endpoints)
   - [Contacts](#contacts-endpoints)
   - [Imports](#imports-endpoints)
   - [Exports](#exports-endpoints)
   - [Deduplication](#deduplication-endpoints)
   - [Tags](#tags-endpoints)
   - [Segments](#segments-endpoints)
   - [Validation](#validation-endpoints)
   - [Skip Trace](#skip-trace-endpoints)
   - [Audit](#audit-endpoints)

---

## API Overview

### Design Principles

- **RESTful**: Standard HTTP methods (GET, POST, PATCH, DELETE)
- **JSON**: All requests and responses use JSON
- **Stateless**: No server-side sessions (JWT-based auth)
- **Versioned**: API version in URL path (`/v1`)
- **Predictable**: Consistent naming and structure
- **Documented**: OpenAPI 3.0 specification available

### HTTP Methods

| Method | Usage | Idempotent |
|--------|-------|------------|
| GET | Retrieve resources | Yes |
| POST | Create resources or actions | No |
| PATCH | Partial update | No |
| PUT | Full replacement (rare) | Yes |
| DELETE | Remove resources | Yes |

### Content Types

- Request: `Content-Type: application/json`
- Response: `Content-Type: application/json`

---

## Authentication

### JWT Token-Based Authentication

**Flow:**
1. User logs in with email/password or OAuth
2. Server returns `accessToken` (short-lived: 15min) and `refreshToken` (long-lived: 30d)
3. Client includes access token in Authorization header: `Authorization: Bearer <token>`
4. When access token expires, use refresh token to get new access token

### Access Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "platform_role": "none",
  "orgs": [
    {
      "org_id": "org-uuid",
      "org_role": "account_owner",
      "permissions": ["contacts:read", "contacts:write", ...]
    }
  ],
  "iat": 1699718400,
  "exp": 1699719300
}
```

### Headers Required

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## Common Patterns

### Pagination

**Request:**
```http
GET /orgs/{org_id}/contacts?page=1&limit=50
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25,
    "hasMore": true
  }
}
```

### Filtering

**Query Parameters:**
```http
GET /orgs/{org_id}/contacts?filter[email][contains]=@gmail.com&filter[state][eq]=TX
```

**Complex Filters (via POST):**
```http
POST /orgs/{org_id}/contacts/search
{
  "filter": {
    "type": "and",
    "conditions": [
      { "field": "state", "operator": "eq", "value": "TX" },
      { "field": "tags", "operator": "contains", "value": "VIP" }
    ]
  }
}
```

### Sorting

```http
GET /orgs/{org_id}/contacts?sort=-created_at,last_name
```
- Prefix with `-` for descending
- Comma-separated for multiple fields

### Field Selection

```http
GET /orgs/{org_id}/contacts?fields=id,email,first_name,last_name
```

---

## Error Handling

### Error Response Structure

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "email",
      "constraint": "Must be valid email format"
    },
    "request_id": "req-abc123"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 202 | Accepted | Async job started |
| 204 | No Content | Successful DELETE with no response |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (duplicate) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary outage |

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `AUTHENTICATION_REQUIRED` | 401 | No auth token provided |
| `INVALID_TOKEN` | 401 | Token expired or invalid |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permission |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource doesn't exist |
| `DUPLICATE_RESOURCE` | 409 | Resource already exists |
| `QUOTA_EXCEEDED` | 403 | Plan quota limit reached |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

### Limits by Plan

| Plan | Requests/Min | Burst |
|------|--------------|-------|
| Free | 100 | 120 |
| Starter | 500 | 600 |
| Pro | 2,000 | 2,500 |
| Enterprise | 10,000 | 12,000 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 2000
X-RateLimit-Remaining: 1543
X-RateLimit-Reset: 1699718460
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "retry_after": 30
  }
}
```

---

## Endpoints

### Authentication Endpoints

#### POST /auth/register
**Description:** Register new user account

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd",
  "first_name": "John",
  "last_name": "Doe",
  "org_name": "Acme Inc"
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "created_at": "2025-11-11T10:00:00Z"
    },
    "org": {
      "id": "org-uuid",
      "name": "Acme Inc",
      "slug": "acme-inc",
      "plan": "free"
    },
    "access_token": "eyJhbGc...",
    "refresh_token": "refresh-token-abc123",
    "expires_in": 900
  }
}
```

---

#### POST /auth/login
**Description:** Login with email and password

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "orgs": [
      {
        "id": "org-uuid",
        "name": "Acme Inc",
        "role": "account_owner"
      }
    ],
    "access_token": "eyJhbGc...",
    "refresh_token": "refresh-token-abc123",
    "expires_in": 900
  }
}
```

**Errors:**
- `401`: Invalid credentials
- `403`: Account suspended

---

#### POST /auth/refresh
**Description:** Refresh access token

**Request:**
```json
{
  "refresh_token": "refresh-token-abc123"
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "refresh-token-def456",
    "expires_in": 900
  }
}
```

---

#### POST /auth/logout
**Description:** Logout and revoke refresh token

**Request:**
```json
{
  "refresh_token": "refresh-token-abc123"
}
```

**Response:** `204 No Content`

---

#### POST /auth/forgot-password
**Description:** Request password reset email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset email sent if account exists"
}
```

---

#### POST /auth/reset-password
**Description:** Reset password with token

**Request:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecureP@ssw0rd"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successful"
}
```

---

### Organizations Endpoints

#### GET /orgs
**Description:** List user's organizations

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "org-uuid",
      "name": "Acme Inc",
      "slug": "acme-inc",
      "plan": "pro",
      "role": "account_owner",
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

#### GET /orgs/{org_id}
**Description:** Get organization details

**Response:** `200 OK`
```json
{
  "data": {
    "id": "org-uuid",
    "name": "Acme Inc",
    "slug": "acme-inc",
    "plan": "pro",
    "status": "active",
    "settings": {
      "default_country": "US",
      "timezone": "America/New_York"
    },
    "usage": {
      "contacts": 12450,
      "contacts_limit": 50000,
      "lists": 8,
      "team_members": 3,
      "team_members_limit": 5
    },
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

---

#### PATCH /orgs/{org_id}
**Description:** Update organization settings

**Request:**
```json
{
  "name": "Acme Corporation",
  "settings": {
    "default_country": "CA",
    "formatting_rules": {
      "company_designator_punctuation": true
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "data": {
    "id": "org-uuid",
    "name": "Acme Corporation",
    "settings": { ... },
    "updated_at": "2025-11-11T10:30:00Z"
  }
}
```

---

#### GET /orgs/{org_id}/members
**Description:** List organization members

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "membership-uuid",
      "user": {
        "id": "user-uuid",
        "email": "john@acme.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "org_role": "account_owner",
      "permissions": {},
      "joined_at": "2025-01-15T10:00:00Z",
      "last_active_at": "2025-11-11T09:00:00Z"
    }
  ]
}
```

---

#### POST /orgs/{org_id}/members/invite
**Description:** Invite team member

**Request:**
```json
{
  "email": "newmember@example.com",
  "org_role": "team_member",
  "permissions": {
    "contacts_read": true,
    "contacts_update": true,
    "imports_create": true,
    "exports_create": false
  }
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "membership-uuid",
    "invitation_token": "inv-token-abc123",
    "status": "pending",
    "expires_at": "2025-11-18T10:00:00Z"
  }
}
```

---

#### PATCH /orgs/{org_id}/members/{membership_id}
**Description:** Update member permissions

**Request:**
```json
{
  "permissions": {
    "contacts_delete": true,
    "dedup_run": true
  }
}
```

**Response:** `200 OK`

---

#### DELETE /orgs/{org_id}/members/{membership_id}
**Description:** Remove team member

**Response:** `204 No Content`

---

### Users Endpoints

#### GET /users/me
**Description:** Get current user profile

**Response:** `200 OK`
```json
{
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://...",
    "timezone": "America/New_York",
    "locale": "en-US",
    "mfa_enabled": true,
    "created_at": "2025-01-15T10:00:00Z"
  }
}
```

---

#### PATCH /users/me
**Description:** Update user profile

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "timezone": "America/Los_Angeles"
}
```

**Response:** `200 OK`

---

#### POST /users/me/mfa/enable
**Description:** Enable MFA

**Response:** `200 OK`
```json
{
  "data": {
    "secret": "base32-secret",
    "qr_code": "data:image/png;base64,...",
    "backup_codes": ["ABC123", "DEF456", ...]
  }
}
```

---

#### POST /users/me/mfa/verify
**Description:** Verify MFA setup

**Request:**
```json
{
  "code": "123456"
}
```

**Response:** `200 OK`

---

### Lists Endpoints

#### GET /orgs/{org_id}/lists
**Description:** List all lists in organization

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 50, max: 100)
- `sort` (string): Sort field (default: `-created_at`)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "list-uuid",
      "name": "Customer List 2025",
      "description": "Active customers from Q1",
      "contact_count": 1234,
      "tags": ["customers", "q1-2025"],
      "created_by": {
        "id": "user-uuid",
        "name": "John Doe"
      },
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-11-11T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 8,
    "totalPages": 1
  }
}
```

---

#### POST /orgs/{org_id}/lists
**Description:** Create new list

**Request:**
```json
{
  "name": "New Customer List",
  "description": "Imported from Q4 campaign",
  "color": "#3B82F6",
  "tags": ["customers", "q4-2025"]
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "list-uuid",
    "name": "New Customer List",
    "contact_count": 0,
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

---

#### GET /orgs/{org_id}/lists/{list_id}
**Description:** Get list details

**Response:** `200 OK`

---

#### PATCH /orgs/{org_id}/lists/{list_id}
**Description:** Update list

**Request:**
```json
{
  "name": "Updated List Name",
  "description": "New description"
}
```

**Response:** `200 OK`

---

#### DELETE /orgs/{org_id}/lists/{list_id}
**Description:** Delete list (soft delete)

**Response:** `204 No Content`

---

### Contacts Endpoints

#### GET /orgs/{org_id}/contacts
**Description:** List contacts with filtering and search

**Query Parameters:**
- `list_id` (uuid): Filter by list
- `page` (int): Page number
- `limit` (int): Items per page (max: 250)
- `search` (string): Keyword search
- `filter[field][operator]` (string): Field-specific filters
- `sort` (string): Sort fields
- `fields` (string): Select specific fields

**Examples:**
```http
GET /orgs/{org_id}/contacts?list_id={list_id}&page=1&limit=50
GET /orgs/{org_id}/contacts?search=john@gmail.com
GET /orgs/{org_id}/contacts?filter[state][eq]=TX&filter[tags][contains]=VIP
GET /orgs/{org_id}/contacts?sort=-created_at&fields=id,email,first_name
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "contact-uuid",
      "email": "john@example.com",
      "phone": "+15551234567",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "company": "Acme Inc",
      "title": "CEO",
      "address_line1": "123 Main St",
      "city": "Austin",
      "state": "TX",
      "postal_code": "78701",
      "country": "US",
      "tags": ["VIP", "customer"],
      "custom_fields": {
        "account_value": 50000,
        "last_purchase_date": "2025-10-15"
      },
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-11-10T15:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25,
    "hasMore": true
  }
}
```

---

#### POST /orgs/{org_id}/contacts/search
**Description:** Advanced search with complex filters

**Request:**
```json
{
  "filter": {
    "type": "and",
    "conditions": [
      {
        "field": "state",
        "operator": "eq",
        "value": "TX"
      },
      {
        "type": "or",
        "conditions": [
          { "field": "tags", "operator": "contains", "value": "VIP" },
          { "field": "custom_fields.account_value", "operator": "gt", "value": 10000 }
        ]
      }
    ]
  },
  "sort": ["-created_at", "last_name"],
  "page": 1,
  "limit": 50
}
```

**Response:** `200 OK` (same structure as GET /contacts)

---

#### POST /orgs/{org_id}/contacts
**Description:** Create single contact

**Request:**
```json
{
  "list_id": "list-uuid",
  "email": "newcontact@example.com",
  "phone": "555-123-4567",
  "first_name": "Jane",
  "last_name": "Smith",
  "company": "Tech Corp",
  "address_line1": "456 Oak Ave",
  "city": "San Francisco",
  "state": "CA",
  "postal_code": "94102",
  "tags": ["lead"],
  "custom_fields": {
    "source": "webinar"
  }
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "contact-uuid",
    "email": "newcontact@example.com",
    "phone": "+15551234567",
    "first_name": "Jane",
    "last_name": "Smith",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

---

#### GET /orgs/{org_id}/contacts/{contact_id}
**Description:** Get contact details

**Response:** `200 OK`

---

#### PATCH /orgs/{org_id}/contacts/{contact_id}
**Description:** Update contact

**Request:**
```json
{
  "phone": "555-987-6543",
  "title": "Senior Manager",
  "tags": ["VIP", "customer", "webinar-attendee"]
}
```

**Response:** `200 OK`

---

#### DELETE /orgs/{org_id}/contacts/{contact_id}
**Description:** Delete contact (soft delete)

**Response:** `204 No Content`

---

#### POST /orgs/{org_id}/contacts/bulk
**Description:** Bulk operations on contacts

**Request:**
```json
{
  "selection": {
    "type": "filter",
    "filter": {
      "type": "and",
      "conditions": [
        { "field": "state", "operator": "eq", "value": "TX" }
      ]
    }
  },
  "action": "add_tags",
  "params": {
    "tags": ["texas-resident", "campaign-2025"]
  }
}
```

**Actions:**
- `add_tags`
- `remove_tags`
- `delete`
- `move_to_list`
- `update_fields`
- `format_fields`

**Response:** `202 Accepted`
```json
{
  "data": {
    "job_id": "job-uuid",
    "status": "pending",
    "estimated_records": 1234
  }
}
```

---

### Imports Endpoints

#### POST /orgs/{org_id}/imports
**Description:** Start new import

**Request:** `multipart/form-data`
```
file: [CSV/XLSX file]
list_id: list-uuid
options: {
  "skip_duplicates": true,
  "auto_dedup": false
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "id": "import-uuid",
    "status": "uploading",
    "source_filename": "contacts.csv",
    "file_size": 1048576,
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

---

#### GET /orgs/{org_id}/imports/{import_id}
**Description:** Get import status

**Response:** `200 OK`
```json
{
  "data": {
    "id": "import-uuid",
    "status": "validating",
    "source_filename": "contacts.csv",
    "total_rows": 5000,
    "processed_rows": 3500,
    "valid_rows": 3400,
    "invalid_rows": 100,
    "progress": {
      "stage": "validating",
      "percent": 70,
      "eta_seconds": 45
    },
    "created_at": "2025-11-11T10:00:00Z",
    "started_at": "2025-11-11T10:01:00Z"
  }
}
```

---

#### GET /orgs/{org_id}/imports/{import_id}/preview
**Description:** Preview first rows for column mapping

**Response:** `200 OK`
```json
{
  "data": {
    "headers": ["Email Address", "First", "Last", "Phone", "City"],
    "rows": [
      {
        "Email Address": "john@example.com",
        "First": "John",
        "Last": "Doe",
        "Phone": "555-1234",
        "City": "Austin"
      }
    ],
    "suggested_mapping": [
      {
        "source_header": "Email Address",
        "target_field": "email",
        "confidence": 0.95,
        "reason": "Exact match"
      },
      {
        "source_header": "First",
        "target_field": "first_name",
        "confidence": 0.90,
        "reason": "Synonym match"
      }
    ]
  }
}
```

---

#### POST /orgs/{org_id}/imports/{import_id}/mapping
**Description:** Confirm column mapping and start processing

**Request:**
```json
{
  "mappings": [
    {
      "source_header": "Email Address",
      "target_field": "email",
      "transforms": ["lowercase", "trim"]
    },
    {
      "source_header": "First",
      "target_field": "first_name",
      "transforms": ["trim", "title_case"]
    },
    {
      "source_header": "Custom Field",
      "target_field": "custom_field_1",
      "create_new": true,
      "field_type": "string"
    }
  ]
}
```

**Response:** `200 OK`

---

#### POST /orgs/{org_id}/imports/{import_id}/cancel
**Description:** Cancel import

**Request:**
```json
{
  "mode": "reverse"
}
```
- `reverse`: Remove all data from this import
- `keep`: Stop processing, keep committed data

**Response:** `200 OK`

---

#### GET /orgs/{org_id}/imports
**Description:** List imports

**Response:** `200 OK`

---

### Exports Endpoints

#### POST /orgs/{org_id}/exports
**Description:** Create export

**Request:**
```json
{
  "selection": {
    "type": "filter",
    "filter_id": "segment-uuid"
  },
  "columns": ["email", "first_name", "last_name", "phone", "city", "state"],
  "format": "csv",
  "options": {
    "include_headers": true,
    "use_formatted": true,
    "delimiter": ",",
    "encoding": "UTF-8"
  }
}
```

**Response:** `202 Accepted`
```json
{
  "data": {
    "id": "export-uuid",
    "status": "pending",
    "estimated_records": 5000
  }
}
```

---

#### GET /orgs/{org_id}/exports/{export_id}
**Description:** Get export status

**Response:** `200 OK`
```json
{
  "data": {
    "id": "export-uuid",
    "status": "complete",
    "format": "csv",
    "row_count": 5000,
    "file_size": 524288,
    "download_url": "https://s3.../export.csv?signature=...",
    "expires_at": "2025-11-12T10:00:00Z",
    "created_at": "2025-11-11T10:00:00Z",
    "completed_at": "2025-11-11T10:02:30Z"
  }
}
```

---

#### GET /orgs/{org_id}/exports
**Description:** List exports

**Response:** `200 OK`

---

### Deduplication Endpoints

#### POST /orgs/{org_id}/dedup/runs
**Description:** Start deduplication run

**Request:**
```json
{
  "list_id": "list-uuid",
  "criteria": {
    "name": "Email + Phone Dedup",
    "fields": [
      {
        "field": "email",
        "weight": 0.7,
        "normalize": true
      },
      {
        "field": "phone",
        "weight": 0.3,
        "normalize": true
      }
    ],
    "fuzzy": {
      "enabled": false
    }
  },
  "sample_only": false
}
```

**Response:** `202 Accepted`
```json
{
  "data": {
    "id": "dedup-run-uuid",
    "status": "pending"
  }
}
```

---

#### GET /orgs/{org_id}/dedup/runs/{run_id}
**Description:** Get dedup run status

**Response:** `200 OK`
```json
{
  "data": {
    "id": "dedup-run-uuid",
    "status": "review",
    "total_contacts": 10000,
    "duplicate_contacts": 450,
    "cluster_count": 200,
    "created_at": "2025-11-11T10:00:00Z",
    "completed_at": "2025-11-11T10:05:00Z"
  }
}
```

---

#### GET /orgs/{org_id}/dedup/runs/{run_id}/clusters
**Description:** Get clusters for review

**Query Parameters:**
- `page` (int)
- `limit` (int)
- `min_confidence` (float): Filter by confidence

**Response:** `200 OK`
```json
{
  "data": [
    {
      "cluster_id": "cluster-1",
      "confidence": 0.95,
      "member_count": 3,
      "reason_codes": ["email_exact_match"],
      "contacts": [
        {
          "id": "contact-1",
          "email": "john@example.com",
          "phone": "+15551234567",
          "first_name": "John",
          "last_name": "Doe"
        },
        {
          "id": "contact-2",
          "email": "john@example.com",
          "phone": "+15559876543",
          "first_name": "J",
          "last_name": "Doe"
        }
      ],
      "suggested_survivor": "contact-1",
      "status": "pending"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 200
  }
}
```

---

#### POST /orgs/{org_id}/dedup/runs/{run_id}/apply
**Description:** Apply dedup decisions

**Request:**
```json
{
  "decisions": [
    {
      "cluster_id": "cluster-1",
      "survivor_id": "contact-1",
      "discard_ids": ["contact-2", "contact-3"],
      "merge_strategy": {
        "phone": "use_longest",
        "address": "use_most_complete"
      }
    }
  ]
}
```

**Response:** `202 Accepted`
```json
{
  "data": {
    "job_id": "merge-job-uuid",
    "applied_clusters": 1,
    "affected_contacts": 3
  }
}
```

---

#### POST /orgs/{org_id}/dedup/merges/{merge_id}/undo
**Description:** Undo a merge

**Response:** `200 OK`

---

### Tags Endpoints

#### GET /orgs/{org_id}/tags
**Description:** List tags

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "tag-uuid",
      "name": "VIP",
      "slug": "vip",
      "color": "#EF4444",
      "contact_count": 234,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

#### POST /orgs/{org_id}/tags
**Description:** Create tag

**Request:**
```json
{
  "name": "Newsletter Subscriber",
  "color": "#3B82F6",
  "description": "Opted in to newsletter"
}
```

**Response:** `201 Created`

---

#### PATCH /orgs/{org_id}/tags/{tag_id}
**Description:** Update tag

**Response:** `200 OK`

---

#### DELETE /orgs/{org_id}/tags/{tag_id}
**Description:** Delete tag

**Response:** `204 No Content`

---

### Segments Endpoints

#### GET /orgs/{org_id}/segments
**Description:** List segments

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "segment-uuid",
      "name": "Texas VIPs",
      "description": "VIP customers in Texas",
      "cached_count": 156,
      "auto_update": true,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

#### POST /orgs/{org_id}/segments
**Description:** Create segment

**Request:**
```json
{
  "name": "High Value Customers",
  "description": "Customers with account value > $10k",
  "filter_definition": {
    "type": "and",
    "conditions": [
      {
        "field": "custom_fields.account_value",
        "operator": "gt",
        "value": 10000
      },
      {
        "field": "tags",
        "operator": "contains",
        "value": "customer"
      }
    ]
  },
  "auto_update": true
}
```

**Response:** `201 Created`

---

#### GET /orgs/{org_id}/segments/{segment_id}
**Description:** Get segment details

**Response:** `200 OK`

---

#### GET /orgs/{org_id}/segments/{segment_id}/contacts
**Description:** Get contacts in segment

**Response:** `200 OK` (same structure as GET /contacts)

---

#### POST /orgs/{org_id}/segments/{segment_id}/refresh
**Description:** Manually refresh segment cache

**Response:** `202 Accepted`

---

### Validation Endpoints

#### POST /orgs/{org_id}/validate/start
**Description:** Start address validation job

**Request:**
```json
{
  "contact_ids": ["contact-uuid-1", "contact-uuid-2"],
  "provider": "accuzip",
  "input_mapping": {
    "first_name": "first_name",
    "last_name": "last_name",
    "address_line1": "address_line1",
    "address_line2": "address_line2",
    "city": "city",
    "state": "state",
    "postal_code": "postal_code"
  }
}
```

**AccuZIP Integration:** This endpoint integrates with AccuZIP's CASS-certified validation service. For detailed information about:
- AccuZIP API authentication and rate limits
- Field mapping between MLM and AccuZIP formats
- DPV code interpretations (Y/D/S/N status codes)
- Credit consumption and cost estimation
- Response transformation examples

See: [AccuZIP API Integration Guide](API-AccuZip.md)

**Response:** `202 Accepted`
```json
{
  "data": {
    "job_id": "validation-job-uuid",
    "total_records": 2,
    "estimated_cost": 0.10
  }
}
```

---

#### GET /orgs/{org_id}/validate/{job_id}
**Description:** Get validation job status

**Response:** `200 OK`
```json
{
  "data": {
    "id": "validation-job-uuid",
    "status": "complete",
    "total_records": 2,
    "processed_records": 2,
    "deliverable_count": 1,
    "undeliverable_count": 1,
    "actual_cost": 0.10,
    "created_at": "2025-11-11T10:00:00Z",
    "completed_at": "2025-11-11T10:01:30Z"
  }
}
```

---

#### POST /orgs/{org_id}/validate/{job_id}/cancel
**Description:** Cancel validation job

**Request:**
```json
{
  "mode": "keep"
}
```

**Response:** `200 OK`

---

### Skip Trace Endpoints

#### POST /orgs/{org_id}/skiptrace/start
**Description:** Start skip trace job

**Request:**
```json
{
  "contact_ids": ["contact-uuid-1"],
  "provider": "spokeo",
  "input_mapping": {
    "first_name": "first_name",
    "last_name": "last_name",
    "address_line1": "address_line1",
    "city": "city",
    "state": "state"
  }
}
```

**Response:** `202 Accepted`
```json
{
  "data": {
    "job_id": "skiptrace-job-uuid",
    "total_records": 1,
    "estimated_cost": 2.50
  }
}
```

---

#### GET /orgs/{org_id}/skiptrace/{job_id}
**Description:** Get skip trace job status

**Response:** `200 OK`
```json
{
  "data": {
    "id": "skiptrace-job-uuid",
    "status": "complete",
    "total_records": 1,
    "found_count": 1,
    "actual_cost": 2.50,
    "completed_at": "2025-11-11T10:05:00Z"
  }
}
```

---

### Audit Endpoints

#### GET /orgs/{org_id}/audit
**Description:** Query audit logs

**Query Parameters:**
- `page` (int)
- `limit` (int)
- `actor_id` (uuid): Filter by user
- `action` (string): Filter by action
- `resource_type` (string): Filter by resource type
- `start_date` (ISO datetime)
- `end_date` (ISO datetime)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "audit-uuid",
      "actor": {
        "id": "user-uuid",
        "email": "john@acme.com"
      },
      "action": "contacts.updated",
      "resource_type": "contact",
      "resource_id": "contact-uuid",
      "diff": {
        "phone": {
          "before": "+15551234567",
          "after": "+15559876543"
        }
      },
      "ip_address": "192.168.1.100",
      "created_at": "2025-11-11T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 2345
  }
}
```

---

#### GET /orgs/{org_id}/audit/{event_id}
**Description:** Get audit event details

**Response:** `200 OK`
```json
{
  "data": {
    "id": "audit-uuid",
    "actor": {
      "id": "user-uuid",
      "email": "john@acme.com",
      "role": "account_owner"
    },
    "action": "contacts.updated",
    "resource_type": "contact",
    "resource_id": "contact-uuid",
    "before_state": { ... },
    "after_state": { ... },
    "diff": { ... },
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "request_id": "req-abc123",
    "created_at": "2025-11-11T10:00:00Z"
  }
}
```

---

## WebSocket API

### Connection

**URL:** `wss://api.mailinglistmanager.com/v1/ws`

**Authentication:**
```javascript
const socket = io('wss://api.mailinglistmanager.com/v1/ws', {
  auth: {
    token: 'access-token-here'
  }
});
```

### Events

#### Subscribe to Import Progress
```javascript
socket.emit('subscribe', {
  type: 'import',
  id: 'import-uuid'
});

socket.on('import:progress', (data) => {
  console.log(data);
  // {
  //   import_id: 'import-uuid',
  //   status: 'validating',
  //   progress: 75,
  //   processed_rows: 3750,
  //   total_rows: 5000
  // }
});

socket.on('import:complete', (data) => {
  console.log('Import complete!', data);
});
```

#### Real-Time Contact Updates
```javascript
socket.emit('subscribe', {
  type: 'org',
  id: 'org-uuid'
});

socket.on('contact:updated', (data) => {
  console.log('Contact updated', data);
});

socket.on('contact:deleted', (data) => {
  console.log('Contact deleted', data);
});
```

---

**End of API Specification**

**Next Document:** Frontend Component Structure
