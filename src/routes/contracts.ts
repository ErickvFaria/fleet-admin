import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { contracts, drivers, vehicles } from "../db/schema";

export const contractsRouter = Router();

contractsRouter.get("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const result = await db.select().from(contracts).where(eq(contracts.companyId, companyId));
  res.json(result);
});

contractsRouter.get("/:id", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const [result] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, id), eq(contracts.companyId, companyId)));
  if (!result) return res.status(404).json({ error: "Contrato não encontrado" });
  res.json(result);
});

contractsRouter.post("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const { driverId, vehicleId, startDate, weeklyRate, paymentDayOfWeek, termEndDate } = req.body;

  const [created] = await db
    .insert(contracts)
    .values({ companyId, driverId, vehicleId, startDate, weeklyRate, paymentDayOfWeek, termEndDate: termEndDate || null })
    .returning();

  await db.update(vehicles).set({ status: "rented" }).where(and(eq(vehicles.id, vehicleId), eq(vehicles.companyId, companyId)));
  await db.update(drivers).set({ currentVehicleId: vehicleId }).where(and(eq(drivers.id, driverId), eq(drivers.companyId, companyId)));

  res.status(201).json(created);
});

contractsRouter.put("/:id", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const { startDate, termEndDate, paymentDayOfWeek, weeklyRate } = req.body;

  const [updated] = await db
    .update(contracts)
    .set({ startDate, termEndDate: termEndDate || null, paymentDayOfWeek, weeklyRate })
    .where(and(eq(contracts.id, id), eq(contracts.companyId, companyId)))
    .returning();

  if (!updated) return res.status(404).json({ error: "Contrato não encontrado" });
  res.json(updated);
});

contractsRouter.put("/:id/finish", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const { endDate } = req.body;

  const [contract] = await db
    .select()
    .from(contracts)
    .where(and(eq(contracts.id, id), eq(contracts.companyId, companyId)));
  if (!contract) return res.status(404).json({ error: "Contrato não encontrado" });

  const [updated] = await db
    .update(contracts)
    .set({ status: "finished", endDate })
    .where(and(eq(contracts.id, id), eq(contracts.companyId, companyId)))
    .returning();

  await db.update(vehicles).set({ status: "available" }).where(and(eq(vehicles.id, contract.vehicleId), eq(vehicles.companyId, companyId)));
  await db.update(drivers).set({ currentVehicleId: null }).where(and(eq(drivers.id, contract.driverId), eq(drivers.companyId, companyId)));

  res.json(updated);
});

contractsRouter.delete("/:id", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const [deleted] = await db
    .delete(contracts)
    .where(and(eq(contracts.id, id), eq(contracts.companyId, companyId)))
    .returning();
  if (!deleted) return res.status(404).json({ error: "Contrato não encontrado" });
  res.json({ ok: true });
});