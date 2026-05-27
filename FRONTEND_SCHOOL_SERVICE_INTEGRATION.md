# Frontend School Service Integration Guide

This document explains how the frontend should integrate with the School Service.

## Base URL

Frontend must call the API Gateway, not `school-service` directly.

```txt
http://localhost:3000
```

School Service runs internally on:

```txt
http://localhost:3002
```

Do not call port `3002` from frontend code. Use only API Gateway routes.

## Auth Requirement

All school APIs are protected.

Send the access token from login:

```http
Authorization: Bearer ACCESS_TOKEN
```

Only `super_admin` can create, list, view, update, activate, inactivate, or suspend schools.

Allowed role:

```txt
super_admin
```

If the user is not logged in or not `super_admin`, the gateway returns `401`.

## Status Values

School status can be:

```txt
active
inactive
suspended
```

Recommended frontend labels:

```txt
active     -> Active
inactive   -> Inactive
suspended  -> Suspended
```

## School Object Shape

Example school object:

```json
{
  "_id": "6657770fdc1e7c6151878001",
  "name": "Green Valley School",
  "code": "GVS001",
  "status": "active",
  "address": {
    "line1": "12 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India",
    "pincode": "560001"
  },
  "contactEmail": "admin@gvs.example",
  "contactPhone": "9876543210",
  "createdBy": "6657770fdc1e7c6151877001",
  "isDeleted": false,
  "createdAt": "2026-05-27T18:45:00.000Z",
  "updatedAt": "2026-05-27T18:45:00.000Z"
}
```

Frontend should treat `_id` as the school id.

## Common Response Shape

Success:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Schools fetched successfully.",
  "type": "SUCCESS",
  "data": {}
}
```

Error:

```json
{
  "statusCode": 400,
  "status": false,
  "message": "Invalid school id.",
  "type": "BAD_REQUEST"
}
```

Always display `message` when showing backend errors.

## Endpoints

```txt
POST /v1/schools
GET  /v1/schools
GET  /v1/schools/:id
GET  /v1/schools/code/:code
PUT  /v1/schools/:id
PUT  /v1/schools/:id/status
```

## Create School

```http
POST http://localhost:3000/v1/schools
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "name": "Green Valley School",
  "code": "GVS001",
  "address": {
    "line1": "12 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India",
    "pincode": "560001"
  },
  "contactEmail": "admin@gvs.example",
  "contactPhone": "9876543210",
  "status": "active"
}
```

Required fields:

```txt
name
code
```

Optional fields:

```txt
address
contactEmail
contactPhone
status
```

Validation:

```txt
name         -> string, 2 to 150 characters
code         -> alphanumeric string, 2 to 30 characters
address      -> object
contactEmail -> valid email
contactPhone -> string, 7 to 20 characters
status       -> active | inactive | suspended
```

Important:

```txt
code is automatically stored uppercase by backend.
code must be unique.
```

Success response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "School created successfully.",
  "type": "SUCCESS",
  "data": {
    "school": {
      "_id": "6657770fdc1e7c6151878001",
      "name": "Green Valley School",
      "code": "GVS001",
      "status": "active"
    }
  }
}
```

Note: HTTP status is `201`, but the response body `statusCode` is currently `200`.

Duplicate code error:

```json
{
  "statusCode": 400,
  "status": false,
  "message": "A school with this code already exists.",
  "type": "ALREADY_EXISTS"
}
```

## List Schools

```http
GET http://localhost:3000/v1/schools
Authorization: Bearer ACCESS_TOKEN
```

Query params:

```txt
page    -> optional, default 1
limit   -> optional, default 20, max 100
status  -> optional, active | inactive | suspended
search  -> optional, searches name and code
```

Examples:

```http
GET /v1/schools?page=1&limit=20
GET /v1/schools?status=active
GET /v1/schools?search=green
GET /v1/schools?page=2&limit=10&status=suspended
```

Success response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Schools fetched successfully.",
  "type": "SUCCESS",
  "data": {
    "schools": [
      {
        "_id": "6657770fdc1e7c6151878001",
        "name": "Green Valley School",
        "code": "GVS001",
        "status": "active",
        "contactEmail": "admin@gvs.example",
        "contactPhone": "9876543210"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

Frontend table suggestions:

```txt
Name
Code
Status
Contact Email
Contact Phone
Created At
Actions: View, Edit, Suspend/Activate
```

## Get School By Id

```http
GET http://localhost:3000/v1/schools/6657770fdc1e7c6151878001
Authorization: Bearer ACCESS_TOKEN
```

Success response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "School fetched successfully.",
  "type": "SUCCESS",
  "data": {
    "school": {
      "_id": "6657770fdc1e7c6151878001",
      "name": "Green Valley School",
      "code": "GVS001",
      "status": "active"
    }
  }
}
```

Not found:

```json
{
  "statusCode": 404,
  "status": false,
  "message": "School not found.",
  "type": "DATA_NOT_FOUND"
}
```

## Get School By Code

```http
GET http://localhost:3000/v1/schools/code/GVS001
Authorization: Bearer ACCESS_TOKEN
```

Use this when the UI needs to validate or inspect a school code.

Success response is the same as Get School By Id.

## Update School

```http
PUT http://localhost:3000/v1/schools/6657770fdc1e7c6151878001
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Body can include one or more fields:

```json
{
  "name": "Green Valley International School",
  "code": "GVIS001",
  "address": {
    "line1": "12 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India",
    "pincode": "560001"
  },
  "contactEmail": "office@gvis.example",
  "contactPhone": "9876543211",
  "status": "active"
}
```

Frontend can use the same form as create school. For edit mode, prefill fields from the school details response.

Success:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "School updated successfully.",
  "type": "SUCCESS",
  "data": {
    "school": {
      "_id": "6657770fdc1e7c6151878001",
      "name": "Green Valley International School",
      "code": "GVIS001",
      "status": "active"
    }
  }
}
```

## Update School Status

Use this for Activate, Inactivate, or Suspend actions.

```http
PUT http://localhost:3000/v1/schools/6657770fdc1e7c6151878001/status
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Suspend:

```json
{
  "status": "suspended"
}
```

Activate:

```json
{
  "status": "active"
}
```

Inactivate:

```json
{
  "status": "inactive"
}
```

Success:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "School status updated successfully.",
  "type": "SUCCESS",
  "data": {
    "school": {
      "_id": "6657770fdc1e7c6151878001",
      "name": "Green Valley School",
      "code": "GVS001",
      "status": "suspended"
    }
  }
}
```

Recommended UI behavior:

```txt
active     -> show Suspend and Inactivate actions
inactive   -> show Activate action
suspended  -> show Activate action
```

Use a confirmation dialog before changing status.

## Frontend Fetch Helper Example

```js
const API_BASE_URL = "http://localhost:3000";

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const payload = await response.json();

  if (!response.ok || payload.status === false) {
    throw new Error(payload.message || "Request failed");
  }

  return payload.data;
}
```

Create:

```js
export function createSchool(input) {
  return apiRequest("/v1/schools", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
```

List:

```js
export function listSchools({ page = 1, limit = 20, status, search } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  if (status) params.set("status", status);
  if (search) params.set("search", search);

  return apiRequest(`/v1/schools?${params.toString()}`);
}
```

Update:

```js
export function updateSchool(id, input) {
  return apiRequest(`/v1/schools/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}
```

Change status:

```js
export function updateSchoolStatus(id, status) {
  return apiRequest(`/v1/schools/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
}
```

## Suggested Pages

```txt
/super-admin/schools
/super-admin/schools/new
/super-admin/schools/:id
/super-admin/schools/:id/edit
```

Minimum UI:

```txt
School list with search, status filter, pagination
Create school form
Edit school form
School details page or drawer
Status action confirmation modal
Error toast using backend message
Loading and empty states
```

## Internal Endpoint

Backend services can call this endpoint directly with `x-internal-key`.

```txt
GET http://localhost:3002/v1/internal/schools/:id/status
```

Frontend must not call this endpoint.

Internal success response:

```json
{
  "valid": true,
  "active": true,
  "status": "active",
  "schoolId": "6657770fdc1e7c6151878001",
  "code": "GVS001"
}
```

## Error Cases Frontend Should Handle

```txt
400 BAD_REQUEST       -> invalid form input or invalid school id
401 UNAUTHORIZED     -> missing/expired token or role not allowed
404 DATA_NOT_FOUND   -> school not found
400 ALREADY_EXISTS   -> duplicate school code
502 Bad gateway      -> school service is down or not reachable through gateway
```

For `401`, use the normal auth refresh flow from `FRONTEND_LOGIN_INTEGRATION.md`.

For `502`, show a friendly message like:

```txt
School service is currently unavailable. Please try again later.
```

## Backend Logs

The School Service logs key operations:

```txt
Creating school
School created
Listing schools
Fetching school by id
Fetching school by code
Updating school
Updating school status
Checking school status for internal caller
```

These logs are for backend debugging only. Frontend should rely on API responses, not logs.

## Local Development Startup

Run these services:

```bash
npm run dev:auth
npm run dev:school
npm run dev:gateway
```

Useful URLs:

```txt
Gateway health:        http://localhost:3000/health
Gateway service check: http://localhost:3000/services/health
Gateway Swagger:       http://localhost:3000/api-docs
School health:         http://localhost:3002/health
School Swagger:        http://localhost:3002/api-docs
```

Frontend should still use only:

```txt
http://localhost:3000
```
