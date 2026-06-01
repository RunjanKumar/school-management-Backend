# Frontend Role-Based Admin Flow

This document explains how the frontend should implement the new dynamic flow:

```txt
Super Admin creates School Admin
School Admin creates and manages schools
Super Admin can read all schools only
```

Frontend must call the API Gateway only:

```txt
http://localhost:3000
```

## Login Data To Store

After login, store:

```txt
data.token
data.refreshToken
data.user
data.user.role
data.user.schoolId
```

Use `user.role` as the source of truth for menus, routes, actions, and redirects.

## Role Permissions

```txt
super_admin
- Can create school admins
- Can update own basic profile data
- Can list all schools
- Can view school details
- Cannot create, edit, delete, activate, inactivate, or suspend schools

school_admin
- Can update own basic profile data
- Can create schools
- Can list schools they created
- Can view schools they created
- Can edit schools they created
- Can activate, inactivate, or suspend schools they created
- Cannot create other school admins
```

## Dynamic Routing

Recommended redirect after login:

```js
const DASHBOARD_BY_ROLE = {
  super_admin: "/super-admin/dashboard",
  school_admin: "/school-admin/dashboard",
  school_operator: "/operator/dashboard",
  teacher: "/teacher/dashboard",
  parent: "/parent/dashboard",
  student: "/student/dashboard",
  guest: "/guest"
};

export function getDashboardPath(user) {
  return DASHBOARD_BY_ROLE[user?.role] || "/login";
}
```

Recommended route metadata:

```js
export const routes = [
  {
    path: "/super-admin/school-admins/new",
    roles: ["super_admin"],
    permission: "schoolAdmin:create"
  },
  {
    path: "/super-admin/schools",
    roles: ["super_admin"],
    permission: "school:readAll"
  },
  {
    path: "/super-admin/schools/:id",
    roles: ["super_admin"],
    permission: "school:readAll"
  },
  {
    path: "/school-admin/schools",
    roles: ["school_admin"],
    permission: "school:readOwn"
  },
  {
    path: "/school-admin/schools/new",
    roles: ["school_admin"],
    permission: "school:create"
  },
  {
    path: "/school-admin/schools/:id/edit",
    roles: ["school_admin"],
    permission: "school:updateOwn"
  }
];
```

Route guard example:

```js
export function canAccessRoute(user, route) {
  return Boolean(user?.role && route.roles.includes(user.role));
}
```

## Dynamic Menus

Build navigation from role rules:

```js
const NAV_BY_ROLE = {
  super_admin: [
    { label: "Dashboard", href: "/super-admin/dashboard" },
    { label: "Create Admin", href: "/super-admin/school-admins/new" },
    { label: "Schools", href: "/super-admin/schools" }
  ],
  school_admin: [
    { label: "Dashboard", href: "/school-admin/dashboard" },
    { label: "Schools", href: "/school-admin/schools" },
    { label: "Create School", href: "/school-admin/schools/new" }
  ]
};

export function getNavItems(user) {
  return NAV_BY_ROLE[user?.role] || [];
}
```

## Dynamic School Actions

Use the same school table component for both roles, but render actions by role:

```js
export function getSchoolActions(user) {
  if (user?.role === "super_admin") {
    return ["view"];
  }

  if (user?.role === "school_admin") {
    return ["view", "edit", "changeStatus"];
  }

  return [];
}
```

For super admin, do not show:

```txt
Create School
Edit
Activate
Inactivate
Suspend
Delete
```

For school admin, show:

```txt
Create School
Edit
Activate/Inactivate/Suspend
```

## API Helper

Use one API helper that automatically sends the bearer token:

```js
const API_BASE_URL = "http://localhost:3000";

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

## Super Admin Creates School Admin

Role: `super_admin`

```http
POST /v1/auth/school-admins
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Request:

```json
{
  "name": "Green Valley Admin",
  "email": "admin@gvs.example",
  "password": "SchoolAdmin@123"
}
```

Frontend function:

```js
export function createSchoolAdmin(input) {
  return apiRequest("/v1/auth/school-admins", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
```

Success:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "School admin created successfully.",
  "type": "SUCCESS",
  "data": {
    "user": {
      "_id": "user-id",
      "email": "admin@gvs.example",
      "role": "school_admin",
      "schoolId": null,
      "name": "Green Valley Admin"
    }
  }
}
```

Note: The HTTP status is `201`. The response body may still show `statusCode: 200`.

## Update Basic Profile

Role: `super_admin` or `school_admin`

```http
PUT /v1/auth/me
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Request:

```json
{
  "name": "Updated Admin Name"
}
```

Frontend function:

```js
export function updateMyProfile(input) {
  return apiRequest("/v1/auth/me", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}
```

After success, replace the stored user with `data.user`.

## School Admin Creates School

Role: `school_admin`

```http
POST /v1/schools
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Request:

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

Frontend function:

```js
export function createSchool(input) {
  return apiRequest("/v1/schools", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
```

## List Schools Dynamically

Same endpoint, different backend behavior by role:

```txt
super_admin  -> backend returns all schools
school_admin -> backend returns only schools created by that admin
```

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

## Update School

Role: `school_admin`

```js
export function updateSchool(id, input) {
  return apiRequest(`/v1/schools/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}
```

## Change School Status

Role: `school_admin`

```js
export function updateSchoolStatus(id, status) {
  return apiRequest(`/v1/schools/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
}
```

Allowed status values:

```txt
active
inactive
suspended
```

## Page Behavior

Super admin pages:

```txt
/super-admin/dashboard
/super-admin/school-admins/new
/super-admin/schools
/super-admin/schools/:id
```

Super admin school table:

```txt
Show: View
Hide: Create, Edit, Activate, Inactivate, Suspend, Delete
```

School admin pages:

```txt
/school-admin/dashboard
/school-admin/schools
/school-admin/schools/new
/school-admin/schools/:id
/school-admin/schools/:id/edit
```

School admin school table:

```txt
Show: View, Edit, Activate/Inactivate/Suspend
Show create button: yes
```

## Error Handling

Always display backend `message`.

Common errors:

```txt
401 UNAUTHORIZED -> missing/expired token or role not allowed
403 FORBIDDEN    -> authenticated but action is not allowed
400 BAD_REQUEST  -> validation error
404 DATA_NOT_FOUND -> school not found or not owned by this school admin
400 ALREADY_EXISTS -> duplicate email or school code
502 Bad gateway  -> service unavailable
```

Recommended behavior:

```txt
401 -> try refresh token once, then retry original request
403 -> show "You do not have permission to perform this action."
404 -> show backend message and return to list when needed
ALREADY_EXISTS -> show backend message near email/code field
```

## Implementation Checklist

```txt
[ ] Store user and token after login
[ ] Redirect using user.role
[ ] Build sidebar/menu from role
[ ] Guard pages using allowed roles
[ ] Render school table actions using role
[ ] Super admin: implement create school admin form
[ ] Super admin: implement read-only schools list/detail
[ ] School admin: implement create school form
[ ] School admin: implement edit/status flows
[ ] Use one API helper with token and refresh handling
[ ] Show backend error message in toast/form errors
```
