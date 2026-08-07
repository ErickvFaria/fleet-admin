import { Router } from "express";
import multer from "multer";
import path from "path";
import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/client";
import { inspections, inspectionPhotos, contracts, vehicles, drivers } from "../db/schema";

export const inspectionsRouter = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/inspections"),
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

inspectionsRouter.get("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const vehicleId = req.query.vehicleId ? Number(req.query.vehicleId) : undefined;

  const conditions = vehicleId
    ? and(eq(inspections.companyId, companyId), eq(inspections.vehicleId, vehicleId))
    : eq(inspections.companyId, companyId);

  const result = await db.select().from(inspections).where(conditions).orderBy(desc(inspections.inspectedAt));

  const withPhotos = await Promise.all(
    result.map(async (inspection) => {
      const photos = await db.select().from(inspectionPhotos).where(eq(inspectionPhotos.inspectionId, inspection.id));
      return { ...inspection, photos };
    })
  );

  res.json(withPhotos);
});

inspectionsRouter.post("/", upload.array("photos", 10), async (req, res) => {
  const companyId = req.auth!.companyId;
  const { vehicleId, driverId, contractId, km, color, checklist, generalNotes } = req.body;

  const [created] = await db
    .insert(inspections)
    .values({
      companyId,
      vehicleId: Number(vehicleId),
      driverId: Number(driverId),
      contractId: contractId ? Number(contractId) : null,
      km: Number(km),
      color,
      checklist,
      generalNotes,
    })
    .returning();

  const files = (req.files as Express.Multer.File[]) ?? [];
  for (const file of files) {
    await db.insert(inspectionPhotos).values({ inspectionId: created.id, filename: file.filename });
  }

  res.status(201).json(created);
});

inspectionsRouter.get("/alerts", async (req, res) => {
  const companyId = req.auth!.companyId;

  const activeContracts = await db.select().from(contracts).where(
    and(eq(contracts.companyId, companyId), eq(contracts.status, "active"))
  );

  const alerts = [];

  for (const contract of activeContracts) {
    const lastInspections = await db
      .select()
      .from(inspections)
      .where(and(eq(inspections.contractId, contract.id), eq(inspections.companyId, companyId)))
      .orderBy(desc(inspections.inspectedAt))
      .limit(1);

    const baseDate = lastInspections[0] ? new Date(lastInspections[0].inspectedAt) : new Date(contract.startDate);
    const nextDueDate = new Date(baseDate);
    nextDueDate.setDate(nextDueDate.getDate() + 7);

    const today = new Date();
    const diffDays = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      const [vehicle] = await db
        .select()
        .from(vehicles)
        .where(and(eq(vehicles.id, contract.vehicleId), eq(vehicles.companyId, companyId)));
      const [driver] = await db
        .select()
        .from(drivers)
        .where(and(eq(drivers.id, contract.driverId), eq(drivers.companyId, companyId)));

      alerts.push({
        contractId: contract.id,
        vehicleId: contract.vehicleId,
        driverId: contract.driverId,
        plate: vehicle?.plate,
        driverName: driver?.name,
        nextDueDate: nextDueDate.toISOString().slice(0, 10),
        daysRemaining: diffDays,
        status: diffDays < 0 ? "overdue" : "due-soon",
      });
    }
  }

  res.json(alerts);
});