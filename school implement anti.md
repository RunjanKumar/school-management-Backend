# 🏫 School CRUD — Full Implementation Plan

> **Author:** Antigravity AI · **Date:** 2026-06-08
> **Audience:** Junior developers who will implement this end-to-end.
> **Goal:** Build a rock-solid School CRUD that works for **every** school type — State Board, CBSE, ICSE, International (IB / Cambridge), and custom boards — **without ever needing schema changes later**.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [⭐ Master Data — Dynamic Options (Hybrid Approach)](#2-master-data--dynamic-options-hybrid-approach)
3. [Constants & Enums (hardcoded — rarely change)](#3-constants--enums-hardcoded)
4. [Backend — School Schema & Interface](#4-backend--school-schema--interface)
5. [Backend — Class Template Model (auto-created with school)](#5-backend--class-template-model)
6. [Backend — Section Model](#6-backend--section-model)
7. [Backend — Controller Logic](#7-backend--controller-logic)
8. [Backend — Joi Validation Schemas](#8-backend--joi-validation-schemas)
9. [Backend — Routes](#9-backend--routes)
10. [Backend — Response Messages](#10-backend--response-messages)
11. [Frontend — Pages & Components](#11-frontend--pages--components)
12. [Frontend — API Service Layer](#12-frontend--api-service-layer)
13. [Frontend — Form Field Reference](#13-frontend--form-field-reference)
14. [Auto-Class Generation Logic (board → classes)](#14-auto-class-generation-logic)
15. [Testing Checklist](#15-testing-checklist)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  School Form  →  API Service  →  POST/PUT /v1/schools       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────────┐
│                BACKEND (Node + Express + Mongoose)           │
│                                                              │
│  Route (Joi validation)                                      │
│    → Controller (business logic + auto-class creation)       │
│      → Model (Mongoose schema)                               │
│        → MongoDB                                             │
└──────────────────────────────────────────────────────────────┘
```

### Existing project structure (you will modify / add files in these locations):

| Layer | Microservice path | Monolith path |
|-------|-------------------|---------------|
| **Model** | `services/school-service/src/models/` | `src/models/` |
| **Interface** | `services/school-service/src/interfaces/` | `src/interfaces/` |
| **Controller** | `services/school-service/src/controllers/` | `src/controllers/` |
| **Routes** | `services/school-service/src/routes/` | `src/routes/api/v1/` |
| **Constants** | `packages/common/src/constants/` | same |
| **Validation** | in route files | in route files |

> ⚠️ **IMPORTANT:**
> **Always update BOTH the microservice (`services/school-service/`) and the monolith (`src/`) files** to keep them in sync. The monolith is used for local dev; the microservice for production deployment.

---

## 2. ⭐ Master Data — Dynamic Options (Hybrid Approach)

### 🧠 Design Decision: Hybrid Approach

Some dropdown options in the School form change across deployments — a Super Admin should be able to add/edit/delete them from the admin panel **without touching code**. Other options are universal and rarely change, so they stay as hardcoded constants.

| Field | Source | Who manages | How to add new option |
|-------|--------|-------------|----------------------|
| **Board** (CBSE, ICSE, State Board, IB...) | 🗄️ **Database** (`master_data` collection) | Super Admin via UI | Add from admin panel |
| **Medium** (English, Hindi, Marathi...) | 🗄️ **Database** | Super Admin via UI | Add from admin panel |
| **Ownership** (Private, Govt, Trust...) | 🗄️ **Database** | Super Admin via UI | Add from admin panel |
| **Category** (Primary, K12, Secondary...) | 🗄️ **Database** | Super Admin via UI | Add from admin panel |
| **Modules** (Attendance, Fees, Exam...) | 🗄️ **Database** | Super Admin via UI | Add from admin panel |
| Status (active, inactive, suspended) | 📦 **Hardcoded constant** | Developer | Change code & redeploy |
| Gender Type (co_ed, boys, girls) | 📦 **Hardcoded constant** | Developer | Change code & redeploy |
| Shift (morning, afternoon, full_day) | 📦 **Hardcoded constant** | Developer | Change code & redeploy |
| Class Names & Order | 📦 **Hardcoded constant** | Developer | Change code & redeploy |

---

### 2A. Master Data — Interface

#### File: `services/school-service/src/interfaces/masterDataInterface.ts` — **[NEW FILE]**

Also create: `src/interfaces/masterDataInterface.ts`

```typescript
import { Document, Types } from 'mongoose';

export interface MasterDataInterface extends Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    type: string;             // 'board' | 'medium' | 'ownership' | 'category' | 'module'
    value: string;            // 'cbse', 'english', 'private', 'k12', 'attendance'
    label: string;            // 'CBSE', 'English', 'Private', 'K-12 (Nursery to Class 12)'
    description?: string;     // optional helper text
    displayOrder: number;     // for sorting in dropdowns
    isActive: boolean;        // soft-disable without deleting
    isDefault: boolean;       // seeded defaults can't be deleted by admin

    // Only for type='board' → maps to auto-class generation
    metadata?: Record<string, unknown>;  // e.g. { defaultClasses: ['Nursery','LKG',...] }

    createdBy?: Types.ObjectId;
    isDeleted: boolean;
}
```

---

### 2B. Master Data — Mongoose Model

#### File: `services/school-service/src/models/masterDataModel.ts` — **[NEW FILE]**

Also create: `src/models/masterDataModel.ts`

```typescript
import mongoose, { Schema } from 'mongoose';
import { MasterDataInterface } from '../interfaces/masterDataInterface';

const MASTER_DATA_TYPES = ['board', 'medium', 'ownership', 'category', 'module'];

const masterDataSchema: Schema<MasterDataInterface> = new Schema(
    {
        type: {
            type: String,
            enum: MASTER_DATA_TYPES,
            required: true,
            index: true
        },
        value: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        label: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        displayOrder: {
            type: Number,
            default: 0
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDefault: {
            type: Boolean,
            default: false
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'master_data'
    }
);

// Unique value per type (no duplicate 'cbse' under 'board')
masterDataSchema.index(
    { type: 1, value: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const masterDataModel = mongoose.model<MasterDataInterface>('master_data', masterDataSchema);
export default masterDataModel;
```

---

### 2C. Master Data — Controller (Super Admin CRUD)

#### File: `services/school-service/src/controllers/masterDataController.ts` — **[NEW FILE]**

```typescript
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Constants, createErrorResponse, createSuccessResponse } from '@school/common';
import masterDataModel from '../models/masterDataModel';
import { logger } from '../services/logger';

const VALID_TYPES = ['board', 'medium', 'ownership', 'category', 'module'];

// ═══════════════════════════════════════════
//  GET ALL MASTER DATA BY TYPE
//  Used by School Admin when filling the "Add School" form
//  Example: GET /master-data?type=board
//  Example: GET /master-data?type=medium
//  Example: GET /master-data  (returns ALL types grouped)
// ═══════════════════════════════════════════

export async function getMasterData(req: Request, res: Response) {
    const { type } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false, isActive: true };
    if (type && VALID_TYPES.includes(type as string)) {
        filter.type = type;
    }

    const data = await masterDataModel
        .find(filter)
        .sort({ type: 1, displayOrder: 1, label: 1 })
        .select('type value label description displayOrder metadata isDefault')
        .lean();

    // Group by type for convenience
    const grouped: Record<string, any[]> = {};
    for (const item of data) {
        if (!grouped[item.type]) grouped[item.type] = [];
        grouped[item.type].push(item);
    }

    const r = createSuccessResponse('Master data fetched successfully.', {
        masterData: type ? data : grouped
    });
    return res.status(r.statusCode).json(r);
}

// ═══════════════════════════════════════════
//  CREATE MASTER DATA (Super Admin only)
// ═══════════════════════════════════════════

export async function createMasterData(req: Request, res: Response) {
    const { type, value, label, description, displayOrder, metadata } = req.body;

    if (!VALID_TYPES.includes(type)) {
        const r = createErrorResponse(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const createdBy = req.headers['x-user-id'];

    try {
        const item = await masterDataModel.create({
            type,
            value: value.toLowerCase().trim(),
            label: label.trim(),
            description,
            displayOrder: displayOrder || 0,
            metadata: metadata || {},
            createdBy,
            isDefault: false
        });

        const r = createSuccessResponse('Master data created successfully.', { item });
        return res.status(201).json(r);
    } catch (error: any) {
        if (error?.code === 11000) {
            const r = createErrorResponse(
                `A ${type} with value '${value}' already exists.`,
                Constants.ERROR_TYPES.ALREADY_EXISTS
            );
            return res.status(r.statusCode).json(r);
        }
        throw error;
    }
}

// ═══════════════════════════════════════════
//  UPDATE MASTER DATA (Super Admin only)
// ═══════════════════════════════════════════

export async function updateMasterData(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const r = createErrorResponse('Invalid master data id.', Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const updatePayload = { ...req.body };
    // Don't allow changing type or value of default items
    delete updatePayload.type;
    delete updatePayload.isDefault;

    const item = await masterDataModel.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { $set: updatePayload },
        { new: true, runValidators: true }
    );

    if (!item) {
        const r = createErrorResponse('Master data not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);
        return res.status(r.statusCode).json(r);
    }

    const r = createSuccessResponse('Master data updated successfully.', { item });
    return res.status(r.statusCode).json(r);
}

// ═══════════════════════════════════════════
//  DELETE MASTER DATA (Super Admin only)
//  Cannot delete default (seeded) items
// ═══════════════════════════════════════════

export async function deleteMasterData(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const r = createErrorResponse('Invalid master data id.', Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const item = await masterDataModel.findOne({ _id: id, isDeleted: false });

    if (!item) {
        const r = createErrorResponse('Master data not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);
        return res.status(r.statusCode).json(r);
    }

    if (item.isDefault) {
        const r = createErrorResponse(
            'Cannot delete default master data. You can deactivate it instead.',
            Constants.ERROR_TYPES.FORBIDDEN
        );
        return res.status(r.statusCode).json(r);
    }

    await masterDataModel.updateOne({ _id: id }, { $set: { isDeleted: true } });

    const r = createSuccessResponse('Master data deleted successfully.');
    return res.status(r.statusCode).json(r);
}

// ═══════════════════════════════════════════
//  TOGGLE ACTIVE/INACTIVE (Super Admin)
// ═══════════════════════════════════════════

export async function toggleMasterDataStatus(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const r = createErrorResponse('Invalid master data id.', Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const item = await masterDataModel.findOne({ _id: id, isDeleted: false });
    if (!item) {
        const r = createErrorResponse('Master data not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);
        return res.status(r.statusCode).json(r);
    }

    item.isActive = !item.isActive;
    await item.save();

    const r = createSuccessResponse(
        `Master data ${item.isActive ? 'activated' : 'deactivated'} successfully.`,
        { item }
    );
    return res.status(r.statusCode).json(r);
}
```

---

### 2D. Master Data — Routes

#### File: `services/school-service/src/routes/masterDataRoutes.ts` — **[NEW FILE]**

```typescript
import { Router } from 'express';
import Joi from 'joi';
import {
    getMasterData,
    createMasterData,
    updateMasterData,
    deleteMasterData,
    toggleMasterDataStatus
} from '../controllers/masterDataController';
import { asyncHandler, validateBody } from '../utils/routeUtils';

const router = Router();

const createSchema = Joi.object({
    type: Joi.string().valid('board', 'medium', 'ownership', 'category', 'module').required(),
    value: Joi.string().trim().min(1).max(50).required(),
    label: Joi.string().trim().min(1).max(100).required(),
    description: Joi.string().trim().max(300).optional(),
    displayOrder: Joi.number().integer().min(0).default(0).optional(),
    metadata: Joi.object().unknown(true).optional()
});

const updateSchema = Joi.object({
    value: Joi.string().trim().min(1).max(50).optional(),
    label: Joi.string().trim().min(1).max(100).optional(),
    description: Joi.string().trim().max(300).optional(),
    displayOrder: Joi.number().integer().min(0).optional(),
    metadata: Joi.object().unknown(true).optional(),
    isActive: Joi.boolean().optional()
}).min(1);

// Public route — School Admin uses this to fill dropdowns
router.get('/', asyncHandler(getMasterData));

// Super Admin only routes
router.post('/', validateBody(createSchema), asyncHandler(createMasterData));
router.put('/:id', validateBody(updateSchema), asyncHandler(updateMasterData));
router.delete('/:id', asyncHandler(deleteMasterData));
router.patch('/:id/toggle', asyncHandler(toggleMasterDataStatus));

export default router;
```

#### Update: `services/school-service/src/routes/index.ts`

```diff
 import { Router } from 'express';
 import internalRoutes from './internalRoutes';
 import schoolRoutes from './schoolRoutes';
+import masterDataRoutes from './masterDataRoutes';

 const router = Router();

 router.use('/schools', schoolRoutes);
+router.use('/master-data', masterDataRoutes);
 router.use('/internal', internalRoutes);

 export default router;
```

---

### 2E. Master Data — Routes Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/master-data` | Get all master data (grouped by type) | Any logged-in user |
| `GET` | `/master-data?type=board` | Get master data filtered by type | Any logged-in user |
| `POST` | `/master-data` | Create new master data option | **Super Admin only** |
| `PUT` | `/master-data/:id` | Update master data option | **Super Admin only** |
| `DELETE` | `/master-data/:id` | Soft delete (cannot delete defaults) | **Super Admin only** |
| `PATCH` | `/master-data/:id/toggle` | Toggle active/inactive | **Super Admin only** |

---

### 2F. Master Data — Seed Script (run once on first deploy)

#### File: `services/school-service/src/seeders/seedMasterData.ts` — **[NEW FILE]**

Run this script **once** to populate default master data. These default records have `isDefault: true` so Super Admin cannot delete them (only deactivate).

```typescript
import masterDataModel from '../models/masterDataModel';

const SEED_DATA = [
    // ─── BOARDS ───
    { type: 'board', value: 'cbse', label: 'CBSE', displayOrder: 1, isDefault: true,
      metadata: { defaultClasses: ['Nursery','LKG','UKG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'] } },
    { type: 'board', value: 'icse', label: 'ICSE', displayOrder: 2, isDefault: true,
      metadata: { defaultClasses: ['Nursery','LKG','UKG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'] } },
    { type: 'board', value: 'state_board', label: 'State Board', displayOrder: 3, isDefault: true,
      metadata: { defaultClasses: ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'] } },
    { type: 'board', value: 'ib', label: 'IB (International Baccalaureate)', displayOrder: 4, isDefault: true,
      metadata: { defaultClasses: ['Pre-Nursery','Nursery','LKG','UKG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'] } },
    { type: 'board', value: 'cambridge', label: 'Cambridge (IGCSE)', displayOrder: 5, isDefault: true,
      metadata: { defaultClasses: ['Pre-Nursery','Nursery','LKG','UKG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'] } },
    { type: 'board', value: 'nios', label: 'NIOS', displayOrder: 6, isDefault: true,
      metadata: { defaultClasses: ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'] } },
    { type: 'board', value: 'madrasa', label: 'Madrasa Board', displayOrder: 7, isDefault: true,
      metadata: { defaultClasses: ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8'] } },
    { type: 'board', value: 'custom', label: 'Other / Custom', displayOrder: 99, isDefault: true,
      metadata: { defaultClasses: [] } },

    // ─── MEDIUMS ───
    { type: 'medium', value: 'english', label: 'English', displayOrder: 1, isDefault: true },
    { type: 'medium', value: 'hindi', label: 'Hindi', displayOrder: 2, isDefault: true },
    { type: 'medium', value: 'marathi', label: 'Marathi', displayOrder: 3, isDefault: true },
    { type: 'medium', value: 'tamil', label: 'Tamil', displayOrder: 4, isDefault: true },
    { type: 'medium', value: 'telugu', label: 'Telugu', displayOrder: 5, isDefault: true },
    { type: 'medium', value: 'kannada', label: 'Kannada', displayOrder: 6, isDefault: true },
    { type: 'medium', value: 'bengali', label: 'Bengali', displayOrder: 7, isDefault: true },
    { type: 'medium', value: 'gujarati', label: 'Gujarati', displayOrder: 8, isDefault: true },
    { type: 'medium', value: 'malayalam', label: 'Malayalam', displayOrder: 9, isDefault: true },
    { type: 'medium', value: 'punjabi', label: 'Punjabi', displayOrder: 10, isDefault: true },
    { type: 'medium', value: 'urdu', label: 'Urdu', displayOrder: 11, isDefault: true },
    { type: 'medium', value: 'odia', label: 'Odia', displayOrder: 12, isDefault: true },
    { type: 'medium', value: 'assamese', label: 'Assamese', displayOrder: 13, isDefault: true },
    { type: 'medium', value: 'sanskrit', label: 'Sanskrit', displayOrder: 14, isDefault: true },
    { type: 'medium', value: 'other', label: 'Other', displayOrder: 99, isDefault: true },

    // ─── OWNERSHIP ───
    { type: 'ownership', value: 'private', label: 'Private', displayOrder: 1, isDefault: true },
    { type: 'ownership', value: 'government', label: 'Government', displayOrder: 2, isDefault: true },
    { type: 'ownership', value: 'semi_government', label: 'Semi-Government', displayOrder: 3, isDefault: true },
    { type: 'ownership', value: 'aided', label: 'Aided', displayOrder: 4, isDefault: true },
    { type: 'ownership', value: 'unaided', label: 'Unaided', displayOrder: 5, isDefault: true },
    { type: 'ownership', value: 'trust', label: 'Trust', displayOrder: 6, isDefault: true },
    { type: 'ownership', value: 'society', label: 'Society', displayOrder: 7, isDefault: true },

    // ─── CATEGORIES ───
    { type: 'category', value: 'pre_primary', label: 'Pre-Primary (Nursery – UKG)', displayOrder: 1, isDefault: true },
    { type: 'category', value: 'primary', label: 'Primary (up to Class 5)', displayOrder: 2, isDefault: true },
    { type: 'category', value: 'middle', label: 'Middle (up to Class 8)', displayOrder: 3, isDefault: true },
    { type: 'category', value: 'secondary', label: 'Secondary (up to Class 10)', displayOrder: 4, isDefault: true },
    { type: 'category', value: 'senior_secondary', label: 'Senior Secondary (up to Class 12)', displayOrder: 5, isDefault: true },
    { type: 'category', value: 'k12', label: 'K-12 (Nursery to Class 12)', displayOrder: 6, isDefault: true },
    { type: 'category', value: 'higher_secondary', label: 'Higher Secondary', displayOrder: 7, isDefault: true },
    { type: 'category', value: 'custom', label: 'Custom', displayOrder: 99, isDefault: true },

    // ─── MODULES ───
    { type: 'module', value: 'attendance', label: 'Attendance', displayOrder: 1, isDefault: true },
    { type: 'module', value: 'fees', label: 'Fees Management', displayOrder: 2, isDefault: true },
    { type: 'module', value: 'exam', label: 'Examination', displayOrder: 3, isDefault: true },
    { type: 'module', value: 'transport', label: 'Transport', displayOrder: 4, isDefault: true },
    { type: 'module', value: 'library', label: 'Library', displayOrder: 5, isDefault: true },
    { type: 'module', value: 'hostel', label: 'Hostel', displayOrder: 6, isDefault: true },
    { type: 'module', value: 'timetable', label: 'Timetable', displayOrder: 7, isDefault: true },
    { type: 'module', value: 'homework', label: 'Homework', displayOrder: 8, isDefault: true },
    { type: 'module', value: 'communication', label: 'Communication (SMS/Email)', displayOrder: 9, isDefault: true },
    { type: 'module', value: 'payroll', label: 'Payroll', displayOrder: 10, isDefault: true }
];

export async function seedMasterData() {
    for (const item of SEED_DATA) {
        await masterDataModel.findOneAndUpdate(
            { type: item.type, value: item.value, isDeleted: false },
            { $setOnInsert: { ...item, isActive: true, isDeleted: false } },
            { upsert: true, new: true }
        );
    }
    console.log(`✅ Seeded ${SEED_DATA.length} master data items`);
}
```

> ⚠️ **Run the seeder once** during first deploy or in your `mongoStartup.ts` / migration script:
> ```typescript
> import { seedMasterData } from '../seeders/seedMasterData';
> await seedMasterData();
> ```

---

### 2G. Master Data — Frontend API Service

#### File (frontend): `src/services/masterDataService.ts` — **[NEW FILE]**

```typescript
import api from './api';

export interface MasterDataItem {
    _id: string;
    type: string;
    value: string;
    label: string;
    description?: string;
    displayOrder: number;
    metadata?: Record<string, any>;
    isDefault: boolean;
}

const masterDataService = {
    // Get all master data (grouped by type) — call once on app load or form mount
    getAll: () =>
        api.get('/master-data'),

    // Get by specific type
    getByType: (type: 'board' | 'medium' | 'ownership' | 'category' | 'module') =>
        api.get(`/master-data?type=${type}`),

    // Super Admin — create new option
    create: (payload: { type: string; value: string; label: string; description?: string; displayOrder?: number; metadata?: any }) =>
        api.post('/master-data', payload),

    // Super Admin — update option
    update: (id: string, payload: Partial<{ value: string; label: string; description: string; displayOrder: number; isActive: boolean; metadata: any }>) =>
        api.put(`/master-data/${id}`, payload),

    // Super Admin — delete option
    delete: (id: string) =>
        api.delete(`/master-data/${id}`),

    // Super Admin — toggle active/inactive
    toggle: (id: string) =>
        api.patch(`/master-data/${id}/toggle`)
};

export default masterDataService;
```

---

### 2H. Frontend — How to use Master Data in School Form

Instead of importing hardcoded arrays, **fetch from API** on form mount:

```typescript
// In SchoolForm.tsx or SchoolCreatePage.tsx
import { useEffect, useState } from 'react';
import masterDataService, { MasterDataItem } from '../services/masterDataService';

const [boards, setBoards] = useState<MasterDataItem[]>([]);
const [mediums, setMediums] = useState<MasterDataItem[]>([]);
const [ownerships, setOwnerships] = useState<MasterDataItem[]>([]);
const [categories, setCategories] = useState<MasterDataItem[]>([]);
const [modules, setModules] = useState<MasterDataItem[]>([]);

useEffect(() => {
    masterDataService.getAll().then((res) => {
        const data = res.data.data.masterData;
        setBoards(data.board || []);
        setMediums(data.medium || []);
        setOwnerships(data.ownership || []);
        setCategories(data.category || []);
        setModules(data.module || []);
    });
}, []);

// Then in your dropdown:
<select name="board">
    {boards.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
</select>
```

---

### 2I. Frontend — Super Admin Master Data Management Page

Build a simple CRUD page at `/admin/master-data` where Super Admin can:

```
src/
├── pages/
│   └── admin/
│       └── MasterDataPage.tsx        // Tabs: Board | Medium | Ownership | Category | Module
├── components/
│   └── admin/
│       ├── MasterDataTable.tsx        // Table with edit/delete/toggle actions
│       └── MasterDataFormModal.tsx    // Add/Edit modal
```

| Feature | Description |
|---------|-------------|
| **Tabs** | One tab per type (Board, Medium, Ownership, Category, Module) |
| **Table columns** | Label, Value, Display Order, Status (Active/Inactive), Actions |
| **Add button** | Opens modal → creates new option via `POST /master-data` |
| **Edit button** | Opens modal pre-filled → updates via `PUT /master-data/:id` |
| **Delete button** | Confirmation dialog → calls `DELETE /master-data/:id`. Disabled for default items |
| **Toggle switch** | Active/Inactive → calls `PATCH /master-data/:id/toggle` |
| **For Board type** | Extra field: `metadata.defaultClasses` — pick which classes this board supports |

---

## 3. Constants & Enums (hardcoded)

### File: `packages/common/src/constants/school.ts` — **[NEW FILE]**

This file contains **only the hardcoded constants** — things that rarely change and don't need Super Admin management. Dynamic fields (board, medium, ownership, category, module) live in the `master_data` DB collection (see Section 2 above).

```typescript
// ═══════════════════════════════════════════
// ⚠️  DYNAMIC FIELDS — these live in the `master_data` DB collection
//     Board, Medium, Ownership, Category, Module
//     Super Admin manages them from the admin panel.
//     DO NOT hardcode enum values for these in schemas!
// ═══════════════════════════════════════════

// ───────────────────────────────────────────
// SCHOOL GENDER TYPE (hardcoded — rarely changes)
// ───────────────────────────────────────────
export const SCHOOL_GENDER_TYPE = {
    CO_ED: 'co_ed',
    BOYS: 'boys',
    GIRLS: 'girls'
} as const;

// ───────────────────────────────────────────
// SCHOOL SHIFT (hardcoded — rarely changes)
// ───────────────────────────────────────────
export const SCHOOL_SHIFT = {
    MORNING: 'morning',
    AFTERNOON: 'afternoon',
    FULL_DAY: 'full_day'
} as const;

// ───────────────────────────────────────────
// MASTER DATA TYPES (used to validate the `type` field in master_data collection)
// ───────────────────────────────────────────
export const MASTER_DATA_TYPES = {
    BOARD: 'board',
    MEDIUM: 'medium',
    OWNERSHIP: 'ownership',
    CATEGORY: 'category',
    MODULE: 'module'
} as const;

// ───────────────────────────────────────────
// CLASS / GRADE names used across boards
// ───────────────────────────────────────────
export const CLASS_NAMES = {
    PRE_NURSERY: 'Pre-Nursery',
    NURSERY: 'Nursery',
    LKG: 'LKG',
    UKG: 'UKG',
    CLASS_1: 'Class 1',
    CLASS_2: 'Class 2',
    CLASS_3: 'Class 3',
    CLASS_4: 'Class 4',
    CLASS_5: 'Class 5',
    CLASS_6: 'Class 6',
    CLASS_7: 'Class 7',
    CLASS_8: 'Class 8',
    CLASS_9: 'Class 9',
    CLASS_10: 'Class 10',
    CLASS_11: 'Class 11',
    CLASS_12: 'Class 12'
} as const;

// ───────────────────────────────────────────
// CLASS ORDER (for sorting)
// ───────────────────────────────────────────
export const CLASS_ORDER: Record<string, number> = {
    'Pre-Nursery': 0,
    'Nursery': 1,
    'LKG': 2,
    'UKG': 3,
    'Class 1': 4,
    'Class 2': 5,
    'Class 3': 6,
    'Class 4': 7,
    'Class 5': 8,
    'Class 6': 9,
    'Class 7': 10,
    'Class 8': 11,
    'Class 9': 12,
    'Class 10': 13,
    'Class 11': 14,
    'Class 12': 15
};

// ───────────────────────────────────────────
// ⚠️ BOARD_CLASS_MAP has moved to master_data DB
// The defaultClasses are now stored in master_data.metadata.defaultClasses
// for each board entry. See Section 2F (seedMasterData) for the seed values.
// The controller reads from DB at runtime instead of this constant.
// ───────────────────────────────────────────

// ───────────────────────────────────────────
// CATEGORY VALUES (kept as reference for the
// auto-class generation switch statement)
// These values MUST match what's seeded in master_data
// ───────────────────────────────────────────
export const CATEGORY_VALUES = {
    PRE_PRIMARY: 'pre_primary',
    PRIMARY: 'primary',
    MIDDLE: 'middle',
    SECONDARY: 'secondary',
    SENIOR_SECONDARY: 'senior_secondary',
    K12: 'k12',
    HIGHER_SECONDARY: 'higher_secondary',
    CUSTOM: 'custom'
} as const;

// ───────────────────────────────────────────
// ACADEMIC YEAR FORMATS (hardcoded reference)
// ───────────────────────────────────────────
export const ACADEMIC_YEAR_START_MONTH = {
    APRIL: 4,   // Most Indian schools
    JUNE: 6,    // Some state boards
    JANUARY: 1, // International schools
    SEPTEMBER: 9 // Some international
} as const;
```

### Update: `packages/common/src/constants/index.ts`

Add the new file to the barrel export:

```diff
 export * from './roles';
 export * from './status';
 export * from './messages';
 export * from './auth';
+export * from './school';

 export const Constants = {
     ...require('./roles'),
     ...require('./status'),
     ...require('./messages'),
-    ...require('./auth')
+    ...require('./auth'),
+    ...require('./school')
 };
```

---

## 3. Backend — School Schema & Interface

### 3A. Interface — ALL fields the School document will ever need

#### File: `services/school-service/src/interfaces/schoolInterface.ts` — **REPLACE entire file**

Also copy to: `src/interfaces/school.ts`

```typescript
import { Document, Types } from 'mongoose';

// ───────── SUB-DOCUMENT INTERFACES ─────────

export interface SchoolAddress {
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    district?: string;
    state: string;
    pincode: string;
    country: string;                    // default 'India'
}

export interface SchoolTimings {
    shift: string;                      // morning | afternoon | full_day
    startTime?: string;                 // HH:mm format e.g. "08:00"
    endTime?: string;                   // HH:mm format e.g. "14:00"
}

export interface AcademicYearConfig {
    startMonth: number;                 // 1-12 (April = 4 for most Indian)
    endMonth: number;                   // 1-12 (March = 3)
    currentSession?: string;            // e.g. "2024-2025"
}

export interface SchoolSocialLinks {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
}

// ───────── MAIN SCHOOL INTERFACE ─────────

export interface SchoolInterface extends Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    // ─── Basic Info ───
    name: string;                       // "Delhi Public School"
    code: string;                       // "DPS001" — unique identifier
    status: string;                     // active | inactive | suspended

    // ─── Board & Category (KEY FIELDS) ───
    board: string;                      // cbse | icse | state_board | ib | cambridge | nios | madrasa | custom
    secondaryBoard?: string;            // some schools follow two boards (e.g. CBSE + State)
    customBoardName?: string;           // only when board = 'custom'
    category: string;                   // primary | middle | secondary | senior_secondary | k12 etc.

    // ─── Medium (MULTI-SELECT) ───
    mediums: string[];                  // ['english', 'hindi'] — can have multiple

    // ─── Affiliation & Recognition ───
    affiliationNumber?: string;         // e.g. CBSE affiliation number
    udiseCode?: string;                 // UDISE+ code (govt tracking)
    recognitionNumber?: string;
    establishedYear?: number;           // e.g. 1995

    // ─── Gender & Ownership ───
    genderType: string;                 // co_ed | boys | girls
    ownership: string;                  // private | government | semi_government etc.

    // ─── Contact ───
    contactEmail?: string;
    contactPhone?: string;
    alternatePhone?: string;
    principalName?: string;
    principalPhone?: string;
    principalEmail?: string;

    // ─── Address (structured) ───
    address: SchoolAddress;

    // ─── Timings ───
    timings?: SchoolTimings;

    // ─── Academic Year ───
    academicYear?: AcademicYearConfig;

    // ─── Branding / Media ───
    logo?: string;                      // URL / file path to school logo
    bannerImage?: string;               // URL / file path to banner
    motto?: string;                     // school motto/tagline

    // ─── Social Links ───
    socialLinks?: SchoolSocialLinks;

    // ─── Settings / Features ───
    enabledModules?: string[];          // e.g. ['attendance', 'fees', 'transport', 'library', 'exam']
    maxStudentsPerClass?: number;       // default cap
    hasTransport?: boolean;
    hasHostel?: boolean;
    hasLibrary?: boolean;
    hasLab?: boolean;

    // ─── Auto-generated Classes ───
    classesAutoGenerated?: boolean;     // true after auto-class creation

    // ─── Metadata ───
    createdBy: Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    deletedBy?: Types.ObjectId;

    // ─── Notes ───
    notes?: string;                     // any admin notes
}
```

---

### 3B. Mongoose Schema

#### File: `services/school-service/src/models/schoolModel.ts` — **REPLACE entire file**

Also mirror to: `src/models/schoolModel.ts`

```typescript
import mongoose, { Schema } from 'mongoose';
import { Constants } from '@school/common';
import { SchoolInterface } from '../interfaces/schoolInterface';

// ───────── Address Sub-Schema ─────────
const addressSchema = new Schema(
    {
        addressLine1: { type: String, trim: true, default: '' },
        addressLine2: { type: String, trim: true },
        landmark: { type: String, trim: true },
        city: { type: String, trim: true, default: '' },
        district: { type: String, trim: true },
        state: { type: String, trim: true, default: '' },
        pincode: { type: String, trim: true, default: '' },
        country: { type: String, trim: true, default: 'India' }
    },
    { _id: false }
);

// ───────── Timings Sub-Schema ─────────
const timingsSchema = new Schema(
    {
        shift: {
            type: String,
            enum: Object.values(Constants.SCHOOL_SHIFT),
            default: Constants.SCHOOL_SHIFT.FULL_DAY
        },
        startTime: { type: String, trim: true },    // "08:00"
        endTime: { type: String, trim: true }        // "14:00"
    },
    { _id: false }
);

// ───────── Academic Year Sub-Schema ─────────
const academicYearSchema = new Schema(
    {
        startMonth: { type: Number, min: 1, max: 12, default: 4 },
        endMonth: { type: Number, min: 1, max: 12, default: 3 },
        currentSession: { type: String, trim: true }  // "2024-2025"
    },
    { _id: false }
);

// ───────── Social Links Sub-Schema ─────────
const socialLinksSchema = new Schema(
    {
        website: { type: String, trim: true },
        facebook: { type: String, trim: true },
        instagram: { type: String, trim: true },
        twitter: { type: String, trim: true },
        youtube: { type: String, trim: true },
        linkedin: { type: String, trim: true }
    },
    { _id: false }
);

// ═══════════════════════════════════════════
//  MAIN SCHOOL SCHEMA
// ═══════════════════════════════════════════
const schoolSchema: Schema<SchoolInterface> = new Schema(
    {
        // ─── Basic Info ───
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, uppercase: true, trim: true },
        status: {
            type: String,
            enum: Object.values(Constants.SCHOOL_STATUS),
            default: Constants.SCHOOL_STATUS.ACTIVE,
            index: true
        },

        // ─── Board & Category (DYNAMIC — validated via master_data, no enum here) ───
        board: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true
        },
        secondaryBoard: {
            type: String,
            trim: true,
            lowercase: true,
            default: null
        },
        customBoardName: { type: String, trim: true },
        category: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        // ─── Medium (MULTI-SELECT — DYNAMIC, validated via master_data) ───
        mediums: {
            type: [String],
            required: true,
            validate: {
                validator: (v: string[]) => v.length > 0,
                message: 'At least one medium is required.'
            }
        },

        // ─── Affiliation & Recognition ───
        affiliationNumber: { type: String, trim: true },
        udiseCode: { type: String, trim: true },
        recognitionNumber: { type: String, trim: true },
        establishedYear: { type: Number, min: 1800, max: new Date().getFullYear() },

        // ─── Gender (HARDCODED) & Ownership (DYNAMIC) ───
        genderType: {
            type: String,
            enum: Object.values(Constants.SCHOOL_GENDER_TYPE),
            default: Constants.SCHOOL_GENDER_TYPE.CO_ED
        },
        ownership: {
            type: String,
            trim: true,
            lowercase: true,
            default: 'private'
        },

        // ─── Contact ───
        contactEmail: { type: String, lowercase: true, trim: true },
        contactPhone: { type: String, trim: true },
        alternatePhone: { type: String, trim: true },
        principalName: { type: String, trim: true },
        principalPhone: { type: String, trim: true },
        principalEmail: { type: String, lowercase: true, trim: true },

        // ─── Address ───
        address: { type: addressSchema, default: () => ({}) },

        // ─── Timings ───
        timings: { type: timingsSchema, default: () => ({}) },

        // ─── Academic Year ───
        academicYear: { type: academicYearSchema, default: () => ({}) },

        // ─── Branding ───
        logo: { type: String, trim: true },
        bannerImage: { type: String, trim: true },
        motto: { type: String, trim: true, maxlength: 300 },

        // ─── Social Links ───
        socialLinks: { type: socialLinksSchema, default: () => ({}) },

        // ─── Settings / Features ───
        enabledModules: {
            type: [String],
            default: ['attendance', 'fees', 'exam']
        },
        maxStudentsPerClass: { type: Number, default: 40, min: 1, max: 200 },
        hasTransport: { type: Boolean, default: false },
        hasHostel: { type: Boolean, default: false },
        hasLibrary: { type: Boolean, default: false },
        hasLab: { type: Boolean, default: false },

        // ─── Auto-Class Flag ───
        classesAutoGenerated: { type: Boolean, default: false },

        // ─── Metadata ───
        createdBy: { type: Schema.Types.ObjectId, ref: 'users', required: true, index: true },
        isDeleted: { type: Boolean, default: false, index: true },
        deletedAt: { type: Date },
        deletedBy: { type: Schema.Types.ObjectId, ref: 'users' },

        // ─── Notes ───
        notes: { type: String, trim: true, maxlength: 1000 }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'schools'
    }
);

// ═══════════════════════════════════════════
//  INDEXES
// ═══════════════════════════════════════════
schoolSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
schoolSchema.index({ board: 1, status: 1 });
schoolSchema.index({ 'address.state': 1, 'address.city': 1 });
schoolSchema.index({ name: 'text', code: 'text' });    // full-text search

export const schoolModel = mongoose.model<SchoolInterface>('schools', schoolSchema);
export default schoolModel;
```

---

## 4. Backend — Class Template Model (auto-created with school)

When a school is created, classes are **automatically generated** based on the school's `board` and `category`.

### 4A. Interface

#### File: `services/school-service/src/interfaces/classInterface.ts` — **[NEW FILE]**

Also create: `src/interfaces/classInterface.ts`

```typescript
import { Document, Types } from 'mongoose';

export interface ClassInterface extends Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    schoolId: Types.ObjectId;           // Reference to school
    name: string;                       // "Class 1", "LKG", "Nursery"
    displayOrder: number;               // for sorting (0 = Pre-Nursery, 15 = Class 12)
    board: string;                      // inherited from school at creation time

    // ─── Sections ───
    sections: string[];                 // ['A', 'B', 'C'] — default ['A']
    maxStudents: number;                // per section, inherited from school default

    // ─── Status ───
    isActive: boolean;
    isDeleted: boolean;
}
```

### 4B. Mongoose Model

#### File: `services/school-service/src/models/classModel.ts` — **[NEW FILE]**

Also create: `src/models/classModel.ts`

```typescript
import mongoose, { Schema } from 'mongoose';
import { ClassInterface } from '../interfaces/classInterface';

const classSchema: Schema<ClassInterface> = new Schema(
    {
        schoolId: {
            type: Schema.Types.ObjectId,
            ref: 'schools',
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        displayOrder: {
            type: Number,
            required: true,
            default: 0
        },
        board: {
            type: String,
            trim: true
        },
        sections: {
            type: [String],
            default: ['A']
        },
        maxStudents: {
            type: Number,
            default: 40,
            min: 1,
            max: 200
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'classes'
    }
);

// Compound index: one class name per school
classSchema.index(
    { schoolId: 1, name: 1 },
    { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const classModel = mongoose.model<ClassInterface>('classes', classSchema);
export default classModel;
```

### 4C. Update model barrel exports

#### File: `services/school-service/src/models/index.ts` — **UPDATE**

```diff
+import classModel from './classModel';
 export { schoolModel } from './schoolModel';
+export { classModel };
```

#### File: `src/models/index.ts` — **UPDATE**

```diff
 import adminModel from './adminModel';
 import dbVersionModel from './dbVersionModel';
 import loginAuditModel from './loginAuditModel';
 import schoolModel from './schoolModel';
 import sessionModel from './sessionModel';
 import userModel from './userModel';
+import classModel from './classModel';

-export { adminModel, dbVersionModel, loginAuditModel, schoolModel, sessionModel, userModel };
+export { adminModel, dbVersionModel, loginAuditModel, schoolModel, sessionModel, userModel, classModel };
```

---

## 5. Backend — Section Model

> **NOTE:**
> Sections (`A`, `B`, `C`...) are stored **inside the Class document as an array** (see `sections: string[]` above). You do NOT need a separate collection for sections at this stage. If you later need per-section metadata (class teacher, room number), you can create a `sections` collection then.

---

## 6. Backend — Controller Logic

#### File: `services/school-service/src/controllers/schoolController.ts` — **REPLACE entire file**

Also mirror the logic to monolith controller if using monolith mode.

```typescript
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Constants, createErrorResponse, createSuccessResponse } from '@school/common';
import schoolModel from '../models/schoolModel';
import classModel from '../models/classModel';
import masterDataModel from '../models/masterDataModel';
import { logger } from '../services/logger';

// ═══════════════════════════════════════════
//  HELPER FUNCTIONS (keep at top)
// ═══════════════════════════════════════════

const getRequesterId = (req: Request): string | undefined => {
    const userId = req.headers['x-user-id'];
    return Array.isArray(userId) ? userId[0] : userId;
};

const getRequesterRole = (req: Request): string | undefined => {
    const role = req.headers['x-user-role'];
    return Array.isArray(role) ? role[0] : role;
};

const forbiddenResponse = (msg: string) =>
    createErrorResponse(msg, Constants.ERROR_TYPES.FORBIDDEN);

const ensureRole = (req: Request, allowedRoles: string[]) => {
    const role = getRequesterRole(req);
    return role && allowedRoles.includes(role) ? role : undefined;
};

const getPagination = (req: Request) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

const schoolNotFoundResponse = () =>
    createErrorResponse('School not found.', Constants.ERROR_TYPES.DATA_NOT_FOUND);

// ═══════════════════════════════════════════
//  VALIDATE DYNAMIC FIELDS AGAINST MASTER DATA DB
//  Called before create/update to ensure values exist
// ═══════════════════════════════════════════

async function validateDynamicFields(body: any): Promise<string | null> {
    // Validate board
    if (body.board) {
        const boardExists = await masterDataModel.findOne(
            { type: 'board', value: body.board, isDeleted: false, isActive: true }
        ).lean();
        if (!boardExists) return `Invalid board: '${body.board}'. Check master data.`;
    }

    // Validate category
    if (body.category) {
        const catExists = await masterDataModel.findOne(
            { type: 'category', value: body.category, isDeleted: false, isActive: true }
        ).lean();
        if (!catExists) return `Invalid category: '${body.category}'. Check master data.`;
    }

    // Validate mediums (each value in the array)
    if (body.mediums && Array.isArray(body.mediums)) {
        const validMediums = await masterDataModel.find(
            { type: 'medium', value: { $in: body.mediums }, isDeleted: false, isActive: true }
        ).lean();
        const validValues = validMediums.map(m => m.value);
        const invalid = body.mediums.filter((m: string) => !validValues.includes(m));
        if (invalid.length > 0) return `Invalid medium(s): ${invalid.join(', ')}. Check master data.`;
    }

    // Validate ownership
    if (body.ownership) {
        const ownerExists = await masterDataModel.findOne(
            { type: 'ownership', value: body.ownership, isDeleted: false, isActive: true }
        ).lean();
        if (!ownerExists) return `Invalid ownership: '${body.ownership}'. Check master data.`;
    }

    // Validate secondaryBoard
    if (body.secondaryBoard) {
        const secBoardExists = await masterDataModel.findOne(
            { type: 'board', value: body.secondaryBoard, isDeleted: false, isActive: true }
        ).lean();
        if (!secBoardExists) return `Invalid secondaryBoard: '${body.secondaryBoard}'. Check master data.`;
    }

    // Validate enabledModules
    if (body.enabledModules && Array.isArray(body.enabledModules)) {
        const validModules = await masterDataModel.find(
            { type: 'module', value: { $in: body.enabledModules }, isDeleted: false, isActive: true }
        ).lean();
        const validVals = validModules.map(m => m.value);
        const invalid = body.enabledModules.filter((m: string) => !validVals.includes(m));
        if (invalid.length > 0) return `Invalid module(s): ${invalid.join(', ')}. Check master data.`;
    }

    return null; // all valid
}

// ═══════════════════════════════════════════
//  AUTO-CLASS GENERATION
//  Board + Category → classes inserted into DB
//  (reads defaultClasses from master_data.metadata)
// ═══════════════════════════════════════════

async function generateClassesForSchool(
    schoolId: mongoose.Types.ObjectId,
    board: string,
    category: string,
    maxStudents: number = 40
): Promise<number> {
    // 1. Get full class list for this board FROM MASTER DATA DB
    const boardRecord = await masterDataModel.findOne(
        { type: 'board', value: board, isDeleted: false, isActive: true }
    ).lean();
    const allClassesForBoard: string[] = (boardRecord?.metadata as any)?.defaultClasses || [];

    if (allClassesForBoard.length === 0) {
        logger.info('No default classes for board, skipping auto-generation', { board });
        return 0;
    }

    // 2. Filter by school category
    let filteredClasses = [...allClassesForBoard];

    const preSchool = ['Pre-Nursery', 'Nursery', 'LKG', 'UKG'];
    const class1to5 = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
    const class6to8 = ['Class 6', 'Class 7', 'Class 8'];
    const class9to10 = ['Class 9', 'Class 10'];
    const class11to12 = ['Class 11', 'Class 12'];

    switch (category) {
        case Constants.SCHOOL_CATEGORY.PRE_PRIMARY:
            filteredClasses = filteredClasses.filter(c => preSchool.includes(c));
            break;
        case Constants.SCHOOL_CATEGORY.PRIMARY:
            filteredClasses = filteredClasses.filter(c =>
                [...preSchool, ...class1to5].includes(c)
            );
            break;
        case Constants.SCHOOL_CATEGORY.MIDDLE:
            filteredClasses = filteredClasses.filter(c =>
                [...preSchool, ...class1to5, ...class6to8].includes(c)
            );
            break;
        case Constants.SCHOOL_CATEGORY.SECONDARY:
            filteredClasses = filteredClasses.filter(c =>
                [...preSchool, ...class1to5, ...class6to8, ...class9to10].includes(c)
            );
            break;
        case Constants.SCHOOL_CATEGORY.SENIOR_SECONDARY:
        case Constants.SCHOOL_CATEGORY.HIGHER_SECONDARY:
        case Constants.SCHOOL_CATEGORY.K12:
            // Keep all classes from board
            break;
        case Constants.SCHOOL_CATEGORY.CUSTOM:
            // Admin will manually add classes — skip auto-creation
            return 0;
        default:
            break;
    }

    // 3. Build insert payload
    const classDocuments = filteredClasses.map((className) => ({
        schoolId,
        name: className,
        displayOrder: Constants.CLASS_ORDER[className] ?? 99,
        board,
        sections: ['A'],              // default 1 section
        maxStudents,
        isActive: true,
        isDeleted: false
    }));

    // 4. Bulk insert
    if (classDocuments.length > 0) {
        await classModel.insertMany(classDocuments);
        logger.info('Auto-generated classes for school', {
            schoolId: schoolId.toString(),
            count: classDocuments.length,
            classes: filteredClasses
        });
    }

    return classDocuments.length;
}

// ═══════════════════════════════════════════
//  CREATE SCHOOL
// ═══════════════════════════════════════════

export async function createSchool(req: Request, res: Response) {
    const createdBy = getRequesterId(req);
    const role = ensureRole(req, [Constants.USER_ROLES.SCHOOL_ADMIN, Constants.USER_ROLES.SUPER_ADMIN]);

    if (!role) {
        const r = forbiddenResponse('Only school admin or super admin can create schools.');
        return res.status(r.statusCode).json(r);
    }

    if (!createdBy || !mongoose.Types.ObjectId.isValid(createdBy)) {
        logger.warn('Create school: invalid user header', { createdBy });
        const r = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
        return res.status(r.statusCode).json(r);
    }

    // ── Validate dynamic fields against master_data DB ──
    const validationError = await validateDynamicFields(req.body);
    if (validationError) {
        const r = createErrorResponse(validationError, Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const payload = {
        ...req.body,
        code: req.body.code.toUpperCase(),
        createdBy
    };

    logger.info('Creating school', { code: payload.code, board: payload.board, createdBy });

    // ── Use transaction for atomicity (school + classes) ──
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const [school] = await schoolModel.create([payload], { session });

        // Auto-generate classes
        const classCount = await generateClassesForSchool(
            school._id,
            school.board,
            school.category,
            school.maxStudentsPerClass || 40
        );

        // Mark auto-generation done
        if (classCount > 0) {
            await schoolModel.updateOne(
                { _id: school._id },
                { $set: { classesAutoGenerated: true } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        const r = createSuccessResponse('School created successfully.', {
            school,
            classesGenerated: classCount
        });
        logger.info('School created', { schoolId: school._id.toString(), classesGenerated: classCount });
        return res.status(201).json(r);
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();

        if (error?.code === 11000) {
            logger.warn('Create school: duplicate code', { code: payload.code });
            const r = createErrorResponse('A school with this code already exists.', Constants.ERROR_TYPES.ALREADY_EXISTS);
            return res.status(r.statusCode).json(r);
        }

        throw error;
    }
}

// ═══════════════════════════════════════════
//  LIST SCHOOLS (paginated + filterable)
// ═══════════════════════════════════════════

export async function listSchools(req: Request, res: Response) {
    const requesterId = getRequesterId(req);
    const role = ensureRole(req, [Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN]);

    if (!role) {
        const r = forbiddenResponse('You are not allowed to list schools.');
        return res.status(r.statusCode).json(r);
    }

    const { page, limit, skip } = getPagination(req);
    const filter: Record<string, unknown> = { isDeleted: false };

    // School admin sees only their schools
    if (role === Constants.USER_ROLES.SCHOOL_ADMIN) {
        if (!requesterId || !mongoose.Types.ObjectId.isValid(requesterId)) {
            const r = createErrorResponse(Constants.RESPONSE_MESSAGES.UNAUTHORIZED, Constants.ERROR_TYPES.UNAUTHORIZED);
            return res.status(r.statusCode).json(r);
        }
        filter.createdBy = new mongoose.Types.ObjectId(requesterId);
    }

    // ─── Query filters ───
    if (req.query.status) filter.status = req.query.status;
    if (req.query.board) filter.board = req.query.board;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.state) filter['address.state'] = { $regex: req.query.state, $options: 'i' };
    if (req.query.city) filter['address.city'] = { $regex: req.query.city, $options: 'i' };

    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: 'i' } },
            { code: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    logger.info('Listing schools', { page, limit, filter });

    const [schools, total] = await Promise.all([
        schoolModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        schoolModel.countDocuments(filter)
    ]);

    const r = createSuccessResponse('Schools fetched successfully.', {
        schools,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
    return res.status(r.statusCode).json(r);
}

// ═══════════════════════════════════════════
//  GET SCHOOL BY ID
// ═══════════════════════════════════════════

export async function getSchoolById(req: Request, res: Response) {
    const { id } = req.params;
    const requesterId = getRequesterId(req);
    const role = ensureRole(req, [Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN]);

    if (!role) {
        const r = forbiddenResponse('You are not allowed to read this school.');
        return res.status(r.statusCode).json(r);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const r = createErrorResponse('Invalid school id.', Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const filter: Record<string, unknown> = { _id: id, isDeleted: false };
    if (role === Constants.USER_ROLES.SCHOOL_ADMIN) {
        filter.createdBy = requesterId;
    }

    const school = await schoolModel.findOne(filter).lean();

    if (!school) {
        const r = schoolNotFoundResponse();
        return res.status(r.statusCode).json(r);
    }

    // Also fetch classes for this school
    const classes = await classModel.find({ schoolId: id, isDeleted: false })
        .sort({ displayOrder: 1 })
        .lean();

    const r = createSuccessResponse('School fetched successfully.', { school, classes });
    return res.status(r.statusCode).json(r);
}

// ═══════════════════════════════════════════
//  GET SCHOOL BY CODE
// ═══════════════════════════════════════════

export async function getSchoolByCode(req: Request, res: Response) {
    const code = req.params.code.toUpperCase();
    const requesterId = getRequesterId(req);
    const role = ensureRole(req, [Constants.USER_ROLES.SUPER_ADMIN, Constants.USER_ROLES.SCHOOL_ADMIN]);

    if (!role) {
        const r = forbiddenResponse('You are not allowed to read this school.');
        return res.status(r.statusCode).json(r);
    }

    const filter: Record<string, unknown> = { code, isDeleted: false };
    if (role === Constants.USER_ROLES.SCHOOL_ADMIN) {
        filter.createdBy = requesterId;
    }

    const school = await schoolModel.findOne(filter).lean();

    if (!school) {
        const r = schoolNotFoundResponse();
        return res.status(r.statusCode).json(r);
    }

    const r = createSuccessResponse('School fetched successfully.', { school });
    return res.status(r.statusCode).json(r);
}

// ═══════════════════════════════════════════
//  UPDATE SCHOOL
// ═══════════════════════════════════════════

export async function updateSchool(req: Request, res: Response) {
    const { id } = req.params;
    const requesterId = getRequesterId(req);
    const role = ensureRole(req, [Constants.USER_ROLES.SCHOOL_ADMIN, Constants.USER_ROLES.SUPER_ADMIN]);

    if (!role) {
        const r = forbiddenResponse('Only school admin or super admin can update schools.');
        return res.status(r.statusCode).json(r);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const r = createErrorResponse('Invalid school id.', Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const updatePayload = {
        ...req.body,
        ...(req.body.code ? { code: req.body.code.toUpperCase() } : {})
    };

    // Prevent changing board after classes have been generated
    // (to avoid data inconsistency — show a warning on frontend)
    if (updatePayload.board) {
        const existingSchool = await schoolModel.findOne({ _id: id, isDeleted: false }).lean();
        if (existingSchool?.classesAutoGenerated && existingSchool.board !== updatePayload.board) {
            const r = createErrorResponse(
                'Cannot change board after classes have been auto-generated. Delete existing classes first.',
                Constants.ERROR_TYPES.BAD_REQUEST
            );
            return res.status(r.statusCode).json(r);
        }
    }

    logger.info('Updating school', { schoolId: id, fields: Object.keys(updatePayload) });

    const filter: Record<string, unknown> = { _id: id, isDeleted: false };
    if (role === Constants.USER_ROLES.SCHOOL_ADMIN) {
        filter.createdBy = requesterId;
    }

    try {
        const school = await schoolModel.findOneAndUpdate(
            filter,
            { $set: updatePayload },
            { new: true, runValidators: true }
        );

        if (!school) {
            const r = schoolNotFoundResponse();
            return res.status(r.statusCode).json(r);
        }

        const r = createSuccessResponse('School updated successfully.', { school });
        return res.status(r.statusCode).json(r);
    } catch (error: any) {
        if (error?.code === 11000) {
            const r = createErrorResponse('A school with this code already exists.', Constants.ERROR_TYPES.ALREADY_EXISTS);
            return res.status(r.statusCode).json(r);
        }
        throw error;
    }
}

// ═══════════════════════════════════════════
//  UPDATE SCHOOL STATUS
// ═══════════════════════════════════════════

export async function updateSchoolStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    const requesterId = getRequesterId(req);
    const role = ensureRole(req, [Constants.USER_ROLES.SCHOOL_ADMIN, Constants.USER_ROLES.SUPER_ADMIN]);

    if (!role) {
        const r = forbiddenResponse('Only school admin or super admin can update school status.');
        return res.status(r.statusCode).json(r);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const r = createErrorResponse('Invalid school id.', Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const filter: Record<string, unknown> = { _id: id, isDeleted: false };
    if (role === Constants.USER_ROLES.SCHOOL_ADMIN) {
        filter.createdBy = requesterId;
    }

    const school = await schoolModel.findOneAndUpdate(
        filter,
        { $set: { status } },
        { new: true, runValidators: true }
    );

    if (!school) {
        const r = schoolNotFoundResponse();
        return res.status(r.statusCode).json(r);
    }

    const r = createSuccessResponse('School status updated successfully.', { school });
    return res.status(r.statusCode).json(r);
}

// ═══════════════════════════════════════════
//  SOFT DELETE SCHOOL
// ═══════════════════════════════════════════

export async function deleteSchool(req: Request, res: Response) {
    const { id } = req.params;
    const requesterId = getRequesterId(req);
    const role = ensureRole(req, [Constants.USER_ROLES.SCHOOL_ADMIN, Constants.USER_ROLES.SUPER_ADMIN]);

    if (!role) {
        const r = forbiddenResponse('Only school admin or super admin can delete schools.');
        return res.status(r.statusCode).json(r);
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const r = createErrorResponse('Invalid school id.', Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const filter: Record<string, unknown> = { _id: id, isDeleted: false };
    if (role === Constants.USER_ROLES.SCHOOL_ADMIN) {
        filter.createdBy = requesterId;
    }

    const school = await schoolModel.findOneAndUpdate(
        filter,
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: new mongoose.Types.ObjectId(requesterId!)
            }
        },
        { new: true }
    );

    if (!school) {
        const r = schoolNotFoundResponse();
        return res.status(r.statusCode).json(r);
    }

    // Also soft-delete all classes under this school
    await classModel.updateMany(
        { schoolId: id, isDeleted: false },
        { $set: { isDeleted: true } }
    );

    const r = createSuccessResponse('School deleted successfully.', { school });
    return res.status(r.statusCode).json(r);
}

// ═══════════════════════════════════════════
//  GET CLASSES FOR A SCHOOL
// ═══════════════════════════════════════════

export async function getSchoolClasses(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        const r = createErrorResponse('Invalid school id.', Constants.ERROR_TYPES.BAD_REQUEST);
        return res.status(r.statusCode).json(r);
    }

    const classes = await classModel.find({ schoolId: id, isDeleted: false })
        .sort({ displayOrder: 1 })
        .lean();

    const r = createSuccessResponse('Classes fetched successfully.', { classes });
    return res.status(r.statusCode).json(r);
}

// ═══════════════════════════════════════════
//  INTERNAL — school status check
// ═══════════════════════════════════════════

export async function getInternalSchoolStatus(req: Request, res: Response) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ valid: false, active: false, status: null, message: 'Invalid school id.' });
    }

    const school = await schoolModel.findOne({ _id: id, isDeleted: false }).select('_id code status').lean();

    if (!school) {
        return res.status(404).json({ valid: false, active: false, status: null, message: 'School not found.' });
    }

    return res.status(200).json({
        valid: true,
        active: school.status === Constants.SCHOOL_STATUS.ACTIVE,
        status: school.status,
        schoolId: school._id.toString(),
        code: school.code
    });
}
```

---

## 7. Backend — Joi Validation Schemas

#### File: `services/school-service/src/routes/schoolRoutes.ts` — **REPLACE entire file**

```typescript
import { Router } from 'express';
import Joi from 'joi';
import { Constants } from '@school/common';
import {
    createSchool,
    getSchoolByCode,
    getSchoolById,
    listSchools,
    updateSchool,
    updateSchoolStatus,
    deleteSchool,
    getSchoolClasses
} from '../controllers/schoolController';
import { asyncHandler, validateBody } from '../utils/routeUtils';

const router = Router();

// ═══════════════════════════════════════════
//  ADDRESS SUB-SCHEMA (reusable)
// ═══════════════════════════════════════════
const addressJoiSchema = Joi.object({
    addressLine1: Joi.string().trim().max(200).allow('').optional(),
    addressLine2: Joi.string().trim().max(200).allow('').optional(),
    landmark: Joi.string().trim().max(150).allow('').optional(),
    city: Joi.string().trim().max(100).allow('').optional(),
    district: Joi.string().trim().max(100).allow('').optional(),
    state: Joi.string().trim().max(100).allow('').optional(),
    pincode: Joi.string().trim().max(10).allow('').optional(),
    country: Joi.string().trim().max(100).default('India').optional()
});

// ═══════════════════════════════════════════
//  TIMINGS SUB-SCHEMA
// ═══════════════════════════════════════════
const timingsJoiSchema = Joi.object({
    shift: Joi.string().valid(...Object.values(Constants.SCHOOL_SHIFT)).optional(),
    startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()
});

// ═══════════════════════════════════════════
//  ACADEMIC YEAR SUB-SCHEMA
// ═══════════════════════════════════════════
const academicYearJoiSchema = Joi.object({
    startMonth: Joi.number().integer().min(1).max(12).optional(),
    endMonth: Joi.number().integer().min(1).max(12).optional(),
    currentSession: Joi.string().trim().max(20).optional()  // "2024-2025"
});

// ═══════════════════════════════════════════
//  SOCIAL LINKS SUB-SCHEMA
// ═══════════════════════════════════════════
const socialLinksJoiSchema = Joi.object({
    website: Joi.string().uri().allow('').optional(),
    facebook: Joi.string().uri().allow('').optional(),
    instagram: Joi.string().uri().allow('').optional(),
    twitter: Joi.string().uri().allow('').optional(),
    youtube: Joi.string().uri().allow('').optional(),
    linkedin: Joi.string().uri().allow('').optional()
});

// ═══════════════════════════════════════════
//  CREATE SCHOOL PAYLOAD
// ═══════════════════════════════════════════
// ⚠️ NOTE: Dynamic fields (board, category, mediums, ownership) are validated
// as free strings here. The CONTROLLER validates them against master_data DB.
// This avoids needing to restart the server when Super Admin adds new options.
const schoolPayloadSchema = Joi.object({
    // ─── Required ───
    name: Joi.string().trim().min(2).max(200).required(),
    code: Joi.string().trim().alphanum().min(2).max(30).required(),
    board: Joi.string().trim().lowercase().min(1).max(50).required(),           // validated against master_data in controller
    category: Joi.string().trim().lowercase().min(1).max(50).required(),        // validated against master_data in controller
    mediums: Joi.array()
        .items(Joi.string().trim().lowercase().min(1).max(50))                  // validated against master_data in controller
        .min(1)
        .required(),

    // ─── Optional ───
    secondaryBoard: Joi.string().trim().lowercase().max(50).allow(null).optional(),
    customBoardName: Joi.string().trim().max(100).optional()
        .when('board', { is: 'custom', then: Joi.required() }),

    affiliationNumber: Joi.string().trim().max(50).optional(),
    udiseCode: Joi.string().trim().max(20).optional(),
    recognitionNumber: Joi.string().trim().max(50).optional(),
    establishedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional(),

    genderType: Joi.string().valid(...Object.values(Constants.SCHOOL_GENDER_TYPE)).default('co_ed').optional(),  // hardcoded enum
    ownership: Joi.string().trim().lowercase().max(50).default('private').optional(),  // validated against master_data in controller

    contactEmail: Joi.string().email().optional(),
    contactPhone: Joi.string().trim().min(7).max(20).optional(),
    alternatePhone: Joi.string().trim().min(7).max(20).optional(),
    principalName: Joi.string().trim().max(100).optional(),
    principalPhone: Joi.string().trim().min(7).max(20).optional(),
    principalEmail: Joi.string().email().optional(),

    address: addressJoiSchema.optional(),
    timings: timingsJoiSchema.optional(),
    academicYear: academicYearJoiSchema.optional(),

    logo: Joi.string().trim().optional(),
    bannerImage: Joi.string().trim().optional(),
    motto: Joi.string().trim().max(300).optional(),

    socialLinks: socialLinksJoiSchema.optional(),

    enabledModules: Joi.array().items(Joi.string().trim()).optional(),
    maxStudentsPerClass: Joi.number().integer().min(1).max(200).default(40).optional(),
    hasTransport: Joi.boolean().optional(),
    hasHostel: Joi.boolean().optional(),
    hasLibrary: Joi.boolean().optional(),
    hasLab: Joi.boolean().optional(),

    status: Joi.string().valid(...Object.values(Constants.SCHOOL_STATUS)).optional(),
    notes: Joi.string().trim().max(1000).optional()
});

// ═══════════════════════════════════════════
//  UPDATE SCHOOL PAYLOAD (all fields optional, min 1)
// ═══════════════════════════════════════════
const schoolUpdateSchema = schoolPayloadSchema
    .fork(['name', 'code', 'board', 'category', 'mediums'], (schema) => schema.optional())
    .min(1);

// ═══════════════════════════════════════════
//  STATUS UPDATE PAYLOAD
// ═══════════════════════════════════════════
const statusUpdateSchema = Joi.object({
    status: Joi.string().valid(...Object.values(Constants.SCHOOL_STATUS)).required()
});

// ═══════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════
router.post('/', validateBody(schoolPayloadSchema), asyncHandler(createSchool));
router.get('/', asyncHandler(listSchools));
router.get('/code/:code', asyncHandler(getSchoolByCode));
router.get('/:id', asyncHandler(getSchoolById));
router.get('/:id/classes', asyncHandler(getSchoolClasses));
router.put('/:id', validateBody(schoolUpdateSchema), asyncHandler(updateSchool));
router.put('/:id/status', validateBody(statusUpdateSchema), asyncHandler(updateSchoolStatus));
router.delete('/:id', asyncHandler(deleteSchool));

export default router;
```

---

## 8. Backend — Routes Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/schools` | Create school + auto-generate classes | School Admin, Super Admin |
| `GET` | `/schools` | List all schools (paginated, filterable) | School Admin, Super Admin |
| `GET` | `/schools/:id` | Get single school + its classes | School Admin, Super Admin |
| `GET` | `/schools/code/:code` | Get school by code | School Admin, Super Admin |
| `GET` | `/schools/:id/classes` | Get classes for a school | Any logged-in user |
| `PUT` | `/schools/:id` | Update school details | School Admin, Super Admin |
| `PUT` | `/schools/:id/status` | Update school status only | School Admin, Super Admin |
| `DELETE` | `/schools/:id` | Soft delete school + classes | School Admin, Super Admin |

### Query Parameters for `GET /schools`

| Param | Type | Example | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |
| `search` | string | `"Delhi"` | Search by name or code |
| `status` | string | `"active"` | Filter by status |
| `board` | string | `"cbse"` | Filter by board |
| `category` | string | `"k12"` | Filter by category |
| `state` | string | `"Maharashtra"` | Filter by state |
| `city` | string | `"Mumbai"` | Filter by city |

---

## 9. Backend — Response Messages

#### Add to: `packages/common/src/constants/messages.ts`

```diff
 export const RESPONSE_MESSAGES = {
     // ... existing messages ...
+
+    // ─── School messages ───
+    SCHOOL_CREATED_SUCCESSFULLY: 'School created successfully.',
+    SCHOOLS_FETCHED_SUCCESSFULLY: 'Schools fetched successfully.',
+    SCHOOL_FETCHED_SUCCESSFULLY: 'School fetched successfully.',
+    SCHOOL_UPDATED_SUCCESSFULLY: 'School updated successfully.',
+    SCHOOL_DELETED_SUCCESSFULLY: 'School deleted successfully.',
+    SCHOOL_NOT_FOUND: 'School not found.',
+    SCHOOL_CODE_ALREADY_EXISTS: 'A school with this code already exists.',
+    SCHOOL_STATUS_UPDATED_SUCCESSFULLY: 'School status updated successfully.',
+    CLASSES_FETCHED_SUCCESSFULLY: 'Classes fetched successfully.',
+    CANNOT_CHANGE_BOARD: 'Cannot change board after classes have been auto-generated.',
 };
```

---

## 10. Frontend — Pages & Components

### 10A. Page Structure

```
src/
├── pages/
│   └── schools/
│       ├── SchoolListPage.tsx           // Table with search, filter, pagination
│       ├── SchoolCreatePage.tsx         // Multi-step form
│       ├── SchoolEditPage.tsx           // Pre-filled form
│       └── SchoolDetailPage.tsx         // Read-only view + classes list
├── components/
│   └── schools/
│       ├── SchoolForm.tsx               // Reusable form (used by Create & Edit)
│       ├── SchoolCard.tsx               // Card for grid/list view
│       ├── SchoolFilters.tsx            // Filter sidebar/bar
│       ├── ClassesList.tsx              // Shows auto-generated classes
│       └── MultiSelectMedium.tsx        // Reusable multi-select for mediums
├── services/
│   └── schoolService.ts                // API calls
└── constants/
    └── schoolConstants.ts              // Frontend mirror of backend enums
```

### 10B. Frontend Constants

#### File: `src/constants/schoolConstants.ts` — **[NEW FILE]**

> ⚠️ **IMPORTANT:** `SCHOOL_BOARDS`, `SCHOOL_MEDIUMS`, `SCHOOL_OWNERSHIP_TYPES`, `SCHOOL_CATEGORIES`, and `ENABLED_MODULES` are now **fetched from the API** (`GET /master-data`). The arrays below are **fallback/offline defaults only**. Always prefer the API response.

```typescript
// These are FALLBACK defaults only.
// The actual options come from GET /master-data API (managed by Super Admin).
// Only SCHOOL_GENDER_TYPES, SCHOOL_SHIFTS, and SCHOOL_STATUSES are truly hardcoded.

export const SCHOOL_BOARDS = [
    { value: 'cbse', label: 'CBSE' },
    { value: 'icse', label: 'ICSE' },
    { value: 'state_board', label: 'State Board' },
    { value: 'ib', label: 'IB (International Baccalaureate)' },
    { value: 'cambridge', label: 'Cambridge (IGCSE)' },
    { value: 'nios', label: 'NIOS' },
    { value: 'madrasa', label: 'Madrasa Board' },
    { value: 'custom', label: 'Other / Custom' }
];

export const SCHOOL_MEDIUMS = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'marathi', label: 'Marathi' },
    { value: 'tamil', label: 'Tamil' },
    { value: 'telugu', label: 'Telugu' },
    { value: 'kannada', label: 'Kannada' },
    { value: 'bengali', label: 'Bengali' },
    { value: 'gujarati', label: 'Gujarati' },
    { value: 'malayalam', label: 'Malayalam' },
    { value: 'punjabi', label: 'Punjabi' },
    { value: 'urdu', label: 'Urdu' },
    { value: 'odia', label: 'Odia' },
    { value: 'assamese', label: 'Assamese' },
    { value: 'sanskrit', label: 'Sanskrit' },
    { value: 'other', label: 'Other' }
];

export const SCHOOL_CATEGORIES = [
    { value: 'pre_primary', label: 'Pre-Primary (Nursery – UKG)' },
    { value: 'primary', label: 'Primary (up to Class 5)' },
    { value: 'middle', label: 'Middle (up to Class 8)' },
    { value: 'secondary', label: 'Secondary (up to Class 10)' },
    { value: 'senior_secondary', label: 'Senior Secondary (up to Class 12)' },
    { value: 'k12', label: 'K-12 (Nursery to Class 12)' },
    { value: 'higher_secondary', label: 'Higher Secondary' },
    { value: 'custom', label: 'Custom' }
];

export const SCHOOL_GENDER_TYPES = [
    { value: 'co_ed', label: 'Co-Education' },
    { value: 'boys', label: 'Boys Only' },
    { value: 'girls', label: 'Girls Only' }
];

export const SCHOOL_SHIFTS = [
    { value: 'morning', label: 'Morning Shift' },
    { value: 'afternoon', label: 'Afternoon Shift' },
    { value: 'full_day', label: 'Full Day' }
];

export const SCHOOL_OWNERSHIP_TYPES = [
    { value: 'private', label: 'Private' },
    { value: 'government', label: 'Government' },
    { value: 'semi_government', label: 'Semi-Government' },
    { value: 'aided', label: 'Aided' },
    { value: 'unaided', label: 'Unaided' },
    { value: 'trust', label: 'Trust' },
    { value: 'society', label: 'Society' }
];

export const SCHOOL_STATUSES = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
];

export const ENABLED_MODULES = [
    { value: 'attendance', label: 'Attendance' },
    { value: 'fees', label: 'Fees Management' },
    { value: 'exam', label: 'Examination' },
    { value: 'transport', label: 'Transport' },
    { value: 'library', label: 'Library' },
    { value: 'hostel', label: 'Hostel' },
    { value: 'timetable', label: 'Timetable' },
    { value: 'homework', label: 'Homework' },
    { value: 'communication', label: 'Communication (SMS/Email)' },
    { value: 'payroll', label: 'Payroll' }
];

export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
];
```

---

## 11. Frontend — API Service Layer

#### File: `src/services/schoolService.ts` — **[NEW FILE]**

```typescript
import api from './api';  // your existing axios instance

// ═══════════════════════════════════════════
//  SCHOOL API SERVICE
// ═══════════════════════════════════════════

export interface SchoolPayload {
    name: string;
    code: string;
    board: string;
    category: string;
    mediums: string[];
    secondaryBoard?: string | null;
    customBoardName?: string;
    affiliationNumber?: string;
    udiseCode?: string;
    recognitionNumber?: string;
    establishedYear?: number;
    genderType?: string;
    ownership?: string;
    contactEmail?: string;
    contactPhone?: string;
    alternatePhone?: string;
    principalName?: string;
    principalPhone?: string;
    principalEmail?: string;
    address?: {
        addressLine1?: string;
        addressLine2?: string;
        landmark?: string;
        city?: string;
        district?: string;
        state?: string;
        pincode?: string;
        country?: string;
    };
    timings?: {
        shift?: string;
        startTime?: string;
        endTime?: string;
    };
    academicYear?: {
        startMonth?: number;
        endMonth?: number;
        currentSession?: string;
    };
    logo?: string;
    bannerImage?: string;
    motto?: string;
    socialLinks?: {
        website?: string;
        facebook?: string;
        instagram?: string;
        twitter?: string;
        youtube?: string;
        linkedin?: string;
    };
    enabledModules?: string[];
    maxStudentsPerClass?: number;
    hasTransport?: boolean;
    hasHostel?: boolean;
    hasLibrary?: boolean;
    hasLab?: boolean;
    notes?: string;
}

export interface SchoolListParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    board?: string;
    category?: string;
    state?: string;
    city?: string;
}

const schoolService = {
    // Create a new school
    create: (payload: SchoolPayload) =>
        api.post('/schools', payload),

    // List schools with filters and pagination
    list: (params: SchoolListParams = {}) =>
        api.get('/schools', { params }),

    // Get school by ID
    getById: (id: string) =>
        api.get(`/schools/${id}`),

    // Get school by code
    getByCode: (code: string) =>
        api.get(`/schools/code/${code}`),

    // Get classes for a school
    getClasses: (schoolId: string) =>
        api.get(`/schools/${schoolId}/classes`),

    // Update school
    update: (id: string, payload: Partial<SchoolPayload>) =>
        api.put(`/schools/${id}`, payload),

    // Update school status
    updateStatus: (id: string, status: string) =>
        api.put(`/schools/${id}/status`, { status }),

    // Delete school (soft delete)
    delete: (id: string) =>
        api.delete(`/schools/${id}`)
};

export default schoolService;
```

---

## 12. Frontend — Form Field Reference

This is the **complete list of every form field** your junior dev needs to build in the School Create/Edit form. Group them into tabs or steps for better UX.

### Step 1: Basic Information

| Field | Type | Required | Validation | UI Component |
|-------|------|----------|------------|--------------|
| `name` | text | ✅ | 2–200 chars | Text input |
| `code` | text | ✅ | 2–30 chars, alphanumeric | Text input (auto-uppercase) |
| `board` | select | ✅ | Must exist in master_data | Dropdown (🗄️ **options from API** `GET /master-data?type=board`) |
| `customBoardName` | text | ⚠️ when board='custom' | max 100 chars | Text input (conditional — only show when board is 'custom') |
| `secondaryBoard` | select | ❌ | Must exist in master_data | Dropdown (🗄️ **options from API**, nullable) |
| `category` | select | ✅ | Must exist in master_data | Dropdown (🗄️ **options from API** `GET /master-data?type=category`) |
| `mediums` | multi-select | ✅ | At least 1, each must exist in master_data | **Checkboxes** (🗄️ **options from API** `GET /master-data?type=medium`) |
| `genderType` | radio/select | ❌ | default 'co_ed' | Radio group (📦 **hardcoded** constant) |
| `ownership` | select | ❌ | default 'private' | Dropdown (🗄️ **options from API** `GET /master-data?type=ownership`) |

### Step 2: Contact Information

| Field | Type | Required | Validation | UI Component |
|-------|------|----------|------------|--------------|
| `contactEmail` | email | ❌ | valid email | Email input |
| `contactPhone` | text | ❌ | 7–20 chars | Phone input |
| `alternatePhone` | text | ❌ | 7–20 chars | Phone input |
| `principalName` | text | ❌ | max 100 chars | Text input |
| `principalPhone` | text | ❌ | 7–20 chars | Phone input |
| `principalEmail` | email | ❌ | valid email | Email input |

### Step 3: Address

| Field | Type | Required | Validation | UI Component |
|-------|------|----------|------------|--------------|
| `address.addressLine1` | text | ❌ | max 200 chars | Text input |
| `address.addressLine2` | text | ❌ | max 200 chars | Text input |
| `address.landmark` | text | ❌ | max 150 chars | Text input |
| `address.city` | text | ❌ | max 100 chars | Text input |
| `address.district` | text | ❌ | max 100 chars | Text input |
| `address.state` | text/select | ❌ | max 100 chars | **Dropdown (Indian states list)** |
| `address.pincode` | text | ❌ | max 10 chars | Text input |
| `address.country` | text | ❌ | default 'India' | Text input (pre-filled) |

### Step 4: Affiliation & Recognition

| Field | Type | Required | Validation | UI Component |
|-------|------|----------|------------|--------------|
| `affiliationNumber` | text | ❌ | max 50 chars | Text input |
| `udiseCode` | text | ❌ | max 20 chars | Text input |
| `recognitionNumber` | text | ❌ | max 50 chars | Text input |
| `establishedYear` | number | ❌ | 1800–current year | Number input |

### Step 5: Timings & Academic Year

| Field | Type | Required | Validation | UI Component |
|-------|------|----------|------------|--------------|
| `timings.shift` | select | ❌ | from enum | Dropdown |
| `timings.startTime` | time | ❌ | HH:mm | Time picker |
| `timings.endTime` | time | ❌ | HH:mm | Time picker |
| `academicYear.startMonth` | select | ❌ | 1–12 | Month dropdown |
| `academicYear.endMonth` | select | ❌ | 1–12 | Month dropdown |
| `academicYear.currentSession` | text | ❌ | e.g. "2024-2025" | Text input |

### Step 6: Branding & Social

| Field | Type | Required | Validation | UI Component |
|-------|------|----------|------------|--------------|
| `logo` | file | ❌ | image upload | File upload |
| `bannerImage` | file | ❌ | image upload | File upload |
| `motto` | text | ❌ | max 300 chars | Textarea |
| `socialLinks.website` | url | ❌ | valid URL | URL input |
| `socialLinks.facebook` | url | ❌ | valid URL | URL input |
| `socialLinks.instagram` | url | ❌ | valid URL | URL input |
| `socialLinks.twitter` | url | ❌ | valid URL | URL input |
| `socialLinks.youtube` | url | ❌ | valid URL | URL input |
| `socialLinks.linkedin` | url | ❌ | valid URL | URL input |

### Step 7: Features & Settings

| Field | Type | Required | Validation | UI Component |
|-------|------|----------|------------|--------------|
| `enabledModules` | multi-select | ❌ | each must exist in master_data | **Checkboxes** (🗄️ **options from API** `GET /master-data?type=module`) |
| `maxStudentsPerClass` | number | ❌ | 1–200, default 40 | Number input |
| `hasTransport` | boolean | ❌ | default false | Toggle switch |
| `hasHostel` | boolean | ❌ | default false | Toggle switch |
| `hasLibrary` | boolean | ❌ | default false | Toggle switch |
| `hasLab` | boolean | ❌ | default false | Toggle switch |
| `notes` | text | ❌ | max 1000 chars | Textarea |

---

## 13. Auto-Class Generation Logic

This is the core logic that happens **automatically when a school is created**. The developer does NOT need to build a separate "Add Classes" UI for the initial creation.

### How it works:

```
User creates school
    → picks Board = "CBSE"
    → picks Category = "Senior Secondary"
    ↓
Backend reads BOARD_CLASS_MAP['cbse']
    = ['Nursery', 'LKG', 'UKG', 'Class 1' ... 'Class 12']
    ↓
Backend filters by Category = "Senior Secondary"
    = keep ALL classes (Pre-school + 1–12)
    ↓
Backend inserts into `classes` collection:
    { schoolId, name: 'Nursery', displayOrder: 1, sections: ['A'], board: 'cbse' }
    { schoolId, name: 'LKG', displayOrder: 2, sections: ['A'], board: 'cbse' }
    ...
    { schoolId, name: 'Class 12', displayOrder: 15, sections: ['A'], board: 'cbse' }
```

### Category → which classes are included:

| Category | Classes auto-generated |
|----------|----------------------|
| `pre_primary` | Pre-Nursery, Nursery, LKG, UKG only |
| `primary` | Pre-school + Class 1–5 |
| `middle` | Pre-school + Class 1–8 |
| `secondary` | Pre-school + Class 1–10 |
| `senior_secondary` / `k12` | ALL classes from board map |
| `custom` | NONE (admin adds manually later) |

### After creation:

- The school's `classesAutoGenerated` flag is set to `true`.
- If admin tries to change the `board` field after classes are generated, the API **blocks** it with an error.
- Admin can still add/remove/rename individual classes via future Class CRUD APIs.

---

## 15. Testing Checklist

### Master Data Tests

- [ ] **Seed** — run seeder, verify all default items created with `isDefault: true`
- [ ] **GET /master-data** — returns all types grouped
- [ ] **GET /master-data?type=board** — returns only boards
- [ ] **POST /master-data** — Super Admin can create new option
- [ ] **POST /master-data** — duplicate value+type returns 400
- [ ] **PUT /master-data/:id** — can update label, displayOrder
- [ ] **DELETE /master-data/:id** — deletes non-default items
- [ ] **DELETE /master-data/:id** — cannot delete default items (returns 403)
- [ ] **PATCH /master-data/:id/toggle** — toggles isActive
- [ ] **Create school with invalid board** — returns validation error from controller
- [ ] **Create school with deactivated medium** — returns validation error

### School CRUD Tests

- [ ] **Create school** — verify school document is created with all fields
- [ ] **Create school** — verify dynamic fields validated against master_data DB
- [ ] **Create school** — verify classes are auto-generated based on board + category
- [ ] **Create school** — verify duplicate code returns 409/400
- [ ] **Create school** — verify `mediums` requires at least 1 value
- [ ] **Create school** — verify `board: 'custom'` requires `customBoardName`
- [ ] **List schools** — verify pagination (page, limit, totalPages)
- [ ] **List schools** — verify search by name and code
- [ ] **List schools** — verify filter by board, category, status, state, city
- [ ] **List schools** — school_admin only sees own schools
- [ ] **Get school by ID** — returns school + classes
- [ ] **Get school by code** — returns correct school
- [ ] **Update school** — partial update works (send only 1 field)
- [ ] **Update school** — changing `board` blocked if classes exist
- [ ] **Update school status** — toggle active/inactive/suspended
- [ ] **Delete school** — soft delete, sets isDeleted=true + deletedAt
- [ ] **Delete school** — also soft-deletes all classes under it
- [ ] **Get classes** — sorted by displayOrder
- [ ] **Transaction** — if class insertion fails, school creation is rolled back

### Frontend Tests

- [ ] **Create form** — all fields render correctly
- [ ] **Create form** — dropdowns populated from `GET /master-data` API (not hardcoded)
- [ ] **Create form** — `customBoardName` only shows when board = 'custom'
- [ ] **Create form** — mediums multi-select allows multiple selections
- [ ] **Create form** — submit sends correct JSON payload
- [ ] **List page** — table renders with pagination
- [ ] **List page** — search & filters work
- [ ] **Edit page** — form pre-fills with existing data
- [ ] **Edit page** — board field is disabled if classesAutoGenerated = true
- [ ] **Detail page** — shows all school info + auto-generated classes
- [ ] **Delete** — confirmation dialog → calls API → refreshes list
- [ ] **Master Data admin page** — Super Admin can add/edit/delete/toggle options

---

## Sample API Request / Response

### POST `/schools` — Create School

**Request body:**
```json
{
    "name": "Delhi Public School, Noida",
    "code": "DPSNOIDA01",
    "board": "cbse",
    "category": "k12",
    "mediums": ["english", "hindi"],
    "genderType": "co_ed",
    "ownership": "private",
    "contactEmail": "info@dpsnoida.edu.in",
    "contactPhone": "0120-1234567",
    "principalName": "Dr. Ravi Sharma",
    "principalEmail": "principal@dpsnoida.edu.in",
    "address": {
        "addressLine1": "Sector 30",
        "city": "Noida",
        "district": "Gautam Buddh Nagar",
        "state": "Uttar Pradesh",
        "pincode": "201301",
        "country": "India"
    },
    "timings": {
        "shift": "morning",
        "startTime": "07:30",
        "endTime": "14:00"
    },
    "academicYear": {
        "startMonth": 4,
        "endMonth": 3,
        "currentSession": "2024-2025"
    },
    "affiliationNumber": "2130025",
    "establishedYear": 2001,
    "maxStudentsPerClass": 45,
    "enabledModules": ["attendance", "fees", "exam", "transport", "library"],
    "hasTransport": true,
    "hasLibrary": true,
    "hasLab": true
}
```

**Response (201):**
```json
{
    "statusCode": 201,
    "status": true,
    "message": "School created successfully.",
    "data": {
        "school": {
            "_id": "665f...",
            "name": "Delhi Public School, Noida",
            "code": "DPSNOIDA01",
            "board": "cbse",
            "category": "k12",
            "mediums": ["english", "hindi"],
            "classesAutoGenerated": true,
            "status": "active",
            "genderType": "co_ed",
            "ownership": "private",
            "address": {
                "addressLine1": "Sector 30",
                "city": "Noida",
                "district": "Gautam Buddh Nagar",
                "state": "Uttar Pradesh",
                "pincode": "201301",
                "country": "India"
            },
            "createdAt": "2024-06-08T...",
            "updatedAt": "2024-06-08T..."
        },
        "classesGenerated": 16
    }
}
```

### GET `/schools/:id` — Get School Detail

**Response (200):**
```json
{
    "statusCode": 200,
    "status": true,
    "message": "School fetched successfully.",
    "data": {
        "school": { "...school fields..." },
        "classes": [
            {
                "_id": "665f...",
                "schoolId": "665f...",
                "name": "Nursery",
                "displayOrder": 1,
                "board": "cbse",
                "sections": ["A"],
                "maxStudents": 45,
                "isActive": true
            },
            {
                "_id": "665f...",
                "schoolId": "665f...",
                "name": "LKG",
                "displayOrder": 2,
                "board": "cbse",
                "sections": ["A"],
                "maxStudents": 45,
                "isActive": true
            }
        ]
    }
}
```

---

## ⚠️ IMPORTANT: Before Starting Implementation

1. **Run `npm run build:common`** after modifying anything in `packages/common/`
2. **MongoDB must support transactions** — requires replica set even for local dev:
   ```bash
   mongod --replSet rs0
   ```
   Then in mongo shell:
   ```javascript
   rs.initiate()
   ```
3. Keep the monolith (`src/`) and microservice (`services/school-service/`) schemas **identical**
4. Update `src/interfaces/index.ts` to export the new `ClassInterface`
5. Update `src/models/index.ts` to export the new `classModel`

---

## 💡 Future-Proofing Tip

If you need to add a new board, medium, ownership type, category, or module:
1. **Super Admin** logs into the admin panel → goes to Master Data page → clicks "Add" → done! 🎉
2. **No code changes**, no redeployment, no schema migration needed.
3. The School form automatically picks up new options from `GET /master-data` API.
4. For hardcoded fields (Status, Gender Type, Shift), update `packages/common/src/constants/school.ts` and rebuild.

---

*End of document. Happy coding! 🚀*
