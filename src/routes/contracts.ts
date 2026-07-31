import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { contracts, drivers, vehicles } from "../db/schema";

export const contractsRouter = Router();

contractsRouter.get("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const result = await db.select().from(contracts).where(eq(contracts.companyId, companyId));
  res.json(result);
});

contractsRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [result] = await db.select().from(contracts).where(eq(contracts.id, id));
  if (!result) return res.status(404).json({ error: "Contrato não encontrado" });
  res.json(result);
});

contractsRouter.post("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const { driverId, vehicleId, startDate, weeklyRate } = req.body;

  const [created] = await db
    .insert(contracts)
    .values({ companyId, driverId, vehicleId, startDate, weeklyRate })
    .returning();

  await db.update(vehicles).set({ status: "rented" }).where(eq(vehicles.id, vehicleId));
  await db.update(drivers).set({ currentVehicleId: vehicleId }).where(eq(drivers.id, driverId));

  res.status(201).json(created);
});

contractsRouter.put("/:id/finish", async (req, res) => {
  const id = Number(req.params.id);
  const { endDate } = req.body;

  const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
  if (!contract) return res.status(404).json({ error: "Contrato não encontrado" });

  const [updated] = await db
    .update(contracts)
    .set({ status: "finished", endDate })
    .where(eq(contracts.id, id))
    .returning();

  await db.update(vehicles).set({ status: "available" }).where(eq(vehicles.id, contract.vehicleId));
  await db.update(drivers).set({ currentVehicleId: null }).where(eq(drivers.id, contract.driverId));

  res.json(updated);
});

contractsRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(contracts).where(eq(contracts.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Contrato não encontrado" });
  res.json({ ok: true });
});