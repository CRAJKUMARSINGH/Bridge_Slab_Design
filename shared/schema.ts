import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// ── Typed designData JSON sub-schema (CURSOR-003 fix) ──────────────────────
// Replaces the drizzle-default z.any() for jsonb design_data with a
// structurally-typed Zod schema matching the client's project fields.
// Fields are optional so partial saves from POST /api/projects are accepted.
const designDataSchema = z.object({
  description: z.string().nullable().optional(),
  bridgeType:  z.string().nullable().optional(),
  status:      z.string().nullable().optional(),
  location:    z.string().nullable().optional(),
  district:    z.string().nullable().optional(),
  engineer:    z.string().nullable().optional(),
  // Free-form additional metadata (design snapshots, tags, labels) is
  // preserved via catchall passthrough so consumer-specific extensions do
  // not have to be re-declared in the schema.
}).passthrough().nullable().optional();

// ── projects ──────────────────────────────────────────────────────────────────
export const projects = pgTable('projects', {
  id:         serial('id').primaryKey(),
  name:       text('name').notNull(),
  location:   text('location'),
  district:   text('district'),
  engineer:   text('engineer'),
  designData: jsonb('design_data'),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects, {
  name: (s) => s.min(1, 'Project name is required'),
  designData: designDataSchema as any,
});
export const selectProjectSchema = createSelectSchema(projects);
export type InsertProject = typeof projects.$inferInsert;
export type SelectProject = typeof projects.$inferSelect;

// ── file_records ──────────────────────────────────────────────────────────────
export const fileRecords = pgTable('file_records', {
  id:           serial('id').primaryKey(),
  projectId:    integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  fileName:     text('file_name').notNull(),
  fileType:     text('file_type').notNull(),
  filePath:     text('file_path'),
  bridgeType:   text('bridge_type'),
  spanLength:   numeric('span_length'),
  width:        numeric('width'),
  height:       numeric('height'),
  material:     text('material'),
  loadCapacity: numeric('load_capacity'),
  designCode:   text('design_code'),
  layers:       jsonb('layers'),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const insertFileRecordSchema = createInsertSchema(fileRecords);
export const selectFileRecordSchema = createSelectSchema(fileRecords);
export type InsertFileRecord = typeof fileRecords.$inferInsert;
export type SelectFileRecord = typeof fileRecords.$inferSelect;

// ── analysis_records ──────────────────────────────────────────────────────────
export const analysisRecords = pgTable('analysis_records', {
  id:             serial('id').primaryKey(),
  fileId:         integer('file_id').references(() => fileRecords.id, { onDelete: 'cascade' }),
  projectId:      integer('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  variationType:  text('variation_type').notNull(),
  inputSnapshot:  jsonb('input_snapshot').notNull(),
  resultsSummary: jsonb('results_summary'),
  createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysisRecords);
export const selectAnalysisSchema = createSelectSchema(analysisRecords);
export type InsertAnalysisRecord = typeof analysisRecords.$inferInsert;
export type SelectAnalysisRecord = typeof analysisRecords.$inferSelect;

// ── comparisons ───────────────────────────────────────────────────────────────
export const comparisons = pgTable('comparisons', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),
  fileIds:   jsonb('file_ids').notNull(),
  notes:     text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const insertComparisonSchema = createInsertSchema(comparisons);
export const selectComparisonSchema = createSelectSchema(comparisons);
export type InsertComparison = typeof comparisons.$inferInsert;
export type SelectComparison = typeof comparisons.$inferSelect;
