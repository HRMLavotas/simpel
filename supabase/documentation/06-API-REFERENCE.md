# Supabase MCP API Reference

## Overview

Dokumentasi lengkap untuk Supabase Management API dan MCP tools.

## Base URLs

```
Management API: https://api.supabase.com/v1
MCP Server: https://mcp.supabase.com/mcp
Project API: https://{project-ref}.supabase.co
```

## Authentication

### Access Token

```javascript
headers: {
  'Authorization': 'Bearer sbp_your_access_token_here'
}
```

### Service Role Key

```javascript
headers: {
  'apikey': 'your_service_role_key',
  'Authorization': 'Bearer your_service_role_key'
}
```

## MCP Tools Reference

### Database Operations

#### list_tables

List all tables in database.

**Parameters:**
```typescript
{
  project_id: string;      // Required
  schemas?: string[];      // Optional, default: all schemas
  verbose?: boolean;       // Optional, default: false
}
```

**Example:**
```javascript
{
  "project_id": "mauyygrbdopmpdpnwzra",
  "schemas": ["public"],
  "verbose": true
}
```

**Response:**
```json
{
  "tables": [
    {
      "schema": "public",
      "name": "profiles",
      "columns": [
        {
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "default": "gen_random_uuid()"
        }
      ]
    }
  ]
}
```

#### execute_sql

Execute raw SQL query.

**Parameters:**
```typescript
{
  project_id: string;      // Required
  query: string;           // Required
}
```

**Example:**
```javascript
{
  "project_id": "mauyygrbdopmpdpnwzra",
  "query": "SELECT * FROM profiles LIMIT 10"
}
```

**Response:**
```json
{
  "rows": [
    {
      "id": "uuid",
      "email": "user@example.com"
    }
  ]
}
```

#### apply_migration

Apply migration to database.

**Parameters:**
```typescript
{
  project_id: string;      // Required
  name: string;            // Required, snake_case
  query: string;           // Required, SQL
}
```

**Example:**
```javascript
{
  "project_id": "mauyygrbdopmpdpnwzra",
  "name": "add_templates_column",
  "query": "ALTER TABLE profiles ADD COLUMN templates jsonb;"
}
```

**Response:**
```json
{
  "success": true,
  "migration_id": "20260407000000"
}
```

#### list_migrations

List all applied migrations.

**Parameters:**
```typescript
{
  project_id: string;      // Required
}
```

**Response:**
```json
{
  "migrations": [
    {
      "version": "20260407000000",
      "name": "add_templates_column",
      "applied_at": "2026-04-07T10:00:00Z"
    }
  ]
}
```

### Project Management

#### list_projects

List all projects.

**Parameters:** None

**Response:**
```json
{
  "projects": [
    {
      "id": "mauyygrbdopmpdpnwzra",
      "ref": "mauyygrbdopmpdpnwzra",
      "name": "SIMPEL Production",
      "organization_id": "org_id",
      "region": "ap-southeast-1",
      "status": "ACTIVE",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### get_project

Get project details.

**Parameters:**
```typescript
{
  id: string;              // Required
}
```

**Response:**
```json
{
  "id": "mauyygrbdopmpdpnwzra",
  "name": "SIMPEL Production",
  "status": "ACTIVE",
  "database": {
    "host": "db.mauyygrbdopmpdpnwzra.supabase.co",
    "version": "15.1"
  }
}
```

#### get_project_url

Get project API URL.

**Parameters:**
```typescript
{
  project_id: string;      // Required
}
```

**Response:**
```json
{
  "url": "https://mauyygrbdopmpdpnwzra.supabase.co"
}
```

#### get_publishable_keys

Get API keys.

**Parameters:**
```typescript
{
  project_id: string;      // Required
}
```

**Response:**
```json
{
  "anon_key": "eyJhbGc...",
  "service_role_key": "eyJhbGc...",
  "publishable_key": "sb_publishable_..."
}
```

### Edge Functions

#### list_edge_functions

List all edge functions.

**Parameters:**
```typescript
{
  project_id: string;      // Required
}
```

**Response:**
```json
{
  "functions": [
    {
      "id": "func_id",
      "name": "hello-world",
      "status": "ACTIVE",
      "version": 1
    }
  ]
}
```

#### get_edge_function

Get function code.

**Parameters:**
```typescript
{
  project_id: string;      // Required
  function_slug: string;   // Required
}
```

**Response:**
```json
{
  "name": "hello-world",
  "code": "Deno.serve(async (req) => { ... })"
}
```

#### deploy_edge_function

Deploy edge function.

**Parameters:**
```typescript
{
  project_id: string;      // Required
  name: string;            // Required
  entrypoint_path: string; // Required
  verify_jwt: boolean;     // Required
  files: Array<{           // Required
    path: string;
    content: string;
  }>;
}
```

### Monitoring

#### get_logs

Get service logs.

**Parameters:**
```typescript
{
  project_id: string;      // Required
  service: 'postgres' | 'auth' | 'realtime' | 'storage';
}
```

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2026-04-07T10:00:00Z",
      "level": "info",
      "message": "Query executed"
    }
  ]
}
```

#### get_advisors

Get security advisors.

**Parameters:**
```typescript
{
  project_id: string;      // Required
  type: 'security' | 'performance';
}
```

**Response:**
```json
{
  "advisors": [
    {
      "type": "security",
      "severity": "high",
      "message": "RLS not enabled on table X",
      "remediation_url": "https://..."
    }
  ]
}
```

## Management API Endpoints

### Execute SQL

**Endpoint:**
```
POST /v1/projects/{project_ref}/database/query
```

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "query": "SELECT * FROM profiles"
}
```

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com"
  }
]
```

**Example:**
```javascript
const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  }
);

const data = await response.json();
```

### List Projects

**Endpoint:**
```
GET /v1/projects
```

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response:**
```json
[
  {
    "id": "project_id",
    "name": "Project Name",
    "organization_id": "org_id",
    "region": "ap-southeast-1",
    "status": "ACTIVE"
  }
]
```

### Get Project

**Endpoint:**
```
GET /v1/projects/{project_id}
```

**Response:**
```json
{
  "id": "project_id",
  "name": "Project Name",
  "database": {
    "host": "db.project.supabase.co",
    "version": "15.1"
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Invalid SQL syntax"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid access token"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Project not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Rate Limits

### Management API

- **Rate limit**: 60 requests per minute
- **Burst**: 10 requests per second
- **Headers**:
  - `X-RateLimit-Limit`: Total limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

### Handling Rate Limits

```javascript
async function executeWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const retryAfter = error.headers['retry-after'] || 60;
        await sleep(retryAfter * 1000);
        continue;
      }
      throw error;
    }
  }
}
```

## Code Examples

### Node.js with https

```javascript
import https from 'https';

function executeSQLViaManagementAPI(projectRef, accessToken, sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}
```

### Node.js with fetch

```javascript
async function executeSQLViaManagementAPI(projectRef, accessToken, sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}
```

### cURL

```bash
curl -X POST \
  https://api.supabase.com/v1/projects/PROJECT_REF/database/query \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM profiles LIMIT 10"}'
```

## TypeScript Types

```typescript
// Project
interface Project {
  id: string;
  ref: string;
  name: string;
  organization_id: string;
  region: string;
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  created_at: string;
  database: {
    host: string;
    version: string;
  };
}

// Migration
interface Migration {
  version: string;
  name: string;
  applied_at: string;
}

// Table
interface Table {
  schema: string;
  name: string;
  columns: Column[];
}

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

// API Response
interface APIResponse<T> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}
```

## Next Steps

- [Overview](./01-SUPABASE-MCP-OVERVIEW.md)
- [Setup](./02-SETUP-MCP-CONNECTION.md)
- [Running Migrations](./03-RUNNING-MIGRATIONS.md)
- [Troubleshooting](./04-TROUBLESHOOTING.md)
- [Best Practices](./05-BEST-PRACTICES.md)
