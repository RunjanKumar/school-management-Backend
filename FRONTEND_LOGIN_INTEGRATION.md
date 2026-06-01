# Frontend Login Integration Guide

This document explains how the frontend should integrate login with the School Management backend.

## Base URL

Frontend must call the API Gateway, not auth-service directly.

```txt
http://localhost:3000
```

Swagger:

```txt
http://localhost:3000/api-docs
```

## Auth Endpoints

```txt
POST /v1/auth/login
POST /v1/auth/google
GET  /v1/auth/me
PUT  /v1/auth/me
POST /v1/auth/logout
POST /v1/auth/refresh
POST /v1/auth/forgot-password
POST /v1/auth/reset-password
POST /v1/auth/school-admins
```

## Role Values

```txt
super_admin
school_admin
school_operator
teacher
parent
student
guest
```

## Email Password Login

Request:

```http
POST http://localhost:3000/v1/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@school.com",
  "password": "superadmin123",
  "deviceId": "browser-device-id"
}
```

Success response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Login successful.",
  "type": "SUCCESS",
  "data": {
    "token": "access-jwt",
    "refreshToken": "refresh-jwt",
    "sessionId": "session-id",
    "user": {
      "_id": "user-id",
      "email": "admin@school.com",
      "role": "super_admin",
      "schoolId": null,
      "profileRef": null,
      "profileModel": null
    }
  }
}
```

Frontend should store:

```txt
data.token
data.refreshToken
data.user
data.user.role
data.user.schoolId
```

## Google Login

The backend does not open the Google popup. The frontend opens the popup using Firebase Auth, gets a Firebase ID token, and sends that token to the backend.

Flow:

```txt
User clicks Continue with Google
→ Firebase opens Google account popup
→ User selects Gmail
→ Frontend calls user.getIdToken()
→ Frontend sends ID token to POST /v1/auth/google
→ Backend verifies Firebase token
→ Backend returns app JWT and refresh token
```

### Firebase Console Setup

In Firebase Console:

```txt
Authentication → Sign-in method → Google → Enable → Save
```

Then create a web app:

```txt
Project settings → General → Your apps → Add app → Web
```

Copy the frontend Firebase config. It looks like:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "school-management-system-b09cf.firebaseapp.com",
  projectId: "school-management-system-b09cf",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

This frontend config is safe to share with frontend developers.

Do not share the backend service account JSON.

### Firebase Frontend Code

Install:

```bash
npm install firebase
```

Example:

```js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "school-management-system-b09cf.firebaseapp.com",
  projectId: "school-management-system-b09cf",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  const response = await fetch("http://localhost:3000/v1/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      idToken,
      role: "parent",
      schoolCode: "ABC001",
      deviceId: "browser-device-id"
    })
  });

  const payload = await response.json();

  if (!response.ok || !payload.status) {
    throw new Error(payload.message || "Google login failed");
  }

  localStorage.setItem("token", payload.data.token);
  localStorage.setItem("refreshToken", payload.data.refreshToken);
  localStorage.setItem("user", JSON.stringify(payload.data.user));

  return payload.data;
}
```

Google login request:

```http
POST http://localhost:3000/v1/auth/google
Content-Type: application/json
```

Body:

```json
{
  "idToken": "REAL_FIREBASE_ID_TOKEN",
  "role": "parent",
  "schoolCode": "ABC001",
  "deviceId": "browser-device-id"
}
```

Important rules:

- Google auto-create is allowed only for `parent`, `student`, and `guest`.
- Google auto-create is rejected for `super_admin`, `school_admin`, `school_operator`, and `teacher`.
- Staff/admin users must already exist before they can use Google login.
- `parent` and `student` need a valid `schoolCode`.
- `guest` can be tested without `schoolCode`.

Local backend dev token:

```json
{
  "idToken": "dev-google-token",
  "role": "guest",
  "deviceId": "browser-device-id"
}
```

Use this only for local testing. Real frontend should use Firebase ID tokens.

## Auth Header For Protected APIs

After login, send the access token:

```http
Authorization: Bearer ACCESS_TOKEN
```

Example:

```js
async function getMe() {
  const token = localStorage.getItem("token");

  const response = await fetch("http://localhost:3000/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.json();
}
```

## Refresh Token

When an API returns `401`, frontend should try refresh once.

Request:

```http
POST http://localhost:3000/v1/auth/refresh
Content-Type: application/json
```

Body:

```json
{
  "refreshToken": "refresh-jwt"
}
```

Success response includes new tokens:

```json
{
  "status": true,
  "data": {
    "token": "new-access-jwt",
    "refreshToken": "new-refresh-jwt",
    "sessionId": "session-id"
  }
}
```

Frontend should replace both stored tokens.

Recommended behavior:

```txt
API call gets 401
→ call /v1/auth/refresh
→ save new token and refreshToken
→ retry original API once
→ if refresh fails, logout user
```

## Logout

This logout API works for every logged-in role:

```txt
super_admin
school_admin
school_operator
teacher
parent
student
guest
```

Request:

```http
POST http://localhost:3000/v1/auth/logout
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "refreshToken": "refresh-jwt"
}
```

After success, frontend should clear:

```txt
token
refreshToken
user
```

## Update Basic Profile

Only `super_admin` and `school_admin` can update basic auth profile data right now.

```http
PUT http://localhost:3000/v1/auth/me
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "name": "Updated Admin Name"
}
```

Success response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "Profile updated successfully.",
  "type": "SUCCESS",
  "data": {
    "user": {
      "_id": "user-id",
      "email": "admin@school.com",
      "role": "school_admin",
      "schoolId": null,
      "name": "Updated Admin Name"
    }
  }
}
```

Frontend should replace stored `user` with `data.user`.

## Forgot Password

Request:

```http
POST http://localhost:3000/v1/auth/forgot-password
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@school.com"
}
```

In local development, backend may return a `resetToken` for testing. In production, this should be sent through email.

## Reset Password

Request:

```http
POST http://localhost:3000/v1/auth/reset-password
Content-Type: application/json
```

Body:

```json
{
  "token": "reset-token",
  "password": "NewPassword@123"
}
```

Password rule:

```txt
At least 8 characters, one uppercase, one lowercase, one number, one special character.
```

## Frontend Routing After Login

Use `user.role` from login response.

Suggested redirects:

```txt
super_admin      → /super-admin/dashboard
school_admin     → /school-admin/dashboard
school_operator  → /operator/dashboard
teacher          → /teacher/dashboard
parent           → /parent/dashboard
student          → /student/dashboard
guest            → /guest
```

For role-based admin/school UI behavior, see:

```txt
FRONTEND_ROLE_BASED_ADMIN_FLOW.md
```

## Super Admin Creates School Admin

Only `super_admin` can call this endpoint.

```http
POST http://localhost:3000/v1/auth/school-admins
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Body:

```json
{
  "name": "Green Valley Admin",
  "email": "admin@gvs.example",
  "password": "SchoolAdmin@123"
}
```

The created user has role `school_admin`. That school admin then logs in and creates schools from the school admin UI.

## Error Handling

Failed login example:

```json
{
  "statusCode": 401,
  "status": false,
  "message": "Invalid email or password.",
  "type": "UNAUTHORIZED"
}
```

Frontend should display `message`.

Do not show special messages like "email not found" or "wrong password". The backend intentionally uses generic login errors for security.

## What Not To Share

Do not share or commit:

```txt
firebase-service-account.json
private_key
JWT_SECRET
JWT_REFRESH_SECRET
INTERNAL_API_KEY
SMTP_PASSWORD
```

Safe to share with frontend:

```txt
Firebase web config
API Gateway base URL
Swagger URL
Role list
Endpoint request/response examples
```
