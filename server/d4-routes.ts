import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { dbGuard } from "./db-guard";
import { requireDb } from "../shared/db";
import { isSimilar } from "./similarity";
import {
  analysisRecords,
  comparisons,
  fileRecords,
  projects,
} from "../shared/schema";

function parseId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const maybeInt = z.coerce.number().int().positive().nullable().optional();
const maybeNum = z.coerce.number().nullable().optional();
const maybeStr = z.string().nullable().optional();

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: maybeStr,
  bridgeType: maybeStr,
  location: maybeStr,
  status: z.string().min(1).optional(),
});

const updateProjectSchema = createProjectSchema.partial();

const createFileSchema = z.object({
  projectId: maybeInt,
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  fileSizeKb: maybeNum,
  bridgeType: maybeStr,
  spanLength: maybeNum,
  width: maybeNum,
  height: maybeNum,
  material: maybeStr,
  loadCapacity: maybeNum,
  designCode: maybeStr,
  layers: maybeStr,
  pageCount: maybeInt,
  extractedData: maybeStr,
  tags: maybeStr,
  notes: maybeStr,
  analysisStatus: z.string().min(1),
});

const updateFileSchema = createFileSchema.partial();

const createRecordSchema = z.object({
  projectId: maybeInt,
  fileId: maybeInt,
  title: z.string().min(1),
  variationType: z.string().min(1),
  description: maybeStr,
  parameters: maybeStr,
  notes: maybeStr,
  referenceFiles: maybeStr,
  isFavorite: z.boolean(),
});

const updateRecordSchema = createRecordSchema.partial();

const createComparisonSchema = z.object({
  projectId: maybeInt,
  title: z.string().min(1),
  fileIds: z.string().min(1),
  differencesSummary: maybeStr,
  similaritiesSummary: maybeStr,
  notes: maybeStr,
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const filesQuerySchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  fileType: z.string().min(1).optional(),
});
const recordsQuerySchema = z.object({
  projectId: z.coerce.number().int().positive().optional(),
  fileId: z.coerce.number().int().positive().optional(),
});

function badRequest(res: any, issues: z.ZodIssue[], message = "Invalid request body") {
  return res.status(400).json({
    error: message,
    issues: issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    })),
  });
}

function parseIdOrBad(req: { params: { id?: string } }, res: any): number | null {
  const parsed = idParamSchema.safeParse(req.params ?? {});
  if (!parsed.success) {
    badRequest(res, parsed.error.issues, "Invalid id parameter");
    return null;
  }
  return parsed.data.id;
}

function asIsoString(value: Date | string | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString();
}

function asNullableIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function mapProjectRow(
  row: typeof projects.$inferSelect,
  fileCount = 0,
  recordCount = 0,
) {
  const designData =
    row.designData && typeof row.designData === "object" ? (row.designData as Record<string, unknown>) : {};
  return {
    id: row.id,
    name: row.name,
    description: typeof designData.description === "string" ? designData.description : null,
    bridgeType: typeof designData.bridgeType === "string" ? designData.bridgeType : null,
    location: row.location,
    status: typeof designData.status === "string" ? designData.status : "active",
    fileCount,
    recordCount,
    createdAt: asIsoString(row.createdAt),
    updatedAt: asIsoString(row.updatedAt),
  };
}

function mapFileRow(row: typeof fileRecords.$inferSelect) {
  const layerValue = row.layers ?? null;
  return {
    id: row.id,
    projectId: row.projectId,
    fileName: row.fileName,
    fileType: row.fileType,
    fileSizeKb: null,
    bridgeType: row.bridgeType,
    spanLength: toNullableNumber(row.spanLength),
    width: toNullableNumber(row.width),
    height: toNullableNumber(row.height),
    material: row.material,
    loadCapacity: toNullableNumber(row.loadCapacity),
    designCode: row.designCode,
    layers: layerValue === null ? null : JSON.stringify(layerValue),
    pageCount: null,
    extractedData: null,
    tags: null,
    notes: row.filePath,
    analysisStatus: "pending",
    createdAt: asIsoString(row.createdAt),
    updatedAt: asIsoString(row.updatedAt),
  };
}

function mapRecordRow(row: typeof analysisRecords.$inferSelect) {
  return {
    id: row.id,
    projectId: row.projectId,
    fileId: row.fileId,
    title: `Variation ${row.id}`,
    variationType: row.variationType,
    description: null,
    parameters: row.inputSnapshot ? JSON.stringify(row.inputSnapshot) : null,
    notes: null,
    referenceFiles: null,
    isFavorite: false,
    createdAt: asIsoString(row.createdAt),
    updatedAt: asIsoString(row.updatedAt),
  };
}

function mapComparisonRow(row: typeof comparisons.$inferSelect) {
  return {
    id: row.id,
    projectId: null,
    title: row.name,
    fileIds: JSON.stringify(row.fileIds ?? []),
    differencesSummary: null,
    similaritiesSummary: null,
    notes: row.notes ?? null,
    createdAt: asIsoString(row.createdAt),
    updatedAt: asIsoString(row.updatedAt),
  };
}

const router = Router();
router.use(dbGuard);

router.get("/projects", async (_req, res, next) => {
  try {
    const db = requireDb();
    const projectRows = await db.select().from(projects).orderBy(desc(projects.id));
    const fileCounts = await db
      .select({
        projectId: fileRecords.projectId,
        count: sql<number>`count(*)`,
      })
      .from(fileRecords)
      .groupBy(fileRecords.projectId);
    const recordCounts = await db
      .select({
        projectId: analysisRecords.projectId,
        count: sql<number>`count(*)`,
      })
      .from(analysisRecords)
      .groupBy(analysisRecords.projectId);
    const fileCountMap = new Map<number, number>();
    const recordCountMap = new Map<number, number>();
    for (const item of fileCounts) {
      if (item.projectId) fileCountMap.set(item.projectId, item.count);
    }
    for (const item of recordCounts) {
      if (item.projectId) recordCountMap.set(item.projectId, item.count);
    }
    res.json(
      projectRows.map((row) => mapProjectRow(row, fileCountMap.get(row.id) ?? 0, recordCountMap.get(row.id) ?? 0)),
    );
  } catch (err) {
    next(err);
  }
});

router.post("/projects", async (req, res, next) => {
  try {
    const db = requireDb();
    const parsed = createProjectSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error.issues);
    const body = parsed.data;
    const [created] = await db
      .insert(projects)
      .values({
        name: body.name,
        location: body.location ?? null,
        district: null,
        engineer: null,
        designData: {
          description: body.description ?? null,
          bridgeType: body.bridgeType ?? null,
          status: body.status ?? "active",
        },
      })
      .returning();
    res.status(201).json(mapProjectRow(created));
  } catch (err) {
    next(err);
  }
});

router.get("/projects/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: "Project not found" });
    res.json(mapProjectRow(row));
  } catch (err) {
    next(err);
  }
});

router.patch("/projects/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    const parsed = updateProjectSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error.issues);
    const body = parsed.data;
    const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Project not found" });
    const existingData =
      existing.designData && typeof existing.designData === "object"
        ? (existing.designData as Record<string, unknown>)
        : {};
    const [updated] = await db
      .update(projects)
      .set({
        name: body.name ?? undefined,
        location: body.location ?? undefined,
        designData: {
          ...existingData,
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.bridgeType !== undefined ? { bridgeType: body.bridgeType } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
        },
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Project not found" });
    res.json(mapProjectRow(updated));
  } catch (err) {
    next(err);
  }
});

router.delete("/projects/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    await db.delete(projects).where(eq(projects.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get("/files", async (req, res, next) => {
  try {
    const db = requireDb();
    const q = filesQuerySchema.safeParse(req.query ?? {});
    if (!q.success) return badRequest(res, q.error.issues, "Invalid query parameters");
    const queryProjectId = q.data.projectId ?? null;
    const queryFileType = q.data.fileType ?? null;
    const conditions = [];
    if (queryProjectId) conditions.push(eq(fileRecords.projectId, queryProjectId));
    if (queryFileType) conditions.push(eq(fileRecords.fileType, queryFileType));
    const rows = conditions.length
      ? await db.select().from(fileRecords).where(and(...conditions)).orderBy(desc(fileRecords.id))
      : await db.select().from(fileRecords).orderBy(desc(fileRecords.id));
    res.json(rows.map(mapFileRow));
  } catch (err) {
    next(err);
  }
});

router.post("/files", async (req, res, next) => {
  try {
    const db = requireDb();
    const parsed = createFileSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error.issues);
    const body = parsed.data;
    const [created] = await db
      .insert(fileRecords)
      .values({
        projectId: body.projectId ?? null,
        fileName: body.fileName,
        fileType: body.fileType,
        filePath: body.notes ?? null,
        bridgeType: body.bridgeType ?? null,
        spanLength: toNullableNumber(body.spanLength)?.toString() ?? null,
        width: toNullableNumber(body.width)?.toString() ?? null,
        height: toNullableNumber(body.height)?.toString() ?? null,
        material: body.material ?? null,
        loadCapacity: toNullableNumber(body.loadCapacity)?.toString() ?? null,
        designCode: body.designCode ?? null,
        layers: body.layers ?? null,
      })
      .returning();
    res.status(201).json(mapFileRow(created));
  } catch (err) {
    next(err);
  }
});

router.get("/files/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    const [row] = await db.select().from(fileRecords).where(eq(fileRecords.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: "File record not found" });
    res.json(mapFileRow(row));
  } catch (err) {
    next(err);
  }
});

router.patch("/files/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    const parsed = updateFileSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error.issues);
    const body = parsed.data;
    const [updated] = await db
      .update(fileRecords)
      .set({
        projectId: body.projectId !== undefined ? body.projectId : undefined,
        filePath: body.notes !== undefined ? body.notes : undefined,
        bridgeType: body.bridgeType !== undefined ? body.bridgeType : undefined,
        spanLength: body.spanLength !== undefined ? toNullableNumber(body.spanLength)?.toString() ?? null : undefined,
        width: body.width !== undefined ? toNullableNumber(body.width)?.toString() ?? null : undefined,
        height: body.height !== undefined ? toNullableNumber(body.height)?.toString() ?? null : undefined,
        material: body.material !== undefined ? body.material : undefined,
        loadCapacity: body.loadCapacity !== undefined ? toNullableNumber(body.loadCapacity)?.toString() ?? null : undefined,
        designCode: body.designCode !== undefined ? body.designCode : undefined,
        layers: body.layers !== undefined ? body.layers : undefined,
        updatedAt: new Date(),
      })
      .where(eq(fileRecords.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "File record not found" });
    res.json(mapFileRow(updated));
  } catch (err) {
    next(err);
  }
});

router.delete("/files/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    await db.delete(fileRecords).where(eq(fileRecords.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get("/files/:id/similar", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    const [base] = await db.select().from(fileRecords).where(eq(fileRecords.id, id)).limit(1);
    if (!base) return res.status(404).json({ error: "File record not found" });
    // Coarse DB filter: same bridgeType and fileType, exclude self
    const rows = await db
      .select()
      .from(fileRecords)
      .where(
        and(
          sql`${fileRecords.bridgeType} is not distinct from ${base.bridgeType}`,
          eq(fileRecords.fileType, base.fileType),
          sql`${fileRecords.id} <> ${id}`,
        ),
      )
      .orderBy(desc(fileRecords.id))
      .limit(100);
    // Fine filter: apply ±20% numeric similarity (Requirement 4.2)
    const similar = rows.filter(r => isSimilar(base, r));
    res.json(similar.map(mapFileRow));
  } catch (err) {
    next(err);
  }
});

router.get("/records", async (req, res, next) => {
  try {
    const db = requireDb();
    const q = recordsQuerySchema.safeParse(req.query ?? {});
    if (!q.success) return badRequest(res, q.error.issues, "Invalid query parameters");
    const queryProjectId = q.data.projectId ?? null;
    const queryFileId = q.data.fileId ?? null;
    const conditions = [];
    if (queryProjectId) conditions.push(eq(analysisRecords.projectId, queryProjectId));
    if (queryFileId) conditions.push(eq(analysisRecords.fileId, queryFileId));
    const rows = conditions.length
      ? await db.select().from(analysisRecords).where(and(...conditions)).orderBy(desc(analysisRecords.id))
      : await db.select().from(analysisRecords).orderBy(desc(analysisRecords.id));
    res.json(rows.map(mapRecordRow));
  } catch (err) {
    next(err);
  }
});

router.post("/records", async (req, res, next) => {
  try {
    const db = requireDb();
    const parsed = createRecordSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error.issues);
    const body = parsed.data;
    const [created] = await db
      .insert(analysisRecords)
      .values({
        fileId: body.fileId ?? null,
        projectId: body.projectId ?? null,
        variationType: body.variationType,
        inputSnapshot: body.parameters ? { raw: body.parameters, title: body.title } : { title: body.title },
        resultsSummary: body.description ? { description: body.description } : null,
      })
      .returning();
    res.status(201).json(mapRecordRow(created));
  } catch (err) {
    next(err);
  }
});

router.get("/records/variations", async (_req, res, next) => {
  try {
    const db = requireDb();
    const rows = await db
      .select({
        variationType: analysisRecords.variationType,
        count: sql<number>`count(*)`,
      })
      .from(analysisRecords)
      .groupBy(analysisRecords.variationType)
      .orderBy(desc(sql`count(*)`));
    res.json(
      rows.map((row) => ({
        variationType: row.variationType,
        count: row.count,
        examples: [],
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.get("/records/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    const [row] = await db.select().from(analysisRecords).where(eq(analysisRecords.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: "Record not found" });
    res.json(mapRecordRow(row));
  } catch (err) {
    next(err);
  }
});

router.patch("/records/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    const parsed = updateRecordSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error.issues);
    const body = parsed.data;
    const [updated] = await db
      .update(analysisRecords)
      .set({
        variationType: body.variationType !== undefined ? body.variationType : undefined,
        inputSnapshot:
          body.parameters !== undefined || body.title !== undefined
            ? {
                ...(body.parameters !== undefined ? { raw: body.parameters } : {}),
                ...(body.title !== undefined ? { title: body.title } : {}),
              }
            : undefined,
        resultsSummary:
          body.description !== undefined
            ? {
                description: body.description,
              }
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(analysisRecords.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Record not found" });
    res.json(mapRecordRow(updated));
  } catch (err) {
    next(err);
  }
});

router.delete("/records/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    await db.delete(analysisRecords).where(eq(analysisRecords.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get("/comparisons", async (req, res, next) => {
  try {
    const db = requireDb();
    const rows = await db.select().from(comparisons).orderBy(desc(comparisons.id));
    res.json(rows.map(mapComparisonRow));
  } catch (err) {
    next(err);
  }
});

router.post("/comparisons", async (req, res, next) => {
  try {
    const db = requireDb();
    const parsed = createComparisonSchema.safeParse(req.body ?? {});
    if (!parsed.success) return badRequest(res, parsed.error.issues);
    const body = parsed.data;
    let parsedFileIds: unknown[] = [];
    try {
      const maybeArray = JSON.parse(body.fileIds);
      if (Array.isArray(maybeArray)) parsedFileIds = maybeArray;
    } catch {
      parsedFileIds = [];
    }
    const [created] = await db
      .insert(comparisons)
      .values({
        name: body.title,
        fileIds: parsedFileIds,
        notes: body.notes ?? null,
      })
      .returning();
    res.status(201).json(mapComparisonRow(created));
  } catch (err) {
    next(err);
  }
});

router.get("/comparisons/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    const [row] = await db.select().from(comparisons).where(eq(comparisons.id, id)).limit(1);
    if (!row) return res.status(404).json({ error: "Comparison not found" });
    res.json(mapComparisonRow(row));
  } catch (err) {
    next(err);
  }
});

router.delete("/comparisons/:id", async (req, res, next) => {
  try {
    const id = parseIdOrBad(req, res);
    if (!id) return;
    const db = requireDb();
    await db.delete(comparisons).where(eq(comparisons.id, id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get("/stats/summary", async (_req, res, next) => {
  try {
    const db = requireDb();
    const [{ totalProjects }] = await db.select({ totalProjects: sql<number>`count(*)` }).from(projects);
    const [{ totalFiles }] = await db.select({ totalFiles: sql<number>`count(*)` }).from(fileRecords);
    const [{ totalRecords }] = await db.select({ totalRecords: sql<number>`count(*)` }).from(analysisRecords);
    const [{ totalComparisons }] = await db.select({ totalComparisons: sql<number>`count(*)` }).from(comparisons);
    const recentFiles = await db.select().from(fileRecords).orderBy(desc(fileRecords.id)).limit(10);
    const filesByType = await db
      .select({
        label: fileRecords.fileType,
        count: sql<number>`count(*)`,
      })
      .from(fileRecords)
      .groupBy(fileRecords.fileType)
      .orderBy(desc(sql`count(*)`));
    const recordsByVariationType = await db
      .select({
        label: analysisRecords.variationType,
        count: sql<number>`count(*)`,
      })
      .from(analysisRecords)
      .groupBy(analysisRecords.variationType)
      .orderBy(desc(sql`count(*)`));

    res.json({
      totalProjects,
      totalFiles,
      totalRecords,
      totalComparisons,
      filesByType,
      recordsByVariationType,
      recentFiles: recentFiles.map(mapFileRow),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
