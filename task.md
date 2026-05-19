# 🏫 School Management Login Backend — Weekly Task Plan

> **Deadline:** This Week (Mon 19 May – Sun 25 May 2026)
> **Architecture Reference:** [LOGIN_ARCHITECTURE.md](file:///d:/SCHOOL/school-management-backend/LOGIN_ARCHITECTURE.md)

---

## Day 1 — Monday (19 May) ✅ DONE

**Goal:** Boilerplate Setup

- [x] Project initialized (TypeScript + Express + MongoDB)
- [x] Folder structure created (`controllers/`, `models/`, `routes/`, `services/`, `middleware/`, etc.)
- [x] Base server, app startup, route utils, Joi validation in place
- [x] Existing `adminModel`, `sessionModel`, `authService`, `adminController` working
- [x] Environment config, logger, Swagger, rate limiter set up

---

## Day 2 — Tuesday (20 May) ✅ DONE

> [!IMPORTANT]
> **Goal:** Core Models, Constants & Auth Foundation
>
> This is the most critical day — everything else builds on top of these.

### Constants & Enums
- [x] Add `USER_ROLES` enum to `constants.ts` (`super_admin`, `school_admin`, `school_operator`, `teacher`, `parent`, `student`, `guest`)
- [x] Add `AVAILABLE_AUTHS` enum to `constants.ts` (numeric auth levels 1–8)
- [x] Add `USER_STATUS` enum (`pending`, `active`, `inactive`, `blocked`)
- [x] Add `SCHOOL_STATUS` enum (`active`, `inactive`, `suspended`)
- [x] Add `AUTH_PROVIDERS` and `SESSION_TYPES` constants

### Models
- [x] Create `userModel.ts` — Central login identity table
  - Fields: `email`, `normalizedEmail`, `passwordHash`, `role`, `schoolId`, `profileRef`, `profileModel`, `authProviders`, `googleSub`, `emailVerified`, `status`, `lastLoginAt`, `isDeleted`
  - Indexes: unique on `normalizedEmail`, index on `googleSub`
- [x] Create `schoolModel.ts` — Tenant/school collection
  - Fields: `name`, `code`, `status`, `address`, `contactEmail`, `contactPhone`, `createdBy`, `isDeleted`
  - Index: unique on `code`
- [x] Update `sessionModel.ts` — Add `role`, `schoolId`, `refreshTokenHash`, `deviceId`, `ipAddress`, `userAgent`, `revokedAt`
- [x] Create `loginAuditModel.ts` — Security audit trail
  - Fields: `userId`, `email`, `schoolId`, `role`, `loginMethod`, `success`, `failureReason`, `ipAddress`, `userAgent`
- [x] Update `models/index.ts` to export all new models

### DB Migration / Seed
- [x] Update `dbMigration.ts` to seed first Super Admin (instead of generic admin)

### Deliverables
> By end of Day 2: All core models created, constants defined, seed updated. You can verify by running the server and checking MongoDB collections.

---

## Day 3 — Wednesday (21 May)

**Goal:** Auth Controller — Login, Logout, Profile & Google Auth

### Auth Service Expansion
- [ ] Expand `authService.ts` → `validateAuth` to support all 7 roles + `ANY_LOGGED_IN_USER`
- [ ] Add school status check in auth validation (reject if school suspended/deleted)
- [ ] Add `request.auth` context object (`userId`, `schoolId`, `role`, `sessionId`, `permissions`)

### Auth Controller
- [ ] Create `authController.ts` with:
  - [ ] `POST /v1/auth/login` — Email/password login flow (normalize email → find user → check status → bcrypt compare → check school status → create session → generate JWT → return token + profile)
  - [ ] `POST /v1/auth/logout` — Revoke/delete session
  - [ ] `GET /v1/auth/me` — Return current user profile from session

### Google Auth
- [ ] Create `googleAuthService.ts` — Verify Google ID token, extract claims
- [ ] Add `POST /v1/auth/google` — Google login endpoint
  - Find user by `googleSub` or `normalizedEmail`
  - If exists: validate role/status/school → create session
  - If not exists: auto-create only for `parent`, `student`, `guest` roles
  - Reject auto-create for admin/operator/teacher roles

### Auth Routes
- [ ] Create `authRoutes.ts` with Joi schemas for all auth endpoints
- [ ] Register auth routes in app startup

### Deliverables
> By end of Day 3: Login, logout, Google login, and `/me` endpoints working. Test with Postman/Swagger.

---

## Day 4 — Thursday (22 May)

**Goal:** Super Admin APIs + School Admin APIs

### Super Admin Controller
- [ ] Create `superAdminController.ts`:
  - [ ] `POST /v1/super-admin/schools` — Create school + first school admin user + profile + send invite/temp password
  - [ ] `GET /v1/super-admin/schools` — List all schools
  - [ ] `GET /v1/super-admin/schools/:schoolId` — Get school details
  - [ ] `PUT /v1/super-admin/schools/:schoolId` — Update school info
  - [ ] `PUT /v1/super-admin/schools/:schoolId/status` — Suspend/activate school
  - [ ] `POST /v1/super-admin/schools/:schoolId/admins` — Add school admin

### Super Admin Routes
- [ ] Create `superAdminRoutes.ts` with Joi schemas + `roleRequired(["super_admin"])`

### School Admin Controller
- [ ] Create `schoolAdminController.ts`:
  - [ ] `POST /v1/school-admin/operators` — Create operator user + profile
  - [ ] `POST /v1/school-admin/teachers` — Create teacher user + profile
  - [ ] `POST /v1/school-admin/students` — Create student user + profile
  - [ ] `POST /v1/school-admin/parents` — Create parent user + profile
  - [ ] `POST /v1/school-admin/parents/link-student` — Link parent ↔ student
  - [ ] `GET /v1/school-admin/dashboard` — Dashboard summary

### School Admin Routes
- [ ] Create `schoolAdminRoutes.ts` with Joi schemas + `schoolRoleRequired(["school_admin"])`

### Role-Specific Profile Models
- [ ] Create `superAdminModel.ts` (userId, name)
- [ ] Create `schoolAdminModel.ts` (userId, schoolId, name, designation)
- [ ] Create `teacherModel.ts` (userId, schoolId, employeeCode, name, assignedClassIds, assignedSubjectIds)
- [ ] Create `parentModel.ts` (userId, schoolId, name, phone, studentIds)
- [ ] Create `studentModel.ts` (userId, schoolId, admissionNumber, name, classId, sectionId, parentIds)

### Deliverables
> By end of Day 4: Super Admin can create schools & assign school admins. School Admin can create operators, teachers, students, parents, and link them.

---

## Day 5 — Friday (23 May)

**Goal:** Teacher, Parent, Student & Guest APIs + Authorization Middleware

### Authorization Middleware
- [ ] Create `permissionService.ts` with middleware helpers:
  - `authRequired()` — any logged-in user
  - `roleRequired([...roles])` — platform-level role check
  - `schoolRoleRequired([...roles])` — school-scoped role check
  - `permissionRequired("feature:action")` — granular permission check
  - `sameSchoolOnly()` — enforce school tenant isolation
- [ ] Create permission matrix mapping (role → allowed permissions)

### Teacher Controller & Routes
- [ ] Create `teacherController.ts`:
  - [ ] `GET /v1/teacher/classes` — View assigned classes
  - [ ] `POST /v1/teacher/attendance` — Mark attendance for assigned classes
  - [ ] `POST /v1/teacher/homework` — Add homework
  - [ ] `POST /v1/teacher/marks` — Add marks
- [ ] Create `teacherRoutes.ts`

### Parent Controller & Routes
- [ ] Create `parentController.ts`:
  - [ ] `GET /v1/parent/students` — View linked students
  - [ ] `GET /v1/parent/students/:studentId/attendance` — Student attendance
  - [ ] `GET /v1/parent/students/:studentId/fees` — Student fees
  - [ ] `GET /v1/parent/students/:studentId/report-card` — Report card
- [ ] Create `parentRoutes.ts`

### Student Controller & Routes
- [ ] Create `studentController.ts`:
  - [ ] `GET /v1/student/profile` — Own profile
  - [ ] `GET /v1/student/timetable` — Timetable
  - [ ] `GET /v1/student/homework` — Homework list
  - [ ] `GET /v1/student/attendance` — Own attendance
  - [ ] `GET /v1/student/report-card` — Own report card
- [ ] Create `studentRoutes.ts`

### Guest Controller & Routes
- [ ] Create `guestController.ts`:
  - [ ] `POST /v1/guest/inquiries` — Submit admission inquiry
  - [ ] `GET /v1/guest/schools/:schoolCode/public-profile` — Public school info
- [ ] Create `guestRoutes.ts`
- [ ] Create `guestModel.ts` (userId, schoolId, name, email, inquiryType, expiresAt)

### SchoolMembership Model (Optional)
- [ ] Create `schoolMembershipModel.ts` if multi-school support needed for parents/teachers

### Deliverables
> By end of Day 5: All role-specific endpoints created. Full permission matrix enforced. Parent ↔ Student linking verified.

---

## Day 6 — Saturday (24 May)

**Goal:** Password Reset, Security Hardening & Testing

### Password Reset Flow
- [ ] Add `POST /v1/auth/forgot-password` — Generate reset token, create password-reset session, send email
- [ ] Add `POST /v1/auth/reset-password` — Validate reset token, update password hash, revoke reset session
- [ ] Add `POST /v1/auth/refresh` — Refresh token endpoint (if implementing refresh tokens)

### Security Hardening
- [ ] Rate-limit `login`, `forgot-password`, and `google` auth endpoints
- [ ] Add account lockout after 5 failed login attempts (with cooldown)
- [ ] Ensure passwords are never returned in any API response (use `.select("-passwordHash")`)
- [ ] Verify all school-scoped APIs use `request.auth.schoolId` not request body
- [ ] Add generic error messages for login failures ("Invalid credentials")
- [ ] Verify login blocked when school is suspended/inactive/deleted
- [ ] Verify login blocked when user is inactive/blocked/deleted
- [ ] Add `loginAudit` logging on every login attempt (success + failure)

### Session Management
- [ ] Session cleanup cron for expired sessions
- [ ] Verify logout properly revokes session
- [ ] Ensure JWT validation checks active session in DB

### Testing
- [ ] Test Super Admin login (email/password)
- [ ] Test School Admin login → school isolation
- [ ] Test Teacher login → can only access assigned classes
- [ ] Test Parent login → can only see linked students
- [ ] Test Student login → can only see own data
- [ ] Test Guest → limited to public endpoints
- [ ] Test Google login auto-create for parent/student/guest
- [ ] Test Google login rejected for admin/operator/teacher (no pre-existing account)
- [ ] Test login rejected for suspended school
- [ ] Test login rejected for blocked/inactive user
- [ ] Test logout invalidates session

### Deliverables
> By end of Day 6: Full security audit done. Password reset working. All login scenarios tested.

---

## Day 7 — Sunday (25 May)

**Goal:** Final Polish, Documentation & Deployment Prep

### Code Cleanup
- [ ] Remove old `adminController.ts` login logic (migrated to `authController`)
- [ ] Remove/migrate old `adminModel.ts` (replaced by `userModel`)
- [ ] Ensure all routes registered in app startup
- [ ] Final `models/index.ts` exports verified

### Documentation
- [ ] Update Swagger docs — all new endpoints visible and documented
- [ ] Update README with setup instructions, environment variables, and API overview
- [ ] Add Postman collection export (optional)

### Deployment Prep
- [ ] Verify `.env.example` has all required variables (JWT secret, Google client ID, MongoDB URI, etc.)
- [ ] Test full flow: Server start → Seed Super Admin → Login → Create School → Create Users → Role-based access
- [ ] Verify MongoDB indexes created properly
- [ ] Final build check (`npm run build`)

### Deliverables
> By end of Day 7: Production-ready auth system. Clean code, documented APIs, all tests passing.

---

## 📊 Progress Summary

| Day | Date | Focus | Status |
|-----|------|-------|--------|
| 1 | Mon 19 May | Boilerplate Setup | ✅ Done |
| **2** | **Tue 20 May** | **Core Models & Constants** | **✅ Done** |
| 3 | Wed 21 May | Auth Controller & Google Auth | ⬜ Pending |
| 4 | Thu 22 May | Super Admin & School Admin APIs | ⬜ Pending |
| 5 | Fri 23 May | Teacher, Parent, Student, Guest APIs | ⬜ Pending |
| 6 | Sat 24 May | Security, Password Reset & Testing | ⬜ Pending |
| 7 | Sun 25 May | Polish, Docs & Deployment | ⬜ Pending |
