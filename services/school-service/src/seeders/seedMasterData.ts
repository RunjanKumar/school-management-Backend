import masterDataModel from '../models/masterDataModel';

const SEED_DATA = [
	// ─── BOARDS ───
	{ type: 'board', value: 'cbse', label: 'CBSE', displayOrder: 1, isDefault: true,
		metadata: { defaultClasses: [ 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12' ] } },
	{ type: 'board', value: 'icse', label: 'ICSE', displayOrder: 2, isDefault: true,
		metadata: { defaultClasses: [ 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12' ] } },
	{ type: 'board', value: 'state_board', label: 'State Board', displayOrder: 3, isDefault: true,
		metadata: { defaultClasses: [ 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12' ] } },
	{ type: 'board', value: 'ib', label: 'IB (International Baccalaureate)', displayOrder: 4, isDefault: true,
		metadata: { defaultClasses: [ 'Pre-Nursery', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12' ] } },
	{ type: 'board', value: 'cambridge', label: 'Cambridge (IGCSE)', displayOrder: 5, isDefault: true,
		metadata: { defaultClasses: [ 'Pre-Nursery', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12' ] } },
	{ type: 'board', value: 'nios', label: 'NIOS', displayOrder: 6, isDefault: true,
		metadata: { defaultClasses: [ 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12' ] } },
	{ type: 'board', value: 'madrasa', label: 'Madrasa Board', displayOrder: 7, isDefault: true,
		metadata: { defaultClasses: [ 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8' ] } },
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