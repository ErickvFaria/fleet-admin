import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { drivers } from "../db/schema";

export const driversRouter = Router();

// Listar motoristas de uma empresa
driversRouter.get("/", async (req, res) => {
  const companyId = Number(req.query.companyId);
  const result = await db.select().from(drivers).where(eq(drivers.companyId, companyId));
  res.json(result);
});

// Buscar um motorista específico
driversRouter.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [result] = await db.select().from(drivers).where(eq(drivers.id, id));
  if (!result) return res.status(404).json({ error: "Motorista não encontrado" });
  res.json(result);
});

// Criar motorista
driversRouter.post("/", async (req, res) => {
  const { companyId, currentVehicleId, name, document, licenseNumber, licenseExpiresAt } = req.body;
  const [created] = await db
    .insert(drivers)
    .values({ companyId, currentVehicleId, name, document, licenseNumber, licenseExpiresAt })
    .returning();
  res.status(201).json(created);
});

// Atualizar motorista
driversRouter.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { currentVehicleId, name, document, licenseNumber, licenseExpiresAt, status } = req.body;
  const [updated] = await db
    .update(drivers)
    .set({ currentVehicleId, name, document, licenseNumber, licenseExpiresAt, status })
    .where(eq(drivers.id, id))
    .returning();
  if (!updated) return res.status(404).json({ error: "Motorista não encontrado" });
  res.json(updated);
});

// Deletar motorista
driversRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [deleted] = await db.delete(drivers).where(eq(drivers.id, id)).returning();
  if (!deleted) return res.status(404).json({ error: "Motorista não encontrado" });
  res.json({ ok: true });
});