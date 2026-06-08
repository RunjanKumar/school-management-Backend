import { Document, Types } from 'mongoose';

export interface MasterDataInterface extends Document {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    type: string; // 'board' | 'medium' | 'ownership' | 'category' | 'module'
    value: string; // 'cbse', 'english', 'private', 'k12', 'attendance'
    label: string; // 'CBSE', 'English', 'Private', 'K-12 (Nursery to Class 12)'
    description?: string; // optional helper text
    displayOrder: number; // for sorting in dropdowns
    isActive: boolean; // soft-disable without deleting
    isDefault: boolean; // seeded defaults can't be deleted by admin

    // Only for type='board' → maps to auto-class generation
    metadata?: Record<string, unknown>; // e.g. { defaultClasses: ['Nursery','LKG',...] }

    createdBy?: Types.ObjectId;
    isDeleted: boolean;
}