# School CRUD Implementation Plan

This document is for junior developers implementing the full school setup flow for the School Management System.

Goal: build one school setup module that works for any school type: state board, CBSE, ICSE, IB, Cambridge, international, pre-primary, higher secondary, coaching-style, or mixed campus.

Do this carefully now so we do not keep changing fields later.

## Current Project Context

The backend is a TypeScript + Express + MongoDB monorepo.

Important existing folders:

```txt
services/api-gateway
services/auth-service
services/school-service
packages/common
tests
```

Current school service already has simple CRUD:

```txt
POST /v1/schools
GET  /v1/schools
GET  /v1/schools/:id
GET  /v1/schools/code/:code
PUT  /v1/schools/:id
PUT  /v1/schools/:id/status
```

Frontend must call only API Gateway:

```txt
http://localhost:3000/v1/schools
```

Do not call school service directly from frontend.

## Role Rules

Use existing roles from `packages/common/src/constants/roles.ts`.

```txt
super_admin     -> can list and view all schools, approve/suspend later, read-only for school setup
school_admin    -> can create school and update only schools they own
school_operator -> later can manage day-to-day school data after permission system is ready
teacher         -> no school CRUD
parent          -> no school CRUD
student         -> no school CRUD
guest           -> no school CRUD
```

For this implementation:

```txt
Create school        -> school_admin only
Update school        -> school_admin only, own school only
Update school status -> school_admin only for now, own school only
List schools         -> super_admin all, school_admin own schools
View school          -> super_admin all, school_admin own schools
Delete school        -> do not implement hard delete
Soft delete school   -> optional later, school_admin own school only
```

API Gateway already sends these headers after token validation:

```txt
x-user-id
x-user-role
x-school-id
x-session-id
```

School service must trust only these gateway headers, not frontend body fields for ownership.

## Backend Data Model

Update `services/school-service/src/models/schoolModel.ts` and `services/school-service/src/interfaces/schoolInterface.ts`.

Keep existing fields:

```txt
name
code
status
address
contactEmail
contactPhone
createdBy
isDeleted
createdAt
updatedAt
```

Add structured fields below.

### School Identity Fields

```ts
displayName?: string;
legalName?: string;
shortName?: string;
registrationNumber?: string;
affiliationNumber?: string;
establishedYear?: number;
schoolType: 'day_school' | 'boarding_school' | 'day_boarding' | 'online_school' | 'coaching_center';
ownershipType: 'private' | 'government' | 'government_aided' | 'trust' | 'society' | 'missionary' | 'other';
campusType: 'single_campus' | 'multi_campus';
```

`name` remains the main required school name. `code` remains the unique tenant code.

### Board And Curriculum Fields

One school can support multiple boards.

```ts
boards: Array<{
  boardType: 'state_board' | 'cbse' | 'icse' | 'isc' | 'ib' | 'cambridge' | 'nios' | 'other';
  boardName?: string;
  state?: string;
  affiliationCode?: string;
  isPrimary: boolean;
}>;
```

Examples:

```json
[
  { "boardType": "cbse", "boardName": "CBSE", "isPrimary": true },
  { "boardType": "state_board", "boardName": "Karnataka State Board", "state": "Karnataka", "isPrimary": false }
]
```

Rules:

```txt
At least one board is required.
Exactly one board should have isPrimary = true.
For state_board, state is required.
For other, boardName is required.
```

### Medium Fields

School can support multiple mediums.

```ts
mediums: Array<'english' | 'hindi' | 'regional' | 'urdu' | 'sanskrit' | 'french' | 'other'>;
primaryMedium: 'english' | 'hindi' | 'regional' | 'urdu' | 'sanskrit' | 'french' | 'other';
regionalMediumName?: string;
otherMediumName?: string;
```

Frontend must use multi-select for `mediums`.

Examples:

```json
{
  "mediums": ["english", "hindi"],
  "primaryMedium": "english"
}
```

Rules:

```txt
At least one medium is required.
primaryMedium must exist inside mediums.
If mediums includes regional, regionalMediumName is required.
If mediums includes other, otherMediumName is required.
```

### Academic Structure Fields

These fields decide which classes are automatically created.

```ts
academicLevels: Array<'pre_primary' | 'primary' | 'middle' | 'secondary' | 'higher_secondary'>;
classRange: {
  from: string;
  to: string;
};
sectionsPerClassDefault: number;
sectionNamesDefault: string[];
academicYearStartMonth: number;
academicYearEndMonth: number;
workingDays?: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
```

Allowed class values:

```txt
nursery
lkg
ukg
class_1
class_2
class_3
class_4
class_5
class_6
class_7
class_8
class_9
class_10
class_11
class_12
```

Rules:

```txt
classRange.from and classRange.to are required.
Backend must validate from is not after to.
sectionsPerClassDefault default = 1.
sectionNamesDefault default = ["A"].
If sectionsPerClassDefault = 3, default names should be ["A", "B", "C"].
```

### Contact And Location Fields

Replace the loose address object with this structured shape, but keep backward compatibility by accepting old `address` during migration.

```ts
address: {
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
};
contact: {
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
};
principal?: {
  name?: string;
  email?: string;
  phone?: string;
};
```

Keep `contactEmail` and `contactPhone` temporarily for existing API compatibility. When create/update receives `contact.email`, also set `contactEmail`. When it receives `contact.phone`, also set `contactPhone`.

### Branding And Settings Fields

```ts
branding?: {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
};
settings: {
  timezone: string;
  currency: string;
  dateFormat: 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'YYYY-MM-DD';
  attendanceType: 'daily' | 'period_wise' | 'both';
  gradingSystem: 'marks' | 'grades' | 'both';
};
```

Defaults:

```txt
timezone = Asia/Kolkata
currency = INR
dateFormat = DD-MM-YYYY
attendanceType = daily
gradingSystem = marks
```

## New Collections

Do not store all future academic data inside the school document. Create separate collections.

### school_classes

Create this collection in `services/school-service`.

```ts
{
  _id: ObjectId;
  schoolId: ObjectId;
  name: string;
  code: string;
  order: number;
  level: 'pre_primary' | 'primary' | 'middle' | 'secondary' | 'higher_secondary';
  boardType?: string;
  mediums: string[];
  sections: Array<{
    name: string;
    code: string;
    capacity?: number;
    isActive: boolean;
  }>;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

Indexes:

```txt
unique: schoolId + code + isDeleted false
index: schoolId + isActive
index: schoolId + order
```

Class examples:

```txt
nursery -> Nursery
lkg     -> LKG
ukg     -> UKG
class_1 -> Class 1
class_12 -> Class 12
```

### school_setup_audits

Optional but recommended for debugging.

```ts
{
  schoolId: ObjectId;
  action: 'school_created' | 'school_updated' | 'classes_generated' | 'setup_failed';
  actorId: ObjectId;
  metadata: object;
  createdAt: Date;
}
```

## Automatic Class Creation

When a school is created, backend must automatically create classes from `classRange`.

Example request:

```json
{
  "name": "Green Valley School",
  "code": "GVS001",
  "boards": [{ "boardType": "cbse", "boardName": "CBSE", "isPrimary": true }],
  "mediums": ["english", "hindi"],
  "primaryMedium": "english",
  "academicLevels": ["primary", "middle", "secondary"],
  "classRange": { "from": "class_1", "to": "class_10" },
  "sectionsPerClassDefault": 2,
  "sectionNamesDefault": ["A", "B"]
}
```

Backend creates:

```txt
Class 1  sections A, B
Class 2  sections A, B
Class 3  sections A, B
Class 4  sections A, B
Class 5  sections A, B
Class 6  sections A, B
Class 7  sections A, B
Class 8  sections A, B
Class 9  sections A, B
Class 10 sections A, B
```

Use a MongoDB transaction if the current MongoDB setup supports transactions.

Flow:

```txt
1. Validate request body.
2. Normalize school code uppercase.
3. Normalize mediums and boards.
4. Start DB transaction.
5. Create school.
6. Generate class list from classRange.
7. Insert school_classes.
8. Commit transaction.
9. Return school and generatedClasses count.
```

If transactions are not available in local MongoDB:

```txt
1. Create school.
2. Try creating classes.
3. If class creation fails, soft-delete the school and return error.
4. Log setup_failed audit.
```

Response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "School created successfully.",
  "type": "SUCCESS",
  "data": {
    "school": {},
    "generatedClasses": 10
  }
}
```

## Backend Implementation Steps

### Step 1: Add Constants

Update `packages/common/src/constants`.

Add constants for:

```txt
SCHOOL_BOARD_TYPES
SCHOOL_MEDIUMS
SCHOOL_TYPES
SCHOOL_OWNERSHIP_TYPES
SCHOOL_CAMPUS_TYPES
ACADEMIC_LEVELS
SCHOOL_CLASS_CODES
WEEK_DAYS
DATE_FORMATS
ATTENDANCE_TYPES
GRADING_SYSTEMS
```

Export them from the common constants index.

Do not hardcode these lists separately in frontend and backend. Frontend can maintain labels, but values must match backend constants.

### Step 2: Update Interfaces

Update:

```txt
services/school-service/src/interfaces/schoolInterface.ts
```

Create additional interfaces:

```txt
SchoolBoardInterface
SchoolAddressInterface
SchoolContactInterface
SchoolSettingsInterface
SchoolClassInterface
```

### Step 3: Update School Schema

Update:

```txt
services/school-service/src/models/schoolModel.ts
```

Use nested schemas for:

```txt
boards
address
contact
principal
branding
settings
classRange
```

Important schema rules:

```txt
boards required, min length 1
mediums required, min length 1
primaryMedium required
classRange.from required
classRange.to required
createdBy required
isDeleted default false
status default active
```

Keep existing unique index:

```ts
schoolSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
```

Add useful indexes:

```ts
schoolSchema.index({ createdBy: 1, isDeleted: 1 });
schoolSchema.index({ status: 1, isDeleted: 1 });
schoolSchema.index({ 'boards.boardType': 1 });
schoolSchema.index({ mediums: 1 });
```

### Step 4: Create School Class Model

Add:

```txt
services/school-service/src/models/schoolClassModel.ts
```

Export it from:

```txt
services/school-service/src/models/index.ts
```

### Step 5: Add Class Generation Utility

Add:

```txt
services/school-service/src/utils/classGenerator.ts
```

Responsibilities:

```txt
Return ordered class codes from from/to.
Map class code to display name.
Map class code to academic level.
Build sections from sectionNamesDefault.
Validate selected range.
```

Recommended ordered list:

```ts
const CLASS_ORDER = [
  'nursery',
  'lkg',
  'ukg',
  'class_1',
  'class_2',
  'class_3',
  'class_4',
  'class_5',
  'class_6',
  'class_7',
  'class_8',
  'class_9',
  'class_10',
  'class_11',
  'class_12'
];
```

### Step 6: Update Joi Validation

Update:

```txt
services/school-service/src/routes/schoolRoutes.ts
```

Create schemas for:

```txt
boardSchema
addressSchema
contactSchema
principalSchema
brandingSchema
settingsSchema
classRangeSchema
schoolPayloadSchema
schoolUpdateSchema
```

Validation must reject:

```txt
No board selected
Multiple primary boards
No medium selected
primaryMedium not present in mediums
regional medium without regionalMediumName
other medium without otherMediumName
Invalid class range
Invalid section count
Duplicate section names
```

### Step 7: Update Controller

Update:

```txt
services/school-service/src/controllers/schoolController.ts
```

Create helper functions:

```txt
normalizeSchoolPayload
validateSchoolBusinessRules
createSchoolWithClasses
syncLegacyContactFields
```

Do not let frontend send:

```txt
createdBy
isDeleted
createdAt
updatedAt
```

Always set `createdBy` from `x-user-id`.

For update:

```txt
Allow updating school profile fields.
Do not automatically regenerate classes on every school update.
If classRange changes, require a separate endpoint later: POST /v1/schools/:id/classes/regenerate-preview.
```

Reason: changing class range after students exist can break data.

### Step 8: Add Class Read Endpoints

Add these now because frontend will need them after school creation:

```txt
GET /v1/schools/:id/classes
GET /v1/schools/:id/classes/:classId
```

Access:

```txt
super_admin     -> can read all
school_admin    -> can read own school classes
school_operator -> later
teacher         -> later with schoolId permission
```

Do not add class update/delete yet unless needed.

### Step 9: API Gateway

Current gateway proxies all `/v1/schools/*` routes to school service.

Verify:

```txt
POST /v1/schools
GET  /v1/schools/:id/classes
```

are proxied correctly.

If class read should be available to more roles later, update:

```txt
services/api-gateway/src/routes/schoolProxy.ts
```

For this first implementation, keep current roles:

```txt
super_admin
school_admin
```

### Step 10: Swagger

Update:

```txt
services/school-service/src/docs/swagger.ts
services/api-gateway/src/docs/swagger.ts
swagger.json if still used manually
```

Document all new fields and example create request.

## API Contract

### Create School

```http
POST /v1/schools
Authorization: Bearer ACCESS_TOKEN
Content-Type: application/json
```

Required minimum body:

```json
{
  "name": "Green Valley School",
  "code": "GVS001",
  "schoolType": "day_school",
  "ownershipType": "private",
  "campusType": "single_campus",
  "boards": [
    {
      "boardType": "cbse",
      "boardName": "CBSE",
      "isPrimary": true
    }
  ],
  "mediums": ["english"],
  "primaryMedium": "english",
  "academicLevels": ["primary", "middle", "secondary"],
  "classRange": {
    "from": "class_1",
    "to": "class_10"
  },
  "sectionsPerClassDefault": 1,
  "sectionNamesDefault": ["A"],
  "academicYearStartMonth": 4,
  "academicYearEndMonth": 3,
  "address": {
    "line1": "12 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India",
    "pincode": "560001"
  },
  "contact": {
    "email": "admin@gvs.example",
    "phone": "9876543210"
  }
}
```

Recommended full body includes:

```txt
displayName
legalName
shortName
registrationNumber
affiliationNumber
establishedYear
principal
branding
settings
workingDays
```

### List Schools

```http
GET /v1/schools?page=1&limit=20&search=green&status=active&boardType=cbse&medium=english
```

Add filters:

```txt
boardType
medium
schoolType
state
city
```

### Get Classes

```http
GET /v1/schools/:id/classes
```

Response:

```json
{
  "statusCode": 200,
  "status": true,
  "message": "School classes fetched successfully.",
  "type": "SUCCESS",
  "data": {
    "classes": [
      {
        "_id": "6657770fdc1e7c6151879001",
        "schoolId": "6657770fdc1e7c6151878001",
        "name": "Class 1",
        "code": "class_1",
        "order": 4,
        "level": "primary",
        "mediums": ["english"],
        "sections": [
          { "name": "A", "code": "A", "isActive": true }
        ],
        "isActive": true
      }
    ]
  }
}
```

## Frontend Implementation Plan

Frontend should implement school setup as a proper form flow, not one giant confusing form.

### Screens

Create these screens:

```txt
School List
School Details
Create School
Edit School
School Classes
```

### Role Based UI

```txt
super_admin
- Show school list and details.
- Hide create/edit buttons.
- Show status badge.

school_admin
- Show own school list.
- Show create school button.
- Show edit button for own schools.
- Show classes created after school creation.
```

Frontend must still handle backend 401/403 errors because UI hiding is not security.

### Create School Form Sections

Use these sections:

```txt
1. Basic Details
2. Board and Medium
3. Academic Setup
4. Contact and Address
5. Branding and Settings
6. Review and Create
```

Do not submit until the final review step.

### Basic Details Fields

```txt
name                  required text
displayName           optional text
legalName             optional text
shortName             optional text
code                  required text, uppercase preview
registrationNumber    optional text
affiliationNumber     optional text
establishedYear       optional number
schoolType            required select
ownershipType         required select
campusType            required select
```

### Board And Medium Fields

Boards:

```txt
boardType       select
boardName       text
state           select/text, required for state_board
affiliationCode text
isPrimary       radio/checkbox but only one board can be primary
```

Frontend controls:

```txt
Add Board button
Remove Board button
Primary Board radio
```

Mediums:

```txt
mediums            multi-select
primaryMedium      select from selected mediums only
regionalMediumName show only if regional selected
otherMediumName    show only if other selected
```

Important: English and Hindi must be selectable together.

### Academic Setup Fields

```txt
academicLevels           multi-select
classRange.from          select
classRange.to            select
sectionsPerClassDefault  number
sectionNamesDefault      editable chips/input list
academicYearStartMonth   select month
academicYearEndMonth     select month
workingDays              checkbox group
```

Add class preview before submit:

```txt
Selected range: Class 1 to Class 10
Classes to create: 10
Sections per class: A, B
```

Frontend should generate preview using same ordered class list as backend. Backend remains source of truth.

### Contact And Address Fields

```txt
address.line1       required
address.line2       optional
address.landmark    optional
address.city        required
address.district    optional
address.state       required
address.country     required default India
address.pincode     required
address.latitude    optional
address.longitude   optional
contact.email       required email
contact.phone       required phone
contact.alternatePhone optional
contact.website     optional
principal.name      optional
principal.email     optional
principal.phone     optional
```

### Branding And Settings Fields

```txt
branding.logoUrl          optional
branding.primaryColor     color picker
branding.secondaryColor   color picker
settings.timezone         select default Asia/Kolkata
settings.currency         select default INR
settings.dateFormat       select default DD-MM-YYYY
settings.attendanceType   select default daily
settings.gradingSystem    select default marks
```

### Frontend Validation

Frontend must validate before API call:

```txt
name required
code required
at least one board
only one primary board
state required when boardType = state_board
at least one medium
primaryMedium selected from mediums
class from/to valid
sections count matches names
required address fields
valid contact email and phone
```

Still show backend error messages exactly from API response `message`.

## Implementation Order

Follow this order to avoid rework.

```txt
1. Add shared constants.
2. Add school class model.
3. Add class generator utility and unit tests.
4. Extend school interface and schema.
5. Extend Joi validation.
6. Update create school controller to create school + classes.
7. Add class list endpoint.
8. Add filters to school list.
9. Update swagger docs.
10. Add backend tests.
11. Build frontend create school form.
12. Build frontend school list/details/classes views.
13. Test full flow through API Gateway.
```

## Backend Test Checklist

Add or update tests in `tests/school-service.test.js`.

Required tests:

```txt
School model accepts board, medium, academic setup fields.
School model rejects invalid status.
Create school normalizes code uppercase.
Create school syncs contact.email to contactEmail.
Create school syncs contact.phone to contactPhone.
Class generator returns correct range nursery to class_12.
Class generator rejects invalid from/to order.
Create school with class_1 to class_10 creates 10 classes.
Each generated class has default sections.
Duplicate school code returns already exists error.
school_admin cannot read another admin school.
super_admin can read all schools.
GET /v1/schools/:id/classes returns generated classes.
```

Run:

```txt
npm test
npm run build:all
```

## Manual QA Flow

Use this flow after implementation:

```txt
1. Login as school_admin.
2. Create school with CBSE board, English + Hindi medium, Class 1 to Class 10, sections A and B.
3. Confirm success response includes generatedClasses = 10.
4. Open school details.
5. Open school classes.
6. Confirm classes Class 1 to Class 10 exist.
7. Confirm every class has sections A and B.
8. Login as super_admin.
9. Confirm super_admin can view the school but cannot edit from UI.
10. Try duplicate school code and verify error message.
```

## Important Decisions

```txt
Do not regenerate classes automatically on normal school update.
Do not hard delete schools.
Do not allow frontend to send createdBy.
Do not store future students/teachers/fees inside school document.
Do not make board a single select because many schools run multiple boards.
Do not make medium a single select because many schools teach in English + Hindi or English + regional.
```

## Future Work

After school CRUD is stable, implement these separately:

```txt
School branch/campus management
Class update and section update
Academic year management
Subject templates by board/class
House management
Department management
User invitation for school operators and teachers
Permission system for school_operator
Logo file upload instead of logoUrl text
School approval workflow by super_admin
```

## Done Definition

This task is complete only when:

```txt
School create accepts full setup fields.
School create automatically creates classes.
School list and detail work through API Gateway.
School classes can be fetched through API Gateway.
Role rules are enforced in gateway and school service.
Frontend has create/list/detail/classes screens.
Tests pass.
Swagger/docs are updated.
```
