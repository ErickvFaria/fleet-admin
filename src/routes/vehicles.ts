import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { vehicles } from "../db/schema";

export const vehiclesRouter = Router();

vehiclesRouter.get("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const result = await db.select().from(vehicles).where(eq(vehicles.companyId, companyId));
  res.json(result);
});

vehiclesRouter.get("/:id", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const [result] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.companyId, companyId)));
  if (!result) return res.status(404).json({ error: "Veículo não encontrado" });
  res.json(result);
});

vehiclesRouter.post("/", async (req, res) => {
  const companyId = req.auth!.companyId;
  const { plate, brand, model, year, currentKm } = req.body;
  const [created] = await db
    .insert(vehicles)
    .values({ companyId, plate, brand, model, year, currentKm })
    .returning();
  res.status(201).json(created);
});

vehiclesRouter.put("/:id", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const { plate, brand, model, year, currentKm, status } = req.body;
  const [updated] = await db
    .update(vehicles)
    .set({ plate, brand, model, year, currentKm, status })
    .where(and(eq(vehicles.id, id), eq(vehicles.companyId, companyId)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Veículo não encontrado" });
  res.json(updated);
});

vehiclesRouter.delete("/:id", async (req, res) => {
  const companyId = req.auth!.companyId;
  const id = Number(req.params.id);
  const [deleted] = await db
    .delete(vehicles)
    .where(and(eq(vehicles.id, id), eq(vehicles.companyId, companyId)))
    .returning();
  if (!deleted) return res.status(404).json({ error: "Veículo não encontrado" });
  res.json({ ok: true });
});