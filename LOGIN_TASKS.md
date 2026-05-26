# Login Microservice Task Breakdown

Reference: [LOGIN_ARCHITECTURE.md](LOGIN_ARCHITECTURE.md)

## Completed In This Pass

- [x] Keep login code inside `services/auth-service`.
- [x] Keep login routing/proxy code inside `services/api-gateway`.
- [x] Add auth-service `schools` model so login can enforce tenant status.
- [x] Implement password login at `POST /v1/auth/login`.
- [x] Implement Google login endpoint at `POST /v1/auth/google`.
- [x] Allow Google auto-create only for `parent`, `student`, and `guest`.
- [x] Reject inactive, blocked, deleted, or non-active-school users during login.
- [x] Create server-side session records for successful login.
- [x] Generate JWTs with `userId`, `role`, `schoolId`, and `sessionId`.
- [x] Validate JWT and active session through `POST /v1/internal/auth/validate`.
- [x] Revoke sessions through `POST /v1/auth/logout`.
- [x] Return current user/session through `GET /v1/auth/me`.
- [x] Record login audit rows for successful and failed login attempts.
- [x] Proxy `/v1/auth/*` from api-gateway to auth-service.
- [x] Make api-gateway auth middleware call auth-service internal validation.
- [x] Inject downstream auth headers: `x-user-id`, `x-user-role`, `x-school-id`, `x-session-id`.

## Next Steps

- [ ] Replace the placeholder Google verifier with `google-auth-library` or Firebase Admin.
- [ ] Implement refresh token rotation or remove the placeholder `POST /v1/auth/refresh`.
- [ ] Implement full forgot/reset password flows with reset sessions.
- [ ] Add Super Admin school creation APIs.
- [ ] Add School Admin user creation APIs for operators, teachers, students, and parents.
- [ ] Add role-specific profile models and linking flows.
- [ ] Add permission middleware for school-scoped protected services.
- [ ] Add integration tests with a test MongoDB instance for successful login, logout, school suspension, and Google role restrictions.
