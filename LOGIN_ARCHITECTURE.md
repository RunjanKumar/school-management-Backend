# School Management Login Backend Architecture

## Purpose

This document defines the login and authentication architecture for the school management backend.

The current backend already has the foundation for this style of architecture:

- TypeScript + Express API.
- MongoDB through Mongoose models.
- Route metadata with Joi validation.
- Central route registration through `routeUtils`.
- JWT-based login.
- Server-side session records in MongoDB.
- Role-based middleware through `authService`.

The target architecture expands the current admin-only login into a complete multi-role, multi-school login system.

## Login Actors

The backend should support these login identities:

| Actor | Scope | Main Purpose |
| --- | --- | --- |
| Super Admin | Platform-wide | Creates schools, manages school admins, monitors all schools. |
| School Admin | One school | Operates and manages a specific school. |
| School Operator | One school | Handles day-to-day school operations with limited permissions. |
| Teacher | One school | Manages assigned classes, attendance, homework, exams, and communication. |
| Parent | One or more students | Views linked student information, fees, notices, attendance, and reports. |
| Student | One school | Accesses own timetable, homework, attendance, exams, and notices. |
| Guest | Limited public access | Can make inquiries, submit admission interest, or access guest-only flows. |

Social login is supported only through Google email login. No Facebook, Apple, Microsoft, or phone-only social login should be included unless added later by design.

## Core Design

The backend should use one central authentication system for all users, then apply role and school-based authorization after login.

Recommended login flow:

1. User submits email/password or Google login token.
2. Backend validates the credential.
3. Backend loads the user account.
4. Backend checks account status, school status, role, and permissions.
5. Backend creates a server-side session.
6. Backend returns a JWT access token and user profile summary.
7. Protected APIs validate both the JWT and the session record.

This is better than building separate login systems for each actor because password policy, token handling, logout, session expiry, Google login, and audit logging remain consistent.

## Tenant Model

This is a multi-school system. Most users must belong to a school.

Super Admin is the only platform-level role that does not require a `schoolId`.

Every school-scoped user should have a `schoolId`:

- School Admin
- School Operator
- Teacher
- Parent
- Student
- Guest, if guest is tied to a school inquiry

Every school-scoped API must filter by `schoolId` from the authenticated session, not from user-submitted request body values.

Example:

```ts
{
  userId: "...",
  role: "teacher",
  schoolId: "...",
  sessionId: "..."
}
```

## Main Collections

### users

The `users` collection should be the primary login identity table.

Suggested fields:

```ts
{
  _id: ObjectId,
  email: string,
  normalizedEmail: string,
  passwordHash?: string,
  role: "super_admin" | "school_admin" | "school_operator" | "teacher" | "parent" | "student" | "guest",
  schoolId?: ObjectId,
  profileRef?: ObjectId,
  profileModel?: "superAdmins" | "schoolAdmins" | "teachers" | "parents" | "students" | "guests",
  authProviders: {
    password: boolean,
    google: boolean
  },
  googleSub?: string,
  emailVerified: boolean,
  status: "pending" | "active" | "inactive" | "blocked",
  lastLoginAt?: Date,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

Rules:

- `normalizedEmail` should be lowercase and unique per login scope.
- For most systems, email should be globally unique.
- If the same parent can access multiple schools, use a membership table instead of duplicating users.
- `passwordHash` is optional only when the user was created with Google login.
- `googleSub` should be stored after successful Google login because it is more stable than email.

### schools

The `schools` collection stores tenant information.

Suggested fields:

```ts
{
  _id: ObjectId,
  name: string,
  code: string,
  status: "active" | "inactive" | "suspended",
  address?: object,
  contactEmail?: string,
  contactPhone?: string,
  createdBy: ObjectId,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

Rules:

- Only Super Admin can create schools.
- If a school is suspended or deleted, school-scoped users should not be able to log in.

### schoolMemberships

Use this only if one user can belong to multiple schools.

Recommended for parents and possibly teachers.

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  schoolId: ObjectId,
  role: "parent" | "teacher" | "school_operator" | "school_admin",
  status: "active" | "inactive",
  createdAt: Date,
  updatedAt: Date
}
```

If users always belong to one school only, this collection is optional.

### sessions

The existing `sessions` model can be expanded.

Suggested fields:

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  schoolId?: ObjectId,
  role: string,
  type: "login" | "forgot_password" | "google_login",
  token: string,
  refreshTokenHash?: string,
  deviceId?: string,
  ipAddress?: string,
  userAgent?: string,
  expirationTime: Date,
  revokedAt?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

Rules:

- Logout should delete or revoke the session.
- Auth middleware should reject JWTs that do not have an active session.
- Expired sessions should be cleaned by cron.
- Password reset sessions should be separate from login sessions.

### loginAudits

This collection is recommended for security and troubleshooting.

```ts
{
  _id: ObjectId,
  userId?: ObjectId,
  email: string,
  schoolId?: ObjectId,
  role?: string,
  loginMethod: "password" | "google",
  success: boolean,
  failureReason?: string,
  ipAddress?: string,
  userAgent?: string,
  createdAt: Date
}
```

## Role-Specific Profiles

The `users` collection should handle login. Role-specific collections should handle domain information.

Examples:

### superAdmins

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  name: string
}
```

### schoolAdmins

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  schoolId: ObjectId,
  name: string,
  designation?: string
}
```

### teachers

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  schoolId: ObjectId,
  employeeCode?: string,
  name: string,
  assignedClassIds: ObjectId[],
  assignedSubjectIds: ObjectId[]
}
```

### parents

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  schoolId: ObjectId,
  name: string,
  phone?: string,
  studentIds: ObjectId[]
}
```

### students

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  schoolId: ObjectId,
  admissionNumber: string,
  name: string,
  classId: ObjectId,
  sectionId?: ObjectId,
  parentIds: ObjectId[]
}
```

### guests

```ts
{
  _id: ObjectId,
  userId?: ObjectId,
  schoolId?: ObjectId,
  name?: string,
  email?: string,
  inquiryType?: string,
  expiresAt?: Date
}
```

## Password Login Flow

Endpoint:

```txt
POST /v1/auth/login
```

Request:

```json
{
  "email": "admin@school.com",
  "password": "Password@123"
}
```

Backend steps:

1. Normalize email to lowercase.
2. Find user by `normalizedEmail` and `isDeleted: false`.
3. Reject if user is not found.
4. Reject if `status` is not `active`.
5. Reject if `passwordHash` is missing.
6. Compare password with bcrypt.
7. If user has `schoolId`, load school and confirm school is active.
8. Create session.
9. Generate JWT.
10. Return token, role, schoolId, and profile summary.

Response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Login successful.",
  "type": "SUCCESS",
  "data": {
    "token": "jwt-token",
    "user": {
      "_id": "user-id",
      "email": "admin@school.com",
      "role": "school_admin",
      "schoolId": "school-id",
      "name": "School Admin"
    }
  }
}
```

## Google Login Flow

Endpoint:

```txt
POST /v1/auth/google
```

Request:

```json
{
  "idToken": "google-id-token",
  "role": "parent",
  "schoolCode": "ABC001"
}
```

Backend steps:

1. Verify the Google ID token using Google Auth library or Firebase Admin.
2. Read verified claims:
   - `email`
   - `email_verified`
   - `sub`
   - `name`
   - `picture`
3. Reject if `email_verified` is false.
4. Normalize email to lowercase.
5. Find an existing user by `googleSub` or `normalizedEmail`.
6. If user exists:
   - Attach `googleSub` if missing.
   - Set `authProviders.google = true`.
   - Validate role, status, and school.
   - Create session and return token.
7. If user does not exist:
   - Allow auto-create only for roles that the product allows.
   - Recommended auto-create roles: `parent`, `student`, `guest`.
   - Recommended invite-only roles: `super_admin`, `school_admin`, `school_operator`, `teacher`.
8. Return JWT and user profile summary.

Important security rule:

Google login proves ownership of an email address. It does not prove that the user should be a teacher, school admin, or operator. Staff and admin roles should be created or invited by an authorized admin first.

## Role Login Rules

### Super Admin

Creation:

- Created by environment seed, migration, or another Super Admin.
- Not created through public signup.
- Not created through Google auto-signup.

Login:

- Email/password login allowed.
- Google login allowed only if the Super Admin account already exists and the email matches.

Permissions:

- Create schools.
- Create and disable school admins.
- View all schools.
- Suspend schools.
- View platform-wide reports.

### School Admin

Creation:

- Created by Super Admin when a school is created.
- Can be invited by Super Admin.

Login:

- Email/password login allowed.
- Google login allowed only after the account exists.

Permissions:

- Manage one assigned school.
- Create operators.
- Create teachers.
- Create students.
- Link parents with students.
- Manage classes, sections, subjects, fees, notices, attendance setup, and exams.

### School Operator

Creation:

- Created by School Admin.

Login:

- Email/password login allowed.
- Google login allowed only after the account exists.

Permissions:

- Limited school operations.
- Example: student admission, fee entry, notices, attendance support.
- Cannot create School Admins.
- Cannot suspend school.
- Cannot access platform-wide settings.

### Teacher

Creation:

- Created or invited by School Admin or School Operator with permission.

Login:

- Email/password login allowed.
- Google login allowed only after the teacher account exists.

Permissions:

- View assigned classes and subjects.
- Mark attendance for assigned classes.
- Add homework.
- Add marks if permission is enabled.
- Communicate with linked students and parents.

### Parent

Creation:

- Created by School Admin or Operator.
- Can also be auto-created through Google login if the product allows parent self-onboarding.
- Must be linked to one or more students before accessing private student data.

Login:

- Email/password login allowed.
- Google login allowed.

Permissions:

- View linked student profile.
- View attendance, fees, notices, homework, report cards, and transport details.
- Cannot view unrelated students.

### Student

Creation:

- Created by School Admin, Operator, or import process.

Login:

- Email/password login allowed.
- Google login allowed if student email exists or the school permits student Google onboarding.

Permissions:

- View own profile, timetable, homework, notices, attendance, and marks.
- Cannot view another student.

### Guest

Creation:

- Guest can be anonymous or email-based.
- Guest can be created during admission inquiry or demo access.

Login:

- Google login can create a guest account.
- Email/password is optional and usually not needed for guest.

Permissions:

- Submit admission inquiry.
- View public school information.
- Cannot access student, teacher, fee, attendance, or private school data.

## Authorization Middleware

The backend should have middleware similar to the current `authService.validateAuth`, but expanded for roles and permissions.

Recommended middleware types:

```ts
authRequired()
roleRequired(["super_admin"])
schoolRoleRequired(["school_admin", "school_operator", "teacher"])
permissionRequired("students:create")
sameSchoolOnly()
```

Every protected request should produce an authenticated context:

```ts
request.auth = {
  userId: "...",
  schoolId: "...",
  role: "teacher",
  sessionId: "...",
  permissions: ["attendance:create"]
};
```

Controllers should use `request.auth.schoolId` instead of trusting `schoolId` from request body.

## Permission Matrix

| Feature | Super Admin | School Admin | Operator | Teacher | Parent | Student | Guest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create school | Yes | No | No | No | No | No | No |
| Create school admin | Yes | No | No | No | No | No | No |
| Manage school settings | View all | Yes | Limited | No | No | No | No |
| Create operators | No | Yes | No | No | No | No | No |
| Create teachers | No | Yes | Limited | No | No | No | No |
| Create students | No | Yes | Yes | No | No | No | No |
| Link parent to student | No | Yes | Yes | No | No | No | No |
| Mark attendance | No | Yes | Limited | Assigned classes | No | No | No |
| View student data | Platform support only | School only | School only | Assigned only | Linked only | Own only | No |
| View fees | Platform support only | School only | School only | No | Linked only | Own only | No |
| Submit inquiry | No | No | No | No | No | No | Yes |

## Token Strategy

Recommended approach:

- Access token expiry: 15 minutes to 1 hour.
- Refresh token expiry: 7 to 30 days.
- Store refresh token hash in `sessions`.
- Rotate refresh token on refresh.
- Revoke session on logout.

Simpler approach using current backend style:

- Single JWT token expiry: 7 days.
- Store the exact JWT in `sessions`.
- Validate JWT and session on every protected API.
- Delete session on logout.

The simpler approach matches the current codebase and is acceptable for an early version, but refresh tokens are better for production.

## API Endpoints

### Auth

```txt
POST /v1/auth/login
POST /v1/auth/google
POST /v1/auth/logout
GET  /v1/auth/me
POST /v1/auth/refresh
POST /v1/auth/forgot-password
POST /v1/auth/reset-password
```

### Super Admin

```txt
POST /v1/super-admin/schools
GET  /v1/super-admin/schools
GET  /v1/super-admin/schools/:schoolId
PUT  /v1/super-admin/schools/:schoolId
POST /v1/super-admin/schools/:schoolId/admins
PUT  /v1/super-admin/schools/:schoolId/status
```

### School Admin

```txt
POST /v1/school-admin/operators
POST /v1/school-admin/teachers
POST /v1/school-admin/students
POST /v1/school-admin/parents
POST /v1/school-admin/parents/link-student
GET  /v1/school-admin/dashboard
```

### Teacher

```txt
GET  /v1/teacher/classes
POST /v1/teacher/attendance
POST /v1/teacher/homework
POST /v1/teacher/marks
```

### Parent

```txt
GET /v1/parent/students
GET /v1/parent/students/:studentId/attendance
GET /v1/parent/students/:studentId/fees
GET /v1/parent/students/:studentId/report-card
```

### Student

```txt
GET /v1/student/profile
GET /v1/student/timetable
GET /v1/student/homework
GET /v1/student/attendance
GET /v1/student/report-card
```

### Guest

```txt
POST /v1/guest/inquiries
GET  /v1/guest/schools/:schoolCode/public-profile
```

## Suggested Route Metadata Pattern

This matches the existing backend style.

```ts
{
  method: "POST",
  path: "/v1/auth/login",
  joiSchemaForSwagger: {
    body: {
      email: Joi.string().email().lowercase().required(),
      password: Joi.string().required()
    },
    group: "Auth",
    description: "Login with email and password.",
    model: "Login"
  },
  rateLimit: true,
  handler: authController.login
}
```

Protected route example:

```ts
{
  method: "GET",
  path: "/v1/school-admin/dashboard",
  joiSchemaForSwagger: {
    headers: {
      authorization: Joi.string().required()
    },
    group: "School Admin",
    description: "Get school admin dashboard.",
    model: "SchoolAdminDashboard"
  },
  auth: Constants.AVAILABLE_AUTHS.SCHOOL_ADMIN,
  handler: schoolAdminController.getDashboard
}
```

## Constants

Recommended auth constants:

```ts
AVAILABLE_AUTHS = {
  SUPER_ADMIN: 1,
  SCHOOL_ADMIN: 2,
  SCHOOL_OPERATOR: 3,
  TEACHER: 4,
  PARENT: 5,
  STUDENT: 6,
  GUEST: 7,
  ANY_LOGGED_IN_USER: 8
}
```

Recommended roles:

```ts
USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  SCHOOL_ADMIN: "school_admin",
  SCHOOL_OPERATOR: "school_operator",
  TEACHER: "teacher",
  PARENT: "parent",
  STUDENT: "student",
  GUEST: "guest"
}
```

## Login Security Rules

Required:

- Hash all passwords with bcrypt.
- Never return password hashes in API responses.
- Normalize email before saving and login.
- Validate Google ID token server-side.
- Require verified Google email.
- Do not auto-create admin, operator, or teacher accounts from Google login.
- Store login sessions in DB.
- Check session status on every protected API.
- Rate-limit login and forgot-password endpoints.
- Log failed login attempts.
- Use generic login failure messages.
- Reject login if school is suspended or deleted.
- Reject login if user is inactive, blocked, or deleted.

Recommended:

- Add account lock after repeated failed attempts.
- Add two-factor authentication for Super Admin and School Admin.
- Store refresh token hash instead of raw refresh token.
- Add device/session listing for admins.
- Add audit logs for sensitive actions.

## School Creation Flow

Only Super Admin can create a school.

Flow:

1. Super Admin logs in.
2. Super Admin creates school.
3. Backend creates school record.
4. Backend creates first School Admin user.
5. Backend creates School Admin profile.
6. Backend sends invite or temporary password email.
7. School Admin logs in and completes setup.

Example endpoint:

```txt
POST /v1/super-admin/schools
```

Request:

```json
{
  "schoolName": "Green Valley School",
  "schoolCode": "GVS001",
  "adminName": "Primary Admin",
  "adminEmail": "admin@gvs.edu"
}
```

## Parent And Student Linking

Parents should never receive access to all students in a school.

Access should come from an explicit relationship:

```ts
{
  parentId: ObjectId,
  studentId: ObjectId,
  schoolId: ObjectId,
  relation: "father" | "mother" | "guardian",
  status: "active"
}
```

When a parent requests student data, backend must check:

1. Parent is logged in.
2. Parent session is active.
3. Student belongs to the same school.
4. Parent is linked to the student.

## Guest Access

Guest access should be limited.

Allowed:

- School public profile.
- Admission inquiry.
- Contact form.
- Demo request.

Not allowed:

- Attendance.
- Fees.
- Student details.
- Teacher records.
- Parent records.
- Admin dashboard.

Guest login through Google can create a lightweight guest account if the product needs inquiry tracking.

## Current Backend Mapping

Current backend file mapping:

| Current File | Current Purpose | Future Expansion |
| --- | --- | --- |
| `src/server.ts` | Starts Express and MongoDB | Keep. |
| `src/startup/app.ts` | Registers middleware, routes, migrations, crons | Keep and add new route groups. |
| `src/utils/routeUtils.ts` | Adds auth, Joi, multer, rate limit, handler wrapper | Keep and expand auth types. |
| `src/services/authService.ts` | Validates admin sessions | Expand to all roles and permissions. |
| `src/controllers/adminController.ts` | Admin login/profile/logout/password reset | Split into `authController`, `superAdminController`, `schoolAdminController`. |
| `src/models/adminModel.ts` | Current admin login data | Replace or migrate toward central `userModel`. |
| `src/models/sessionModel.ts` | Server-side token sessions | Keep and add role, schoolId, metadata. |
| `src/utils/dbMigration.ts` | Seeds first admin | Seed first Super Admin. |

## Recommended Folder Structure

```txt
src/
  controllers/
    authController.ts
    superAdminController.ts
    schoolAdminController.ts
    teacherController.ts
    parentController.ts
    studentController.ts
    guestController.ts
  models/
    userModel.ts
    schoolModel.ts
    schoolMembershipModel.ts
    sessionModel.ts
    loginAuditModel.ts
    teacherModel.ts
    parentModel.ts
    studentModel.ts
  routes/
    api/
      v1/
        authRoutes.ts
        superAdminRoutes.ts
        schoolAdminRoutes.ts
        teacherRoutes.ts
        parentRoutes.ts
        studentRoutes.ts
        guestRoutes.ts
  services/
    authService.ts
    googleAuthService.ts
    permissionService.ts
    databaseService.ts
  middleware/
    requestLogger.ts
    errorHandler.ts
```

## Implementation Order

Recommended build order:

1. Add role constants and permission constants.
2. Add `schoolModel`.
3. Add central `userModel`.
4. Update `sessionModel` with `role` and `schoolId`.
5. Create `authController` for password login, Google login, logout, and profile.
6. Expand `authService` to validate all roles.
7. Add Super Admin school creation APIs.
8. Add School Admin user creation APIs.
9. Add teacher, parent, student, and guest route groups.
10. Add audit logging and rate limits.
11. Add tests for login, role access, school isolation, logout, and Google login.

## Key Rule

Authentication answers: who is this user?

Authorization answers: what is this user allowed to do?

Tenant isolation answers: which school data can this user access?

The backend must enforce all three on every protected API.
