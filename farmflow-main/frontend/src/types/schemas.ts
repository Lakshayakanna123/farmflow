import * as z from 'zod';

// --- BIRDS SECTOR SCHEMAS ---
export const birdsFeedSchema = z.object({
  feedPounds: z.coerce.number().positive('Feed pounds must be a positive number'),
});

export const birdsMortalitySchema = z.object({
  mortalityCount: z.coerce.number().int().nonnegative('Mortality count must be zero or positive'),
});

export const birdsEggCollectionSchema = z.object({
  eggsCount: z.coerce.number().int().positive('Eggs count must be a positive number'),
  crackedCount: z.coerce.number().int().nonnegative('Cracked eggs must be zero or positive'),
});

export const birdsVaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  batchCode: z.string().min(1, 'Batch code is required'),
  notes: z.string().optional(),
});

export const birdsMedicineSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  notes: z.string().optional(),
});

export const birdsNotesSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
});

// --- FISH SECTOR SCHEMAS ---
export const fishFeedingSchema = z.object({
  feedKg: z.coerce.number().positive('Feed kilograms must be a positive number'),
  feedType: z.string().min(1, 'Feed type is required'),
});

export const fishWaterQualitySchema = z.object({
  pH: z.coerce.number().min(0, 'pH cannot be less than 0').max(14, 'pH cannot be greater than 14'),
  ammonia: z.coerce.number().nonnegative('Ammonia level must be zero or positive'),
});

export const fishOxygenSchema = z.object({
  dissolvedOxygen: z.coerce.number().positive('Dissolved oxygen (ppm) must be a positive number'),
});

export const fishMedicineSchema = z.object({
  medicineName: z.string().min(1, 'Medicine name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  notes: z.string().optional(),
});

export const fishHarvestSchema = z.object({
  fishCount: z.coerce.number().int().positive('Fish count must be a positive integer'),
  totalWeightKg: z.coerce.number().positive('Total weight must be a positive number'),
});

export const fishNotesSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
});
